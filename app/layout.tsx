import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// PODE ALTERAR O TEXTO ENTRE AS ASPAS PARA O QUE QUISER!
export const metadata: Metadata = {
  title: "Portal Crachás | Dínamo Engenharia",
  description: "Sistema de Gestão e Emissão de Crachás",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
