"use client";

import React from "react";

// ── Token types ──────────────────────────────────────────────────
type TT =
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "type"
  | "function"
  | "operator"
  | "preprocessor"
  | "plain";

interface Token {
  t: TT;
  v: string;
}

// ── GitHub dark theme colors ──────────────────────────────────────
const COLOR: Record<TT, string> = {
  comment:      "#8b949e",
  string:       "#a5d6ff",
  number:       "#79c0ff",
  keyword:      "#ff7b72",
  type:         "#ffa657",
  function:     "#d2a8ff",
  operator:     "#ff7b72",
  preprocessor: "#f0883e",
  plain:        "#e6edf3",
};

// ── Ordered tokenizer rules ───────────────────────────────────────
// Each rule is [regex, tokenType]. First match wins.
// All regexes must start with ^ and be non-global.
const RULES: [RegExp, TT][] = [
  // Block comments
  [/^\/\*[\s\S]*?\*\//, "comment"],
  // C++/Java/JS line comments
  [/^\/\/[^\r\n]*/, "comment"],
  // C preprocessor directives (before # Python comment rule)
  [/^#\s*(include|define|pragma|ifdef|ifndef|endif|undef|if|elif|else|error|warning)\b[^\r\n]*/, "preprocessor"],
  // Python/shell comments
  [/^#[^\r\n]*/, "comment"],
  // Python triple-quoted strings (double)
  [/^"""[\s\S]*?"""/, "string"],
  // Python triple-quoted strings (single)
  [/^'''[\s\S]*?'''/, "string"],
  // Double-quoted strings
  [/^"(?:[^"\\]|\\.)*"/, "string"],
  // Single-quoted strings (skip char literals like 'a' fine too)
  [/^'(?:[^'\\]|\\.)*'/, "string"],
  // Hex / binary / octal / float / int
  [/^0[xX][0-9a-fA-F]+[uUlL]*/,  "number"],
  [/^0[bB][01]+/,                  "number"],
  [/^\d+\.?\d*(?:[eE][+-]?\d+)?[uUlLfF]*/, "number"],
  // Keywords (word-boundary enforced via lookahead: not followed by \w)
  [/^(?:int|long|short|double|float|char|bool|void|auto|const|static|extern|inline|volatile|signed|unsigned|return|if|else|elif|for|while|do|break|continue|pass|class|struct|union|enum|interface|abstract|extends|implements|new|delete|throw|try|catch|finally|except|with|import|from|as|using|namespace|template|typename|virtual|override|public|private|protected|final|def|lambda|yield|global|nonlocal|self|cls|in|not|and|or|is|isinstance|async|await|switch|case|default|goto|sizeof|typeof|instanceof|this|super|let|var|function|true|false|nullptr|null|None|True|False|operator)(?![a-zA-Z0-9_])/, "keyword"],
  // Common types / containers
  [/^(?:vector|map|set|pair|queue|stack|deque|list|dict|tuple|unordered_map|unordered_set|priority_queue|string|wstring|String|ArrayList|HashMap|HashSet|LinkedList|TreeMap|TreeSet|Integer|Long|Double|Boolean|Character|Object|Array|Optional|Number|BigInteger|BigDecimal|Scanner|StringBuilder|StringBuffer|size_t|ssize_t|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t)(?![a-zA-Z0-9_])/, "type"],
  // Function/method call: identifier immediately before (
  [/^[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/, "function"],
  // Plain identifiers
  [/^[a-zA-Z_][a-zA-Z0-9_]*/, "plain"],
  // Multi-char operators first
  [/^(?:<<=|>>=|<<|>>|->|=>|==|!=|<=|>=|\+\+|--|&&|\|\|\|\|[+\-*/%&|^~<>!]=?|[=?:])/, "operator"],
  // Single-char punctuation — NOT newline/tab/space (those become plain)
  [/^[()[\]{},;.@]/, "plain"],
  // Whitespace (spaces + tabs) — preserve as plain
  [/^[ \t]+/, "plain"],
  // Newlines — keep as plain so they render in <pre>
  [/^\r?\n/, "plain"],
  // Fallback: any single char
  [/^./, "plain"],
];

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let src = code;
  while (src.length > 0) {
    let matched = false;
    for (const [re, type] of RULES) {
      const m = re.exec(src);
      if (m) {
        tokens.push({ t: type, v: m[0] });
        src = src.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Safety fallback — consume one char
      tokens.push({ t: "plain", v: src[0] });
      src = src.slice(1);
    }
  }
  return tokens;
}

// ── Component ─────────────────────────────────────────────────────
export default function CodeHighlighter({ code, cursorIndex, lang }: { code: string; cursorIndex?: number; lang?: string }) {
  // Normalize \r\n and lone \r → \n, tabs → 4 spaces
  const normalized = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  const html = React.useMemo(() => {
    const tokens = tokenize(normalized);
    let out = "";
    let currentPos = 0;
    let cursorInserted = false;
    
    const cursorHTML = `<span class="inline-block w-[2px] h-[1em] bg-[#79c0ff] animate-pulse align-middle mx-[0.5px] -mt-[2px]"></span>`;
    
    const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    for (const tok of tokens) {
      const tokStart = currentPos;
      const tokEnd = currentPos + tok.v.length;
      
      if (!cursorInserted && cursorIndex !== undefined && cursorIndex >= tokStart && cursorIndex < tokEnd) {
        const split = cursorIndex - tokStart;
        const p1 = tok.v.slice(0, split);
        const p2 = tok.v.slice(split);
        
        if (p1) out += tok.t === "plain" ? escape(p1) : `<span style="color:${COLOR[tok.t]}">${escape(p1)}</span>`;
        out += cursorHTML;
        if (p2) out += tok.t === "plain" ? escape(p2) : `<span style="color:${COLOR[tok.t]}">${escape(p2)}</span>`;
        cursorInserted = true;
      } else {
        out += tok.t === "plain" ? escape(tok.v) : `<span style="color:${COLOR[tok.t]}">${escape(tok.v)}</span>`;
      }
      currentPos = tokEnd;
    }
    
    if (!cursorInserted && cursorIndex !== undefined && cursorIndex >= currentPos) {
      out += cursorHTML;
    }
    
    return out;
  }, [normalized, cursorIndex]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
