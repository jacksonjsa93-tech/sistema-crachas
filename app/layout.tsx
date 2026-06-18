import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGSO Premium - Portal RH",
  description: "Sistema de Gestão de Crachás Dínamo Engenharia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
