import React, { useState } from "react";

function Dropdown({ handleSelectLanguage, selectLanguage }) {
  const [open, setOpen] = useState(false);

  const language = [
    "c++",
    "java",
    "python",
    "c",
    "javascript",
    "ruby",
    "go",
    "rust",
    "php",
    "typescript",
  ];

  const helloWorldCode = {
    "c++": `#include <iostream>
using namespace std;
  
int main() {
    cout << "Hello, world!" << endl;
    return 0;
}`,
    java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}`,
    python: `print("Hello, world!")`,
    c: `#include <stdio.h>
  
int main() {
  printf("Hello, world!\\n");
  return 0;
}`,
    javascript: `console.log("Hello, world!");`,
    ruby: `puts "Hello, world!"`,
    go: `package main
  
import "fmt"
  
func main() {
  fmt.Println("Hello, world!")
}`,
    rust: `fn main() {
  println!("Hello, world!");
}`,
    php: `<?php
  echo "Hello, world!";
?>`,
    typescript: `console.log("Hello, world!");`,
  };

  return (
    <div className="relative inline-block text-left">
      <div className="">
        <button
          type="button"
          className="inline-flex w-[140px] justify-center gap-x-8 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setOpen(!open)}
        >
          {selectLanguage}
          <svg
            className="-mr-1 h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div
        className="absolute right-0 z-10 mt-2 w-[100%] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex="-1"
        style={{ display: open ? "block" : "none" }}
      >
        <div className="flex-col gap-2 h-100">
          {language.map((item, ind) => (
            <button
              key={ind}
              className="py-2 text-black w-[100%] hover:bg-[#222] hover:text-white hover:opacity-80"
              role="none"
              onClick={() => {
                handleSelectLanguage(item, helloWorldCode[item]),
                  setOpen(!open);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dropdown;
