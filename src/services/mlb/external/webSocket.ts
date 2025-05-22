import WebSocket from 'ws';
import { MlbGameApiResponse } from '@/types/mlb';
import { getMlbGameApiGame } from './mlbApi';
import { ipcMain } from 'electron';

// ---------- Main class: MLB WebSocket Manager ----------

class MLBWebSocketManager {
    private connections: Map<number, MLBWebSocketClient> = new Map();
    private mainWindow: Electron.BrowserWindow;
  
    constructor(mainWindow: Electron.BrowserWindow) {
      this.mainWindow = mainWindow;
    }
  
    public async connectToGame(gameId: number) {
      // Don't create duplicate connections
      if (this.connections.has(gameId)) {
        console.log(`Already connected to game ${gameId}`);
        return;
      }
  
      try {
        const wsClient = new MLBWebSocketClient();
        
        // Connect and set up update handler
        await wsClient.connect(gameId.toString(), (gameData: MlbGameApiResponse) => {
          // Send update to renderer process
          this.mainWindow.webContents.send('mlb-game-update', {
            gameId,
            data: gameData
          });
        });
  
        // Store the connection
        this.connections.set(gameId, wsClient);
        console.log(`Connected to game ${gameId}`);
  
      } catch (error) {
        console.error(`Failed to connect to game ${gameId}:`, error);
        throw error;
      }
    }
  
    public async disconnectFromGame(gameId: number) {
      const client = this.connections.get(gameId);
      if (client) {
        client.disconnect();
        this.connections.delete(gameId);
        console.log(`Disconnected from game ${gameId}`);
      }
    }
  
    public async disconnectAll() {
      for (const [gameId, client] of this.connections) {
        client.disconnect();
        console.log(`Disconnected from game ${gameId}`);
      }
      this.connections.clear();
    }
  
    // Call this when the app is shutting down
    public cleanup() {
      this.disconnectAll();
    }
}
  
export function initializeMLBWebSockets(mainWindow: Electron.BrowserWindow) {
  const manager = new MLBWebSocketManager(mainWindow);
  return manager;
}

// ---------- MLB WebSocket(single) ----------

interface WebSocketUpdate {
  timeStamp: string;          // Format: "YYYYMMDD_HHMMSS"
  gamePk: string;             // Game ID
  updateId: string;           // Unique update identifier
  wait: number;               // Wait time in seconds
  logicalEvents: string[];    // Game state changes
  gameEvents: string[];       // Play results
  changeEvent: {
    type: string;             // e.g., "new_entry"
  };
  isDelay?: boolean;         // Optional delay indicator
}

interface GameUpdateCallback {
  (gameData: MlbGameApiResponse): void;
}

export class MLBWebSocketClient {
  private ws: WebSocket | null = null;
  private gameId: string | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds
  private readonly keepAliveDelay = 60000; // 1 minute
  private updateCallback: GameUpdateCallback | null = null;
  private isConnecting = false;

  constructor() {
    this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);
    this.handleWebSocketError = this.handleWebSocketError.bind(this);
    this.handleWebSocketClose = this.handleWebSocketClose.bind(this);
  }

  public async connect(gameId: string, callback: GameUpdateCallback): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;
    this.gameId = gameId;
    this.updateCallback = callback;

    try {
      await this.establishConnection();
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  public disconnect(): void {
    this.cleanup();
  }

  private async establishConnection(): Promise<void> {
    if (!this.gameId) {
      throw new Error('Game ID not set');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/${this.gameId}`);

        this.ws.on('open', () => {
          console.log(`WebSocket connected for game ${this.gameId}`);
          this.setupKeepAlive();
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', this.handleWebSocketMessage);
        this.ws.on('error', this.handleWebSocketError);
        this.ws.on('close', this.handleWebSocketClose);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async handleWebSocketMessage(data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as WebSocketUpdate;
      
      if (message.timeStamp && message.gamePk && this.updateCallback) {
        // Fetch full game state using the timestamp
        const gameData = await getMlbGameApiGame(parseInt(message.gamePk));
        this.updateCallback(gameData);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private handleWebSocketError(error: Error): void {
    console.error('WebSocket error:', error);
    this.attemptReconnect();
  }

  private handleWebSocketClose(): void {
    console.log('WebSocket connection closed');
    this.cleanup();
    this.attemptReconnect();
  }

  private setupKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('Gameday5');
      }
    }, this.keepAliveDelay);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.establishConnection();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private cleanup(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.gameId = null;
    this.updateCallback = null;
    this.reconnectAttempts = 0;
  }
}

