# CodeFlow - Real-Time Collaborative Code Editor

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-Python-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A real-time collaborative code editor built with React and Flask, featuring Operational Transformation (OT) for conflict-free concurrent editing, live code execution, and multi-language support. Ideal for pair programming, technical interviews, and collaborative development sessions.

## Features

- **Real-Time Collaboration** — Multiple users edit simultaneously with live cursor tracking and presence awareness
- **Operational Transformation** — Custom OT engine ensures conflict-free synchronization across all clients
- **Multi-Language Support** — Write and execute code in C++, Java, Python, and JavaScript
- **Live Code Execution** — Run code and view output/errors instantly
- **Live Preview** — See HTML/CSS rendering update as you code
- **User Presence** — Colored cursors and user indicators show who's editing
- **Session Management** — Create and share session links for instant collaboration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18+, CSS |
| **Backend** | Flask (Python), Socket.IO |
| **OT Engine** | Custom Python implementation (`ot_engine.py`) |
| **State Management** | Redux (`store/store.js`) |
| **Real-Time** | Socket.IO (WebSocket) |

## Project Structure

```
codeflow/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── LivePreview.jsx          # Live HTML/CSS preview panel
│   │   ├── PendingChangesPanel.jsx  # Pending OT changes display
│   │   └── UserPresence.jsx         # Active user indicators
│   ├── pages/
│   │   ├── Editor.jsx               # Main collaborative editor page
│   │   └── Home.jsx                 # Landing / session creation page
│   ├── store/
│   │   └── store.js                 # Redux store configuration
│   ├── utils/
│   │   ├── deltaUtils.js            # OT delta transformation utilities
│   │   └── socketManager.js         # Socket.IO client manager
│   ├── App.js                       # Root component with routing
│   ├── App.css                      # Global styles
│   └── index.js                     # React entry point
├── app.py                           # Flask backend server
├── ot_engine.py                     # Operational Transformation engine
├── test_ot.py                       # OT engine tests
├── requirements.txt                 # Python dependencies
├── package.json                     # Node.js dependencies
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arpit-sutariya/codeflow.git
   cd codeflow
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask backend:**
   ```bash
   python app.py
   ```

5. **Start the React frontend** (in a separate terminal):
   ```bash
   npm start
   ```

6. **Open** `http://localhost:3000` in your browser.

## Usage

**Create a session** — Visit the home page and start a new session. Share the link with collaborators.

**Write and run code** — Select a language, write your code, and hit Run. Output appears in the results panel. All changes sync automatically.

**Collaborate** — See other users' cursors in real-time. The OT engine ensures edits never conflict, even with network delays.

## How Operational Transformation Works

CodeFlow uses a custom OT engine (`ot_engine.py`) to handle concurrent edits:

1. User edits are captured as delta operations
2. Operations are sent to the Flask server via Socket.IO
3. The server transforms conflicting operations to maintain consistency
4. Transformed operations are broadcast to all connected clients
5. All clients converge to the same document state

Run the OT test suite with:
```bash
python test_ot.py
```

## Deployment

**Frontend:**
```bash
npm run build
```
Serve the `build/` directory with any static hosting (Vercel, Netlify, etc.)

**Backend:**
Deploy `app.py` on any Python hosting platform that supports WebSockets (Render, Railway, AWS, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
