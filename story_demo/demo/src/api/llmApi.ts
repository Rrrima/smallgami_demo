/**
 * @file llmApi.ts
 * @description Frontend-only AI generation via the OpenAI API (GPT-4o).
 * Calls are proxied through Vite dev server (/api/openai → api.openai.com)
 * to avoid browser CORS restrictions.
 */

import { ChangePropagationData } from './chatApi';

interface MechanismConfig {
  description: string;
  objects: Record<string, string>;
  narrative: string;
}

interface BlockInfo {
  id: string;
  content: string;
}

/**
 * Calls GPT-4o to generate cohesive new descriptions for all blocks
 * (player, world, objects) plus a narrative sentence.
 */
export async function generateCohesiveTheme(
  changedBlockId: string,
  currentBlocks: BlockInfo[],
  mechanismConfig: MechanismConfig | null
): Promise<ChangePropagationData> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_OPENAI_API_KEY is not set. Add it to story_demo/demo/.env'
    );
  }

  const playerBlock = currentBlocks.find(b => b.id === 'player');
  const worldBlock = currentBlocks.find(b => b.id === 'world');

  const objectKeys = mechanismConfig
    ? Object.keys(mechanismConfig.objects)
    : [];

  // Build a description of each object slot from the mechanism config
  const objectDescriptions = objectKeys
    .map(key => `- "${key}": ${mechanismConfig!.objects[key]}`)
    .join('\n');

  // Build the JSON schema for the expected response
  const properties: Record<string, object> = {
    player: {
      type: 'string',
      description: 'A short creative description of the player character (2-6 words)',
    },
    world: {
      type: 'string',
      description: 'A short creative description of the game world/environment (2-6 words)',
    },
  };

  objectKeys.forEach(key => {
    properties[key] = {
      type: 'string',
      description: `A short creative name/description for the ${mechanismConfig!.objects[key]} (2-6 words)`,
    };
  });

  properties.narrative = {
    type: 'string',
    description: 'A one-sentence narrative combining all elements',
  };

  const prompt = `You are a creative game designer. Given the current game blocks, generate a cohesive new theme.

Current game state:
- Player: "${playerBlock?.content || '(empty)'}"
- World: "${worldBlock?.content || '(empty)'}"
${objectKeys.map(key => {
  const block = currentBlocks.find(b => b.id === key);
  return `- ${key}: "${block?.content || '(empty)'}"`;
}).join('\n')}

Game mechanism: ${mechanismConfig?.description || 'unknown'}

Object roles:
${objectDescriptions || 'No objects defined'}

Narrative template: ${mechanismConfig?.narrative || 'N/A'}

The user clicked the sparkles button on the "${changedBlockId}" block, requesting a creative refresh.

Generate a completely NEW cohesive theme for this game. All elements should feel like they belong together in the same creative universe. Keep descriptions short (2-6 words each). The narrative should follow the template pattern but with the new theme values substituted in.`;

  const requiredKeys = ['player', 'world', ...objectKeys, 'narrative'];

  const response = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'set_game_theme',
            description:
              'Sets the cohesive game theme with descriptions for all blocks',
            parameters: {
              type: 'object',
              properties,
              required: requiredKeys,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'set_game_theme' } },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  // Extract the function call arguments from the response
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall?.function?.arguments) {
    throw new Error('No tool_call response from GPT-4o');
  }

  return JSON.parse(toolCall.function.arguments) as ChangePropagationData;
}
