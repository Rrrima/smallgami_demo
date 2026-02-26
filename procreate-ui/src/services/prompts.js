// ============================================================
// PROMPT TEMPLATES
// ============================================================

export const PROMPTS = {
  commitInfo: `Look at this player character drawn by the user. It will be their player sprite in a flappy bird game. Based on how the player's look, first describe its in a single sentence. Then, give it:
1. A single playful sentence describing its personality, be creative and fun!
2. Game stats from 1 to 100 for: speed, mass, stability, jumpPower — infer from visual cues (e.g. big wings = more speed, round body = more mass, streamlined = more stability, strong legs = more jump)

Respond with ONLY a JSON object, no other text:
{ "description": "...", "characteristics": "...", "speed": N, "mass": N, "stability": N, "jumpPower": N }`,

  birdBase: (
    styleDesc,
  ) => `You are a game asset designer. Generate a player character sprite for a flappy bird game.

CRITICAL REQUIREMENTS:
- The player MUST face RIGHT (flying to the right), side view.
- The background MUST be solid bright magenta (#FF00FF). Fill the entire background with this exact magenta/pink color. No gradients, no other colors in the background.
- The image aspect ratio MUST be 5:4 (width > height), e.g. 500x400px
- The player character should be centered and fill about 100% of the frame, do not leave any space around the bird.
- This is a GAME ASSET — the player character should be a single isolated character sprite on a magenta screen, NOT a scene or illustration

ART STYLE: ${styleDesc}

Output ONLY the image. No text, no labels, no watermarks.`,

  birdFromSketchPrefix: `Here is the user's input reference for you to generate, first understand what it is and then try to design this into a player character sprite for a flappy bird game. It does not have to be a bird. For exmaple if the user input is a human, consider use the head picture of the human and add the body and with the flyer posture. If the reference object is other animals or plants consider add a pair of wings to it or parachute, or some other props to it to make it could fly. If the reference object already seem to have the flying ability, just make it a little more cute and playful in flying posture.Be creative but the content should be suitable for kids so avoid any adult content.`,

  birdRefined: `Here is the user's player character reference for a flappy bird game. Keep the exact same design, colors, shape, and art style — do NOT change or reinterpret anything.  If the user's input is a human, consider wrap it with a circle bounding box to make it looks like a profile picture on a social media platform.

CRITICAL REQUIREMENTS:
- The character MUST face RIGHT (facing to the right side of the image), side view. If the sketch faces left, mirror/flip it so it faces RIGHT.
- The background MUST be solid bright magenta (#FF00FF). Fill the entire background with this exact magenta/pink color. No gradients.
- Center the character and fill the frame, no extra padding.

Output ONLY the image. No text, no labels, no watermarks.`,

  skybox: `Here is a player character for a flappy bird game. Generate ONLY a game background/skybox that matches this player character's art style and theme. The background should be a seamless, horizontally tileable landscape — just pure environment art (sky, clouds, landscape, horizon). Do NOT include any pipes, tubes, pillars, obstacles, characters, birds, or game UI elements. No text. Output ONLY the image.`,

  pipe: `Here is a player character for a flappy bird game. Generate a single vertical pipe/pillar game obstacle asset that matches this player character's art style and theme. The background MUST be solid bright magenta (#FF00FF). Fill the entire background with this exact magenta/pink color. No gradients. The pipe should be oriented vertically and centered in the image. Make the pipe narrow and tall.`,
};

// ============================================================
// STYLES
// ============================================================

export const STYLES = [
  {
    label: "Pixel Art",
    desc: "pixel art retro 8-bit/16-bit style with visible blocky pixels, limited color palette, reminiscent of classic NES/SNES game sprites",
  },
  {
    label: "Sketch",
    desc: "simple hand-drawn minimal color, abstract and cute",
  },
  {
    label: "Ghibli",
    desc: "Studio Ghibli style, cute, whimsical, and derpy characters",
  },
  {
    label: "Claymation",
    desc: "claymation / stop-motion style with visible clay texture, soft rounded shapes, matte surfaces, and a handcrafted feel like Wallace & Gromit or Shaun the Sheep, a little derpy but cute.",
  },
];

// ============================================================
// MODELS
// ============================================================

export const MODELS = [
  { id: "gemini-3-pro", label: "Gemini 3 Pro", provider: "gemini" },
  { id: "gpt-image-1", label: "GPT Image 1", provider: "openai" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
];

export const GEMINI_MODEL_MAP = {
  "gemini-2.0-flash": "gemini-2.0-flash-exp-image-generation",
  "gemini-2.5-flash": "gemini-2.5-flash-image",
  "gemini-3-pro": "gemini-3-pro-image-preview",
};

// ============================================================
// DEFAULTS
// ============================================================

export const DEFAULT_INFO = {
  name: "",
  characteristics: "",
  speed: 50,
  mass: 50,
  stability: 50,
  jumpPower: 50,
};
