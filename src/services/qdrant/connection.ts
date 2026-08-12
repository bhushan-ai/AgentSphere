import { QdrantVectorStore } from "@langchain/qdrant";
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

  //store to db
  export const storeToDb = async (data: any[]) => {
    return await QdrantVectorStore.fromDocuments(data, embeddings, {
      url: process.env.QDRANT_URL!,
      collectionName: "agent-sphere",
    });
  };
  
  export const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL!,
  });

// export const getVectorStore = async () =>{
//   return await QdrantVectorStore.fromExistingCollection(embeddings,{
//     url: process.env.QDRANT_URL!,
//     collectionName:"agent-sphere"
//   })
// }
