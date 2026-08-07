import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// creating embedding
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001",
});

//store to db
export const vectorStore = new QdrantVectorStore(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "agent-sphere",
});


