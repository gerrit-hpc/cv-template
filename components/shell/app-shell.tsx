import type { ReactNode } from "react";
import { LeftRail } from "@/components/navigation/left-rail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen">
      <LeftRail />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
