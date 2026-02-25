import {
  PROMPTS,
  STYLES,
  MODELS,
  GEMINI_MODEL_MAP,
  DEFAULT_INFO,
} from "./prompts.js";

export { MODELS };

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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

// ============================================================
// GREEN-SCREEN REMOVAL + AUTO-CROP
// ============================================================

function removeMagentaScreen(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // magenta = high R, low G, high B
        if (r > 120 && b > 120 && g < r * 0.6 && g < b * 0.6) {
          const dist = Math.sqrt(
            (r - 255) * (r - 255) + g * g + (b - 255) * (b - 255),
          );
          if (dist < 90) {
            data[i + 3] = 0;
          } else if (dist < 110) {
            data[i + 3] = Math.round(((dist - 90) / 20) * data[i + 3]);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

function autoCrop(dataUrl, padding = 2) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      let minX = width,
        minY = height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(dataUrl);
        return;
      }

      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width - 1, maxX + padding);
      maxY = Math.min(height - 1, maxY + padding);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      const out = document.createElement("canvas");
      out.width = cropW;
      out.height = cropH;
      out
        .getContext("2d")
        .drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      resolve(out.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

async function cleanAsset(dataUrl) {
  const noBg = await removeMagentaScreen(dataUrl);
  return autoCrop(noBg);
}

// ============================================================
// INFO PARSING (for commit)
// ============================================================

function parseInfo(text, fallbackName) {
  try {
    const match = text.match(/\{[\s\S]*?"characteristics"[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        description: parsed.description || fallbackName,
        characteristics: parsed.characteristics || "",
        speed: Number(parsed.speed) || 50,
        mass: Number(parsed.mass) || 50,
        stability: Number(parsed.stability) || 50,
        jumpPower: Number(parsed.jumpPower) || 50,
      };
    }
  } catch {
    // JSON parse failed
  }
  return { ...DEFAULT_INFO, name: fallbackName };
}

// ============================================================
// PROVIDER API CALLS
// ============================================================

async function callGemini(modelId, parts) {
  const modelName = GEMINI_MODEL_MAP[modelId] || "gemini-2.5-flash-image";
  const url =
    "https://generativelanguage.googleapis.com" +
    `/v1beta/models/${modelName}:generateContent` +
    `?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  let image = null;

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && !image) {
        const { mimeType, data: b64 } = part.inlineData;
        image = `data:${mimeType};base64,${b64}`;
      }
    }
  }

  if (!image) throw new Error("No image returned from Gemini");
  return image;
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
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
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

async function callGeminiText(parts) {
  const url =
    "https://generativelanguage.googleapis.com" +
    `/v1beta/models/gemini-2.0-flash:generateContent` +
    `?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  let text = "";
  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) text += part.text;
    }
  }
  return text;
}

async function callOpenAIChat(prompt, imageDataUrl) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "low" },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============================================================
// UNIFIED IMAGE GENERATION
// ============================================================

async function generateImage(provider, modelId, prompt, referenceDataUrl) {
  if (provider === "openai") {
    return callOpenAI(prompt, referenceDataUrl);
  }

  const parts = [];
  if (referenceDataUrl) parts.push(dataUrlToInlineData(referenceDataUrl));
  parts.push({ text: prompt });
  return callGemini(modelId, parts);
}

// ============================================================
// PUBLIC API
// ============================================================

export async function generateBirdVariations(
  sketchDataUrl,
  modelId = "gemini-3-pro",
) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const hasSketch = !!sketchDataUrl;

  const styledPromises = STYLES.map((style) => {
    const base = PROMPTS.birdBase(style.desc);
    const prompt = hasSketch
      ? `${PROMPTS.birdFromSketchPrefix}\n\n${base}`
      : base;

    return generateImage(model.provider, model.id, prompt, sketchDataUrl).then(
      (image) => ({ image, label: style.label }),
    );
  });

  let refinedPromise = null;
  if (hasSketch) {
    refinedPromise = generateImage(
      model.provider,
      model.id,
      PROMPTS.birdRefined,
      sketchDataUrl,
    ).then((image) => ({ image, label: "Refined" }));
  }

  const allPromises = refinedPromise
    ? [refinedPromise, ...styledPromises]
    : styledPromises;

  const rawResults = await Promise.all(allPromises);

  return Promise.all(
    rawResults.map(async (result) => {
      const image = await cleanAsset(result.image);
      return { image, label: result.label };
    }),
  );
}

export async function generateBirdInfo(
  sketchDataUrl,
  modelId = "gemini-2.0-flash",
) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];
  const prompt = PROMPTS.commitInfo;

  let text;
  if (model.provider === "openai") {
    text = await callOpenAIChat(prompt, sketchDataUrl);
  } else {
    const parts = [dataUrlToInlineData(sketchDataUrl), { text: prompt }];
    text = await callGeminiText(parts);
  }

  return parseInfo(text, "My Bird");
}

export async function generateWorldAssets(
  birdImageDataUrl,
  modelId = "gemini-2.0-flash",
) {
  const model = MODELS.find((m) => m.id === modelId) || MODELS[0];

  const [skyboxImage, rawPipeImage] = await Promise.all([
    generateImage(model.provider, model.id, PROMPTS.skybox, birdImageDataUrl),
    generateImage(model.provider, model.id, PROMPTS.pipe, birdImageDataUrl),
  ]);

  const skybox = await resizeImage(skyboxImage, 1536, 1024);
  const cleanedPipe = await cleanAsset(rawPipeImage);
  const PIPE_W = 52;
  const PIPE_H = 320;
  const pipeImage = await resizeImage(cleanedPipe, PIPE_W, PIPE_H);

  return { skybox, pipe: pipeImage, pipeAspectRatio: PIPE_W / PIPE_H };
}
