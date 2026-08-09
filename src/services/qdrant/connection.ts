import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenAI } from "@google/genai";

// creating embedding
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001",
});

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

//store to db
export const vectorStore = new QdrantVectorStore(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "agent-sphere",
});

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!,
});
