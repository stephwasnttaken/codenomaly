/**
 * Maps per language. Each map is a small application with a purpose.
 * Files in a map may depend on each other.
 */

export interface MapFile {
  name: string;
  content: string;
  language: string;
}

export interface CodeMap {
  id: string;
  name: string;
  description: string;
  files: MapFile[];
}

export const MAPS_BY_LANGUAGE: Record<string, CodeMap[]> = {
  javascript: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A simple calculator with basic operations (add, subtract, multiply, divide). Uses a math module and a main entry point.",
      files: [
        {
          name: "math.js",
          content: `function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  return a / b;
}

module.exports = { add, subtract, multiply, divide };
`,
          language: "javascript",
        },
        {
          name: "main.js",
          content: `const { add, subtract, multiply, divide } = require("./math");

const a = 10;
const b = 3;

console.log("Sum:", add(a, b));
console.log("Difference:", subtract(a, b));
console.log("Product:", multiply(a, b));
console.log("Quotient:", divide(a, b));
`,
          language: "javascript",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo List",
      description:
        "A small todo list app that keeps tasks in memory. Has a store, render logic, and an entry file that wires them together.",
      files: [
        {
          name: "store.js",
          content: `const tasks = [];

function addTask(text) {
  tasks.push({ id: Date.now(), text, done: false });
}

function removeTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index >= 0) tasks.splice(index, 1);
}

function toggleTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
}

module.exports = { tasks, addTask, removeTask, toggleTask };
`,
          language: "javascript",
        },
        {
          name: "app.js",
          content: `const { tasks, addTask, removeTask, toggleTask } = require("./store");

function render() {
  tasks.forEach((t) => {
    console.log(\`\${t.done ? "[x]" : "[ ]"} \${t.text}\`);
  });
}

module.exports = { render };
`,
          language: "javascript",
        },
        {
          name: "index.js",
          content: `const { addTask, removeTask, toggleTask } = require("./store");
const { render } = require("./app");

addTask("Learn JavaScript");
addTask("Build a game");
render();
`,
          language: "javascript",
        },
      ],
    },
    {
      id: "api",
      name: "REST API",
      description:
        "A minimal REST API with in-memory storage. Server, routes, and a small db module.",
      files: [
        {
          name: "db.js",
          content: `const items = new Map();

function get(id) {
  return items.get(id);
}

function set(id, value) {
  items.set(id, value);
}

function getAll() {
  return Array.from(items.entries());
}

module.exports = { get, set, getAll };
`,
          language: "javascript",
        },
        {
          name: "routes.js",
          content: `const { get, set, getAll } = require("./db");

function handleGet(req, res) {
  const data = getAll();
  res.json(data);
}

function handlePost(req, res) {
  const id = req.body.id;
  const value = req.body.value;
  set(id, value);
  res.status(201).json({ id, value });
}

module.exports = { handleGet, handlePost };
`,
          language: "javascript",
        },
        {
          name: "server.js",
          content: `const http = require("http");
const { handleGet, handlePost } = require("./routes");

const server = http.createServer((req, res) => {
  if (req.url === "/api" && req.method === "GET") {
    handleGet(req, res);
  } else if (req.url === "/api" && req.method === "POST") {
    handlePost(req, res);
  } else {
    res.statusCode = 404;
    res.end();
  }
});

server.listen(3000);
`,
          language: "javascript",
        },
      ],
    },
  ],
  typescript: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A typed calculator with basic operations. Math module and main entry.",
      files: [
        {
          name: "math.ts",
          content: `export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  return a / b;
}
`,
          language: "typescript",
        },
        {
          name: "main.ts",
          content: `import { add, subtract, multiply, divide } from "./math";

const a = 10;
const b = 3;

console.log("Sum:", add(a, b));
console.log("Difference:", subtract(a, b));
console.log("Product:", multiply(a, b));
console.log("Quotient:", divide(a, b));
`,
          language: "typescript",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo List",
      description:
        "A typed todo app with a Task interface and store.",
      files: [
        {
          name: "types.ts",
          content: `export interface Task {
  id: number;
  text: string;
  done: boolean;
}
`,
          language: "typescript",
        },
        {
          name: "store.ts",
          content: `import type { Task } from "./types";

const tasks: Task[] = [];

export function addTask(text: string): void {
  tasks.push({ id: Date.now(), text, done: false });
}

export function getTasks(): Task[] {
  return tasks;
}

export function toggleTask(id: number): void {
  const t = tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
}
`,
          language: "typescript",
        },
        {
          name: "index.ts",
          content: `import { addTask, getTasks, toggleTask } from "./store";

addTask("Learn TypeScript");
addTask("Build a game");
console.log(getTasks());
`,
          language: "typescript",
        },
      ],
    },
    {
      id: "api",
      name: "API Client",
      description:
        "A small typed HTTP client that fetches and parses JSON.",
      files: [
        {
          name: "client.ts",
          content: `export async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
`,
          language: "typescript",
        },
        {
          name: "index.ts",
          content: `import { get } from "./client";

interface User {
  id: number;
  name: string;
}

async function main() {
  const user = await get<User>("/api/user");
  console.log(user.name);
}
`,
          language: "typescript",
        },
      ],
    },
  ],
  python: [
    {
      id: "calculator",
      name: "Calculator",
      description:
        "A simple calculator with basic operations. Math module and main script.",
      files: [
        {
          name: "math_ops.py",
          content: `def add(a: float, b: float) -> float:
    return a + b


def subtract(a: float, b: float) -> float:
    return a - b


def multiply(a: float, b: float) -> float:
    return a * b


def divide(a: float, b: float) -> float:
    return a / b
`,
          language: "python",
        },
        {
          name: "main.py",
          content: `from math_ops import add, subtract, multiply, divide

a = 10
b = 3

print("Sum:", add(a, b))
print("Difference:", subtract(a, b))
print("Product:", multiply(a, b))
print("Quotient:", divide(a, b))
`,
          language: "python",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo CLI",
      description:
        "A command-line todo list with add, list, and done actions.",
      files: [
        {
          name: "store.py",
          content: `tasks: list[dict] = []


def add_task(text: str) -> None:
    tasks.append({"id": len(tasks), "text": text, "done": False})


def list_tasks() -> list[dict]:
    return tasks


def mark_done(task_id: int) -> None:
    for t in tasks:
        if t["id"] == task_id:
            t["done"] = True
            break
`,
          language: "python",
        },
        {
          name: "main.py",
          content: `from store import add_task, list_tasks, mark_done

add_task("Learn Python")
add_task("Build a game")
print(list_tasks())
`,
          language: "python",
        },
      ],
    },
    {
      id: "api",
      name: "HTTP Server",
      description:
        "A minimal HTTP server that serves JSON. Handler and server entry.",
      files: [
        {
          name: "handler.py",
          content: `def handle_get() -> dict:
    return {"status": "ok", "message": "Hello"}


def handle_post(data: dict) -> dict:
    return {"received": data}
`,
          language: "python",
        },
        {
          name: "server.py",
          content: `from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from handler import handle_get, handle_post


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api":
            body = handle_get()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())

    def do_POST(self):
        if self.path == "/api":
            length = int(self.headers["Content-Length"])
            data = json.loads(self.rfile.read(length))
            body = handle_post(data)
            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())


HTTPServer(("", 8000), Handler).serve_forever()
`,
          language: "python",
        },
      ],
    },
  ],
};

export function getMapFiles(
  language: string,
  mapId: string
): MapFile[] | null {
  const maps = MAPS_BY_LANGUAGE[language] ?? MAPS_BY_LANGUAGE["javascript"];
  const map = maps?.find((m) => m.id === mapId) ?? maps?.[0];
  return map?.files ?? null;
}
