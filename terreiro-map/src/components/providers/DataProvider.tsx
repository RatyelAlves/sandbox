"use client";

import { useEffect } from "react";
import { hydrateFromApi } from "@/lib/data-source";

export function DataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateFromApi();
  }, []);

  return children;
}
