import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ESTA É A IDENTIDADE DO SEU SISTEMA!
export const metadata: Metadata = {
  title: "SGSO | Dínamo Engenharia",
  description: "Portal Operacional e Emissão de Crachás - Dínamo Engenharia",
};

export default function RootLayout({
  children,
}: ReadType<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
