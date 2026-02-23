/**
 * @file StickyBlocks.tsx
 * @description State and logic container for the four sticky-block cards
 * (player, world, object, mechanism). Handles text editing, image upload, AI
 * generation, lock/unlock, and the "Change Everything" cohesive propagation mode.
 * Renders each card via the <StickyBlock> presentational component.
 *
 * Key exports:
 *  - StickyBlocks: React component (default export)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, Unlink, X, Image } from 'lucide-react';
import StickyBlock from './StickyBlock';
import {
  sendBlockGenerate,
  sendChangePropagation,
  interpretMedia,
} from '../api/chatApi';
import { useGameStore, mechanisms, getCurrentMechanismConfig } from '@smallgami/engine';
import DrawingPad from './DrawingPad';
import './StickyBlocks.scss';

interface Block {
  id: string;
  title: string;
  content: string | string[]; // Allow array for object block
}

interface UploadedImage {
  base64: string;
  description?: string;
  isLoading?: boolean;
}

interface StickyBlocksProps {
  gameId: string;
  setGameId: (id: string) => void;
  narrativeSlots: Record<string, string>;
  setNarrativeSlots: (slots: Record<string, string>) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  currentObjectIndex: number;
  setCurrentObjectIndex: (index: number) => void;
  generatingBlocks: Set<string>;
  setGeneratingBlocks: (blocks: Set<string>) => void;
}

export default function StickyBlocks({
  gameId,
  setGameId,
  narrativeSlots,
  setNarrativeSlots,
  hoveredId,
  setHoveredId,
  currentObjectIndex,
  setCurrentObjectIndex,
  generatingBlocks,
  setGeneratingBlocks,
}: StickyBlocksProps) {
  // Get game store state and actions
  const playerConfig = useGameStore(state => state.playerConfig);
  const worldConfig = useGameStore(state => state.worldConfig);
  const gameConfig = useGameStore(state => state.gameConfig);
  const setWorldConfig = useGameStore(state => state.setWorldConfig);
  const setGameConfig = useGameStore(state => state.setGameConfig);

  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'player',
      title: 'Player',
      content: '',
    },
    {
      id: 'world',
      title: 'World',
      content: '',
    },
    {
      id: 'object',
      title: 'Object',
      content: ['', ''],
    },
    {
      id: 'mechanism',
      title: 'Mechanism',
      content: '',
    },
  ]);

  const [isChangeEverythingEnabled, setIsChangeEverythingEnabled] =
    useState(false);
  const [isGlobalUploading, setIsGlobalUploading] = useState(false);
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [drawingBlockId, setDrawingBlockId] = useState<string | null>(null);

  // Helper functions for managing generating blocks
  const addGeneratingBlock = (id: string) => {
    const newSet = new Set(generatingBlocks);
    newSet.add(id);
    setGeneratingBlocks(newSet);
  };

  const removeGeneratingBlock = (id: string) => {
    const newSet = new Set(generatingBlocks);
    newSet.delete(id);
    setGeneratingBlocks(newSet);
  };

  const mechanismOptions = [
    { value: 'christmas', label: 'Dodge & Catch' },
    { value: 'running_christmas', label: 'Run & Catch' },
    { value: 'flappy_bird', label: 'Flappy Bird' },
    { value: 'test', label: 'Racing' },
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [lockedBlocks, setLockedBlocks] = useState<Set<string>>(new Set());
  const [originalContent, setOriginalContent] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<{
    [key: string]: UploadedImage;
  }>({});
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>(
    {}
  );
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper functions to handle content conversion
  const contentToString = (content: string | string[]): string => {
    return Array.isArray(content) ? content.join(', ') : content;
  };

  const stringToContent = (id: string, value: string): string | string[] => {
    // For object block, convert comma-separated string back to array
    if (id === 'object') {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
    }
    return value;
  };

  const handleDoubleClick = (id: string) => {
    if (!lockedBlocks.has(id)) {
      // Store original content before editing
      const block = blocks.find(b => b.id === id);
      if (block) {
        setOriginalContent(contentToString(block.content));
      }
      setEditingId(id);
    }
  };

  const handleBlur = async (id: string) => {
    setEditingId(null);
    const block = blocks.find(block => block.id === id);

    if (id !== 'mechanism' && block) {
      // Only send if content has changed
      if (contentToString(block.content) !== originalContent) {
        // If "change everything" is enabled, ask backend what else should change
        if (isChangeEverythingEnabled) {
          try {
            console.log(
              '🔗 Change Everything Mode: Generating cohesive theme...'
            );
            const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
            const propagationResponse = await sendChangePropagation(
              id as 'player' | 'world' | 'object',
              contentToString(block.content),
              originalContent,
              (blocks.find(b => b.id === 'mechanism')?.content as string) ||
                gameId,
              mechanismConfig || undefined
            );

            if (propagationResponse.success && propagationResponse.data) {
              const themeData = propagationResponse.data;

              // Build narrative slots dynamically based on mechanism config
              const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
              const themeDataRecord = themeData as Record<string, any>;
              const slots: Record<string, string> = {
                player: themeData.player,
                world: themeData.world,
              };
              // Add object slots based on mechanism config
              if (mechanismConfig) {
                Object.keys(mechanismConfig.objects).forEach(key => {
                  if (themeDataRecord[key]) {
                    slots[key] = themeDataRecord[key];
                  }
                });
              }
              setNarrativeSlots(slots);

              // Update block contents
              setBlocks(prev =>
                prev.map(block => {
                  if (block.id === 'player')
                    return { ...block, content: themeData.player };
                  if (block.id === 'world')
                    return { ...block, content: themeData.world };
                  if (block.id === 'object' && mechanismConfig) {
                    // Build object content array dynamically
                    const objectKeys = Object.keys(mechanismConfig.objects);
                    const objectContent = objectKeys.map(
                      key => themeDataRecord[key] || ''
                    );
                    return {
                      ...block,
                      content: objectContent,
                    };
                  }
                  return block;
                })
              );

              // Mark all blocks as generating
              setGeneratingBlocks(new Set(['player', 'world', 'object']));

              const generatePlayer = sendBlockGenerate(
                'player',
                'generate',
                themeData.player,
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
                themeData.world,
                undefined,
                worldConfig,
                themeData.player,
                undefined,
                undefined,
                undefined,
                undefined
              ).catch(error => {
                console.error('❌ World generation failed:', error);
                return null;
              });

              // Generate all objects dynamically based on mechanism config
              const objectKeys = mechanismConfig
                ? Object.keys(mechanismConfig.objects)
                : [];
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
                  themeData.world,
                  gameConfig?.spawn,
                  gameId,
                  mechanismConfig || undefined
                ).catch(error => {
                  console.error(`❌ ${key} generation failed:`, error);
                  return null;
                });
              });

              // Wait for all generations to complete, then apply all updates at once
              Promise.all([generatePlayer, generateWorld, ...objectGenerations])
                .then(async responses => {
                  const playerResponse = responses[0];
                  const worldResponse = responses[1];
                  const objectResponses = responses.slice(2);
                  console.log(
                    '📦 All generations complete, applying updates...'
                  );

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

                  // Apply object updates dynamically
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
                  console.log('🎉 All updates applied successfully!');

                  // Clear generating state
                  setGeneratingBlocks(new Set());
                })
                .catch(error => {
                  console.error('⚠️ Error applying updates:', error);
                  // Clear generating state even on error
                  setGeneratingBlocks(new Set());
                });

              setOriginalContent('');
              return;
            } else {
              console.log('⚠️ No theme received from backend');
            }
          } catch (error) {
            console.error('❌ Error getting change propagation:', error);
          }
        }

        // Send block content to backend via blockGenerate endpoint
        try {
          console.log('Sending block to backend:', {
            blockType: id,
            actionType: 'generate',
            content: block.content,
          });

          // Set loading state
          addGeneratingBlock(id);

          const mechanismConfigForGenerate = getCurrentMechanismConfig(gameConfig, gameId);
          const response = await sendBlockGenerate(
            id as 'player' | 'world' | 'object',
            'generate',
            contentToString(block.content),
            id === 'player' ? playerConfig : undefined,
            id === 'world' ? worldConfig : undefined,
            id === 'world'
              ? contentToString(
                  blocks.find(b => b.id === 'player')?.content || ''
                )
              : undefined,
            id === 'object' && gameConfig?.objects?.[currentObjectIndex]
              ? gameConfig.objects[currentObjectIndex]
              : undefined,
            id === 'object'
              ? contentToString(
                  blocks.find(b => b.id === 'world')?.content || ''
                )
              : undefined,
            id === 'object' && gameConfig?.spawn ? gameConfig.spawn : undefined,
            id === 'object' ? gameId : undefined,
            id === 'object'
              ? mechanismConfigForGenerate || undefined
              : undefined
          );
          console.log('Backend response:', response);

          // Handle player block response
          if (id === 'player' && response.success && response.data) {
            handlePlayerGenerationResponse(response.data);
          }

          // Handle world block response
          if (id === 'world' && response.success && response.data) {
            handleWorldGenerationResponse(response.data);
          }

          // Handle object block response
          if (id === 'object' && response.success && response.data) {
            handleObjectGenerationResponse(response.data);
          }

          // Clear loading state
          removeGeneratingBlock(id);
        } catch (error) {
          console.error('Error sending block to backend:', error);
          // Clear loading state on error
          removeGeneratingBlock(id);
        }
      } else {
        console.log('Content unchanged, not sending to backend');
      }
    }

    // Clear original content
    setOriginalContent('');
  };

  const handleChange = (id: string, value: string) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === id
          ? { ...block, content: stringToContent(id, value) }
          : block
      )
    );

    // If mechanism block is changed, update the game
    if (id === 'mechanism') {
      setGameId(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    // Exit editing on Escape
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleUpload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (id === 'mechanism') return;

    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        // Read the file as base64
        const reader = new FileReader();

        reader.onload = async e => {
          const base64 = e.target?.result as string;

          // Immediately display the uploaded image
          setUploadedImages(prev => ({
            ...prev,
            [id]: { base64, isLoading: true },
          }));

          try {
            // Send to server for interpretation
            const response = await interpretMedia(
              base64,
              id as 'player' | 'world' | 'object'
            );

            if (response.success && response.description) {
              // Update with description
              setUploadedImages(prev => ({
                ...prev,
                [id]: {
                  base64,
                  description: response.description,
                  isLoading: false,
                },
              }));

              // Update the block content with the description
              setBlocks(prevBlocks =>
                prevBlocks.map(block =>
                  block.id === id
                    ? {
                        ...block,
                        content: response.description || block.content,
                      }
                    : block
                )
              );

              console.log(`✓ Interpreted ${id}:`, response.description);

              // If "Change Everything" is enabled, skip individual generation and go straight to propagation
              if (isChangeEverythingEnabled) {
                console.log(
                  '🔗 Change Everything enabled - triggering cohesive generation...'
                );
                await triggerChangePropagation(id, response.description, '');
              } else {
                // Only generate this block individually
                try {
                  // Set loading state for generation
                  addGeneratingBlock(id);

                  const mechanismConfigForUpload = getCurrentMechanismConfig(gameConfig, gameId);
                  const generateResponse = await sendBlockGenerate(
                    id as 'player' | 'world' | 'object',
                    'generate',
                    response.description,
                    id === 'player' ? playerConfig : undefined,
                    id === 'world' ? worldConfig : undefined,
                    id === 'world'
                      ? contentToString(
                          blocks.find(b => b.id === 'player')?.content || ''
                        )
                      : undefined,
                    id === 'object' && gameConfig?.objects?.[currentObjectIndex]
                      ? gameConfig.objects[currentObjectIndex]
                      : undefined,
                    id === 'object'
                      ? contentToString(
                          blocks.find(b => b.id === 'world')?.content || ''
                        )
                      : undefined,
                    id === 'object' && gameConfig?.spawn
                      ? gameConfig.spawn
                      : undefined,
                    id === 'object' ? gameId : undefined,
                    id === 'object'
                      ? mechanismConfigForUpload || undefined
                      : undefined
                  );

                  console.log('✓ Generation response:', generateResponse);

                  // Handle responses based on block type
                  if (
                    id === 'player' &&
                    generateResponse.success &&
                    generateResponse.data
                  ) {
                    await handlePlayerGenerationResponse(generateResponse.data);
                  } else if (
                    id === 'world' &&
                    generateResponse.success &&
                    generateResponse.data
                  ) {
                    await handleWorldGenerationResponse(generateResponse.data);
                  } else if (
                    id === 'object' &&
                    generateResponse.success &&
                    generateResponse.data
                  ) {
                    await handleObjectGenerationResponse(generateResponse.data);
                  }

                  // Clear loading state
                  removeGeneratingBlock(id);
                } catch (genError) {
                  console.error('Error generating asset:', genError);
                  // Clear loading state on error
                  removeGeneratingBlock(id);
                }
              }
            } else {
              throw new Error(response.message || 'Failed to interpret image');
            }
          } catch (error) {
            console.error('Error interpreting image:', error);
            // Keep the image but mark as not loading
            setUploadedImages(prev => ({
              ...prev,
              [id]: {
                base64,
                description: 'Failed to interpret image',
                isLoading: false,
              },
            }));
          }
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    };

    // Trigger file selection
    input.click();
  };

  const handleRemoveImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove the uploaded image from state
    setUploadedImages(prev => {
      const newImages = { ...prev };
      delete newImages[id];
      return newImages;
    });
    console.log(`✓ Removed uploaded image from ${id} block`);
  };

  const handleDraw = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'mechanism') return;

    setDrawingBlockId(id);
    setDrawingModalOpen(true);
  };

  const handleDrawingSave = async (base64: string, blockId: string) => {
    try {
      // Display the drawing immediately
      setUploadedImages(prev => ({
        ...prev,
        [blockId]: { base64, isLoading: true },
      }));

      console.log(`✓ Drawing saved for ${blockId} block`);

      // Send to server for interpretation (same flow as image upload)
      const response = await interpretMedia(
        base64,
        blockId as 'player' | 'world' | 'object'
      );

      if (response.success && response.description) {
        // Update with description
        setUploadedImages(prev => ({
          ...prev,
          [blockId]: {
            base64,
            description: response.description,
            isLoading: false,
          },
        }));

        // Update the block content with the description
        setBlocks(prevBlocks =>
          prevBlocks.map(block =>
            block.id === blockId
              ? {
                  ...block,
                  content: response.description || block.content,
                }
              : block
          )
        );

        console.log(`✓ Interpreted ${blockId}:`, response.description);

        // If "Change Everything" is enabled, trigger cohesive generation
        if (isChangeEverythingEnabled) {
          console.log(
            '🔗 Change Everything enabled - triggering cohesive generation...'
          );
          await triggerChangePropagation(blockId, response.description, '');
        } else {
          // Only generate this block individually
          try {
            // Set loading state for generation
            addGeneratingBlock(blockId);

            const mechanismConfigForDrawing = getCurrentMechanismConfig(gameConfig, gameId);
            const generateResponse = await sendBlockGenerate(
              blockId as 'player' | 'world' | 'object',
              'generate',
              response.description,
              blockId === 'player' ? playerConfig : undefined,
              blockId === 'world' ? worldConfig : undefined,
              blockId === 'world'
                ? contentToString(
                    blocks.find(b => b.id === 'player')?.content || ''
                  )
                : undefined,
              blockId === 'object' && gameConfig?.objects?.[currentObjectIndex]
                ? gameConfig.objects[currentObjectIndex]
                : undefined,
              blockId === 'object'
                ? contentToString(
                    blocks.find(b => b.id === 'world')?.content || ''
                  )
                : undefined,
              blockId === 'object' && gameConfig?.spawn
                ? gameConfig.spawn
                : undefined,
              blockId === 'object' ? gameId : undefined,
              blockId === 'object'
                ? mechanismConfigForDrawing || undefined
                : undefined
            );

            console.log('✓ Generation response:', generateResponse);

            // Handle responses based on block type
            if (
              blockId === 'player' &&
              generateResponse.success &&
              generateResponse.data
            ) {
              await handlePlayerGenerationResponse(generateResponse.data);
            } else if (
              blockId === 'world' &&
              generateResponse.success &&
              generateResponse.data
            ) {
              await handleWorldGenerationResponse(generateResponse.data);
            } else if (
              blockId === 'object' &&
              generateResponse.success &&
              generateResponse.data
            ) {
              await handleObjectGenerationResponse(generateResponse.data);
            }

            // Clear loading state
            removeGeneratingBlock(blockId);
          } catch (genError) {
            console.error('Error generating asset:', genError);
            // Clear loading state on error
            removeGeneratingBlock(blockId);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to interpret drawing');
      }
    } catch (error) {
      console.error('Error interpreting drawing:', error);
      // Keep the drawing but mark as not loading
      setUploadedImages(prev => ({
        ...prev,
        [blockId]: {
          base64,
          description: 'Failed to interpret drawing',
          isLoading: false,
        },
      }));
    }
  };

  const handleCloseDrawingModal = () => {
    setDrawingModalOpen(false);
    setDrawingBlockId(null);
  };

  const handleGlobalUpload = async () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        setIsGlobalUploading(true);

        // Read the file as base64
        const reader = new FileReader();

        reader.onload = async e => {
          const base64 = e.target?.result as string;

          try {
            console.log(
              '🌍 Global upload: Interpreting image for complete game theme...'
            );

            // Interpret the image with a comprehensive prompt
            const interpretResponse = await interpretMedia(
              base64,
              'complete_game'
            );

            if (!interpretResponse.success || !interpretResponse.description) {
              throw new Error(
                interpretResponse.message || 'Failed to interpret image'
              );
            }

            console.log(
              `✓ Image interpreted: ${interpretResponse.description}`
            );

            // Now use this interpretation to trigger cohesive theme generation
            // We'll call the change propagation API with the interpreted description
            console.log(
              '🎨 Generating cohesive game theme from interpretation...'
            );

            const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
            const propagationResponse = await sendChangePropagation(
              'player', // Use player as the "changed" block
              interpretResponse.description,
              '', // No old content
              (blocks.find(b => b.id === 'mechanism')?.content as string) ||
                gameId,
              mechanismConfig || undefined
            );

            if (propagationResponse.success && propagationResponse.data) {
              const themeData = propagationResponse.data;
              console.log('🎨 Cohesive Theme Generated from Image:');
              console.log(`📖 ${themeData.narrative}`);
              console.log(`👤 Player: "${themeData.player}"`);
              console.log(`🌍 World: "${themeData.world}"`);
              console.log(`⚠️  Box1 (dodge): "${themeData.box1}"`);
              console.log(`✨ Box2 (catch): "${themeData.box2}"`);

              // Update narrative slots
              const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
              const slots: Record<string, string> = {
                player: themeData.player,
                world: themeData.world,
              };
              // Add object slots based on mechanism config
              if (mechanismConfig) {
                const themeDataRecord = themeData as Record<string, any>;
                Object.keys(mechanismConfig.objects).forEach(key => {
                  if (themeDataRecord[key]) {
                    slots[key] = themeDataRecord[key];
                  }
                });
              }
              setNarrativeSlots(slots);

              // Clear all uploaded images since we're starting fresh
              setUploadedImages({});

              // Update all block contents with new theme
              setBlocks(prevBlocks =>
                prevBlocks.map(block => {
                  if (block.id === 'player')
                    return { ...block, content: themeData.player };
                  if (block.id === 'world')
                    return { ...block, content: themeData.world };
                  if (block.id === 'object') {
                    // Build object content array dynamically
                    const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
                    if (mechanismConfig) {
                      const themeDataRecord = themeData as Record<string, any>;
                      const objectKeys = Object.keys(mechanismConfig.objects);
                      const objectContent = objectKeys.map(
                        key => themeDataRecord[key] || ''
                      );
                      return {
                        ...block,
                        content: objectContent,
                      };
                    }
                  }
                  return block;
                })
              );

              // Set all blocks to generating state
              setGeneratingBlocks(new Set(['player', 'world', 'object']));

              // Generate all blocks with the new theme
              const generatePlayer = sendBlockGenerate(
                'player',
                'generate',
                themeData.player,
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
                themeData.world,
                undefined,
                worldConfig,
                themeData.player,
                undefined,
                undefined,
                undefined,
                undefined
              ).catch(error => {
                console.error('❌ World generation failed:', error);
                return null;
              });

              // Generate all objects dynamically based on mechanism config
              const mechanismConfigForGlobal = getCurrentMechanismConfig(gameConfig, gameId);
              const objectKeysForGlobal = mechanismConfigForGlobal
                ? Object.keys(mechanismConfigForGlobal.objects)
                : [];
              const objectGenerationsForGlobal = objectKeysForGlobal.map(
                (key, index) => {
                  const themeDataRecordForGlobal = themeData as Record<
                    string,
                    any
                  >;
                  const objectDescription = themeDataRecordForGlobal[key] || '';
                  return sendBlockGenerate(
                    'object',
                    'generate',
                    objectDescription,
                    undefined,
                    undefined,
                    undefined,
                    gameConfig?.objects?.[index],
                    themeData.world,
                    gameConfig?.spawn,
                    gameId,
                    mechanismConfigForGlobal || undefined
                  ).catch(error => {
                    console.error(`❌ ${key} generation failed:`, error);
                    return null;
                  });
                }
              );

              // Wait for all generations and apply updates
              Promise.all([
                generatePlayer,
                generateWorld,
                ...objectGenerationsForGlobal,
              ])
                .then(async responses => {
                  const playerResponse = responses[0];
                  const worldResponse = responses[1];
                  const objectResponses = responses.slice(2);
                  console.log('📦 All global generations complete');

                  if (!gameConfig) return;

                  let updatedConfig = { ...gameConfig };

                  // Apply player updates
                  if (playerResponse?.success && playerResponse.data) {
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
                    if (worldResponse.data.worldConfig) {
                      updatedConfig.world = worldResponse.data.worldConfig;
                    }
                    if (worldResponse.data.groundTexture) {
                      const cacheBuster = Date.now();
                      updatedConfig = {
                        ...updatedConfig,
                        assets: {
                          ...updatedConfig.assets,
                          ground: `${worldResponse.data.groundTexture}?v=${cacheBuster}`,
                        },
                      };
                    }
                    if (worldResponse.data.ambientSound) {
                      const cacheBuster = Date.now();
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

                  // Apply object updates dynamically
                  const newObjects = [...(updatedConfig.objects || [])];
                  let newModels = { ...updatedConfig.assets.models };
                  let newSpawn = updatedConfig.spawn;

                  objectResponses.forEach((objectResponse, index) => {
                    if (objectResponse?.success && objectResponse.data) {
                      const objectKey = objectKeysForGlobal[index];
                      console.log(`✅ Applying ${objectKey} updates`);
                      const cacheBuster = Date.now();
                      newObjects[index] = objectResponse.data.objectConfig;
                      const objectId = String(objectResponse.data.objectId);
                      newModels[objectId] =
                        `${objectResponse.data.assetFilename}?v=${cacheBuster}`;

                      if (objectResponse.data.spawnConfigs) {
                        newSpawn = objectResponse.data.spawnConfigs;
                      }
                    }
                  });

                  updatedConfig = {
                    ...updatedConfig,
                    objects: newObjects,
                    spawn: newSpawn,
                    assets: {
                      ...updatedConfig.assets,
                      models: newModels,
                    },
                  };

                  // Apply all updates at once
                  setGameConfig(updatedConfig);

                  // Clear all generating states
                  setGeneratingBlocks(new Set());
                  setIsGlobalUploading(false);

                  console.log('✅ All global updates applied!');
                })
                .catch(error => {
                  console.error('❌ Error in global generations:', error);
                  setGeneratingBlocks(new Set());
                  setIsGlobalUploading(false);
                });
            } else {
              throw new Error('Failed to generate cohesive theme');
            }
          } catch (error) {
            console.error('Error in global upload:', error);
            setIsGlobalUploading(false);
          }
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
        setIsGlobalUploading(false);
      }
    };

    // Trigger file selection
    input.click();
  };

  // Helper function to trigger change propagation and regenerate other blocks
  const triggerChangePropagation = async (
    changedBlockId: string,
    newContent: string,
    oldContent: string
  ) => {
    if (!isChangeEverythingEnabled) return;

    try {
      console.log(
        '🔗 Change Everything Mode: Generating cohesive theme after generation...'
      );

      const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
      const propagationResponse = await sendChangePropagation(
        changedBlockId as 'player' | 'world' | 'object',
        newContent,
        oldContent,
        (blocks.find(b => b.id === 'mechanism')?.content as string) || gameId,
        mechanismConfig || undefined
      );

      if (propagationResponse.success && propagationResponse.data) {
        const themeData = propagationResponse.data;
        console.log('🎨 Cohesive Theme Generated:');
        console.log(`📖 ${themeData.narrative}`);
        console.log(`👤 Player: "${themeData.player}"`);
        console.log(`🌍 World: "${themeData.world}"`);

        // Log object slots dynamically
        const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);
        const themeDataRecord = themeData as Record<string, any>;
        if (mechanismConfig) {
          Object.keys(mechanismConfig.objects).forEach(key => {
            if (themeDataRecord[key]) {
              console.log(`📦 ${key}: "${themeDataRecord[key]}"`);
            }
          });
        }

        // Build narrative slots dynamically
        const slots: Record<string, string> = {
          player: themeData.player,
          world: themeData.world,
        };
        if (mechanismConfig) {
          Object.keys(mechanismConfig.objects).forEach(key => {
            if (themeDataRecord[key]) {
              slots[key] = themeDataRecord[key];
            }
          });
        }
        setNarrativeSlots(slots);

        // Remove uploaded images from blocks that are getting AI-generated content
        // Keep the image in the block that triggered the change (changedBlockId)
        setUploadedImages(prev => {
          const newImages = { ...prev };
          // Remove images from all blocks except the one that triggered the change
          Object.keys(newImages).forEach(blockId => {
            if (blockId !== changedBlockId) {
              delete newImages[blockId];
            }
          });
          return newImages;
        });

        // Update block contents with new theme
        setBlocks(prevBlocks =>
          prevBlocks.map(block => {
            if (block.id === 'player')
              return { ...block, content: themeData.player };
            if (block.id === 'world')
              return { ...block, content: themeData.world };
            if (block.id === 'object' && mechanismConfig) {
              // Build object content array dynamically
              const objectKeys = Object.keys(mechanismConfig.objects);
              const objectContent = objectKeys.map(
                key => themeDataRecord[key] || ''
              );
              return {
                ...block,
                content: objectContent,
              };
            }
            return block;
          })
        );

        // Set all blocks to generating state
        setGeneratingBlocks(new Set(['player', 'world', 'object']));

        // Generate all blocks with the new theme
        const generatePlayer = sendBlockGenerate(
          'player',
          'generate',
          themeData.player,
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
          themeData.world,
          undefined,
          worldConfig,
          themeData.player,
          undefined,
          undefined,
          undefined,
          undefined
        ).catch(error => {
          console.error('❌ World generation failed:', error);
          return null;
        });

        // Generate all objects dynamically based on mechanism config
        const objectKeysForProp = mechanismConfig
          ? Object.keys(mechanismConfig.objects)
          : [];
        const objectGenerationsForProp = objectKeysForProp.map((key, index) => {
          const objectDescription = themeDataRecord[key] || '';
          return sendBlockGenerate(
            'object',
            'generate',
            objectDescription,
            undefined,
            undefined,
            undefined,
            gameConfig?.objects?.[index],
            themeData.world,
            gameConfig?.spawn,
            gameId,
            mechanismConfig || undefined
          ).catch(error => {
            console.error(`❌ ${key} generation failed:`, error);
            return null;
          });
        });

        // Wait for all generations and apply updates
        Promise.all([
          generatePlayer,
          generateWorld,
          ...objectGenerationsForProp,
        ])
          .then(async responses => {
            const playerResponse = responses[0];
            const worldResponse = responses[1];
            const objectResponses = responses.slice(2);
            console.log('📦 All propagated generations complete');

            if (!gameConfig) return;

            let updatedConfig = { ...gameConfig };

            // Apply player updates
            if (playerResponse?.success && playerResponse.data) {
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
              if (worldResponse.data.worldConfig) {
                updatedConfig.world = worldResponse.data.worldConfig;
              }
              if (worldResponse.data.groundTexture) {
                const cacheBuster = Date.now();
                updatedConfig = {
                  ...updatedConfig,
                  assets: {
                    ...updatedConfig.assets,
                    ground: `${worldResponse.data.groundTexture}?v=${cacheBuster}`,
                  },
                };
              }
              if (worldResponse.data.ambientSound) {
                const cacheBuster = Date.now();
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

            // Apply object updates dynamically
            const propNewObjects = [...(updatedConfig.objects || [])];
            let propNewModels = { ...updatedConfig.assets.models };
            let propNewSpawn = updatedConfig.spawn;

            objectResponses.forEach((objectResponse, index) => {
              if (objectResponse?.success && objectResponse.data) {
                const objectKey = objectKeysForProp[index];
                console.log(`✅ Applying ${objectKey} updates`);
                const cacheBuster = Date.now();
                propNewObjects[index] = objectResponse.data.objectConfig;
                const objectId = String(objectResponse.data.objectId);
                propNewModels[objectId] =
                  `${objectResponse.data.assetFilename}?v=${cacheBuster}`;

                if (objectResponse.data.spawnConfigs) {
                  propNewSpawn = objectResponse.data.spawnConfigs;
                }
              }
            });

            updatedConfig = {
              ...updatedConfig,
              objects: propNewObjects,
              spawn: propNewSpawn,
              assets: {
                ...updatedConfig.assets,
                models: propNewModels,
              },
            };

            // Apply all updates at once
            setGameConfig(updatedConfig);

            // Clear all generating states
            setGeneratingBlocks(new Set());

            console.log('✅ All propagated updates applied!');
          })
          .catch(error => {
            console.error('❌ Error in propagated generations:', error);
            setGeneratingBlocks(new Set());
          });
      }
    } catch (error) {
      console.error('❌ Change propagation failed:', error);
    }
  };

  const handleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLockedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAI = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const block = blocks.find(block => block.id === id);

    if (id !== 'mechanism' && block) {
      // If "Change Everything" is enabled, skip individual generation and go straight to propagation
      if (isChangeEverythingEnabled) {
        console.log(
          '🔗 Change Everything enabled - triggering cohesive generation...'
        );
        const oldContent = contentToString(block.content);
        await triggerChangePropagation(
          id,
          contentToString(block.content),
          oldContent
        );
      } else {
        // Generate only this block
        try {
          // Set loading state
          addGeneratingBlock(id);

          const mechanismConfigForAI = getCurrentMechanismConfig(gameConfig, gameId);
          const response = await sendBlockGenerate(
            id as 'player' | 'world' | 'object',
            'randomize',
            contentToString(block.content),
            id === 'player' ? playerConfig : undefined,
            id === 'world' ? worldConfig : undefined,
            id === 'world'
              ? contentToString(
                  blocks.find(b => b.id === 'player')?.content || ''
                )
              : undefined,
            id === 'object' && gameConfig?.objects?.[currentObjectIndex]
              ? gameConfig.objects[currentObjectIndex]
              : undefined,
            id === 'object'
              ? contentToString(
                  blocks.find(b => b.id === 'world')?.content || ''
                )
              : undefined,
            id === 'object' && gameConfig?.spawn ? gameConfig.spawn : undefined,
            id === 'object' ? gameId : undefined,
            id === 'object' ? mechanismConfigForAI || undefined : undefined
          );
          console.log('Backend response:', response);

          // Handle player block response
          if (id === 'player' && response.success && response.data) {
            await handlePlayerGenerationResponse(response.data);
          }

          // Handle world block response
          if (id === 'world' && response.success && response.data) {
            await handleWorldGenerationResponse(response.data);
          }

          // Handle object block response
          if (id === 'object' && response.success && response.data) {
            await handleObjectGenerationResponse(response.data);
          }

          // Clear loading state
          removeGeneratingBlock(id);
        } catch (error) {
          console.error('Error generating with AI:', error);
          // Clear loading state on error
          removeGeneratingBlock(id);
        }
      }
    }
  };

  // Handler for player generation response
  const handlePlayerGenerationResponse = async (data: any) => {
    if (!data.playerConfig || !data.assetFilename) {
      console.error('Invalid player generation response:', data);
      return;
    }

    console.log('Player generated:', data.summary);

    // Wait a moment to ensure Vite's dev server has picked up the new file
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the entire game config with new player config and asset
    if (gameConfig) {
      // Add cache-busting query parameter to force browser to load fresh asset
      const cacheBuster = Date.now();
      const assetPathWithCache = `${data.assetFilename}?v=${cacheBuster}`;

      const updatedGameConfig = {
        ...gameConfig,
        player: data.playerConfig,
        assets: {
          ...gameConfig.assets,
          models: {
            ...gameConfig.assets.models,
            player: assetPathWithCache,
          },
        },
      };

      setGameConfig(updatedGameConfig);
    }
  };

  // Handler for world generation response
  const handleWorldGenerationResponse = async (data: any) => {
    console.log('World generation response:', data);

    // Wait a moment to ensure Vite's dev server has picked up the new files
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!gameConfig) {
      console.error('No game config available');
      return;
    }

    // Start with the current game config
    let updatedGameConfig = { ...gameConfig };

    // Update world config if provided
    if (data.worldConfig) {
      console.log('World config updated:', data.summary);
      updatedGameConfig.world = data.worldConfig;

      // Also update the world config in the store
      setWorldConfig(data.worldConfig);
    }

    // Update ground texture if provided
    if (data.groundTexture) {
      console.log('Ground texture updated:', data.groundTexture);
      const cacheBuster = Date.now();
      const groundPathWithCache = `${data.groundTexture}?v=${cacheBuster}`;

      updatedGameConfig = {
        ...updatedGameConfig,
        assets: {
          ...updatedGameConfig.assets,
          ground: groundPathWithCache,
        },
      };
    }

    // Update ambient sound if provided
    if (data.ambientSound) {
      console.log('Ambient sound updated:', data.ambientSound);
      const cacheBuster = Date.now();
      const soundPathWithCache = `${data.ambientSound}?v=${cacheBuster}`;

      updatedGameConfig = {
        ...updatedGameConfig,
        assets: {
          ...updatedGameConfig.assets,
          sounds: {
            ...updatedGameConfig.assets.sounds,
            ambient: {
              file: soundPathWithCache,
              volume: 0.3,
              loop: true,
            },
          },
        },
      };
    }

    // Apply the updated config
    setGameConfig(updatedGameConfig);

    // Log any warnings
    if (data.warnings && data.warnings.length > 0) {
      console.warn('World generation warnings:', data.warnings);
    }
  };

  // Handler for object generation response
  const handleObjectGenerationResponse = async (
    data: any,
    targetObjectIndex?: number
  ) => {
    const objectIndex =
      targetObjectIndex !== undefined ? targetObjectIndex : currentObjectIndex;
    if (!data.objectConfig || !data.assetFilename || !data.objectId) {
      console.error('Invalid object generation response:', data);
      return;
    }

    console.log('Object generated:', data.summary);

    // Wait a moment to ensure Vite's dev server has picked up the new file
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!gameConfig) {
      console.error('No game config available');
      return;
    }

    // Add cache-busting query parameter to force browser to load fresh asset
    const cacheBuster = Date.now();
    const assetPathWithCache = `${data.assetFilename}?v=${cacheBuster}`;

    // Clone the objects array
    const updatedObjects = [...gameConfig.objects];

    // Update the object at the target index with the new config
    updatedObjects[objectIndex] = data.objectConfig;

    // Build the updated game config
    let updatedGameConfig = {
      ...gameConfig,
      objects: updatedObjects,
      assets: {
        ...gameConfig.assets,
        models: {
          ...gameConfig.assets.models,
          [data.objectId]: assetPathWithCache,
        },
      },
    };

    // Update spawn configs if provided
    if (data.spawnConfigs && data.spawnConfigs.length > 0) {
      console.log('Spawn configs updated:', data.spawnSummary);
      updatedGameConfig = {
        ...updatedGameConfig,
        spawn: data.spawnConfigs,
      };
    } else if (data.spawnWarning) {
      console.warn('Spawn config update warning:', data.spawnWarning);
    }

    setGameConfig(updatedGameConfig);

    // Only update block content if this is the current object
    if (objectIndex === currentObjectIndex) {
      setBlocks(prev =>
        prev.map(block =>
          block.id === 'object'
            ? { ...block, content: data.objectConfig.name }
            : block
        )
      );
    }
  };

  // Auto-focus textarea or select when editing starts
  useEffect(() => {
    if (editingId === 'mechanism' && selectRef.current) {
      selectRef.current.focus();
    } else if (editingId && textareaRefs.current[editingId]) {
      textareaRefs.current[editingId]?.focus();
    }
  }, [editingId]);

  // Sync mechanism block with gameId
  useEffect(() => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === 'mechanism' ? { ...block, content: gameId } : block
      )
    );
  }, [gameId]);

  // Sync player block with playerConfig.description
  useEffect(() => {
    if (playerConfig?.description) {
      setBlocks(prev =>
        prev.map(block =>
          block.id === 'player'
            ? { ...block, content: playerConfig.description }
            : block
        )
      );
    }
  }, [playerConfig?.description]);

  // Sync world block with worldConfig.description
  useEffect(() => {
    if (worldConfig?.description) {
      setBlocks(prev =>
        prev.map(block =>
          block.id === 'world'
            ? { ...block, content: worldConfig.description }
            : block
        )
      );
    }
  }, [worldConfig?.description]);

  // Sync object block with current object name from gameConfig
  useEffect(() => {
    if (gameConfig?.objects && gameConfig.objects.length > 0) {
      const currentObject = gameConfig.objects[currentObjectIndex];
      if (currentObject) {
        setBlocks(prev =>
          prev.map(block =>
            block.id === 'object'
              ? {
                  ...block,
                  content:
                    currentObject.name || `Object ${currentObjectIndex + 1}`,
                }
              : block
          )
        );
      }
    }
  }, [gameConfig?.objects, currentObjectIndex]);

  // Initialize narrative slots with current block content and object names
  useEffect(() => {
    const mechanismConfig = getCurrentMechanismConfig(gameConfig, gameId);

    if (!mechanismConfig) return;

    const slots: Record<string, string> = {
      player: contentToString(
        blocks.find(b => b.id === 'player')?.content || ''
      ),
      world: contentToString(blocks.find(b => b.id === 'world')?.content || ''),
    };

    // Map mechanism object keys to actual game objects
    const objectKeys = Object.keys(mechanismConfig.objects);
    if (gameConfig?.objects) {
      objectKeys.forEach((key, index) => {
        if (gameConfig.objects[index]) {
          slots[key] = gameConfig.objects[index].name || '';
        }
      });
    }

    // Only update if we have at least one object slot
    if (objectKeys.some(key => slots[key])) {
      setNarrativeSlots(slots);
    }
  }, [
    gameConfig?.objects,
    blocks,
    gameConfig?.mechanism,
    gameId,
    setNarrativeSlots,
  ]);

  // Navigate to previous object
  const handlePreviousObject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameConfig?.objects && gameConfig.objects.length > 0) {
      const newIndex =
        currentObjectIndex > 0
          ? currentObjectIndex - 1
          : gameConfig.objects.length - 1;
      setCurrentObjectIndex(newIndex);
    }
  };

  // Navigate to next object
  const handleNextObject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameConfig?.objects && gameConfig.objects.length > 0) {
      const newIndex =
        currentObjectIndex < gameConfig.objects.length - 1
          ? currentObjectIndex + 1
          : 0;
      setCurrentObjectIndex(newIndex);
    }
  };

  return (
    <div className='sticky-blocks-wrapper'>
      <div className='sticky-blocks-container'>
        {blocks.map(block => {
          const isNarrativeHighlighted =
            (hoveredId === 'player' && block.id === 'player') ||
            (hoveredId === 'world' && block.id === 'world') ||
            (hoveredId === 'object' && block.id === 'object');

          return (
            <StickyBlock
              key={block.id}
              id={block.id}
              label={block.title}
              isLocked={lockedBlocks.has(block.id)}
              isGenerating={generatingBlocks.has(block.id)}
              isHovered={hoveredId === block.id}
              isEditing={editingId === block.id}
              isNarrativeHighlighted={isNarrativeHighlighted}
              onDoubleClick={() => handleDoubleClick(block.id)}
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
              onUpload={e => handleUpload(block.id, e)}
              onDraw={e => handleDraw(block.id, e)}
              onLock={e => handleLock(block.id, e)}
              onAI={e => handleAI(block.id, e)}
              objectCount={
                block.id === 'object' ? gameConfig?.objects?.length : undefined
              }
              currentObjectIndex={
                block.id === 'object' ? currentObjectIndex : undefined
              }
              onPreviousObject={
                block.id === 'object' ? handlePreviousObject : undefined
              }
              onNextObject={
                block.id === 'object' ? handleNextObject : undefined
              }
            >
              {editingId === block.id ? (
                block.id === 'mechanism' ? (
                  <select
                    ref={selectRef}
                    className='sticky-block-select handwriting'
                    value={block.content as string}
                    onChange={e => handleChange(block.id, e.target.value)}
                    onBlur={() => handleBlur(block.id)}
                    onKeyDown={e => handleKeyDown(e, block.id)}
                  >
                    {mechanismOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    ref={el => {
                      textareaRefs.current[block.id] = el;
                    }}
                    className='sticky-block-textarea handwriting'
                    value={contentToString(block.content)}
                    onChange={e => handleChange(block.id, e.target.value)}
                    onBlur={() => handleBlur(block.id)}
                    onKeyDown={e => handleKeyDown(e, block.id)}
                    placeholder='Double click to edit...'
                  />
                )
              ) : (
                <div className='sticky-block-content handwriting'>
                  {uploadedImages[block.id] && (
                    <div className='uploaded-image-container'>
                      <button
                        className='remove-image-btn'
                        onClick={e => handleRemoveImage(block.id, e)}
                        title='Remove image'
                      >
                        <X size={12} />
                      </button>
                      <img
                        src={uploadedImages[block.id].base64}
                        alt='Uploaded reference'
                        className='uploaded-image'
                      />
                      {uploadedImages[block.id].isLoading && (
                        <div className='image-loading'>Interpreting...</div>
                      )}
                    </div>
                  )}
                  {block.id === 'mechanism'
                    ? mechanismOptions.find(
                        opt => opt.value === (block.content as string)
                      )?.label || block.content
                    : contentToString(block.content) ||
                      'Double click to edit...'}
                </div>
              )}
            </StickyBlock>
          );
        })}
      </div>

      <div className='change-everything-toggle'>
        <button
          className={`toggle-button ${isChangeEverythingEnabled ? 'active' : ''}`}
          onClick={() =>
            setIsChangeEverythingEnabled(!isChangeEverythingEnabled)
          }
          title={
            isChangeEverythingEnabled
              ? 'Disable change propagation'
              : 'Enable change propagation'
          }
        >
          {isChangeEverythingEnabled ? (
            <>
              <Link size={14} />
              <span>Change Everything</span>
            </>
          ) : (
            <>
              <Unlink size={14} />
              <span>Independent Changes</span>
            </>
          )}
        </button>
      </div>

      <DrawingPad
        isOpen={drawingModalOpen}
        blockId={drawingBlockId}
        onClose={handleCloseDrawingModal}
        onSave={handleDrawingSave}
      />
    </div>
  );
}
