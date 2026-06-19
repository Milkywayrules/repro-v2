"use client";

import { AppProviders } from "@repro-v2/ui/providers/app-providers";

export default function DocsAppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProviders nuqs="next-app">{children}</AppProviders>;
}
