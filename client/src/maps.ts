/**
 * Map metadata for UI. Must match server map ids (party/src/maps.ts).
 */

export interface MapOption {
  id: string;
  name: string;
  description: string;
}

export const MAPS_BY_LANGUAGE: Record<string, MapOption[]> = {
  csharp: [
    { id: "calculator", name: "Calculator", description: "A simple calculator with basic operations (add, subtract, multiply, divide). Math helper and main entry." },
    { id: "todo", name: "Todo List", description: "A small in-memory todo list. Task model, store, and console runner." },
    { id: "api", name: "REST API", description: "A minimal REST API with in-memory storage. Model, controller, and startup." },
    { id: "game", name: "Number Game", description: "A small guess-the-number game. Game logic and main loop." },
  ],
  c: [
    { id: "calculator", name: "Calculator", description: "A simple calculator with basic operations. Math functions and main." },
    { id: "todo", name: "Todo List", description: "A small CLI todo list. Task array and main loop." },
    { id: "api", name: "HTTP Server", description: "A minimal HTTP server. Request parsing and response helpers." },
    { id: "game", name: "Number Game", description: "A guess-the-number game. RNG and main loop." },
  ],
  python: [
    { id: "calculator", name: "Calculator", description: "A simple calculator with basic operations. Math module and main script." },
    { id: "todo", name: "Todo List", description: "A command-line todo list. Store, render, and main." },
    { id: "api", name: "HTTP Server", description: "A minimal HTTP server that serves JSON. Handler and server entry." },
    { id: "game", name: "Number Game", description: "A guess-the-number game. Game logic and main loop." },
  ],
};
