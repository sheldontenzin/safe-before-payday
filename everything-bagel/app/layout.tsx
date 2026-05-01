import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Everything Bagel",
  description:
    "A warm lifestyle and wellness channel about routines, movement, parenting, culture, and honest reflections."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
