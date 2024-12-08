"use client";

import { Editor } from "@monaco-editor/react";
import editorTheme from "./editor-theme.json";

const CodeEditor = ({
  code,
  setCode,
}: {
  code: string;
  setCode: (code: string) => void;
}) => {
  const theme = JSON.parse(JSON.stringify(editorTheme));
  return (
    <Editor
      value={code}
      language="sol"
      width={"100%"}
      height={'68vh'}
      onChange={(code) => setCode(code || "")}
      theme="editorTheme"
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("editorTheme", theme);
      }}
    />
  );
};

export default CodeEditor;
