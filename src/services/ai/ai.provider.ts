import { AIRequest } from "./ai.types";

export interface AIProviderInterface {
  stream(request: AIRequest): Promise<AsyncIterable<string>>;
}
