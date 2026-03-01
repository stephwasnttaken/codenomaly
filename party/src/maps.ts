/**
 * Maps per language. Each map is a small application (2-4 files).
 * Files are written to support every error type: semicolon, quotes, typo,
 * bracket, extra_char, wrong_operator, missing_colon, wrong_indentation (Python).
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
  csharp: [
    {
      id: "calculator",
      name: "Calculator",
      description: "A simple calculator with basic operations (add, subtract, multiply, divide). Math helper and main entry.",
      files: [
        {
          name: "MathOps.cs",
          content: `namespace Calculator;

public static class MathOps
{
    public static int Add(int a, int b)
    {
        return a + b;
    }

    public static int Subtract(int a, int b)
    {
        return a - b;
    }

    public static int Multiply(int a, int b)
    {
        return a * b;
    }

    public static int Divide(int a, int b)
    {
        if (b == 0) throw new ArgumentException("Divide by zero");
        return a / b;
    }
}
`,
          language: "csharp",
        },
        {
          name: "Program.cs",
          content: `using Calculator;

class Program
{
    static void Main(string[] args)
    {
        int x = 10;
        int y = 3;
        Console.WriteLine("Sum: " + MathOps.Add(x, y));
        Console.WriteLine("Diff: " + MathOps.Subtract(x, y));
        Console.WriteLine("Product: " + MathOps.Multiply(x, y));
        Console.WriteLine("Quotient: " + MathOps.Divide(x, y));
    }
}
`,
          language: "csharp",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo List",
      description: "A small in-memory todo list. Task model, store, and console runner.",
      files: [
        {
          name: "Task.cs",
          content: `namespace Todo;

public class Task
{
    public int Id { get; set; }
    public string Text { get; set; } = "";
    public bool Done { get; set; }

    public override string ToString()
    {
        return (Done ? "[x]" : "[ ]") + " " + Text;
    }
}
`,
          language: "csharp",
        },
        {
          name: "Store.cs",
          content: `namespace Todo;

public class Store
{
    private readonly List<Task> _tasks = new();
    private int _nextId = 1;

    public void Add(string text)
    {
        _tasks.Add(new Task { Id = _nextId++, Text = text, Done = false });
    }

    public IEnumerable<Task> All() => _tasks;

    public void Toggle(int id)
    {
        var t = _tasks.FirstOrDefault(x => x.Id == id);
        if (t != null) t.Done = !t.Done;
    }
}
`,
          language: "csharp",
        },
        {
          name: "Program.cs",
          content: `using Todo;

class Program
{
    static void Main()
    {
        var store = new Store();
        store.Add("Learn C#");
        store.Add("Build app");
        foreach (var t in store.All())
            Console.WriteLine(t.ToString());
    }
}
`,
          language: "csharp",
        },
      ],
    },
    {
      id: "api",
      name: "REST API",
      description: "A minimal REST API with in-memory storage. Model, controller, and startup.",
      files: [
        {
          name: "Item.cs",
          content: `namespace Api;

public class Item
{
    public string Id { get; set; } = "";
    public string Value { get; set; } = "";
}
`,
          language: "csharp",
        },
        {
          name: "ItemsController.cs",
          content: `using Microsoft.AspNetCore.Mvc;

namespace Api;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private static readonly Dictionary<string, string> _data = new();

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        if (!_data.ContainsKey(id)) return NotFound();
        return Ok(new { id, value = _data[id] });
    }

    [HttpPost]
    public IActionResult Post([FromBody] Item item)
    {
        _data[item.Id] = item.Value;
        return CreatedAtAction(nameof(Get), new { item.Id });
    }
}
`,
          language: "csharp",
        },
      ],
    },
    {
      id: "game",
      name: "Number Game",
      description: "A small guess-the-number game. Game logic and main loop.",
      files: [
        {
          name: "Game.cs",
          content: `namespace Game;

public class NumberGame
{
    private readonly int _secret;
    private readonly Random _rng = new();

    public NumberGame(int min, int max)
    {
        _secret = _rng.Next(min, max + 1);
    }

    public bool Guess(int n)
    {
        if (n == _secret) return true;
        return false;
    }

    public string Hint(int n)
    {
        switch (n.CompareTo(_secret))
        {
            case -1: return "Higher";
            case 1: return "Lower";
            default: return "Correct!";
        }
    }
}
`,
          language: "csharp",
        },
        {
          name: "Program.cs",
          content: `using Game;

class Program
{
    static void Main()
    {
        var game = new NumberGame(1, 100);
        int tries = 0;
        while (true)
        {
            var input = Console.ReadLine();
            if (int.TryParse(input, out int guess))
            {
                tries++;
                if (game.Guess(guess)) break;
                Console.WriteLine(game.Hint(guess));
            }
        }
        Console.WriteLine("Won in " + tries + " tries");
    }
}
`,
          language: "csharp",
        },
      ],
    },
  ],
  c: [
    {
      id: "calculator",
      name: "Calculator",
      description: "A simple calculator with basic operations. Math functions and main.",
      files: [
        {
          name: "math.c",
          content: `#include "math.h"

int add(int a, int b)
{
    return a + b;
}

int subtract(int a, int b)
{
    return a - b;
}

int multiply(int a, int b)
{
    return a * b;
}

int divide(int a, int b)
{
    if (b == 0) return 0;
    return a / b;
}
`,
          language: "c",
        },
        {
          name: "main.c",
          content: `#include <stdio.h>
#include "math.h"

int main(void)
{
    int x = 10;
    int y = 3;
    printf("Sum: %d\\n", add(x, y));
    printf("Diff: %d\\n", subtract(x, y));
    printf("Product: %d\\n", multiply(x, y));
    printf("Quotient: %d\\n", divide(x, y));
    return 0;
}
`,
          language: "c",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo List",
      description: "A small CLI todo list. Task array and main loop.",
      files: [
        {
          name: "todo.c",
          content: `#include <stdio.h>
#include <string.h>

#define MAX_TASKS 64
#define MAX_LEN 128

struct Task
{
    int id;
    char text[MAX_LEN];
    int done;
};

static struct Task tasks[MAX_TASKS];
static int count = 0;

void add_task(const char* text)
{
    if (count >= MAX_TASKS) return;
    tasks[count].id = count + 1;
    strncpy(tasks[count].text, text, MAX_LEN - 1);
    tasks[count].done = 0;
    count++;
}

void list_tasks(void)
{
    for (int i = 0; i < count; i++)
    {
        printf("%s %s\\n", tasks[i].done ? "[x]" : "[ ]", tasks[i].text);
    }
}

void toggle(int id)
{
    for (int i = 0; i < count; i++)
    {
        if (tasks[i].id == id) { tasks[i].done = !tasks[i].done; return; }
    }
}
`,
          language: "c",
        },
        {
          name: "main.c",
          content: `#include <stdio.h>

int main(void)
{
    add_task("Learn C");
    add_task("Build app");
    list_tasks();
    return 0;
}
`,
          language: "c",
        },
      ],
    },
    {
      id: "api",
      name: "HTTP Server",
      description: "A minimal HTTP server. Request parsing and response helpers.",
      files: [
        {
          name: "server.c",
          content: `#include <stdio.h>
#include <string.h>

#define BUF_SIZE 1024

void handle_get(int fd)
{
    const char* body = "{\\"status\\":\\"ok\\"}";
    char header[256];
    snprintf(header, sizeof(header), "HTTP/1.0 200 OK\\r\\nContent-Length: %zu\\r\\n\\r\\n", strlen(body));
    write(fd, header, strlen(header));
    write(fd, body, strlen(body));
}

void handle_post(int fd, const char* data)
{
    if (data == NULL) return;
    char resp[BUF_SIZE];
    snprintf(resp, sizeof(resp), "{\\"received\\":\\"%s\\"}", data);
    printf("POST: %s\\n", data);
    write(fd, "HTTP/1.0 201 Created\\r\\n\\r\\n", 26);
    write(fd, resp, strlen(resp));
}
`,
          language: "c",
        },
        {
          name: "main.c",
          content: `#include <sys/socket.h>
#include <netinet/in.h>

int main(void)
{
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = { 0 };
    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
    listen(server_fd, 5);
    while (1) { /* accept and dispatch */ }
    return 0;
}
`,
          language: "c",
        },
      ],
    },
    {
      id: "game",
      name: "Number Game",
      description: "A guess-the-number game. RNG and main loop.",
      files: [
        {
          name: "game.c",
          content: `#include <stdlib.h>
#include <time.h>

static int secret = 0;

void game_init(int min, int max)
{
    srand((unsigned)time(NULL));
    secret = min + rand() % (max - min + 1);
}

int game_guess(int n)
{
    if (n == secret) return 1;
    return 0;
}

int game_hint(int n)
{
    if (n < secret) return 1;
    if (n > secret) return -1;
    return 0;
}
`,
          language: "c",
        },
        {
          name: "main.c",
          content: `#include <stdio.h>
#include "game.c"

int main(void)
{
    int guess, result;
    game_init(1, 100);
    while (1)
    {
        scanf("%d", &guess);
        result = game_guess(guess);
        if (result) break;
        int h = game_hint(guess);
        printf("%s\\n", h == 1 ? "Higher" : "Lower");
    }
    printf("Correct!\\n");
    return 0;
}
`,
          language: "c",
        },
      ],
    },
  ],
  python: [
    {
      id: "calculator",
      name: "Calculator",
      description: "A simple calculator with basic operations. Math module and main script.",
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
    if b == 0:
        raise ValueError("Divide by zero")
    return a / b
`,
          language: "python",
        },
        {
          name: "main.py",
          content: `from math_ops import add, subtract, multiply, divide

x = 10
y = 3
print("Sum:", add(x, y))
print("Diff:", subtract(x, y))
print("Product:", multiply(x, y))
print("Quotient:", divide(x, y))
`,
          language: "python",
        },
      ],
    },
    {
      id: "todo",
      name: "Todo List",
      description: "A command-line todo list. Store, render, and main.",
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
add_task("Build app")
for t in list_tasks():
    status = "[x]" if t["done"] else "[ ]"
    print(f"{status} {t['text']}")
`,
          language: "python",
        },
      ],
    },
    {
      id: "api",
      name: "HTTP Server",
      description: "A minimal HTTP server that serves JSON. Handler and server entry.",
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
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())


HTTPServer(("", 8000), Handler).serve_forever()
`,
          language: "python",
        },
      ],
    },
    {
      id: "game",
      name: "Number Game",
      description: "A guess-the-number game. Game logic and main loop.",
      files: [
        {
          name: "game.py",
          content: `import random


def new_game(low: int, high: int) -> int:
    return random.randint(low, high)


def check_guess(secret: int, guess: int) -> int:
    if guess == secret:
        return 0
    if guess < secret:
        return 1
    return -1
`,
          language: "python",
        },
        {
          name: "main.py",
          content: `from game import new_game, check_guess

secret = new_game(1, 100)
while True:
    try:
        guess = int(input("Guess: "))
    except ValueError:
        continue
    result = check_guess(secret, guess)
    if result == 0:
        print("Correct!")
        break
    print("Higher" if result == 1 else "Lower")
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
  const maps = MAPS_BY_LANGUAGE[language] ?? MAPS_BY_LANGUAGE["csharp"];
  const map = maps?.find((m) => m.id === mapId) ?? maps?.[0];
  return map?.files ?? null;
}
