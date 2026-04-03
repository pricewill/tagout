import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AIIdentifyResult {
  species: string;
  confidence: number;
  notes: string;
}

export async function identifySpeciesFromUrl(
  imageUrl: string
): Promise<AIIdentifyResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
source: {
  type: "base64",
  media_type: "image/jpeg",
  data: imageUrl,
},
            },
          },
          {
            type: "text",
            text: `You are an expert wildlife and fish identification assistant for hunters and anglers.
Analyze this image and identify the species shown.

Respond in this exact JSON format (no markdown, just JSON):
{
  "species": "Common name of the species (e.g. Largemouth Bass, White-tailed Deer, Mallard Duck)",
  "confidence": 0.92,
  "notes": "Brief identification notes, distinguishing features visible, or caveats about the ID"
}

If you cannot identify a species (e.g. no animal visible), respond with:
{
  "species": "Unknown",
  "confidence": 0,
  "notes": "Could not identify a species in this image"
}`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";

  try {
    const parsed = JSON.parse(text.trim()) as AIIdentifyResult;
    return {
      species: parsed.species ?? "Unknown",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0)),
      notes: parsed.notes ?? "",
    };
  } catch {
    return { species: "Unknown", confidence: 0, notes: text.slice(0, 200) };
  }
}
