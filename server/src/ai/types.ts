export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendMessageParams {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export interface AiClient {
  sendMessage(params: SendMessageParams): Promise<string>;
}
