import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import theme from "../api";
import Dropdown from "@/components/Dropdown";
import Exec from "../api/Exec";
import { useRouter } from "next/router";
function Index() {
  const [selectLanguage, setSelectLanguage] = useState("javascript");
  const [defaultCode, setDefaultCode] = useState("console.log('Hello World')");
  const [args, setargs] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [outputSubject, setoutputSubject] = useState(["Success", "#2e7d32"]);
  const router = useRouter();

  const handleSelectLanguage = (value, code) => {
    setSelectLanguage(value);
    setOutput("");
    editorRef.current.setValue(code);
    editorRef.current.defaultLanguage = value;
  };

  const editorRef = useRef(null);
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monaco.editor.defineTheme("customTheme", theme);
    monaco.editor.setTheme("customTheme");
    editorRef.current.defaultLanguage = selectLanguage;

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [8009, 8006, 1434, 1005],
      noSyntaxValidation: true,
    });
  }

  const showValue = () => {
    onSendCode(editorRef.current.getValue());
  };

  const onSendCode = (Currentcode) => {
    setLoading(true);
    let data = {
      language: selectLanguage,
      code: Currentcode,
      input: args,
    };

    Exec(data.input, data.language, data.code, (error, data) => {
      if (error) {
        setOutput("Unknown error occured");
        setoutputSubject(["Error", "#ff3333"]);
      } else {
        const output = JSON.stringify(JSON.parse(data).output);
        const result = JSON.parse(output).replace(/\n/g, "<br>");
        if (JSON.parse(data).hasOwnProperty("error")) {
          setoutputSubject(["Error", "#ff3333"]);
        } else {
          setoutputSubject(["Success", "#2e7d32"]);
        }
        setOutput(result);
      }
      setLoading(false);
      const outputContainer = document.getElementById("outputContainer");
      if (outputContainer) {
        outputContainer.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  return (
    <div className="relative flex justify-center items-center flex-col pb-4 dm:w-[100vw] sm:w-[96vw] dm:px-2">
      <div className=" flex justify-between w-[100%] h-[40px] my-4 cursor-pointer sm:flex-row sm:h-[40px] dm:flex-col dm:h-[80px] dm:px-2">
        <div
          className="flex gap-4 justify-start "
          onClick={() => router.push("/")}
        >
          <img src="/main-logo.png" className="w-[40px] h-[40px]" />
          <h2 className="text-2xl font-bold">CodeFlow Playground</h2>
        </div>
        <div className="flex gap-8 justify-center items-center dm:gap-4 dm:justify-start">
          <button
            onClick={() => {
              loading ? "" : showValue();
            }}
            className={`w-[120px] h-[100%] bg-green-500 hover:bg-green-700 text-white rounded-lg ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Run
          </button>
          <Dropdown
            handleSelectLanguage={handleSelectLanguage}
            selectLanguage={selectLanguage}
          />
        </div>
      </div>

      <div className="flex justify-center md:flex-row sm:flex-col dm:items-center dm:flex-col w-[100%]">
        <Editor
          theme="customTheme"
          defaultLanguage={selectLanguage}
          defaultValue={defaultCode}
          onMount={handleEditorDidMount}
          className="border-2 border-black md:w-[100vw] sm:w-[96vw] dm:w-[80vw] dm:h-[80vh] "
        />
        <div
          id="outputContainer"
          className="h-[80vh] md:w-[50%] sm:w-[100%] dm:w-[100%]"
        >
          {/* Output */}
          <div className="h-[50%] w-[100%] bg-[#222] border-2 border-black flex flex-col">
            <div className="flex justify-between items-center border-2 border-[#333]">
              <h2 className="text-bold text-white text-left px-4 py-2">
                Output
              </h2>
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="48px"
                  height="48px"
                >
                  <path
                    fill="#ff6f02"
                    d="M31 7.002l13 1.686L33.296 19 31 7.002zM17 41L4 39.314 14.704 29 17 41z"
                  />
                  <path
                    fill="#ff6f00"
                    d="M8 24c0-8.837 7.163-16 16-16 1.024 0 2.021.106 2.992.29l.693-3.865C26.525 4.112 25.262 4.005 24 4.005c-11.053 0-20 8.947-20 20 0 4.844 1.686 9.474 4.844 13.051l3.037-2.629C9.468 31.625 8 27.987 8 24zM39.473 11.267l-3.143 2.537C38.622 16.572 40 20.125 40 24c0 8.837-7.163 16-16 16-1.029 0-2.033-.106-3.008-.292l-.676 3.771c1.262.21 2.525.317 3.684.317 11.053 0 20-8.947 20-20C44 19.375 42.421 14.848 39.473 11.267z"
                  />
                </svg>
              ) : (
                <></>
              )}
            </div>

            <div
              className="w-[100%] h-[100%] sm:px-4 dm:p-0 scroll-m-1 overflow-auto"
              style={
                outputSubject[0] === "Error"
                  ? { color: outputSubject[1] }
                  : { color: "#f8f8f8" }
              }
              dangerouslySetInnerHTML={{ __html: output }}
            ></div>
          </div>
          {/* Input */}
          <div className="h-[50%] w-[100%] bg-[#222] border-2 border-black flex flex-col">
            <h2 className="text-bold text-white text-left px-4 py-2 border-2 border-[#333]">
              Input
            </h2>
            <textarea
              onChange={(e) => setargs(e.target.value)}
              placeholder="Input data here"
              className="w-[100%] h-[100%] placeholder:text-gray-500 bg-[#222] outline-none items-left px-4"
              style={{ textAlign: "left" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
