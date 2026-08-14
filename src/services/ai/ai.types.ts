export type AIProvider = "OPENAI" | "GEMINI" | "GROK" | "ANTHROPIC";

export interface AIMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface AIRequest {
  provider: AIProvider;
  model: string;
  systemPrompt?: string | null;
  temperature: number | null;
  messages: AIMessage[];
}
