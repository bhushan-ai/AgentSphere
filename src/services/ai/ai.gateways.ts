import { AIRequest } from "./ai.types";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { GrokProvider } from "./providers/grok.provider";
import { OpenAiProvider } from "./providers/openai.provider";

export class AIGateway {
  private geminiProvider = new GeminiProvider();
  private grokProvider = new GrokProvider();
  private openAIProvider = new OpenAiProvider();
  private anthropicAIProvider = new AnthropicProvider();

  async stream(request: AIRequest): Promise<AsyncIterable<string>> {
    switch (request.provider) {
      case "GEMINI":
        return this.geminiProvider.stream(request);

      case "GROK":
        return this.grokProvider.stream(request);

      case "OPENAI":
        return this.openAIProvider.stream(request);

      case "ANTHROPIC":
        return this.anthropicAIProvider.stream(request);
      default:
        throw new Error(`Unsupported AI provider: ${request.provider}`);
    }
  }
}

export const aiGateway = new AIGateway();
