import {
  PROMPTS,
  STYLES,
  MODELS,
  GEMINI_MODEL_MAP,
  DEFAULT_INFO,
  DEFAULT_INFO_BY_STYLE,
  REFINED_INFO,
} from "./prompts.js";

export { MODELS };

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ============================================================
// SHARED UTILITIES
// ============================================================

function dataUrlToInlineData(dataUrl) {
  const [header, b64] = dataUrl.split(",");
  const mime =
    header.match(/data:(.*?);/)?.[1] || "image/png";
  return { inlineData: { mimeType: mime, data: b64 } };
}

function dataUrlToFile(dataUrl, filename) {
  const [header, b64] = dataUrl.split(",");
  const mime =
    header.match(/data:(.*?);/)?.[1] || "image/png";
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

      const imageData = ctx.getImageData(
        0, 0, canvas.width, canvas.height,
      );
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
// INFO PARSING
// ============================================================

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

function defaultInfoForStyle(styleName) {
  return (
    DEFAULT_INFO_BY_STYLE[styleName] ||
    { ...DEFAULT_INFO, name: styleName }
  );
}

// ============================================================
// PROVIDER API CALLS
// ============================================================

async function callGemini(modelId, parts) {
  const modelName =
    GEMINI_MODEL_MAP[modelId] || "gemini-2.5-flash-image";
  const url =
    "https://generativelanguage.googleapis.com" +
    `/v1beta/models/${modelName}:generateContent` +
    `?key=${GEMINI_API_KEY}`;

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
    throw new Error(
      `Gemini API error ${res.status}: ${text}`,
    );
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
    form.append(
      "image[]",
      dataUrlToFile(sketchDataUrl, "sketch.png"),
    );

    res = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: form,
      },
    );
  } else {
    res = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
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
      },
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OpenAI API error ${res.status}: ${text}`,
    );
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

async function generateImage(
  provider, modelId, prompt, referenceDataUrl,
) {
  if (provider === "openai") {
    const image = await callOpenAI(
      prompt, referenceDataUrl,
    );
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

  const base =
    PROMPTS.birdBase(style.desc) +
    PROMPTS.infoJsonSuffix;

  return hasSketch
    ? `${PROMPTS.birdFromSketchPrefix}\n\n${base}`
    : base;
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
  const model =
    MODELS.find((m) => m.id === modelId) || MODELS[0];
  const hasSketch = !!sketchDataUrl;
  const isOpenAI = model.provider === "openai";

  const styledPromises = STYLES.map((style) => {
    const prompt = buildBirdPrompt(
      style, hasSketch, model.provider,
    );

    return generateImage(
      model.provider, model.id, prompt, sketchDataUrl,
    ).then(({ image, text }) => ({
      image,
      info: isOpenAI
        ? defaultInfoForStyle(style.label)
        : parseInfo(text, style.label),
      label: style.label,
      _provider: model.provider,
    }));
  });

  let refinedPromise = null;
  if (hasSketch) {
    const prompt = buildRefinedPrompt();
    refinedPromise = generateImage(
      model.provider, model.id, prompt, sketchDataUrl,
    ).then(({ image, text }) => ({
      image,
      info: isOpenAI
        ? REFINED_INFO
        : parseInfo(text, "Refined"),
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
      const cleanImage =
        await removeBackground(result.image);
      return { ...result, image: cleanImage };
    }),
  );
}

export async function generateWorldAssets(
  birdImageDataUrl,
  modelId = "gemini-2.0-flash",
) {
  const model =
    MODELS.find((m) => m.id === modelId) || MODELS[0];
  const isOpenAI = model.provider === "openai";

  const skyboxPrompt = isOpenAI
    ? PROMPTS.openai.skybox
    : PROMPTS.gemini.skybox;
  const pipePrompt = isOpenAI
    ? PROMPTS.openai.pipe
    : PROMPTS.gemini.pipe;

  const [skyboxResult, pipeResult] = await Promise.all([
    generateImage(
      model.provider, model.id,
      skyboxPrompt, birdImageDataUrl,
    ),
    generateImage(
      model.provider, model.id,
      pipePrompt, birdImageDataUrl,
    ),
  ]);

  const skybox = await resizeImage(
    skyboxResult.image, 1536, 1024,
  );
  const pipe = pipeResult.image;
  const pipeAspectRatio = await getImageAspectRatio(pipe);

  return { skybox, pipe, pipeAspectRatio };
}
