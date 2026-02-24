// ============================================================
// PROMPT TEMPLATES — edit these to tune generation output
// ============================================================

const PROMPTS = {
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
You are a game asset designer. Generate ONLY a single bird 
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

const STYLES = [
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
    desc: "Studio Ghibl style, cute, whimsical, " + "and derpy characters.",
    shortDesc: "soft watercolor anime style " + "with warm whimsical colors",
  },
];

// ============================================================
// MODELS
// ============================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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

const GEMINI_MODEL_MAP = {
  "gemini-2.0-flash": "gemini-2.0-flash-exp-image-generation",
  "gemini-2.5-flash": "gemini-2.5-flash-image",
  "gemini-3-pro": "gemini-3-pro-image-preview",
};

// ============================================================
// SHARED UTILITIES
// ============================================================

function dataUrlToInlineData(dataUrl) {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
  return { inlineData: { mimeType: mime, data: b64 } };
}

function dataUrlToFile(dataUrl, filename) {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new File([arr], filename, { type: mime });
}

function resizeImage(dataUrl, width, height) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

function getImageAspectRatio(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width / img.height);
    img.src = dataUrl;
  });
}

// ============================================================
// BACKGROUND REMOVAL (flood-fill from corners)
// ============================================================

function removeBackground(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      const getPixel = (x, y) => {
        const i = (y * width + x) * 4;
        return [data[i], data[i + 1], data[i + 2]];
      };
      const bgColor = getPixel(0, 0);
      const tolerance = 60;

      const matches = (x, y) => {
        const i = (y * width + x) * 4;
        return (
          Math.abs(data[i] - bgColor[0]) <= tolerance &&
          Math.abs(data[i + 1] - bgColor[1]) <= tolerance &&
          Math.abs(data[i + 2] - bgColor[2]) <= tolerance
        );
      };

      const visited = new Uint8Array(width * height);
      const queue = [];

      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ];
      for (const [cx, cy] of corners) {
        if (!visited[cy * width + cx] && matches(cx, cy)) {
          queue.push(cx, cy);
          visited[cy * width + cx] = 1;
        }
      }

      while (queue.length > 0) {
        const y = queue.pop();
        const x = queue.pop();
        data[(y * width + x) * 4 + 3] = 0;

        const neighbors = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width) continue;
          if (ny < 0 || ny >= height) continue;
          const ni = ny * width + nx;
          if (visited[ni]) continue;
          visited[ni] = 1;
          if (matches(nx, ny)) queue.push(nx, ny);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

// ============================================================
// INFO PARSING (character stats from model text output)
// ============================================================

const DEFAULT_INFO = {
  name: "",
  characteristics: "",
  speed: 50,
  mass: 50,
  stability: 50,
  jumpPower: 50,
};

function parseInfo(text, fallbackName) {
  try {
    const match = text.match(/\{[\s\S]*?"name"[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        name: parsed.name || fallbackName,
        characteristics: parsed.characteristics || "",
        speed: Number(parsed.speed) || 50,
        mass: Number(parsed.mass) || 50,
        stability: Number(parsed.stability) || 50,
        jumpPower: Number(parsed.jumpPower) || 50,
      };
    }
  } catch {
    // JSON parse failed, use defaults
  }
  return { ...DEFAULT_INFO, name: fallbackName };
}

const DEFAULT_INFO_BY_STYLE = {
  "Pixel Art": {
    name: "Blip McSquare",
    characteristics: "Born in 1987, still thinks 64 colors is plenty.",
    speed: 60,
    mass: 40,
    stability: 70,
    jumpPower: 55,
  },
  Sketch: {
    name: "Doodle McDraw",
    characteristics: "Escaped from a napkin and never looked back.",
    speed: 50,
    mass: 45,
    stability: 55,
    jumpPower: 50,
  },
  Ghibli: {
    name: "Whisper Cloudwing",
    characteristics: "Fluent in wind and can nap on a moving cloud.",
    speed: 45,
    mass: 55,
    stability: 60,
    jumpPower: 65,
  },
};

const REFINED_INFO = {
  name: "Glow-Up",
  characteristics: "Same bird, but after a spa day and a pep talk.",
  speed: 50,
  mass: 50,
  stability: 50,
  jumpPower: 50,
};

function defaultInfoForStyle(styleName) {
  return (
    DEFAULT_INFO_BY_STYLE[styleName] || { ...DEFAULT_INFO, name: styleName }
  );
}

// ============================================================
// PROVIDER API CALLS
// ============================================================

async function callGemini(modelId, parts) {
  const modelName = GEMINI_MODEL_MAP[modelId] || "gemini-2.5-flash-image";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  let image = null;
  let text = "";

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && !image) {
        const { mimeType, data: b64 } = part.inlineData;
        image = `data:${mimeType};base64,${b64}`;
      }
      if (part.text) text += part.text;
    }
  }

  if (!image) {
    throw new Error("No image returned from Gemini");
  }
  return { image, text };
}

async function callOpenAI(prompt, sketchDataUrl) {
  let res;

  if (sketchDataUrl) {
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("size", "1024x1024");
    form.append("image[]", dataUrlToFile(sketchDataUrl, "sketch.png"));

    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    });
  } else {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
      }),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;

  const url = data.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    const blob = await imgRes.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  throw new Error("No image returned from OpenAI");
}

// ============================================================
// UNIFIED GENERATION HELPER
// ============================================================

async function generateImage(provider, modelId, prompt, referenceDataUrl) {
  if (provider === "openai") {
    const image = await callOpenAI(prompt, referenceDataUrl);
    return { image, text: "" };
  }

  const parts = [];
  if (referenceDataUrl) {
    parts.push(dataUrlToInlineData(referenceDataUrl));
  }
  parts.push({ text: prompt });
  return callGemini(modelId, parts);
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

function buildBirdPrompt(style, hasSketch, provider) {
  if (provider === "openai") {
    return hasSketch
      ? PROMPTS.openai.birdFromSketch
      : PROMPTS.openai.birdGenerate(style.shortDesc);
  }

  const base = PROMPTS.birdBase(style.desc) + PROMPTS.infoJsonSuffix;

  return hasSketch ? `${PROMPTS.birdFromSketchPrefix}\n\n${base}` : base;
}

function buildRefinedPrompt() {
  return PROMPTS.birdRefined + PROMPTS.infoJsonSuffix;
}

// ============================================================
// PUBLIC API
// ============================================================

export async function generateBirdVariations(
  sketchDataUrl,
  modelId = "gemini-2.0-flash",
) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const hasSketch = !!sketchDataUrl;
  const isOpenAI = model.provider === "openai";

  const styledPromises = STYLES.map((style) => {
    const prompt = buildBirdPrompt(style, hasSketch, model.provider);

    return generateImage(model.provider, model.id, prompt, sketchDataUrl).then(
      ({ image, text }) => ({
        image,
        info: isOpenAI
          ? defaultInfoForStyle(style.label)
          : parseInfo(text, style.label),
        label: style.label,
        _provider: model.provider,
      }),
    );
  });

  let refinedPromise = null;
  if (hasSketch) {
    const prompt = buildRefinedPrompt();
    refinedPromise = generateImage(
      model.provider,
      model.id,
      prompt,
      sketchDataUrl,
    ).then(({ image, text }) => ({
      image,
      info: isOpenAI ? REFINED_INFO : parseInfo(text, "Refined"),
      label: "Refined",
      _provider: model.provider,
    }));
  }

  const allPromises = refinedPromise
    ? [refinedPromise, ...styledPromises]
    : styledPromises;
  const rawResults = await Promise.all(allPromises);

  return Promise.all(
    rawResults.map(async (result) => {
      if (result._provider === "openai") return result;
      const cleanImage = await removeBackground(result.image);
      return { ...result, image: cleanImage };
    }),
  );
}

export async function generateWorldAssets(
  birdImageDataUrl,
  modelId = "gemini-2.0-flash",
) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const isOpenAI = model.provider === "openai";

  const skyboxPrompt = isOpenAI ? PROMPTS.openai.skybox : PROMPTS.gemini.skybox;
  const pipePrompt = isOpenAI ? PROMPTS.openai.pipe : PROMPTS.gemini.pipe;

  const [skyboxResult, pipeResult] = await Promise.all([
    generateImage(model.provider, model.id, skyboxPrompt, birdImageDataUrl),
    generateImage(model.provider, model.id, pipePrompt, birdImageDataUrl),
  ]);

  const skybox = await resizeImage(skyboxResult.image, 1536, 1024);
  const pipe = pipeResult.image;
  const pipeAspectRatio = await getImageAspectRatio(pipe);

  return { skybox, pipe, pipeAspectRatio };
}
