import type { Metadata } from "next";
import "./globals.css";
import "@uploadthing/react/styles.css";

export const metadata: Metadata = {
  title: "مشغل الفيديو | لوحة التحكم",
  description: "تطبيق لعرض فيديو مع تتبع البصمة والموقع",
};

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
