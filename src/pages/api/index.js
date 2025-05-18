const theme = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "#ffffff" },
    { token: "invalid", foreground: "#ff3333" },
    { token: "emphasis", fontStyle: "italic" },
    { token: "strong", fontStyle: "bold" },
    { token: "variable", foreground: "#5c6773" },
    { token: "variable.predefined", foreground: "#5c6773" },
    { token: "constant", foreground: "#f08c36" },
    { token: "comment", foreground: "#abb0b6", fontStyle: "italic" },
    { token: "number", foreground: "#f08c36" },
    { token: "number.hex", foreground: "#f08c36" },
    { token: "regexp", foreground: "#4dbf99" },
    { token: "annotation", foreground: "#41a6d9" },
    { token: "type", foreground: "#41a6d9" },
    { token: "delimiter", foreground: "#5c6773" },
    { token: "delimiter.html", foreground: "#5c6773" },
    { token: "delimiter.xml", foreground: "#5c6773" },
    { token: "tag", foreground: "#e7c547" },
    { token: "tag.id.jade", foreground: "#e7c547" },
    { token: "tag.class.jade", foreground: "#e7c547" },
    { token: "meta.scss", foreground: "#e7c547" },
    { token: "metatag", foreground: "#e7c547" },
    { token: "metatag.content.html", foreground: "#86b300" },
    { token: "metatag.html", foreground: "#e7c547" },
    { token: "metatag.xml", foreground: "#e7c547" },
    { token: "metatag.php", fontStyle: "bold" },
    { token: "key", foreground: "#41a6d9" },
    { token: "string.key.json", foreground: "#41a6d9" },
    { token: "string.value.json", foreground: "#86b300" },
    { token: "attribute.name", foreground: "#f08c36" },
    { token: "attribute.value", foreground: "#0451A5" },
    { token: "attribute.value.number", foreground: "#abb0b6" },
    { token: "attribute.value.unit", foreground: "#86b300" },
    { token: "attribute.value.html", foreground: "#86b300" },
    { token: "attribute.value.xml", foreground: "#86b300" },
    { token: "string", foreground: "#86b300" },
    { token: "string.html", foreground: "#86b300" },
    { token: "string.sql", foreground: "#86b300" },
    { token: "string.yaml", foreground: "#86b300" },
    { token: "keyword", foreground: "#f2590c" },
    { token: "keyword.json", foreground: "#f2590c" },
    { token: "keyword.flow", foreground: "#f2590c" },
    { token: "keyword.flow.scss", foreground: "#f2590c" },
    { token: "operator.scss", foreground: "#666666" }, //
    { token: "operator.sql", foreground: "#778899" }, //
    { token: "operator.swift", foreground: "#666666" }, //
    { token: "predefined.sql", foreground: "#FF00FF" }, //
  ],
  colors: {
    "editor.foreground": "#fefae0", // Text color
    "editor.background": "#222222", // Editor background color
    "editorLineNumber.foreground": "#dad7cd", // Line number color
    "editorCursor.foreground": "#fefae0", // Cursor color
    "editor.selectionBackground": "#232323", // Selection color
    editorInactiveSelectionBackground: "#222222", // Inactive selection color
  },
};

export default theme;
