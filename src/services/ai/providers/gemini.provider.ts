import { GoogleGenAI } from "@google/genai";
import { AIRequest } from "../ai.types";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export class GeminiProvider {
  async *stream(request: AIRequest): AsyncGenerator<string> {
    const responseStream = await ai.models.generateContentStream({
      model: request.model,

      config: {
        systemInstruction: request.systemPrompt || "",
        temperature: request.temperature ?? 0.7,
      },
      contents: request.messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        parts: [
          {
            text: message.content,
          },
        ],
      })),
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }
}
