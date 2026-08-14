import OpenAI from "openai";
import { AIRequest } from "../ai.types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAiProvider {
  async *stream(request: AIRequest): AsyncGenerator<string> {
    const response = await openai.chat.completions.create({
      model: request.model,
      temperature: request.temperature ?? 0.7,
      stream: true,
      messages: [
        {
          role: "system",
          content: request.systemPrompt ?? "",
        },

        ...request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  }
}
