/**
 * @file gameApi.ts
 * @description HTTP and WebSocket client functions for game-level operations:
 * DSL generation, asset streaming, factory-state persistence, file upload, and
 * game-config save/load. The base URL is read from VITE_API_URL (defaults to
 * http://localhost:5000).
 *
 * Key exports:
 *  - generateGame2DSL / generateLowLevelConfig / generateAssets: pipeline steps
 *  - generateAssetsStreaming: WebSocket-backed streaming asset generation
 *  - sendFactoryState / saveFactoryState / loadFactoryState: factory persistence
 *  - uploadFile: multipart file upload
 *  - saveGameConfig / loadConfigFile / listConfigFiles: config file management
 */

export interface Game2DSLRequest {
  narrative: string[];
}

export interface Game2DSLResponse {
  message: string;
  game2_dsl: any; // The high-level DSL data
}

export interface LowLevelConfigRequest {
  game2_dsl: any;
}

export interface LowLevelConfigResponse {
  message: string;
  complete_config: any;
  config_id: string;
}

export interface AssetGenerationRequest {
  game2_dsl: any;
}

export interface AssetGenerationResponse {
  message: string;
  assets: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function generateGame2DSL(
  game_id: string,
  narrative_text: string,
  mechanism_sentence: string,
  name: string
): Promise<Game2DSLResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-game2-dsl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id,
        narrative_text,
        mechanism_sentence,
        name,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating Game2DSL:', error);
    throw error;
  }
}

export async function generateLowLevelConfig(
  game2_dsl: any,
  game_id: string,
  game_name: string
): Promise<LowLevelConfigResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-low-level-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game2_dsl: game2_dsl,
        game_id: game_id,
        game_name: game_name,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating low-level config:', error);
    throw error;
  }
}

export async function generateAssets(
  game2_dsl: any,
  game_id: string,
  game_name: string
): Promise<AssetGenerationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ game2_dsl, game_id, game_name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating assets:', error);
    throw error;
  }
}

// WebSocket-based asset generation with streaming
export async function generateAssetsStreaming(
  complete_config: any,
  game_id: string,
  game_name: string,
  onAssetGenerated: (assetData: any) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const { getAssetGenerationWebSocket } = await import('./websocketApi');

  try {
    const wsClient = getAssetGenerationWebSocket();

    // Connect if not already connected
    if (!wsClient.isConnected()) {
      await wsClient.connect();
    }

    // Check if skybox generation is needed
    const atmosphere = complete_config.atmosphere || {};
    const background = atmosphere.background || {};
    const needsSkybox = background.type === 'skybox';

    console.log(`🎨 Asset generation: skybox needed = ${needsSkybox}`);

    // Set up message handler
    wsClient.onMessage(message => {
      switch (message.type) {
        case 'generation_started':
          console.log('🎨 Asset generation started:', message.message);
          break;

        case 'asset_generated':
          console.log('✅ Asset generated:', message.asset_data);
          if (message.asset_data) {
            onAssetGenerated(message.asset_data);
          }
          break;

        case 'generation_complete':
          console.log('🎯 Asset generation completed:', message.message);
          onComplete();
          break;

        case 'error':
          console.error('🚨 Asset generation error:', message.message);
          console.trace('🚨 Asset error stack trace');
          onError(message.message || 'Unknown error');
          break;

        default:
          console.warn('🤔 Unknown message type:', message.type);
      }
    });

    // Start asset generation with conditional skybox
    await wsClient.generateAssets(
      complete_config,
      game_name,
      game_id,
      needsSkybox
    );
  } catch (error) {
    console.error('🚨 WebSocket asset generation error:', error);
    console.trace('🚨 WebSocket error stack trace');
    onError(
      error instanceof Error ? error.message : 'WebSocket connection failed'
    );
  }
}

export interface DialogueInteractionRequest {
  user_input: string;
  object_name: string;
  game_id?: string;
}

export interface DialogueInteractionResponse {
  message: string;
  game_setting_config: string;
  game_layout_config: string;
  dsl_data: string;
}

export async function handleDialogueInteraction(
  request: DialogueInteractionRequest
): Promise<DialogueInteractionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/dialogue-interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error handling dialogue interaction:', error);
    throw error;
  }
}

// Factory state interfaces
export interface AssetRef {
  id: string;
  content: string;
  type: 'text' | 'file' | 'genre';
  reference: string;
  fileUrl?: string;
  file?: File;
}

// Factory store item format (matches server structure)
export interface FactoryStoreItem {
  id: string;
  content: string | null;
  dataType: 'text' | 'image' | 'file' | 'category';
  fileUrl?: string | null;
  tags: string[];
}

export interface FactoryStateRequest {
  timestamp: string;
  mechanism: string | null;
  factory_store: FactoryStoreItem[];
}

export interface FactoryStateResponse {
  message: string;
  success: boolean;
}

export async function sendFactoryState(
  factoryState: FactoryStateRequest,
  game_id: string | null
): Promise<FactoryStateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/factory-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        factoryState: factoryState,
        game_id: game_id || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// Factory state save/load interfaces
export interface SaveFactoryStateResponse {
  message: string;
  success: boolean;
  filename: string;
}

export interface FactoryStateFile {
  filename: string;
  created_at: string;
  display_name: string;
}

export interface ListFactoryStatesResponse {
  message: string;
  files: FactoryStateFile[];
}

export interface LoadFactoryStateResponse {
  message: string;
  success: boolean;
  factory_store: FactoryStoreItem[];
  timestamp: string;
  mechanism: string | null;
  filename: string;
}

// Save factory state to server
export async function saveFactoryState(
  factoryState: FactoryStateRequest
): Promise<SaveFactoryStateResponse> {
  try {
    console.log('💾 Saving factory state to server:', factoryState);

    const response = await fetch(`${API_BASE_URL}/save-factory-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryState),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Factory state saved successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error saving factory state:', error);
    throw error;
  }
}

// List available factory state files
export async function listFactoryStates(): Promise<ListFactoryStatesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/list-factory-states`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📋 Factory states listed successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error listing factory states:', error);
    throw error;
  }
}

// Load factory state from server
export async function loadFactoryState(
  filename: string
): Promise<LoadFactoryStateResponse> {
  try {
    console.log('📂 Loading factory state from server:', filename);

    const response = await fetch(
      `${API_BASE_URL}/load-factory-state/${encodeURIComponent(filename)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Factory state loaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error loading factory state:', error);
    throw error;
  }
}

// Upload file interfaces
export interface UploadFileResponse {
  success: boolean;
  message: string;
  content?: any;
  original_filename?: string;
  file_url?: string;
}

// Upload file to server
export async function uploadFile(
  file: File,
  gameId: string
): Promise<UploadFileResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log(`📤 Uploading file: ${file.name} to game: ${gameId}`);
    const response = await fetch(`${API_BASE_URL}/upload-file/${gameId}`, {
      method: 'POST',
      body: formData, // Don't set Content-Type header, let browser set it with boundary
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.message || 'Upload failed');
    }

    const result = await response.json();
    console.log('✅ File uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
}

// Save game config interfaces
export interface SaveGameConfigResponse {
  message: string;
  success: boolean;
  filename: string;
}

// Save game config to frontend/src/config/ folder
export async function saveGameConfig(
  gameConfig: any,
  gameName: string
): Promise<SaveGameConfigResponse> {
  try {
    console.log('💾 Saving game config to server:', gameName);

    const response = await fetch(`${API_BASE_URL}/save-game-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_config: gameConfig,
        game_name: gameName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Game config saved successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error saving game config:', error);
    throw error;
  }
}

// List config files interfaces
export interface ConfigFileInfo {
  filename: string;
  size: number;
  modified: string;
}

export interface ListConfigFilesResponse {
  success: boolean;
  files: ConfigFileInfo[];
  message: string;
}

// List config files from server
export async function listConfigFiles(): Promise<ListConfigFilesResponse> {
  try {
    console.log('📋 Listing config files from server');

    const response = await fetch(`${API_BASE_URL}/list-config-files`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Config files listed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error listing config files:', error);
    throw error;
  }
}

// Load config file interface
export interface LoadConfigFileResponse {
  success: boolean;
  config: any;
  filename: string;
  message: string;
}

// Load a specific config file from server
export async function loadConfigFile(
  filename: string
): Promise<LoadConfigFileResponse> {
  try {
    console.log('📂 Loading config file from server:', filename);

    const response = await fetch(
      `${API_BASE_URL}/load-config-file/${encodeURIComponent(filename)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Config file loaded:', result);
    return result;
  } catch (error) {
    console.error('❌ Error loading config file:', error);
    throw error;
  }
}
