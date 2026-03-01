import { useMemo, useState, useEffect } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテト";
const COLUMN_COUNT = 28;
const CYCLE_MS = 120;

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const CHARS_ARRAY = Array.from(CHARS);

function generateColumnChars(length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += randomChoice(CHARS_ARRAY);
  }
  return s;
}

export function MatrixBackground() {
  const columns = useMemo(() => {
    return Array.from({ length: COLUMN_COUNT }, (_, i) => ({
      id: i,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 2,
    }));
  }, []);

  const [charGrid, setCharGrid] = useState<string[]>(() =>
    columns.map(() => generateColumnChars(60))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setCharGrid((prev) =>
        prev.map(() => generateColumnChars(60))
      );
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="matrix-bg"
      aria-hidden
    >
      <div className="matrix-bg-mask">
        {columns.map((col, i) => (
          <div
            key={col.id}
            className="matrix-column"
            style={{
              animationDuration: `${col.duration}s`,
              animationDelay: `-${col.delay}s`,
            }}
          >
            {charGrid[i]}
          </div>
        ))}
      </div>
    </div>
  );
}
