import { Dispatch } from '@reduxjs/toolkit';
import { updateLiveStatus } from '@/simDash/store/slices/scheduleSlice';
import type { RootState } from '@/store/store';
import { Store } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface GameSubscription {
  gameId: number;
  league: string;
  matchId: number;
  subscribers: Set<string>; // Track who is subscribed (e.g., 'schedule', 'matchup-123')
}

class MLBWebSocketManager {
  private dispatch: Dispatch | null = null;
  private store: Store<RootState> | null = null;
  private gameSubscriptions: Map<number, GameSubscription> = new Map();
  private connectionPromises: Map<number, Promise<void>> = new Map();
  private unsubscribeStoreListener?: () => void;
  private openLeagueTabs: Set<string> = new Set(); // Track open MLB league tabs

  initialize(dispatch: Dispatch, store: Store<RootState>) {
    this.dispatch = dispatch;
    this.store = store;
    this.setupStoreListener();
  }

  private setupStoreListener() {
    if (!this.store) return;

    let previousOpenTabs: string[] = [];

    this.unsubscribeStoreListener = this.store.subscribe(() => {
      const state = this.store!.getState();
      const currentOpenTabs = state.simDash.tabs.openTabs
        .filter(tab => tab.type === 'league' && tab.league === 'MLB')
        .map(tab => tab.id);

      // Check for newly opened MLB league tabs
      const newlyOpened = currentOpenTabs.filter(tabId => !previousOpenTabs.includes(tabId));
      const recentlyClosed = previousOpenTabs.filter(tabId => !currentOpenTabs.includes(tabId));

      // Handle newly opened tabs - just track them, don't connect yet
      for (const tabId of newlyOpened) {
        this.openLeagueTabs.add(tabId);
        console.log(`MLB League tab opened: ${tabId}, waiting for schedule data before connecting to WebSockets`);
      }

      // Handle recently closed tabs
      for (const tabId of recentlyClosed) {
        this.openLeagueTabs.delete(tabId);
        this.handleLeagueTabClosed(tabId);
      }

      previousOpenTabs = currentOpenTabs;
    });
  }

  private handleLeagueTabClosed(tabId: string) {
    console.log(`MLB League tab closed: ${tabId}, cleaning up subscriptions`);
    
    // Remove this tab as a subscriber from all games
    for (const [gameId, subscription] of this.gameSubscriptions) {
      subscription.subscribers.delete(tabId);
      
      // If no subscribers left, disconnect from this game
      if (subscription.subscribers.size === 0) {
        this.disconnectFromGame(gameId);
      }
    }
  }

  async subscribeToGame(gameId: number, league: string, matchId: number, subscriberId: string): Promise<void> {
    if (!this.dispatch) {
      console.error('WebSocket manager not initialized');
      return;
    }

    // Validate gameId before proceeding
    if (!gameId || typeof gameId !== 'number' || gameId <= 0 || !Number.isInteger(gameId)) {
      console.error(`Invalid gameId provided to subscribeToGame: ${gameId} (${typeof gameId})`);
      return;
    }

    const existingSubscription = this.gameSubscriptions.get(gameId);
    
    if (existingSubscription) {
      // Add this subscriber to existing subscription
      existingSubscription.subscribers.add(subscriberId);
      console.log(`[WebSocketManager] Added subscriber ${subscriberId} to existing connection for game ${gameId}. Total subscribers: ${existingSubscription.subscribers.size}`);
      return;
    }

    // Check if there's already a connection attempt in progress
    const existingPromise = this.connectionPromises.get(gameId);
    if (existingPromise) {
      console.log(`[WebSocketManager] Connection in progress for game ${gameId}, waiting for ${subscriberId}...`);
      await existingPromise;
      // After waiting, add subscriber to the now-existing subscription
      const subscription = this.gameSubscriptions.get(gameId);
      if (subscription) {
        subscription.subscribers.add(subscriberId);
        console.log(`[WebSocketManager] Added ${subscriberId} to game ${gameId} after waiting for connection. Total subscribers: ${subscription.subscribers.size}`);
      }
      return;
    }

    // Create new subscription
    const subscription: GameSubscription = {
      gameId,
      league,
      matchId,
      subscribers: new Set([subscriberId])
    };

    this.gameSubscriptions.set(gameId, subscription);

    // Create connection promise
    const connectionPromise = this.connectToWebSocket(gameId);
    this.connectionPromises.set(gameId, connectionPromise);

    try {
      await connectionPromise;
      console.log(`[WebSocketManager] Successfully created NEW connection and subscribed ${subscriberId} to game ${gameId}`);
    } catch (error) {
      console.error(`Failed to connect to WebSocket for game ${gameId}:`, error);
      this.gameSubscriptions.delete(gameId);
    } finally {
      this.connectionPromises.delete(gameId);
    }
  }

  private async connectToWebSocket(gameId: number): Promise<void> {
    // Final validation before sending to backend
    if (!gameId || typeof gameId !== 'number' || gameId <= 0 || !Number.isInteger(gameId)) {
      const error = new Error(`Invalid gameId for WebSocket connection: ${gameId} (${typeof gameId})`);
      console.error(error.message);
      throw error;
    }

    try {
      console.log(`Connecting to WebSocket for game ${gameId}...`);
      await window.electronAPI.connectToWebSocketMLB({ gameId });
      
      // Set up the update listener for this game
      const cleanup = window.electronAPI.onMLBGameUpdate((data) => {
        if (data.gameId === gameId && this.dispatch) {
          const subscription = this.gameSubscriptions.get(gameId);
          if (subscription) {
            // Update live status (reduced logging for performance)
            console.log(`[WebSocketManager] Live update for game ${gameId}: ${data.data.gameData.status.detailedState}`);
            
            // Update the schedule slice with live status
            this.dispatch(updateLiveStatus({
              league: subscription.league,
              matchId: subscription.matchId,
              status: {
                abstractGameState: data.data.gameData.status.abstractGameState,
                detailedState: data.data.gameData.status.detailedState,
                reason: data.data.liveData?.plays?.currentPlay?.result?.eventType
              }
            }));

          }
        }
      });

      // Store cleanup function with the subscription
      const subscription = this.gameSubscriptions.get(gameId);
      if (subscription) {
        (subscription as any).cleanup = cleanup;
      }
    } catch (error) {
      console.error(`Failed to connect to WebSocket for game ${gameId}:`, error);
      throw error;
    }
  }

  private async disconnectFromGame(gameId: number): Promise<void> {
    const subscription = this.gameSubscriptions.get(gameId);
    if (!subscription) return;

    try {
      // Clean up WebSocket listener
      if ((subscription as any).cleanup) {
        (subscription as any).cleanup();
      }

      // Disconnect from WebSocket
      await window.electronAPI.disconnectFromWebSocketMLB({ gameId });
      console.log(`Disconnected from WebSocket for game ${gameId}`);
    } catch (error) {
      console.error(`Failed to disconnect from WebSocket for game ${gameId}:`, error);
    } finally {
      this.gameSubscriptions.delete(gameId);
    }
  }

  unsubscribeFromGame(gameId: number, subscriberId: string): void {
    const subscription = this.gameSubscriptions.get(gameId);
    if (!subscription) return;

    subscription.subscribers.delete(subscriberId);
    console.log(`Removed subscriber ${subscriberId} from game ${gameId}`);

    // If no subscribers left, disconnect
    if (subscription.subscribers.size === 0) {
      this.disconnectFromGame(gameId);
    }
  }

  unsubscribeAll(subscriberId: string): void {
    for (const [gameId, subscription] of this.gameSubscriptions) {
      subscription.subscribers.delete(subscriberId);
      
      if (subscription.subscribers.size === 0) {
        this.disconnectFromGame(gameId);
      }
    }
  }

  // Handle schedule updates for open tabs - primary connection trigger
  async handleScheduleUpdate(league: string, scheduleData: any[]): Promise<void> {
    if (league !== 'MLB' || this.openLeagueTabs.size === 0) return;

    // Filter for today's games with validation
    const today = new Date().toLocaleDateString('en-CA');
    const todayGames = scheduleData.filter(game => {
      const gameDate = new Date(game.PostDtmUTC).toLocaleDateString('en-CA');
      const isToday = gameDate === today;
      const hasValidGameId = game.MLBGameId && 
                            typeof game.MLBGameId === 'number' && 
                            game.MLBGameId > 0 && 
                            Number.isInteger(game.MLBGameId);
      
      if (isToday && !hasValidGameId) {
        console.warn(`Game found for today but invalid MLBGameId:`, {
          match: game.Match,
          teams: `${game.Participant1}@${game.Participant2}`,
          gameDate,
          MLBGameId: game.MLBGameId,
          type: typeof game.MLBGameId
        });
      }
      
      return isToday && hasValidGameId;
    });

    if (todayGames.length === 0) {
      console.log('No valid games for today found in schedule, no WebSocket connections needed');
      return;
    }

    console.log(`Found ${todayGames.length} valid today's games, filtering based on current status`);

    // Filter out Final games based on status already fetched and updated during schedule load
    const eligibleGames = todayGames.filter(game => {
      return game.Status !== 'Final';
    });

    const finalGameCount = todayGames.length - eligibleGames.length;

    console.log(`After filtering Final games: ${eligibleGames.length}/${todayGames.length} games eligible for WebSocket subscription${finalGameCount > 0 ? ` (${finalGameCount} Final games skipped)` : ''}`);

    if (eligibleGames.length === 0) {
      console.log('No eligible games for WebSocket subscription after filtering');
      return;
    }

    // Subscribe to eligible games for all open league tabs
    for (const tabId of this.openLeagueTabs) {
      console.log(`Subscribing to ${eligibleGames.length} eligible games for tab: ${tabId}`);
      
      for (const game of eligibleGames) {
        if (game.MLBGameId && !this.gameSubscriptions.has(game.MLBGameId)) {
          await this.subscribeToGame(game.MLBGameId, league, game.Match, tabId);
        } else if (game.MLBGameId && this.gameSubscriptions.has(game.MLBGameId)) {
          // Add this tab as an additional subscriber to existing game
          const subscription = this.gameSubscriptions.get(game.MLBGameId);
          if (subscription) {
            subscription.subscribers.add(tabId);
            console.log(`Added tab ${tabId} as subscriber to existing game ${game.MLBGameId}`);
          }
        }
      }
    }
  }

  destroy(): void {
    if (this.unsubscribeStoreListener) {
      this.unsubscribeStoreListener();
    }

    // Disconnect from all games
    for (const [gameId] of this.gameSubscriptions) {
      this.disconnectFromGame(gameId);
    }

    this.gameSubscriptions.clear();
    this.connectionPromises.clear();
    this.openLeagueTabs.clear();
    this.dispatch = null;
    this.store = null;
  }
}

// Global instance
let mlbWebSocketManager: MLBWebSocketManager | null = null;

export const createMLBWebSocketManager = (dispatch: Dispatch, store: Store<RootState>): MLBWebSocketManager => {
  if (!mlbWebSocketManager) {
    mlbWebSocketManager = new MLBWebSocketManager();
  }
  mlbWebSocketManager.initialize(dispatch, store);
  return mlbWebSocketManager;
};

export const getMLBWebSocketManager = (): MLBWebSocketManager | null => {
  return mlbWebSocketManager;
}; 