import { createHash, randomUUID } from "crypto";
import { embeddings, qdrantClient } from "./connection";

export const storeToDb = async (documents: any[], startIndex: number) => {
  try {
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    if (vectors.length !== documents.length) {
      throw new Error(
        `Documents count mismatch. Documents: ${documents.length}, vectors:${vectors.length} `,
      );
    }

    const points = documents.map((doc, index) => {
      const vector = vectors[index];
      if (!vector || vector.length !== 3072) {
        throw new Error(
          `Invalid embedding at index ${index}. Expected 3072, got ${vector?.length ?? 0}`,
        );
      }

      return {
        id: randomUUID(),
        vector,
        payload: {
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        },
      };
    });

    await qdrantClient.upsert("agent-sphere", { wait: true, points });

    console.log("Qdrant upload successful");
    return points.length;
  } catch (error: any) {
    console.error(" STORE TO DB ERROR");

    console.error("Message:", error.message);
    console.error("Status:", error.status);
    console.error("Status Text:", error.statusText);
    console.error("Data:", JSON.stringify(error.data, null, 2));

    throw error;
  }
};
