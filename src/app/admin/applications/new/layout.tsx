import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Application" };

export default function NewApplicationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
