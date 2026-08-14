import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";

// creating embedding
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
});
