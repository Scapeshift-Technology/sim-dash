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
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 5000; // 5 seconds
  private readonly keepAliveDelay = 45000; // 45 seconds
  private updateCallback: GameUpdateCallback | null = null;
  private isConnecting = false;
  private connectionStartTime: number = 0;

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
    this.cleanup(); // Full cleanup for intentional disconnection
  }

  private async establishConnection(): Promise<void> {
    if (!this.gameId) {
      throw new Error('Game ID not set');
    }

    const wsUrl = `wss://ws.statsapi.mlb.com/api/v1/game/push/subscribe/gameday/${this.gameId}`;
    console.log(`Establishing WebSocket connection for game ${this.gameId} (attempt ${this.reconnectAttempts + 1})`);
    console.log(`WebSocket URL: ${wsUrl}`);
    
    this.connectionStartTime = Date.now();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          const connectionTime = Date.now() - this.connectionStartTime;
          console.log(`WebSocket connected for game ${this.gameId} (took ${connectionTime}ms)`);
          this.setupKeepAlive();
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', this.handleWebSocketMessage);
        this.ws.on('error', this.handleWebSocketError);
        this.ws.on('close', this.handleWebSocketClose);
      } catch (error) {
        console.error(`Failed to create WebSocket for game ${this.gameId}:`, error);
        reject(error);
      }
    });
  }

  private async handleWebSocketMessage(data: WebSocket.Data): Promise<void> {
    try {
      const messageStr = data.toString();
      console.log(`WebSocket message received for game ${this.gameId}:`, messageStr);
      
      const message = JSON.parse(messageStr) as WebSocketUpdate;
      
      if (message.timeStamp && message.gamePk && this.updateCallback) {
        console.log(`Processing game update for game ${this.gameId}, gamePk: ${message.gamePk}`);
        console.log(`Game events: [${message.gameEvents?.join(', ')}], Logical events: [${message.logicalEvents?.join(', ')}]`);
        
        try {
          // Fetch full game state using the timestamp
          const gameData = await getMlbGameApiGame(parseInt(message.gamePk));
          console.log(`Fetched game data for ${this.gameId}, calling update callback`);
          this.updateCallback(gameData);
          console.log(`Update callback completed for game ${this.gameId}`);
        } catch (apiError) {
          console.error(`Error fetching game data for ${this.gameId}:`, apiError);
        }
      } else {
        console.log(`Ignoring message for game ${this.gameId} - missing required fields:`, {
          hasTimeStamp: !!message.timeStamp,
          hasGamePk: !!message.gamePk,
          hasCallback: !!this.updateCallback
        });
      }
    } catch (error) {
      console.error(`Error processing WebSocket message for game ${this.gameId}:`, error);
      console.error('Raw message data:', data.toString());
    }
  }

  private handleWebSocketError(error: Error): void {
    console.error(`WebSocket error for game ${this.gameId}:`, error);
    this.partialCleanup(); // Use partial cleanup to preserve gameId for reconnection
    this.attemptReconnect();
  }

  private handleWebSocketClose(code?: number, reason?: Buffer): void {
    const connectionDuration = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
    const reasonStr = reason ? reason.toString() : 'No reason provided';
    
    console.log(`WebSocket connection closed for game ${this.gameId}`);
    console.log(`Connection was open for: ${connectionDuration}ms`);
    console.log(`Close code: ${code}, reason: "${reasonStr}"`);
    
    // Log human-readable close code meanings
    if (code) {
      const closeCodeMeaning = this.getCloseCodeMeaning(code);
      console.log(`Close code meaning: ${closeCodeMeaning}`);
    }
    
    // Check for permanent errors that should not trigger reconnection
    if (code === 4400) {
      console.log(`Close code 4400 indicates game is not available for subscription - treating as permanent error, will not reconnect`);
      this.cleanup(); // Full cleanup for permanent errors
      return;
    }
    
    this.partialCleanup(); // Use partial cleanup to preserve gameId for reconnection
    this.attemptReconnect();
  }

  private getCloseCodeMeaning(code: number): string {
    switch (code) {
      case 1000: return 'Normal closure';
      case 1001: return 'Going away (page unload/server shutdown)';
      case 1002: return 'Protocol error';
      case 1003: return 'Unsupported data type';
      case 1004: return 'Reserved';
      case 1005: return 'No status code present';
      case 1006: return 'Abnormal closure (no close frame)';
      case 1007: return 'Invalid data (not UTF-8)';
      case 1008: return 'Policy violation';
      case 1009: return 'Message too large';
      case 1010: return 'Extension required';
      case 1011: return 'Internal server error';
      case 1012: return 'Service restart';
      case 1013: return 'Try again later';
      case 1014: return 'Bad gateway';
      case 1015: return 'TLS handshake failure';
      case 4400: return 'Game not available for subscription (permanent error)';
      default: return `Unknown code (${code})`;
    }
  }

  private setupKeepAlive(): void {
    console.log(`Setting up keep-alive for game ${this.gameId} (interval: ${this.keepAliveDelay}ms)`);
    this.keepAliveInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log(`Sending keep-alive message for game ${this.gameId}`);
        try {
          this.ws.send('Gameday5');
          console.log(`Keep-alive sent successfully for game ${this.gameId}`);
        } catch (error) {
          console.error(`Failed to send keep-alive for game ${this.gameId}:`, error);
        }
      } else {
        console.warn(`Skipping keep-alive for game ${this.gameId} - WebSocket not open (state: ${this.ws?.readyState})`);
      }
    }, this.keepAliveDelay);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached for game ${this.gameId}`);
      this.cleanup(); // Full cleanup after max attempts
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`Attempting to reconnect to game ${this.gameId} (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.establishConnection();
        console.log(`Reconnection successful for game ${this.gameId} on attempt ${this.reconnectAttempts}`);
      } catch (error) {
        console.error(`Reconnection attempt ${this.reconnectAttempts} failed for game ${this.gameId}:`, error);
      }
    }, delay);
  }

  private partialCleanup(): void {
    console.log(`Performing partial cleanup for game ${this.gameId} (preserving gameId for reconnection)`);
    
    // Clean up WebSocket and intervals, but preserve gameId and callback for reconnection
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      console.log(`Keep-alive interval cleared for game ${this.gameId}`);
    }

    if (this.ws) {
      const currentState = this.ws.readyState;
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
        console.log(`WebSocket manually closed for game ${this.gameId} (was in state: ${currentState})`);
      }
      this.ws = null;
    }
    // DO NOT clear gameId or updateCallback - we need them for reconnection
  }

  private cleanup(): void {
    console.log(`Performing full cleanup for game ${this.gameId}`);
    
    // Full cleanup - clear everything including gameId and callback
    this.partialCleanup();
    
    this.gameId = null;
    this.updateCallback = null;
    this.reconnectAttempts = 0;
    this.connectionStartTime = 0;
    
    console.log('Full cleanup completed - all state cleared');
  }
}

