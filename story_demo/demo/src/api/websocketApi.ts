/**
 * @file websocketApi.ts
 * @description WebSocket client for streaming asset generation. Wraps the native
 * browser WebSocket with connect/disconnect lifecycle management and typed message
 * handling.
 *
 * Key exports:
 *  - getAssetGenerationWebSocket: singleton accessor for the WebSocket client
 *  - AssetGenerationWebSocketClient: class with connect / generateAssets / onMessage
 */

export interface AssetGenerationMessage {
  type:
    | 'generation_started'
    | 'asset_generated'
    | 'generation_complete'
    | 'error';
  message?: string;
  game_id?: string;
  asset_data?: {
    type: 'model' | 'audio' | 'skybox';
    asset_name?: string;
    sound_name?: string;
    sound_type?: string;
    skybox_name?: string;
    path: string;
    prompt: string;
    asset_id: number;
  };
}

export class AssetGenerationWebSocket {
  private ws: WebSocket | null = null;
  private clientId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(clientId?: string) {
    this.clientId =
      clientId ||
      `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:8000/ws/assets/${this.clientId}`;
        console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = event => {
          console.log('✅ WebSocket connected successfully');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = error => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = event => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.handleReconnect();
        };
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  onMessage(callback: (message: AssetGenerationMessage) => void) {
    if (this.ws) {
      this.ws.onmessage = event => {
        try {
          const message: AssetGenerationMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          callback(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
    }
  }

  generateAssets(
    complete_config: any,
    game_name: string,
    game_id: string,
    include_skybox: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const request = {
        action: 'generate_assets',
        complete_config,
        game_name,
        game_id,
        include_skybox,
      };

      try {
        console.log('📤 Sending asset generation request:', request);
        this.ws.send(JSON.stringify(request));
        resolve();
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance for global use
let globalWebSocketInstance: AssetGenerationWebSocket | null = null;

export function getAssetGenerationWebSocket(): AssetGenerationWebSocket {
  if (!globalWebSocketInstance) {
    globalWebSocketInstance = new AssetGenerationWebSocket();
  }
  return globalWebSocketInstance;
}

export function disconnectAssetGenerationWebSocket() {
  if (globalWebSocketInstance) {
    globalWebSocketInstance.disconnect();
    globalWebSocketInstance = null;
  }
}
