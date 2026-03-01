import type { ReactNode } from "react";

interface GameWindowProps {
  children: ReactNode;
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
}

export function GameWindow({ children, leftSidebar, rightSidebar }: GameWindowProps) {
  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 rounded-lg overflow-hidden border border-white/20 bg-[var(--color-surface)]">
        <div className="flex flex-1 min-h-0 p-6 gap-6 overflow-hidden">
          <aside className="w-52 shrink-0 bg-[var(--color-surface)] border border-white/20 rounded flex flex-col overflow-hidden">
            {leftSidebar}
          </aside>
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[var(--color-surface)] rounded border border-white/20">
            {children}
          </main>
          <aside className="w-72 shrink-0 bg-[var(--color-surface)] border border-white/20 rounded flex flex-col overflow-hidden">
            {rightSidebar}
          </aside>
        </div>
      </div>
    </div>
  );
}
