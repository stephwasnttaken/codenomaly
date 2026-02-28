// Error applicators: (code, range) => modified code
// Each returns code with the error applied at the given range

export type ErrorType =
  | "missing_semicolon"
  | "wrong_quotes"
  | "typo"
  | "wrong_bracket"
  | "extra_char"
  | "wrong_operator"
  | "missing_colon"
  | "wrong_indentation";

interface Range {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export const ERROR_TYPES: ErrorType[] = [
  "missing_semicolon",
  "wrong_quotes",
  "typo",
  "wrong_bracket",
  "extra_char",
  "wrong_operator",
  "missing_colon",
  "wrong_indentation",
];

export function applyError(
  type: ErrorType,
  code: string,
  range: Range,
  originalText: string
): string {
  const lines = code.split("\n");

  switch (type) {
    case "missing_semicolon": {
      // Remove semicolon
      if (originalText.includes(";")) {
        return replaceInRange(code, range, originalText.replace(";", ""));
      }
      return code;
    }
    case "wrong_quotes": {
      // Swap single and double quotes
      let swapped = originalText.replace(/"/g, "'").replace(/'/g, '"');
      if (swapped === originalText) {
        swapped = originalText.replace(/'/g, '"');
      }
      return replaceInRange(code, range, swapped);
    }
    case "typo": {
      // Introduce a typo in a common word
      const typoMap: Record<string, string> = {
        return: "retrun",
        function: "functoin",
        const: "cosnt",
        let: "elt",
        var: "avr",
      };
      const lower = originalText.toLowerCase();
      for (const [correct, typo] of Object.entries(typoMap)) {
        if (lower.includes(correct)) {
          const idx = lower.indexOf(correct);
          const before = originalText.slice(0, idx);
          const match = originalText.slice(idx, idx + correct.length);
          const after = originalText.slice(idx + correct.length);
          const newText = before + typo + after;
          return replaceInRange(code, range, newText);
        }
      }
      return code;
    }
    case "wrong_bracket": {
      // Swap ( and ) or { and }
      const swapped = originalText
        .replace(/\(/g, "\x00")
        .replace(/\)/g, "(")
        .replace(/\x00/g, ")");
      return replaceInRange(code, range, swapped);
    }
    case "extra_char": {
      // Add stray character
      return replaceInRange(code, range, originalText + "x");
    }
    case "wrong_operator": {
      // Swap == with = or + with -
      const swapped = originalText
        .replace(/===/g, "==")
        .replace(/==/g, "=")
        .replace(/\+/g, "-");
      return replaceInRange(code, range, swapped);
    }
    case "missing_colon": {
      if (originalText.includes(":")) {
        return replaceInRange(code, range, originalText.replace(":", ""));
      }
      return code;
    }
    case "wrong_indentation": {
      const spaces = originalText;
      if (spaces.length >= 2) {
        return replaceInRange(code, range, spaces.slice(0, -2));
      }
      if (spaces.length >= 1) {
        return replaceInRange(code, range, "");
      }
      return code;
    }
    default:
      return code;
  }
}

function replaceInRange(
  code: string,
  range: Range,
  newText: string
): string {
  const lines = code.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (i < range.startLine) {
      result.push(lines[i]!);
    } else if (i > range.endLine) {
      result.push(lines[i]!);
    } else if (i === range.startLine && i === range.endLine) {
      const line = lines[i] ?? "";
      result.push(
        line.slice(0, range.startColumn) + newText + line.slice(range.endColumn)
      );
    } else {
      result.push(lines[i]!);
    }
  }
  return result.join("\n");
}

// Language-specific keyword maps for typo errors
const TYPO_KEYWORDS_BY_LANG: Record<string, string[]> = {
  javascript: ["return", "function", "const", "let", "var"],
  typescript: ["return", "function", "const", "let", "var", "interface"],
  python: ["return", "def", "if", "else", "elif", "for", "while", "class"],
};

// Find insertion points for errors (language-specific)
export function findInsertionPoints(
  code: string,
  language: string
): Array<{ range: Range; originalText: string; allowedTypes: ErrorType[] }> {
  const points: Array<{
    range: Range;
    originalText: string;
    allowedTypes: ErrorType[];
  }> = [];
  const lines = code.split("\n");

  const isJsLike = language === "javascript" || language === "typescript";
  const isPython = language === "python";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim().length === 0) continue;

    // Semicolon removal (JS/TS only)
    if (isJsLike && line.trimEnd().endsWith(";")) {
      const startCol = line.length - 1;
      points.push({
        range: {
          startLine: i,
          startColumn: startCol,
          endLine: i,
          endColumn: line.length,
        },
        originalText: ";",
        allowedTypes: ["missing_semicolon"],
      });
    }

    // Missing colon (Python only) - after def, if, else, elif, for, while, class
    if (isPython) {
      const colonMatch = line.match(/\b(def|if|else|elif|for|while|class)\s*:\s*/);
      if (colonMatch) {
        const colonIdx = line.indexOf(":", line.indexOf(colonMatch[1]!));
        if (colonIdx >= 0) {
          points.push({
            range: {
              startLine: i,
              startColumn: colonIdx,
              endLine: i,
              endColumn: colonIdx + 1,
            },
            originalText: ":",
            allowedTypes: ["missing_colon"],
          });
        }
      }
    }

    // Wrong indentation (Python only)
    if (isPython) {
      const indentMatch = line.match(/^( +)/);
      if (indentMatch && indentMatch[1].length >= 2) {
        const spaces = indentMatch[1];
        points.push({
          range: {
            startLine: i,
            startColumn: 0,
            endLine: i,
            endColumn: spaces.length,
          },
          originalText: spaces,
          allowedTypes: ["wrong_indentation"],
        });
      }
    }

    // Quotes (all languages)
    const quoteMatch = line.match(/["']([^"']*)["']/);
    if (quoteMatch) {
      const start = line.indexOf(quoteMatch[0]);
      points.push({
        range: {
          startLine: i,
          startColumn: start,
          endLine: i,
          endColumn: start + quoteMatch[0].length,
        },
        originalText: quoteMatch[0],
        allowedTypes: ["wrong_quotes"],
      });
    }

    // Keywords for typo (language-specific)
    const keywords = TYPO_KEYWORDS_BY_LANG[language] ?? TYPO_KEYWORDS_BY_LANG.javascript;
    const kwPattern = new RegExp(`\\b(${keywords.join("|")})\\b`);
    const kwMatch = line.match(kwPattern);
    if (kwMatch) {
      const start = line.indexOf(kwMatch[0]);
      points.push({
        range: {
          startLine: i,
          startColumn: start,
          endLine: i,
          endColumn: start + kwMatch[0].length,
        },
        originalText: kwMatch[0],
        allowedTypes: ["typo"],
      });
    }

    // Brackets (JS/TS - Python too for parens)
    const parenMatch = line.match(/[()]/);
    if (parenMatch) {
      const start = line.indexOf(parenMatch[0]);
      points.push({
        range: {
          startLine: i,
          startColumn: start,
          endLine: i,
          endColumn: start + 1,
        },
        originalText: parenMatch[0],
        allowedTypes: ["wrong_bracket"],
      });
    }

    // Wrong operator (JS/TS - Python has == too)
    if ((isJsLike || isPython) && /[=+\-]/.test(line)) {
      const opMatch = line.match(/===|==|=|\+|-/);
      if (opMatch) {
        const start = line.indexOf(opMatch[0]);
        points.push({
          range: {
            startLine: i,
            startColumn: start,
            endLine: i,
            endColumn: start + opMatch[0].length,
          },
          originalText: opMatch[0],
          allowedTypes: ["wrong_operator"],
        });
      }
    }

    // Extra char (all languages)
    const wordMatch = line.match(/\b\w+\b/);
    if (wordMatch) {
      const start = line.indexOf(wordMatch[0]);
      points.push({
        range: {
          startLine: i,
          startColumn: start,
          endLine: i,
          endColumn: start + wordMatch[0].length,
        },
        originalText: wordMatch[0],
        allowedTypes: ["extra_char"],
      });
    }
  }

  return points;
}
