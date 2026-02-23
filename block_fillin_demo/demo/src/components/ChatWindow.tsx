/**
 * @file ChatWindow.tsx
 * @description Chat panel that lets the user type a prompt and receives a cohesive
 * narrative + asset regeneration for all game blocks in one shot. Also exposes
 * model selection and image upload for vision-based prompts.
 *
 * Key exports:
 *  - ChatWindow: React component (default export)
 */

import { useState, useRef, useEffect } from 'react';
import { Send, History, Image, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PreviewScene from './PreviewScene';
import {
  switchModel,
  ChatMessage,
  sendCohesiveChatMessage,
  sendBlockGenerate,
} from '../api/chatApi';
import { CompositeObject, WorldConfig, useGameStore, getCurrentMechanismConfig } from '@smallgami/engine';
import '../styles/chat-window.scss';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  asset?: CompositeObject; // Optional asset associated with this message
  worldConfig?: WorldConfig; // Optional world config associated with this message
  image?: string; // Optional base64 image
}

interface ChatWindowProps {
  narrativeSlots: Record<string, string>;
  setNarrativeSlots: (slots: Record<string, string>) => void;
  gameId: string;
  generatingBlocks: Set<string>;
  setGeneratingBlocks: (blocks: Set<string>) => void;
  setTransition: (transition: string | undefined) => void;
}

export default function ChatWindow({
  narrativeSlots,
  setNarrativeSlots,
  gameId,
  generatingBlocks,
  setGeneratingBlocks,
  setTransition,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<CompositeObject | null>(
    null
  );
  const [selectedModel, setSelectedModel] =
    useState<string>('claude-sonnet-4-5');
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get world config and update function from game store
  const worldConfig = useGameStore(state => state.worldConfig);
  const setWorldConfig = useGameStore(state => state.setWorldConfig);
  const playerConfig = useGameStore(state => state.playerConfig);
  const gameConfig = useGameStore(state => state.gameConfig);
  const setGameConfig = useGameStore(state => state.setGameConfig);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if ((!inputValue.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim() || (uploadedImage ? '[Image uploaded]' : ''),
      timestamp: new Date(),
      image: uploadedImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue.trim() || '';
    const imageToSend = uploadedImage;
    setInputValue('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);

      // Mark all blocks as generating
      setGeneratingBlocks(new Set(['player', 'world', 'object']));

      // Send cohesive chat message with narrative context
      const response = await sendCohesiveChatMessage(
        messageToSend,
        narrativeSlots,
        gameId,
        mechanismConfig || undefined,
        playerConfig,
        worldConfig,
        gameConfig?.objects,
        gameConfig?.spawn,
        imageToSend || undefined
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.message || 'Failed to generate cohesive response'
        );
      }

      const { narrative, response: assistantResponse } = response.data;

      // Update transition if present
      if (narrative.transition) {
        setTransition(narrative.transition);
      }

      // Update narrative slots (excluding transition)
      const { transition, ...narrativeSlotsOnly } = narrative;
      setNarrativeSlots(narrativeSlotsOnly as Record<string, string>);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Generate all blocks with the new narrative
      const themeDataRecord = narrative as Record<string, any>;
      const objectKeys = mechanismConfig
        ? Object.keys(mechanismConfig.objects)
        : [];

      const generatePlayer = sendBlockGenerate(
        'player',
        'generate',
        narrative.player,
        playerConfig,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      ).catch(error => {
        console.error('❌ Player generation failed:', error);
        return null;
      });

      const generateWorld = sendBlockGenerate(
        'world',
        'generate',
        narrative.world,
        undefined,
        worldConfig,
        narrative.player,
        undefined,
        undefined,
        undefined,
        undefined
      ).catch(error => {
        console.error('❌ World generation failed:', error);
        return null;
      });

      const objectGenerations = objectKeys.map((key, index) => {
        const objectDescription = themeDataRecord[key] || '';
        return sendBlockGenerate(
          'object',
          'generate',
          objectDescription,
          undefined,
          undefined,
          undefined,
          gameConfig?.objects?.[index],
          narrative.world,
          gameConfig?.spawn,
          gameId,
          mechanismConfig || undefined
        ).catch(error => {
          console.error(`❌ ${key} generation failed:`, error);
          return null;
        });
      });

      // Wait for all generations to complete
      Promise.all([generatePlayer, generateWorld, ...objectGenerations])
        .then(async responses => {
          const playerResponse = responses[0];
          const worldResponse = responses[1];
          const objectResponses = responses.slice(2);
          console.log('📦 All cohesive generations complete');

          if (!gameConfig) {
            console.error('No game config available');
            return;
          }

          // Build the complete updated config with all changes
          let updatedConfig = { ...gameConfig };

          // Apply player updates
          if (playerResponse?.success && playerResponse.data) {
            console.log('✅ Applying player updates');
            const cacheBuster = Date.now();
            updatedConfig = {
              ...updatedConfig,
              player: playerResponse.data.playerConfig,
              assets: {
                ...updatedConfig.assets,
                models: {
                  ...updatedConfig.assets.models,
                  player: `${playerResponse.data.assetFilename}?v=${cacheBuster}`,
                },
              },
            };
          }

          // Apply world updates
          if (worldResponse?.success && worldResponse.data) {
            console.log('✅ Applying world updates');
            const cacheBuster = Date.now();

            if (worldResponse.data.worldConfig) {
              updatedConfig.world = worldResponse.data.worldConfig;
              setWorldConfig(worldResponse.data.worldConfig);
            }

            if (worldResponse.data.groundTexture) {
              updatedConfig = {
                ...updatedConfig,
                assets: {
                  ...updatedConfig.assets,
                  ground: `${worldResponse.data.groundTexture}?v=${cacheBuster}`,
                },
              };
            }

            if (worldResponse.data.ambientSound) {
              updatedConfig = {
                ...updatedConfig,
                assets: {
                  ...updatedConfig.assets,
                  sounds: {
                    ...updatedConfig.assets.sounds,
                    ambient: {
                      file: `${worldResponse.data.ambientSound}?v=${cacheBuster}`,
                      volume: 0.3,
                      loop: true,
                    },
                  },
                },
              };
            }
          }

          // Apply object updates
          const updatedObjects = [...updatedConfig.objects];
          let updatedModels = { ...updatedConfig.assets.models };
          let updatedSpawn = updatedConfig.spawn;

          objectResponses.forEach((objectResponse, index) => {
            if (
              objectResponse?.success &&
              objectResponse.data &&
              objectResponse.data.objectId
            ) {
              const objectKey = objectKeys[index];
              console.log(`✅ Applying ${objectKey} updates`);
              const cacheBuster = Date.now();
              updatedObjects[index] = objectResponse.data.objectConfig;
              updatedModels[objectResponse.data.objectId] =
                `${objectResponse.data.assetFilename}?v=${cacheBuster}`;

              if (objectResponse.data.spawnConfigs) {
                updatedSpawn = objectResponse.data.spawnConfigs;
              }
            }
          });

          // Apply all object updates to config
          updatedConfig = {
            ...updatedConfig,
            objects: updatedObjects,
            spawn: updatedSpawn,
            assets: {
              ...updatedConfig.assets,
              models: updatedModels,
            },
          };

          // Single atomic update with all changes
          setGameConfig(updatedConfig);
          console.log('🎉 All cohesive updates applied successfully!');

          // Clear generating state
          setGeneratingBlocks(new Set());
        })
        .catch(error => {
          console.error('⚠️ Error applying updates:', error);
          // Clear generating state even on error
          setGeneratingBlocks(new Set());
        });
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setGeneratingBlocks(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelChange = async (newModel: string) => {
    setIsDropdownOpen(false);
    setIsSwitchingModel(true);

    try {
      const response = await switchModel(newModel);

      if (response.success) {
        setSelectedModel(newModel);

        // Add system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: `Switched to ${response.info?.model || newModel} (${response.info?.provider || 'unknown provider'})`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, systemMessage]);
      } else {
        throw new Error(response.message || 'Failed to switch model');
      }
    } catch (error) {
      console.error('Error switching model:', error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Failed to switch model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSwitchingModel(false);
    }
  };

  const models = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  ];

  const getModelLabel = (value: string) => {
    return models.find(m => m.value === value)?.label || value;
  };

  const handleMessageClick = (message: Message) => {
    if (message.asset) {
      setGeneratedAsset(message.asset);
    }
    if (message.worldConfig) {
      setWorldConfig(message.worldConfig);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async event => {
        const base64 = event.target?.result as string;
        setUploadedImage(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  return (
    <div className='chat-panel-container'>
      {/* <div className='preview-window'>
        <PreviewScene generatedAsset={generatedAsset} />
      </div> */}
      <div className='chat-window'>
        {/* <div className='chat-messages'>
          {messages.length === 0 ? (
            <div className='empty-state'>
              <p>Start a conversation to generate or modify your game.</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`message ${message.type} ${message.asset ? 'has-asset' : ''} ${message.worldConfig ? 'has-config' : ''}`}
                onClick={() => handleMessageClick(message)}
                style={{
                  cursor:
                    message.asset || message.worldConfig
                      ? 'pointer'
                      : 'default',
                }}
              >
                <div className='message-content'>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div> */}

        <div className='chat-input-container'>
          {uploadedImage && (
            <div className='uploaded-image-preview'>
              <button
                className='remove-image-btn'
                onClick={handleRemoveImage}
                title='Remove image'
              >
                <X size={14} />
              </button>
              <img src={uploadedImage} alt='Uploaded' className='preview-img' />
            </div>
          )}
          <textarea
            ref={inputRef}
            className='chat-input'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading
                ? 'Waiting for response...'
                : uploadedImage
                  ? 'Add a description or send image as is... (Enter to send)'
                  : 'Type a message... (Enter to send, Shift+Enter for new line)'
            }
            rows={1}
            disabled={isLoading}
          />
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className='input-controls'>
            <div className='model-selector' ref={dropdownRef}>
              <button
                className='model-selector-trigger'
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading || isSwitchingModel}
                title='Select AI Model'
              >
                {getModelLabel(selectedModel)}
              </button>
              {isDropdownOpen && (
                <div className='model-dropdown'>
                  {models.map(model => (
                    <button
                      key={model.value}
                      className={`model-option ${selectedModel === model.value ? 'selected' : ''}`}
                      onClick={() => handleModelChange(model.value)}
                      disabled={isSwitchingModel}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className='action-buttons'>
              <button
                className='upload-btn'
                onClick={handleImageUpload}
                disabled={isLoading}
                title='Upload Image'
              >
                <Image size={18} />
              </button>
              <div
                className={`history-toggle ${isHistoryEnabled ? 'active' : ''}`}
                onClick={() => setIsHistoryEnabled(!isHistoryEnabled)}
              >
                {isHistoryEnabled ? 'Remember' : 'Forget'}
              </div>
              <button
                className='send-btn'
                onClick={handleSend}
                disabled={(!inputValue.trim() && !uploadedImage) || isLoading}
                title='Send Message'
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
