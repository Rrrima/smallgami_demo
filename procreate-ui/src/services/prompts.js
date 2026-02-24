// ============================================================
// PROMPT TEMPLATES — edit these to tune generation output
// ============================================================

export const PROMPTS = {
  infoJsonSuffix: `

Also output a short JSON block:
{ "name": "...", "characteristics": "...", "speed": N,
  "mass": N, "stability": N, "jumpPower": N }
where each stat is 1-100. Give the bird a creative, fun name
(like "Captain Fluffbutt" or "Sir Pecks-a-Lot").
The characteristics should be a single playful sentence —
a mini bio for the bird
(e.g. "Believes every cloud is just a really lazy pillow").`,

  birdBase: (styleDesc) => `\
You are a game asset designer. Generate ONLY a single bird \
character sprite for a flappy bird game.

CRITICAL REQUIREMENTS:
- The bird MUST face RIGHT (flying to the right), side view.
- Transparent background. This is a game asset
- The image aspect ratio MUST be 5:4 (width > height), \
e.g. 500x400px
- The bird should be centered and fill about 100% of the \
frame, do no leave any space around the bird.
- This is a GAME ASSET — the bird should be a single \
isolated character sprite, NOT a scene or illustration

ART STYLE: ${styleDesc}

The bird should have a small wings and a round body. \
It should look like it belongs in a fun casual mobile game.

Output ONLY the image. No text, no labels, no watermarks.`,

  birdFromSketchPrefix: `\
Here is the user's hand-drawn sketch of a bird. This is \
their original creation — you MUST faithfully preserve the \
bird's unique shape, silhouette, proportions, colors, \
distinctive features, and personality. Do NOT replace it \
with a generic bird. The user's design choices are \
intentional. Restyle it in the specified art style while \
keeping the same character. CRITICAL: Regardless of the \
sketch orientation, the output bird MUST face RIGHT \
(facing to the right side of the image), side view. If the \
sketch faces left, mirror/flip it horizontally so it \
faces RIGHT.`,

  birdRefined: `\
Clean up and smooth the lines of this sketch. Keep the \
exact same design, colors, shape, and proportions. Do not \
add creative elements or change the style. Just refine and \
polish the drawing.

CRITICAL REQUIREMENTS:
- Keep the exact same design, colors, shape, and \
proportions as the input sketch
- The bird MUST face RIGHT (facing to the right side of \
the image), side view. If the sketch faces left, \
mirror/flip it so it faces RIGHT.
- Transparent background. This is a game asset
- The image aspect ratio MUST be 5:4 (width > height)
- Do NOT change the art style, just clean up and polish

Output ONLY the image. No text, no labels, no watermarks.`,

  openai: {
    birdFromSketch: `\
Here is a user's hand-drawn sketch of a bird. Refer to \
the user's original creation. CRITICAL: The bird MUST \
face RIGHT, side view. If the sketch faces left, \
MIRROR/FLIP it so it faces RIGHT. This is a player asset \
for a cute game. Fully TRANSPARENT background (no \
background at all). Game sprite asset. No text, no \
watermarks, no shadows, no ground.`,

    birdGenerate: (shortStyleDesc) => `\
CRITICAL: The bird MUST face RIGHT (facing to the right \
side of the image), side view profile. A cute colorful \
bird, on a fully transparent background. Game sprite \
asset with transparency, ${shortStyleDesc}. No text, \
no watermarks, no shadows, no ground.`,

    skybox: `\
This is a bird character. Generate ONLY a game \
background/skybox that matches this bird's art style and \
theme. Seamless horizontally tileable landscape — just \
pure environment art (sky, clouds, landscape, horizon). \
Do NOT include any pipes, tubes, pillars, obstacles, \
characters, or game UI. No characters, no obstacles, \
no pipes, no UI, no text.`,

    pipe: `\
This is a bird character. Generate a single vertical \
pipe/pillar game obstacle asset that matches this bird's \
art style and theme. Transparent background, this is a \
game asset. The pipe should be oriented vertically, \
centered in the frame. No characters, no text.`,
  },

  gemini: {
    skybox: `\
Here is a bird character for a flappy bird game. Generate \
ONLY a game background/skybox that matches this bird's art \
style and theme.

CRITICAL: Generate ONLY the background scenery (sky, \
clouds, landscape, horizon). Do NOT include any pipes, \
tubes, pillars, obstacles, characters, birds, or game UI \
elements. The background should be a seamless, \
horizontally tileable landscape — just pure environment \
art, nothing else.

No characters, no obstacles, no pipes, no tubes, no UI, \
no text. Output ONLY the image.`,

    pipe: `\
Here is a bird character for a flappy bird game. Generate \
a single vertical pipe/pillar game obstacle asset that \
matches this bird's art style and theme. Transparent \
background, this is a game asset. The pipe should be \
oriented vertically, centered in the frame. No characters, \
no text. Output ONLY the image.`,
  },
};

// ============================================================
// STYLES — art style presets for bird generation
// ============================================================

export const STYLES = [
  {
    name: "pixel art retro",
    label: "Pixel Art",
    desc:
      "pixel art retro 8-bit/16-bit style with visible " +
      "blocky pixels, limited color palette, reminiscent " +
      "of classic NES/SNES game sprites",
    shortDesc: "pixel art retro 8-bit game sprite style",
  },
  {
    name: "simple sketch",
    label: "Sketch",
    desc: "simple hand-drawn minial color, abstract and cute",
    shortDesc: "simple hand-drawn sketch with clean outlines",
  },
  {
    name: "Studio Ghibli",
    label: "Ghibli",
    desc:
      "Studio Ghibl style, cute, whimsical, " +
      "and derpy characters.",
    shortDesc:
      "soft watercolor anime style " +
      "with warm whimsical colors",
  },
];

// ============================================================
// MODELS
// ============================================================

export const MODELS = [
  {
    id: "gpt-image-1",
    label: "GPT Image 1",
    provider: "openai",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "gemini",
  },
  {
    id: "gemini-2.5-flash",
    label: "Nano Banana (2.5 Flash)",
    provider: "gemini",
  },
  {
    id: "gemini-3-pro",
    label: "Nano Banana Pro (3 Pro)",
    provider: "gemini",
  },
];

export const GEMINI_MODEL_MAP = {
  "gemini-2.0-flash": "gemini-2.0-flash-exp-image-generation",
  "gemini-2.5-flash": "gemini-2.5-flash-image",
  "gemini-3-pro": "gemini-3-pro-image-preview",
};

// ============================================================
// CHARACTER INFO DEFAULTS
// ============================================================

export const DEFAULT_INFO = {
  name: "",
  characteristics: "",
  speed: 50,
  mass: 50,
  stability: 50,
  jumpPower: 50,
};

export const DEFAULT_INFO_BY_STYLE = {
  "Pixel Art": {
    name: "Blip McSquare",
    characteristics:
      "Born in 1987, still thinks 64 colors is plenty.",
    speed: 60,
    mass: 40,
    stability: 70,
    jumpPower: 55,
  },
  Sketch: {
    name: "Doodle McDraw",
    characteristics:
      "Escaped from a napkin and never looked back.",
    speed: 50,
    mass: 45,
    stability: 55,
    jumpPower: 50,
  },
  Ghibli: {
    name: "Whisper Cloudwing",
    characteristics:
      "Fluent in wind and can nap on a moving cloud.",
    speed: 45,
    mass: 55,
    stability: 60,
    jumpPower: 65,
  },
};

export const REFINED_INFO = {
  name: "Glow-Up",
  characteristics:
    "Same bird, but after a spa day and a pep talk.",
  speed: 50,
  mass: 50,
  stability: 50,
  jumpPower: 50,
};
