import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useGameStore } from "../../stores/gameStore";
import type { CodeError } from "../../types";
import { ERROR_CATEGORIES_BY_LANGUAGE } from "../../errorCategories";

const CODENOMALY_THEME = "codenomaly";

function defineCodenomalyTheme(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme(CODENOMALY_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#ffffff",
      "editor.lineHighlightBackground": "#0a0a0a",
      "editorLineNumber.foreground": "#6b6b6b",
      "editorLineNumber.activeForeground": "#b22222",
      "editorCursor.foreground": "#b22222",
      "editor.selectionBackground": "#8b000040",
      "editor.inactiveSelectionBackground": "#8b000020",
    },
  });
}

interface CodeEditorProps {
  fileContent: string;
  language: string;
  fileName: string;
  onCursorChange: (line: number, column: number) => void;
  onSelectLine: (line: number | null) => void;
  selectedLine: number | null;
  onGuess: (errorId: string, type: CodeError["type"]) => void;
  presences?: Array<{ id: string; name: string; file: string; cursor: { line: number; column: number }; color: string }>;
  currentPlayerId?: string | null;
  disabled?: boolean;
}

export function CodeEditor({
  fileContent,
  language,
  fileName,
  onCursorChange,
  onSelectLine,
  selectedLine,
  onGuess,
  presences = [],
  currentPlayerId,
  disabled = false,
}: CodeEditorProps) {
  const errors = useGameStore((s) => s.errors);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const cursorDecorationIdsRef = useRef<string[]>([]);
  const errorsRef = useRef(errors);
  const fileNameRef = useRef(fileName);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [noErrorMessage, setNoErrorMessage] = useState(false);
  errorsRef.current = errors;
  fileNameRef.current = fileName;

  const categories =
    ERROR_CATEGORIES_BY_LANGUAGE[language] ??
    ERROR_CATEGORIES_BY_LANGUAGE.csharp;
  const activeCategory = categories.find((c) => c.value === selectedCategory);

  const lineSelected = selectedLine !== null;

  useEffect(() => {
    setSelectedCategory("");
  }, [selectedLine]);

  useEffect(() => {
    if (!noErrorMessage) return;
    const t = setTimeout(() => setNoErrorMessage(false), 2000);
    return () => clearTimeout(t);
  }, [noErrorMessage]);

  const handleEditorMount = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      editorRef.current = ed;
      ed.onDidChangeCursorPosition((e) => {
        try {
          const pos = e?.position;
          if (pos && Number.isFinite(pos.lineNumber) && Number.isFinite(pos.column)) {
            onCursorChange(pos.lineNumber - 1, pos.column - 1);
          }
        } catch (err) {
          console.error("onCursorChange error:", err);
        }
      });
      ed.onDidChangeCursorSelection((e) => {
        try {
          const sel = e?.selection;
          if (!sel || !Number.isFinite(sel.startLineNumber) || !Number.isFinite(sel.endLineNumber)) {
            return;
          }
          if (sel.startLineNumber !== sel.endLineNumber) {
            onSelectLine(null);
            return;
          }
          const line0 = sel.startLineNumber - 1;
          onSelectLine(line0);
        } catch (err) {
          console.error("onSelectLine error:", err);
        }
      });
    },
    [onCursorChange, onSelectLine]
  );

  const safeErrors = Array.isArray(errors) ? errors : [];
  const fileErrors = safeErrors.filter(
    (e) => e && typeof e.file === "string" && e.file === fileName && e.range
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const newDecorations: editor.IModelDeltaDecoration[] = fileErrors.map(
      (err: CodeError) => {
        const r = err.range;
        const sl = Number.isFinite(r?.startLine) ? r.startLine + 1 : 1;
        const sc = Number.isFinite(r?.startColumn) ? r.startColumn + 1 : 1;
        const el = Number.isFinite(r?.endLine) ? r.endLine + 1 : 1;
        const ec = Number.isFinite(r?.endColumn) ? r.endColumn + 1 : 1;
        return {
          range: {
            startLineNumber: sl,
            startColumn: sc,
            endLineNumber: el,
            endColumn: ec,
          },
          options: {
            inlineClassName: "code-error-highlight",
          },
        };
      }
    );
    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      newDecorations
    );
  }, [fileErrors]);

  const presenceList = Array.isArray(presences) ? presences : [];
  const othersOnThisFile = presenceList.filter(
    (p) => p && p.id !== currentPlayerId && p.file === fileName && p.cursor
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const cursorDecorations: editor.IModelDeltaDecoration[] = othersOnThisFile.map(
      (p) => {
        const line = Number.isFinite(p.cursor?.line) ? p.cursor.line + 1 : 1;
        const col = Number.isFinite(p.cursor?.column) ? p.cursor.column + 1 : 1;
        return {
          range: {
            startLineNumber: line,
            startColumn: col,
            endLineNumber: line,
            endColumn: col,
          },
          options: {
            beforeContentInlineClassName: `remote-cursor remote-cursor-${String(p.id || "").replace(/[^a-zA-Z0-9]/g, "_")}`,
            stickiness: 1,
          },
        };
      }
    );
    cursorDecorationIdsRef.current = editor.deltaDecorations(
      cursorDecorationIdsRef.current,
      cursorDecorations
    );
  }, [othersOnThisFile, fileName]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <style>{`
        .code-error-highlight {
          background-color: rgba(239, 68, 68, 0.25);
          border-bottom: 2px wavy rgb(239, 68, 68);
        }
        .remote-cursor {
          width: 2px !important;
          min-width: 2px !important;
          height: 1.2em !important;
          background-color: var(--cursor-color) !important;
          margin-right: -2px;
          display: inline-block;
          vertical-align: text-bottom;
          pointer-events: none;
        }
      `}</style>
      {othersOnThisFile.length > 0 && (
        <style
          dangerouslySetInnerHTML={{
            __html: othersOnThisFile
              .map(
                (p) =>
                  `.remote-cursor-${String(p?.id ?? "").replace(/[^a-zA-Z0-9]/g, "_")} { --cursor-color: ${p?.color ?? "#888"} !important; }`
              )
              .join("\n"),
          }}
        />
      )}
      {lineSelected && !disabled && (
        <div className="flex items-center gap-3 p-2 bg-[var(--color-surface)] border-b border-white/20 shrink-0 flex-wrap">
          <span className="text-sm text-white/80">
            Line {(selectedLine != null && Number.isFinite(selectedLine) ? selectedLine : 0) + 1} — Identify error:
          </span>
          <select
            className="bg-black text-white border border-white/20 px-3 py-1.5 rounded text-sm focus:outline-none focus:border-[var(--color-accent-red)]"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
            }}
          >
            <option value="">Error type...</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {activeCategory && (
            <select
              className="bg-black text-white border border-white/20 px-3 py-1.5 rounded text-sm focus:outline-none focus:border-[var(--color-accent-red)]"
              defaultValue=""
              onChange={(e) => {
                const causeValue = e.target.value as CodeError["type"];
                if (causeValue) {
                  const lineErrors = safeErrors.filter(
                    (err: CodeError) => {
                      const r = err?.range;
                      if (!r || selectedLine == null) return false;
                      const sl = Number.isFinite(r.startLine) ? r.startLine : 0;
                      const el = Number.isFinite(r.endLine) ? r.endLine : 0;
                      return err.file === fileName && sl <= selectedLine && el >= selectedLine;
                    }
                  );
                  const first = lineErrors.find((e) => e.type === causeValue) ?? lineErrors[0];
                  if (first?.id) {
                    onGuess(first.id, causeValue);
                    onSelectLine(null);
                  } else {
                    setNoErrorMessage(true);
                  }
                  setSelectedCategory("");
                }
              }}
            >
              <option value="">Specific cause...</option>
              {(activeCategory.causes ?? []).map((cause) => (
                <option key={cause.value} value={cause.value}>
                  {cause.label}
                </option>
              ))}
            </select>
          )}
          {noErrorMessage && (
            <span className="text-sm text-[var(--color-accent-red-bright)]">
              No error on this line. Try another.
            </span>
          )}
        </div>
      )}
      <Editor
        height="100%"
        language={language}
        value={fileContent}
        theme={CODENOMALY_THEME}
        beforeMount={defineCodenomalyTheme}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
        }}
        onMount={handleEditorMount}
        loading={<div className="p-4 text-gray-400">Loading editor...</div>}
      />
    </div>
  );
}
