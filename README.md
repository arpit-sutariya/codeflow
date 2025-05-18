## CodeFlow Compiler

CodeFlow Compiler is an online code editor and compiler built with Next.js and Tailwind CSS, using the `pat-exec` API for code execution.

### Features

- Write and execute code in various programming languages.
- View output and error messages from code execution.
- Supports popular languages like C++, Java, Python, JavaScript, and more.
- Clean and responsive user interface.

### Installation

To run this project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/Pathak1511/codeflow.git
   ```

2. Install dependencies:

   ```bash
   cd codeflow
   npm install
   ```

3. Create a `.env.local` file in the root directory and set the following environment variables:

   ```plaintext
   NEXT_PUBLIC_EXEC_API_URL=https://your-exec-api-url
   ```

   Replace `https://your-exec-api-url` with the URL of the `pat-exec` API server.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and visit [http://localhost:3000](http://localhost:3000) to view the application.

### Usage

1. Select a programming language from the dropdown menu.
2. Write your code in the editor.
3. Click the "Run" button to execute the code.
4. View the output or error messages in the result panel.

### Technologies Used

- **Next.js**: React framework for server-side rendering and routing.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **pat-exec**: API for executing code snippets in various languages.

### Directory Structure

```
codeflow/
├── components/
│   ├── Dropdown.js
├── pages/
│   ├── api/
│   │── compiler/index.js
│   └── index.js
├── styles/
│   └── globals.css
├── next.config.js
├── package.json
└── README.md
```

### Contributing

Contributions to CodeFlow Compiler are welcome! Feel free to fork the repository and submit pull requests with your improvements.

---

For more details, visit the [CodeFlow Compiler GitHub repository](https://github.com/Pathak1511/codeflow). If you encounter any issues or have suggestions for improvements, please create a GitHub issue or reach out to the project maintainers.

Happy coding with CodeFlow Compiler! 🚀🌟
# codeflow
