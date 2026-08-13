import { qdrantClient } from "./connection";

async function resetQdrant() {
  try {
    console.log("Deleting old Qdrant collection...");

    await qdrantClient.deleteCollection("agent-sphere");

    console.log("Old collection deleted.");

    console.log("Creating new collection...");

    await qdrantClient.createCollection("agent-sphere", {
      vectors: {
        size: 3072,
        distance: "Cosine",
      },
    });

    console.log("New Qdrant collection created successfully!");
  } catch (error) {
    console.error("Failed to reset Qdrant:", error);
  }
}

resetQdrant();