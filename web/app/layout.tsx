import type { ReactNode } from "react";

export const metadata = {
  title: "DaaS Purchase Orders",
  description: "Purchase order receiving take-home",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
