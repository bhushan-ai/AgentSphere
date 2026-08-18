import Anthropic from "@anthropic-ai/sdk";
import { AIRequest } from "../ai.types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
export class AnthropicProvider {
  async *stream(request: AIRequest): AsyncGenerator<string> {
    const stream = await anthropic.messages.create({
      model: request.model,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt ?? "",
      max_tokens: 1024,
      stream: true,

      messages: request.messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }
  }
}
