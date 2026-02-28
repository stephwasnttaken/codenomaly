// Sample code templates per language - server injects errors into these

export const CODE_TEMPLATES: Record<
  string,
  { name: string; content: string; language: string }[]
> = {
  javascript: [
    {
      name: "utils.js",
      content: `function greet(name) {
  return "Hello, " + name;
}

function add(a, b) {
  return a + b;
}

const result = add(5, 3);
console.log(greet("World"));
`,
      language: "javascript",
    },
    {
      name: "main.js",
      content: `const fs = require("fs");

function readFile(path) {
  return fs.readFileSync(path, "utf8");
}

module.exports = { readFile };
`,
      language: "javascript",
    },
  ],
  typescript: [
    {
      name: "index.ts",
      content: `interface User {
  id: number;
  name: string;
}

function getUserId(user: User): number {
  return user.id;
}

const user: User = { id: 1, name: "Alice" };
`,
      language: "typescript",
    },
  ],
  python: [
    {
      name: "main.py",
      content: `def add_numbers(a, b):
    return a + b

result = add_numbers(10, 20)
print(f"Result: {result}")
`,
      language: "python",
    },
  ],
};
