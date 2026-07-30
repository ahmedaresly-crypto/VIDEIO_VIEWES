import type { Metadata } from "next";
import "./globals.css";
import "@uploadthing/react/styles.css";
import prisma from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  let title = "مشغل الفيديو";
  let thumbnailUrl = "";
  
  try {
    const settings = await prisma.settings.findUnique({
      where: { key: 'global' }
    });
    if (settings) {
      if (settings.title) title = settings.title;
      if (settings.thumbnailUrl) thumbnailUrl = settings.thumbnailUrl;
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  return {
    title: title,
    description: "شاهد الفيديو الآن",
    openGraph: {
      title: title,
      description: "شاهد الفيديو الآن",
      images: thumbnailUrl ? [{ url: thumbnailUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: "شاهد الفيديو الآن",
      images: thumbnailUrl ? [thumbnailUrl] : [],
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
