
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ImageAnalysis, GenerationConfig, StoryboardFramePlan } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeReferenceImage = async (base64Image: string): Promise<ImageAnalysis> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    You are a Director of Photography (DP). Analyze this reference image strictly for a continuity storyboard.
    Extract the following details in JSON format:
    1. subject: The main subject (person, object, scene).
    2. style: The visual style (cinematic, grainy, photorealistic, noir, etc.).
    3. lighting: The lighting setup (soft, harsh, rim, volumetric, etc.).
    4. keyElements: Specific environmental details to preserve.
    5. characterDNA: A precise description of the character's physical appearance (hair style/color, facial features, eyes, any unique traits, and EXACT clothing/outfit details). This is crucial for maintaining identity.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          style: { type: Type.STRING },
          lighting: { type: Type.STRING },
          keyElements: { type: Type.STRING },
          characterDNA: { type: Type.STRING },
        },
        required: ["subject", "style", "lighting", "keyElements", "characterDNA"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No analysis returned");
  return JSON.parse(text) as ImageAnalysis;
};

export const planStoryboardSequence = async (
  analysis: ImageAnalysis,
  action: string
): Promise<StoryboardFramePlan[]> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    Act as a professional Film Director and Storyboard Artist. Plan a high-end 9-frame cinematic sequence.
    
    REFERENCE DNA:
    - Subject: ${analysis.subject}
    - Style: ${analysis.style}
    - Lighting: ${analysis.lighting}
    - Key Elements: ${analysis.keyElements}
    - Character Appearance (STRICT CONSISTENCY REQUIRED): ${analysis.characterDNA}
    
    STORY ARC: "${action}"

    CORE MISSION: Create a visually dynamic sequence. You MUST vary the shot sizes and camera angles significantly across the 9 frames.
    
    SHOT SIZES TO USE (Mix these): 
    - Extreme Close Up (ECU), Close Up (CU), Medium Close Up (MCU), Medium Shot (MS), Medium Long Shot (MLS), Wide Shot (WS), Extreme Wide Shot (EWS).
    
    CAMERA ANGLES TO USE (Mix these): 
    - Eye level, High angle (俯拍), Low angle (仰拍), Bird's eye view (鸟瞰), Dutch angle (倾斜构图), Over-the-shoulder (过肩拍).

    For each of the 9 frames, provide:
    1. frameNumber (1-9)
    2. shotType (e.g., "Extreme Close Up - Low Angle", "Wide Shot - High Angle")
    3. prompt (A detailed visual description for an image generator that integrates the Character DNA and the specific action/composition)
    4. description (A short director's note in Chinese explaining why this shot was chosen for the story)

    Return the result as a JSON array of 9 objects.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            frameNumber: { type: Type.INTEGER },
            shotType: { type: Type.STRING },
            prompt: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["frameNumber", "shotType", "prompt", "description"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Sequence planning failed");
  return JSON.parse(text) as StoryboardFramePlan[];
};

export const generateSingleFrame = async (
  framePlan: StoryboardFramePlan,
  base64Reference: string,
  config: GenerationConfig
): Promise<string> => {
  const ai = getAI();
  const modelId = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: `Professional cinematic film still. 
            SHOT TYPE & COMPOSITION: ${framePlan.shotType}. 
            SCENE ACTION: ${framePlan.prompt}. 
            
            STRICT IDENTITY RULE: The character in this frame MUST be IDENTICAL to the person in the provided reference image. 
            Do not change facial features, eye color, hair style, or clothing details. 
            
            TECHNICAL SPECS: Photorealistic, 35mm film grain, cinematic lighting, 8k, ultra-detailed textures.`
          },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Reference
            }
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error(`Frame ${framePlan.frameNumber} failed:`, error);
    throw error;
  }
};
