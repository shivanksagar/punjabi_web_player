import type { Metadata } from "next";
import { Space_Grotesk, VT323 } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ਸਾਡਾ ਪੰਜਾਬ — ambient radio",
  description: "A nostalgic lo-fi ambient music player.",
  openGraph: {
    title: "ਸਾਡਾ ਪੰਜਾਬ — ambient radio",
    description: "Chill lo-fi beats, floating over old punjab.",
    type: "website",
    images: [{ url: "/old_punjab.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ਸਾਡਾ ਪੰਜਾਬ — ambient radio",
    description: "Chill lo-fi beats, floating over old punjab.",
    images: ["/old_punjab.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
