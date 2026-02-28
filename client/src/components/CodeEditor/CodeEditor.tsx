import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useGameStore } from "../../stores/gameStore";
import type { CodeError } from "../../types";
import { ERROR_CATEGORIES_BY_LANGUAGE } from "../../errorCategories";

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
}: CodeEditorProps) {
  const errors = useGameStore((s) => s.errors);
  const highlightErrorsInFile = useGameStore((s) => s.highlightErrorsInFile);
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
    ERROR_CATEGORIES_BY_LANGUAGE.javascript;
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
        onCursorChange(e.position.lineNumber - 1, e.position.column - 1);
      });
      ed.onDidChangeCursorSelection((e) => {
        const sel = e.selection;
        if (sel.startLineNumber !== sel.endLineNumber) {
          onSelectLine(null);
          return;
        }
        const line0 = sel.startLineNumber - 1;
        onSelectLine(line0);
      });
    },
    [onCursorChange, onSelectLine]
  );

  const fileErrors = errors.filter((e) => e.file === fileName);
  const shouldHighlightErrors = highlightErrorsInFile === fileName;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const newDecorations: editor.IModelDeltaDecoration[] =
      shouldHighlightErrors
        ? fileErrors.map((err: CodeError) => ({
            range: {
              startLineNumber: err.range.startLine + 1,
              startColumn: err.range.startColumn + 1,
              endLineNumber: err.range.endLine + 1,
              endColumn: err.range.endColumn + 1,
            },
            options: {
              inlineClassName: "code-error-highlight",
            },
          }))
        : [];
    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      newDecorations
    );
  }, [fileErrors, shouldHighlightErrors]);

  const othersOnThisFile = presences.filter(
    (p) => p.id !== currentPlayerId && p.file === fileName
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const cursorDecorations: editor.IModelDeltaDecoration[] = othersOnThisFile.map(
      (p) => ({
        range: {
          startLineNumber: p.cursor.line + 1,
          startColumn: p.cursor.column + 1,
          endLineNumber: p.cursor.line + 1,
          endColumn: p.cursor.column + 1,
        },
        options: {
          beforeContentInlineClassName: `remote-cursor remote-cursor-${p.id.replace(/[^a-zA-Z0-9]/g, "_")}`,
          stickiness: 1,
        },
      })
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
                  `.remote-cursor-${p.id.replace(/[^a-zA-Z0-9]/g, "_")} { --cursor-color: ${p.color} !important; }`
              )
              .join("\n"),
          }}
        />
      )}
      {lineSelected && (
        <div className="flex items-center gap-3 p-2 bg-gray-800 border-b border-gray-700 shrink-0 flex-wrap">
          <span className="text-sm text-gray-400">
            Line {selectedLine! + 1} — Identify error:
          </span>
          <select
            className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm"
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
              className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm"
              defaultValue=""
              onChange={(e) => {
                const causeValue = e.target.value as CodeError["type"];
                if (causeValue) {
                  const lineErrors = errors.filter(
                    (err: CodeError) =>
                      err.file === fileName &&
                      err.range.startLine <= selectedLine! &&
                      err.range.endLine >= selectedLine!
                  );
                  if (lineErrors.length > 0) {
                    onGuess(lineErrors[0]!.id, causeValue);
                    onSelectLine(null);
                  } else {
                    setNoErrorMessage(true);
                  }
                  setSelectedCategory("");
                }
              }}
            >
              <option value="">Specific cause...</option>
              {activeCategory.causes.map((cause) => (
                <option key={cause.value} value={cause.value}>
                  {cause.label}
                </option>
              ))}
            </select>
          )}
          {noErrorMessage && (
            <span className="text-sm text-amber-400">
              No error on this line. Try another.
            </span>
          )}
        </div>
      )}
      <Editor
        height="100%"
        language={language}
        value={fileContent}
        theme="vs-dark"
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
