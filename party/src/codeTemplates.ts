// Sample code templates per language - server injects errors into these
// At least 20 files per language for variety

export const CODE_TEMPLATES: Record<
  string,
  { name: string; content: string; language: string }[]
> = {
  javascript: [
    { name: "utils.js", content: `function greet(name) {
  return "Hello, " + name;
}

function add(a, b) {
  return a + b;
}

const result = add(5, 3);
console.log(greet("World"));
`, language: "javascript" },
    { name: "main.js", content: `const fs = require("fs");

function readFile(path) {
  return fs.readFileSync(path, "utf8");
}

module.exports = { readFile };
`, language: "javascript" },
    { name: "math.js", content: `function square(x) {
  return x * x;
}

const nums = [1, 2, 3];
const squared = nums.map((n) => square(n));
`, language: "javascript" },
    { name: "strings.js", content: `const greeting = "Hello world";
const name = 'Alice';
const template = \`User: \${name}\`;
`, language: "javascript" },
    { name: "loop.js", content: `for (let i = 0; i < 10; i++) {
  console.log(i * 2);
}

let sum = 0;
while (sum < 100) {
  sum += 10;
}
`, language: "javascript" },
    { name: "object.js", content: `const user = {
  id: 1,
  name: "Bob",
  active: true
};

const key = "name";
const value = user[key];
`, language: "javascript" },
    { name: "array.js", content: `const items = [1, 2, 3];
items.push(4);
const first = items[0];
`, language: "javascript" },
    { name: "promise.js", content: `function fetchData() {
  return fetch("/api/data").then((res) => res.json());
}

const data = await fetchData();
`, language: "javascript" },
    { name: "class.js", content: `class Counter {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count++;
  }
}
`, language: "javascript" },
    { name: "validate.js", content: `function isValid(email) {
  return email.includes("@");
}

const test = "user@test.com";
if (isValid(test)) {
  console.log("Valid");
}
`, language: "javascript" },
    { name: "format.js", content: `function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
`, language: "javascript" },
    { name: "sort.js", content: `const arr = [3, 1, 2];
arr.sort((a, b) => a - b);
const max = Math.max(...arr);
`, language: "javascript" },
    { name: "parse.js", content: `const json = '{"x": 1}';
const obj = JSON.parse(json);
const str = JSON.stringify(obj);
`, language: "javascript" },
    { name: "timer.js", content: `setTimeout(() => {
  console.log("Done");
}, 1000);

const id = setInterval(() => {}, 500);
clearInterval(id);
`, language: "javascript" },
    { name: "regex.js", content: `const pattern = /^[a-z]+$/;
const match = "hello".match(pattern);
const replaced = "a-b-c".replace(/-/g, "_");
`, language: "javascript" },
    { name: "default.js", content: `function log(msg = "default") {
  console.log(msg);
}

log();
log("custom");
`, language: "javascript" },
    { name: "spread.js", content: `const a = [1, 2];
const b = [...a, 3];
const copy = { ...{ x: 1 }, y: 2 };
`, language: "javascript" },
    { name: "destruct.js", content: `const [first, second] = [1, 2, 3];
const { name, id } = { id: 1, name: "x" };
`, language: "javascript" },
    { name: "callback.js", content: `function run(fn) {
  return fn();
}

const result = run(() => 42);
`, language: "javascript" },
    { name: "export.js", content: `export const PI = 3.14;
export function double(n) {
  return n * 2;
}
`, language: "javascript" },
  ],
  typescript: [
    { name: "index.ts", content: `interface User {
  id: number;
  name: string;
}

function getUserId(user: User): number {
  return user.id;
}

const user: User = { id: 1, name: "Alice" };
`, language: "typescript" },
    { name: "types.ts", content: `type ID = string | number;
type Handler = (event: Event) => void;

const id: ID = "abc";
`, language: "typescript" },
    { name: "generic.ts", content: `function identity<T>(x: T): T {
  return x;
}

const num = identity(5);
const str = identity("hi");
`, language: "typescript" },
    { name: "api.ts", content: `async function fetchUser(id: number): Promise<User> {
  const res = await fetch(\`/users/\${id}\`);
  return res.json();
}
`, language: "typescript" },
    { name: "model.ts", content: `interface Product {
  id: number;
  name: string;
  price: number;
}

const p: Product = { id: 1, name: "Widget", price: 9.99 };
`, language: "typescript" },
    { name: "guard.ts", content: `function isString(x: unknown): x is string {
  return typeof x === "string";
}

if (isString(value)) {
  console.log(value.length);
}
`, language: "typescript" },
    { name: "enum.ts", content: `enum Status {
  Pending,
  Done,
  Failed
}

const s: Status = Status.Pending;
`, language: "typescript" },
    { name: "optional.ts", content: `interface Config {
  host?: string;
  port?: number;
}

const cfg: Config = { host: "localhost" };
const port = cfg.port ?? 3000;
`, language: "typescript" },
    { name: "array.ts", content: `const nums: number[] = [1, 2, 3];
const matrix: number[][] = [[1], [2]];
`, language: "typescript" },
    { name: "tuple.ts", content: `const pair: [string, number] = ["x", 1];
const [k, v] = pair;
`, language: "typescript" },
    { name: "class.ts", content: `class Point {
  constructor(public x: number, public y: number) {}

  distance(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}
`, language: "typescript" },
    { name: "extends.ts", content: `interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}
`, language: "typescript" },
    { name: "union.ts", content: `type Result = { ok: true; data: string } | { ok: false; error: string };

function handle(r: Result) {
  if (r.ok) return r.data;
  return r.error;
}
`, language: "typescript" },
    { name: "readonly.ts", content: `interface State {
  readonly count: number;
}

const state: State = { count: 0 };
`, language: "typescript" },
    { name: "partial.ts", content: `type PartialUser = Partial<{ id: number; name: string }>;
const u: PartialUser = { name: "x" };
`, language: "typescript" },
    { name: "pick.ts", content: `type IdName = Pick<User, "id" | "name">;
const item: IdName = { id: 1, name: "y" };
`, language: "typescript" },
    { name: "event.ts", content: `type Listener = (data: unknown) => void;
const listeners: Listener[] = [];
listeners.push((d) => console.log(d));
`, language: "typescript" },
    { name: "util.ts", content: `export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
`, language: "typescript" },
    { name: "assert.ts", content: `function assert(cond: boolean): asserts cond {
  if (!cond) throw new Error("Assert failed");
}
assert(value !== null);
`, language: "typescript" },
    { name: "import.ts", content: `import { readFile } from "fs/promises";
const data = await readFile("file.txt", "utf-8");
`, language: "typescript" },
  ],
  python: [
    { name: "main.py", content: `def add_numbers(a, b):
    return a + b

result = add_numbers(10, 20)
print(f"Result: {result}")
`, language: "python" },
    { name: "hello.py", content: `def greet(name):
    return "Hello, " + name

msg = greet("World")
print(msg)
`, language: "python" },
    { name: "list_ops.py", content: `items = [1, 2, 3]
items.append(4)
first = items[0]
`, language: "python" },
    { name: "dict_ops.py", content: `data = {"a": 1, "b": 2}
data["c"] = 3
value = data.get("a")
`, language: "python" },
    { name: "loop.py", content: `for i in range(10):
    print(i * 2)

total = 0
while total < 100:
    total += 10
`, language: "python" },
    { name: "condition.py", content: `x = 5
if x > 0:
    print("positive")
elif x < 0:
    print("negative")
else:
    print("zero")
`, language: "python" },
    { name: "string_fmt.py", content: `name = "Alice"
greeting = f"Hello, {name}"
path = 'data/file.txt'
`, language: "python" },
    { name: "function.py", content: `def square(n):
    return n * n

def default_arg(x=10):
    return x
`, language: "python" },
    { name: "class_def.py", content: `class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
`, language: "python" },
    { name: "imports.py", content: `import os
from pathlib import Path

p = Path(".")
files = list(p.iterdir())
`, language: "python" },
    { name: "try_except.py", content: `try:
    result = int("42")
except ValueError:
    result = 0
`, language: "python" },
    { name: "comprehension.py", content: `squares = [x * x for x in range(5)]
evens = [n for n in nums if n % 2 == 0]
`, language: "python" },
    { name: "lambda.py", content: `add = lambda a, b: a + b
sorted_items = sorted(items, key=lambda x: x[1])
`, language: "python" },
    { name: "slice.py", content: `text = "hello world"
sub = text[0:5]
rev = text[::-1]
`, language: "python" },
    { name: "file_io.py", content: `with open("data.txt") as f:
    content = f.read()

lines = content.split("\n")
`, language: "python" },
    { name: "enum.py", content: `from enum import Enum

class State(Enum):
    IDLE = 0
    RUNNING = 1
`, language: "python" },
    { name: "type_hint.py", content: `def add(a: int, b: int) -> int:
    return a + b

items: list[str] = []
`, language: "python" },
    { name: "decorator.py", content: `def trace(f):
    def wrapper(*args, **kwargs):
        return f(*args, **kwargs)
    return wrapper

@trace
def foo():
    pass
`, language: "python" },
    { name: "generator.py", content: `def count_up(n):
    for i in range(n):
        yield i

for x in count_up(5):
    print(x)
`, language: "python" },
    { name: "context.py", content: `from contextlib import contextmanager

@contextmanager
def managed():
    yield None
`, language: "python" },
  ],
};
