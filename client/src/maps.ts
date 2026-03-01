/**
 * Map metadata for UI. Must match server map ids (party/src/maps.ts).
 */

export interface MapOption {
  id: string;
  name: string;
  description: string;
}

export const MAPS_BY_LANGUAGE: Record<string, MapOption[]> = {
  javascript: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A simple calculator with basic operations (add, subtract, multiply, divide). Uses a math module and a main entry point.",
    },
    {
      id: "todo",
      name: "Todo List",
      description:
        "A small todo list app that keeps tasks in memory. Has a store, render logic, and an entry file that wires them together.",
    },
    {
      id: "api",
      name: "REST API",
      description:
        "A minimal REST API with in-memory storage. Server, routes, and a small db module.",
    },
  ],
  typescript: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A typed calculator with basic operations. Math module and main entry.",
    },
    {
      id: "todo",
      name: "Todo List",
      description: "A typed todo app with a Task interface and store.",
    },
    {
      id: "api",
      name: "API Client",
      description: "A small typed HTTP client that fetches and parses JSON.",
    },
  ],
  python: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A simple calculator with basic operations. Math module and main script.",
    },
    {
      id: "todo",
      name: "Todo CLI",
      description:
        "A command-line todo list with add, list, and done actions.",
    },
    {
      id: "api",
      name: "HTTP Server",
      description:
        "A minimal HTTP server that serves JSON. Handler and server entry.",
    },
  ],
};
