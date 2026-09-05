import type { ReactNode } from "react";
import "../globals.css";

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans antialiased text-foreground">{children}</body>
    </html>
  );
}
