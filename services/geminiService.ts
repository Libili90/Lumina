import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey! });

const MODEL_NAME = 'gemini-2.5-flash-image';
const SUGGESTION_MODEL = 'gemini-2.5-flash';

interface GenerateDesignParams {
  baseImage: string; // Base64
  referenceImage?: string | null; // Base64
  objectImage?: string | null; // Base64
  maskImage?: string | null; // Base64 (Optional inpainting mask)
  prompt: string;
  style: string;
  selectionPrompt?: string; 
}

/**
 * Helper to parse base64 data URI
 */
const parseBase64 = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: 'image/png',
    data: dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl
  };
};

export const getDesignSuggestions = async (baseImage: string): Promise<string[]> => {
  try {
    const { mimeType, data } = parseBase64(baseImage);
    
    const response = await ai.models.generateContent({
      model: SUGGESTION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data
            }
          },
          {
            text: "Analyze this interior room image. Identify specific furniture, materials, and colors present. Generate 3 distinct, actionable design instructions that a user could give to an AI to redesign this specific room. \n\nExamples of good output:\n- \"Replace the beige carpet with light oak flooring\"\n- \"Change the wooden cabinets to matte black\"\n- \"Add a large abstract painting to the empty white wall\"\n\nKeep them short (max 15 words) and direct. Return as a JSON list of strings."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse JSON suggestions", text);
        return [];
    }
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
};

export const generateRoomDesign = async (params: GenerateDesignParams): Promise<string> => {
  const { baseImage, referenceImage, objectImage, maskImage, prompt, style, selectionPrompt } = params;

  try {
    const parts: any[] = [];

    // 1. Add the base image
    const baseImgData = parseBase64(baseImage);
    parts.push({
      inlineData: {
        mimeType: baseImgData.mimeType,
        data: baseImgData.data,
      },
    });

    let hasRef = false;
    let hasObj = false;
    let hasMask = false;

    // 2. Add reference image if provided
    if (referenceImage) {
      const refImgData = parseBase64(referenceImage);
      parts.push({
        inlineData: {
          mimeType: refImgData.mimeType,
          data: refImgData.data,
        },
      });
      hasRef = true;
    }

    // 3. Add object image if provided
    if (objectImage) {
      const objImgData = parseBase64(objectImage);
      parts.push({
        inlineData: {
          mimeType: objImgData.mimeType,
          data: objImgData.data,
        },
      });
      hasObj = true;
    }

    // 4. Add Mask image if provided
    if (maskImage) {
      const maskImgData = parseBase64(maskImage);
      parts.push({
        inlineData: {
          mimeType: maskImgData.mimeType,
          data: maskImgData.data,
        },
      });
      hasMask = true;
    }

    // 5. Construct Prompt
    let fullPrompt = `Redesign the room shown in the first image.\nTarget Style: ${style}.`;

    if (prompt && prompt.trim()) {
        fullPrompt += `\nUser Instructions: ${prompt}.`;
    }

    if (hasRef) {
      fullPrompt += `\nThe second image is a style reference. Adopt its color palette, lighting, and materials for the redesign.`;
    }

    if (hasObj) {
        // Calculate index dynamically based on presence of Ref
        const objIndex = hasRef ? "third" : "second";
        fullPrompt += `\nThe ${objIndex} image shows a specific object (e.g. furniture or decor). Place this object into the room in a natural position`;
        
        if (maskImage || selectionPrompt) {
            fullPrompt += ` within the selected area or where appropriate based on the surface.`;
        } else {
            fullPrompt += ` blending it with the perspective and lighting.`;
        }
    }

    if (hasMask) {
       // If a mask is present (Multimodal inpainting context)
       fullPrompt += `\nThe last image is a mask. The non-transparent brush strokes indicate the exact area you must modify. Keep everything outside this mask exactly as it is in the original image.`;
    } else if (selectionPrompt) {
       // Fallback for Box selection (visual guidance text)
       fullPrompt += `\n\nFocus changes on this area: ${selectionPrompt}`;
    }

    fullPrompt += `\nRequirements:
    - Output a high-quality, photorealistic image.
    - Preserve the structural perspective.
    - Do not output text, only the image.`;

    parts.push({ text: fullPrompt });

    // 6. Call API
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
    });

    const candidate = response.candidates?.[0];
    
    if (!candidate) {
        throw new Error("No candidates returned from API.");
    }

    if (candidate.finishReason === 'SAFETY') {
        throw new Error("The image generation was blocked by safety filters.");
    }

    if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }

    const textPart = candidate.content?.parts?.find(p => p.text);
    if (textPart?.text) {
        console.warn("Model text response:", textPart.text);
        throw new Error(`AI Response: ${textPart.text}`);
    }
    
    throw new Error(`Generation failed. Finish reason: ${candidate.finishReason || 'Unknown'}`);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate design");
  }
};
