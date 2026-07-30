import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: "128MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
      const videoUrl = file.url;
      await prisma.settings.upsert({
        where: { key: 'global' },
        update: { videoUrl },
        create: { key: 'global', videoUrl },
      });
      return { videoUrl };
    }),
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete:", file.url);
      const thumbnailUrl = file.url;
      await prisma.settings.upsert({
        where: { key: 'global' },
        update: { thumbnailUrl },
        create: { key: 'global', thumbnailUrl },
      });
      return { thumbnailUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
