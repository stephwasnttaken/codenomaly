/**
 * Professional error categories and causes, language-specific.
 * Maps display labels to internal server error types.
 */
import type { ErrorType } from "./types";

export interface ErrorCause {
  value: ErrorType;
  label: string;
}

export interface ErrorCategory {
  value: string;
  label: string;
  causes: ErrorCause[];
}

// Internal type -> causes, used to look up which category/cause to pre-select (if we ever need it)
export const ERROR_CATEGORIES_BY_LANGUAGE: Record<
  string,
  ErrorCategory[]
> = {
  python: [
    {
      value: "SyntaxError",
      label: "SyntaxError",
      causes: [
        {
          value: "missing_colon",
          label: "Missing colon after compound statement",
        },
        {
          value: "wrong_quotes",
          label: "Unclosed or mismatched string delimiter",
        },
        {
          value: "wrong_indentation",
          label: "Invalid indentation",
        },
        {
          value: "wrong_bracket",
          label: "Mismatched brackets or parentheses",
        },
        {
          value: "extra_char",
          label: "Unexpected character",
        },
      ],
    },
    {
      value: "NameError",
      label: "NameError",
      causes: [
        {
          value: "typo",
          label: "Misspelled keyword or identifier",
        },
      ],
    },
    {
      value: "TypeError",
      label: "TypeError",
      causes: [
        {
          value: "wrong_operator",
          label: "Incorrect operator or comparison",
        },
      ],
    },
  ],
  javascript: [
    {
      value: "SyntaxError",
      label: "SyntaxError",
      causes: [
        {
          value: "missing_semicolon",
          label: "Missing semicolon",
        },
        {
          value: "wrong_quotes",
          label: "Unclosed or mismatched string delimiter",
        },
        {
          value: "wrong_bracket",
          label: "Mismatched brackets or parentheses",
        },
        {
          value: "extra_char",
          label: "Unexpected token",
        },
      ],
    },
    {
      value: "ReferenceError",
      label: "ReferenceError",
      causes: [
        {
          value: "typo",
          label: "Misspelled keyword or identifier",
        },
      ],
    },
    {
      value: "TypeError",
      label: "TypeError",
      causes: [
        {
          value: "wrong_operator",
          label: "Incorrect comparison or operator",
        },
      ],
    },
  ],
  typescript: [
    {
      value: "SyntaxError",
      label: "SyntaxError",
      causes: [
        {
          value: "missing_semicolon",
          label: "Missing semicolon",
        },
        {
          value: "wrong_quotes",
          label: "Unclosed or mismatched string delimiter",
        },
        {
          value: "wrong_bracket",
          label: "Mismatched brackets or parentheses",
        },
        {
          value: "extra_char",
          label: "Unexpected token",
        },
      ],
    },
    {
      value: "ReferenceError",
      label: "ReferenceError",
      causes: [
        {
          value: "typo",
          label: "Misspelled keyword or identifier",
        },
      ],
    },
    {
      value: "TypeError",
      label: "TypeError",
      causes: [
        {
          value: "wrong_operator",
          label: "Incorrect comparison or operator",
        },
      ],
    },
  ],
};
