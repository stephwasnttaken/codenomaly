// Fallback code templates per language when a map has fewer than 2 files.
// Each file is written to support all error types (semicolon, quotes, typo, bracket, extra_char, wrong_operator, colon, indentation).

export const CODE_TEMPLATES: Record<
  string,
  { name: string; content: string; language: string }[]
> = {
  csharp: [
    { name: "Utils.cs", content: `namespace App;

public static class Utils
{
    public static int Add(int a, int b)
    {
        return a + b;
    }

    public static string Greet(string name)
    {
        return "Hello, " + name;
    }
}
`, language: "csharp" },
    { name: "Program.cs", content: `using App;

class Program
{
    static void Main()
    {
        int x = 10;
        int y = 3;
        Console.WriteLine(Greet("World"));
        Console.WriteLine("Sum: " + Utils.Add(x, y));
    }
}
`, language: "csharp" },
    { name: "Task.cs", content: `namespace Todo;

public class Task
{
    public int Id { get; set; }
    public string Text { get; set; } = "";
    public bool Done { get; set; }
}
`, language: "csharp" },
  ],
  c: [
    { name: "util.c", content: `#include <stdio.h>

int add(int a, int b)
{
    return a + b;
}

void greet(const char* name)
{
    printf("Hello, %s\\n", name);
}
`, language: "c" },
    { name: "main.c", content: `#include <stdio.h>

int main(void)
{
    int x = 10;
    int y = 3;
    greet("World");
    printf("Sum: %d\\n", add(x, y));
    return 0;
}
`, language: "c" },
    { name: "task.c", content: `struct Task
{
    int id;
    char text[64];
    int done;
};

void add_task(struct Task* t, int id, const char* text)
{
    t->id = id;
    snprintf(t->text, 64, "%s", text);
    t->done = 0;
}
`, language: "c" },
  ],
  python: [
    { name: "utils.py", content: `def add(a: int, b: int) -> int:
    return a + b


def greet(name: str) -> str:
    return "Hello, " + name
`, language: "python" },
    { name: "main.py", content: `from utils import add, greet

x = 10
y = 3
print(greet("World"))
print("Sum:", add(x, y))
`, language: "python" },
    { name: "store.py", content: `tasks: list[dict] = []


def add_task(text: str) -> None:
    tasks.append({"id": len(tasks), "text": text, "done": False})
`, language: "python" },
  ],
};
