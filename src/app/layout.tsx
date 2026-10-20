import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantum MLOps Studio Blueprint",
  description: "Dynamic layout builder and compilation gateway for quantum circuit design patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark select-none">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-hidden w-screen h-screen">
        {children}
      </body>
    </html>
  );
}
