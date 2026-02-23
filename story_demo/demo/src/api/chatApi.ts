/**
 * @file chatApi.ts
 * @description HTTP client functions for all chat and block-generation endpoints.
 * The base URL is read from the VITE_API_URL environment variable (defaults to
 * http://localhost:5000).
 *
 * Key exports:
 *  - sendChatMessage: basic single-turn chat
 *  - switchModel: change the active AI model on the server
 *  - sendBlockGenerate: generate / upload a single game block (player/world/object)
 *  - sendChangePropagation: cohesively update all blocks after one changes
 *  - interpretMedia: describe an uploaded image for a block
 *  - sendCohesiveChatMessage: full cohesive narrative + asset generation in one call
 */
import { WorldConfig } from '@smallgami/engine';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatMessageRequest {
  message: string;
  history?: ChatMessage[];
  worldConfig?: WorldConfig;
}

export interface ChatMessageResponse {
  success: boolean;
  intent: 'chat' | 'generate_asset' | 'change_configuration';
  response: string | object;
  model?: string;
  provider?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function sendChatMessage(
  message: string,
  history?: ChatMessage[],
  worldConfig?: WorldConfig
): Promise<ChatMessageResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: history || [],
        worldConfig: worldConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

export interface SwitchModelRequest {
  model: string;
}

export interface SwitchModelResponse {
  success: boolean;
  message: string;
  info?: {
    provider: string;
    model: string;
  };
}

export async function switchModel(model: string): Promise<SwitchModelResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error switching model:', error);
    throw error;
  }
}

// Block generate API
export interface BlockGenerateRequest {
  blockType: 'player' | 'world' | 'object';
  actionType: 'generate' | 'uploadContent' | 'randomize';
  content: string;
  currentPlayerConfig?: any;
  currentWorldConfig?: any;
  playerDescription?: string;
  currentObjectConfig?: any;
  currentSpawnConfigs?: any[];
  worldDescription?: string;
  mechanism?: string;
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  };
}

export interface BlockGenerateResponse {
  success: boolean;
  message?: string;
  data?: {
    // Player generation response
    assetFilename?: string;
    playerConfig?: any;
    summary?: string;

    // World generation response
    worldConfig?: any;
    groundTexture?: string;
    ambientSound?: string;

    // Object generation response
    objectConfig?: any;
    objectId?: string;
    spawnConfigs?: any[];
    spawnSummary?: string;
    spawnWarning?: string;
  };
  warnings?: string[];
}

export async function sendBlockGenerate(
  blockType: 'player' | 'world' | 'object',
  actionType: 'generate' | 'uploadContent' | 'randomize',
  content: string,
  currentPlayerConfig?: any,
  currentWorldConfig?: any,
  playerDescription?: string,
  currentObjectConfig?: any,
  worldDescription?: string,
  currentSpawnConfigs?: any[],
  mechanism?: string,
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  }
): Promise<BlockGenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/blockGenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blockType,
        actionType,
        content,
        currentPlayerConfig,
        currentWorldConfig,
        playerDescription,
        currentObjectConfig,
        worldDescription,
        currentSpawnConfigs,
        mechanism,
        mechanismConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending block generate:', error);
    throw error;
  }
}

// Change propagation API
export interface ChangePropagationRequest {
  changedBlockType: 'player' | 'world' | 'object';
  newContent: string;
  oldContent: string;
  mechanism: string;
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  };
}

export interface ChangePropagationData {
  player: string;
  world: string;
  narrative: string;
  transition?: string;
  [key: string]: string | undefined; // Dynamic object keys based on mechanism
}

export interface ChangePropagationResponse {
  success: boolean;
  message?: string;
  data?: ChangePropagationData;
}

export async function sendChangePropagation(
  changedBlockType: 'player' | 'world' | 'object',
  newContent: string,
  oldContent: string,
  mechanism: string,
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  }
): Promise<ChangePropagationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/changePropagation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        changedBlockType,
        newContent,
        oldContent,
        mechanism,
        mechanismConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending change propagation:', error);
    throw error;
  }
}

// Media interpretation API
export interface InterpretMediaRequest {
  image: string;
  blockType: 'player' | 'world' | 'object';
}

export interface InterpretMediaResponse {
  success: boolean;
  description?: string;
  message?: string;
  type?: string;
}

export async function interpretMedia(
  imageBase64: string,
  blockType: 'player' | 'world' | 'object' | 'complete_game'
): Promise<InterpretMediaResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/interpretMedia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        blockType: blockType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error interpreting media:', error);
    throw error;
  }
}

// Cohesive chat generation API
export interface CohesiveChatRequest {
  message: string;
  image?: string;
  currentNarrative: Record<string, string>;
  mechanism: string;
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  };
  playerConfig?: any;
  worldConfig?: any;
  objectConfigs?: any[];
  spawnConfigs?: any[];
}

export interface CohesiveChatResponse {
  success: boolean;
  message?: string;
  data?: {
    narrative: ChangePropagationData;
    response: string;
  };
}

export async function sendCohesiveChatMessage(
  message: string,
  currentNarrative: Record<string, string>,
  mechanism: string,
  mechanismConfig?: {
    description: string;
    objects: Record<string, string>;
    narrative: string;
  },
  playerConfig?: any,
  worldConfig?: any,
  objectConfigs?: any[],
  spawnConfigs?: any[],
  image?: string
): Promise<CohesiveChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/cohesiveChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        image,
        currentNarrative,
        mechanism,
        mechanismConfig,
        playerConfig,
        worldConfig,
        objectConfigs,
        spawnConfigs,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending cohesive chat message:', error);
    throw error;
  }
}
