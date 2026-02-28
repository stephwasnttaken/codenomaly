import type { ReactNode } from "react";

interface GameWindowProps {
  children: ReactNode;
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
}

export function GameWindow({ children, leftSidebar, rightSidebar }: GameWindowProps) {
  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gray-200">
      <div className="w-full max-w-[1600px] h-full max-h-[900px] flex flex-col rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
        <div className="flex flex-1 min-h-0 p-6 gap-6 overflow-hidden">
          <aside className="w-52 shrink-0 bg-gray-100 border border-gray-300 rounded flex flex-col overflow-hidden">
            {leftSidebar}
          </aside>
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gray-800 rounded border border-gray-600">
            {children}
          </main>
          <aside className="w-72 shrink-0 bg-gray-100 border border-gray-300 rounded flex flex-col overflow-hidden">
            {rightSidebar}
          </aside>
        </div>
      </div>
    </div>
  );
}
