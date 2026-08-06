import { Worker } from "bullmq";
import { prisma } from "../lib/prisma";
import { connection } from "./queue";

// Create a worker for the document queue
const documentWorker = new Worker(
  "document",
  async (job) => {
    console.log("Processing job data");
    const { documentId } = job.data;

    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });
    console.log("doc fetched", job.id);
  },
  { connection },
);

documentWorker.on("completed", (job) => {
  console.log(`Job with id:${job.id} has been completed`);
});

documentWorker.on("failed", (job, err) => {
  console.log(`Job with id ${job?.id} has failed with error: ${err.message}`);
});
