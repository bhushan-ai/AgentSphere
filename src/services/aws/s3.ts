import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION!;
const keyId = process.env.AWS_ACCESS_KEY_ID!;
const accessKey = process.env.AWS_SECRET_ACCESS_KEY!;

export const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: keyId,
    secretAccessKey: accessKey,
  },
});
