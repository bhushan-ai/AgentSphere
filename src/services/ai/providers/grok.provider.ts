import { AIRequest } from "../ai.types";
import { streamText } from "ai";
import { createXai } from "@ai-sdk/xai";

export const xai = createXai({
  apiKey: process.env.GROK_API_KEY,
});

export class GrokProvider {
  async *stream(request: AIRequest): AsyncGenerator<string> {
    const result = streamText({
      model: xai(request.model),
      system: request.systemPrompt ?? "",
      temperature: request.temperature ?? 0.7,
      messages: request.messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }
}
