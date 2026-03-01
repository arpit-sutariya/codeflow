import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  setContent, setOutput, setIsExecuting, setLanguage, setMode,
} from '../store/store';
import socketManager from '../utils/socketManager';
import { createDeltaFromChange } from '../utils/deltaUtils';
import PendingChangesPanel from '../components/PendingChangesPanel';
import UserPresence from '../components/UserPresence';
import LivePreview from '../components/LivePreview';

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'cpp', name: 'C++', icon: '⚙️' },
  { id: 'java', name: 'Java', icon: '☕' },
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const DEFAULT_CODE = {
  python: `print("Hello, World!")`,
  javascript: `console.log("Hello, World!");`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
};

function Editor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const content = useSelector((s) => s.editor.content);
  const language = useSelector((s) => s.editor.language);
  const mode = useSelector((s) => s.editor.mode);
  const isOwner = useSelector((s) => s.editor.isOwner);
  const username = useSelector((s) => s.editor.username);
  const outputData = useSelector((s) => s.editor.output);
  const isExecuting = useSelector((s) => s.editor.isExecuting);
  const users = useSelector((s) => s.collab.users);
  const pendingChanges = useSelector((s) => s.collab.pendingChanges);
  const connectionStatus = useSelector((s) => s.collab.connectionStatus);

  const [localContent, setLocalContent] = useState(content || '');
  const prevContentRef = useRef(content || '');

  useEffect(() => {
    setLocalContent(content);
    prevContentRef.current = content;
  }, [content]);

  useEffect(() => {
    socketManager.onContentUpdate = (newContent) => {
      isRemoteUpdate.current = true;
      setLocalContent(newContent);
      prevContentRef.current = newContent;
    };
    return () => { socketManager.onContentUpdate = null; };
  }, []);

  const handleContentChange = useCallback((newValue) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const oldContent = prevContentRef.current;
    setLocalContent(newValue);

    let from = 0;
    while (from < oldContent.length && from < newValue.length && oldContent[from] === newValue[from]) {
      from++;
    }

    let oldEnd = oldContent.length;
    let newEnd = newValue.length;
    while (oldEnd > from && newEnd > from && oldContent[oldEnd - 1] === newValue[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    const deletedLength = oldEnd - from;
    const insertedText = newValue.slice(from, newEnd);

    if (deletedLength === 0 && insertedText.length === 0) return;

    const delta = createDeltaFromChange(oldContent.length, from, oldEnd, insertedText);
    prevContentRef.current = newValue;
    dispatch(setContent(newValue));
    socketManager.sendOperation(delta);
  }, [dispatch]);

  const handleExecute = async () => {
    dispatch(setIsExecuting(true));
    dispatch(setOutput({ stdout: '', stderr: '', error: null, exit_code: null }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: localContent, language }),
      });
      const data = await response.json();
      dispatch(setOutput({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        error: data.error || null,
        exit_code: data.exit_code,
      }));
    } catch (err) {
      dispatch(setOutput({ stdout: '', stderr: '', error: 'Failed to connect to execution server', exit_code: -1 }));
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    dispatch(setLanguage(newLang));
    socketManager.changeLanguage(newLang);
    const defaultCode = DEFAULT_CODE[newLang] || '';
    const currentLength = prevContentRef.current.length;
    const delta = createDeltaFromChange(currentLength, 0, currentLength, defaultCode);
    setLocalContent(defaultCode);
    prevContentRef.current = defaultCode;
    dispatch(setContent(defaultCode));
    socketManager.sendOperation(delta);
  };

  const handleCursorChange = (e) => {
    socketManager.sendCursorMove(e.target.selectionStart);
  };

  const handleLeave = () => {
    socketManager.disconnect();
    navigate('/');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <span className="logo-small">⟨/⟩ CodeFlow</span>
          <div className="room-info">
            <span className="room-id" onClick={copyRoomId} title="Click to copy">
              Room: {roomId} 📋
            </span>
            <span className={`status-dot ${connectionStatus}`} />
            <span className="status-text">{connectionStatus}</span>
          </div>
        </div>

        <div className="header-center">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'code' ? 'active' : ''}`}
              onClick={() => { dispatch(setMode('code')); socketManager.changeMode('code'); }}
            >
              ▶ Code
            </button>
            <button
              className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
              onClick={() => { dispatch(setMode('preview')); socketManager.changeMode('preview'); }}
            >
              👁 Preview
            </button>
          </div>

          {mode === 'code' && (
            <select className="lang-select" value={language} onChange={handleLanguageChange}>
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="header-right">
          <UserPresence users={users} />
          <button className="btn-leave" onClick={handleLeave}>Leave</button>
        </div>
      </header>

      <div className="editor-main">
        <div className="editor-panel">
          <div className="panel-header">
            <span>
              {mode === 'code'
                ? `${LANGUAGES.find(l => l.id === language)?.icon || ''} ${language}`
                : '🌐 HTML / CSS / JS'}
            </span>
            {isOwner && <span className="owner-badge">👑 Owner</span>}
          </div>
          <textarea
            ref={editorRef}
            className="code-textarea"
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={handleCursorChange}
            spellCheck={false}
            placeholder={
              mode === 'code'
                ? `Write your ${language} code here...`
                : 'Write HTML, CSS, and JS here for live preview...'
            }
          />
        </div>

        <div className="output-panel">
          {mode === 'code' ? (
            <>
              <div className="panel-header">
                <span>📤 Output</span>
                <button className="btn-run" onClick={handleExecute} disabled={isExecuting}>
                  {isExecuting ? '⏳ Running...' : '▶ Run'}
                </button>
              </div>
              <div className="output-area">
                {outputData.stdout && <pre className="stdout">{outputData.stdout}</pre>}
                {(outputData.stderr || outputData.error) && (
                  <pre className="stderr">{outputData.stderr || outputData.error}</pre>
                )}
                {!outputData.stdout && !outputData.stderr && !outputData.error && (
                  <div className="output-placeholder">Click "Run" to execute your code</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="panel-header"><span>👁 Live Preview</span></div>
              <LivePreview code={localContent} />
            </>
          )}
        </div>
      </div>

      {isOwner && pendingChanges.length > 0 && (
        <PendingChangesPanel
          changes={pendingChanges}
          onAccept={(id) => socketManager.acceptChange(id)}
          onReject={(id) => socketManager.rejectChange(id)}
        />
      )}
    </div>
  );
}

export default Editor;
