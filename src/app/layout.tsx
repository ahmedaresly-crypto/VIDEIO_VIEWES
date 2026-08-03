import type { Metadata } from "next";
import "./globals.css";
import "@uploadthing/react/styles.css";
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const images = thumbnailUrl ? [{
    url: thumbnailUrl,
    width: 1200,
    height: 630,
    alt: title,
  }] : [];

  return {
    title: title,
    description: "اضغط هنا لمشاهدة الفيديو بالكامل",
    openGraph: {
      title: title,
      description: "اضغط هنا لمشاهدة الفيديو بالكامل",
      type: "website",
      images: images,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: "اضغط هنا لمشاهدة الفيديو بالكامل",
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
