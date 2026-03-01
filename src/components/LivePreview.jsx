/**
 * LivePreview Component
 * 
 * Renders user's HTML/CSS/JS code in a sandboxed iframe for
 * the "live preview" mode. This is one half of the dual-mode editor:
 *   1. Code mode: compile & execute (C++, Java, Python, JS)
 *   2. Preview mode: live HTML/CSS/JS rendering (this component)
 * 
 * Uses srcdoc to inject code into the iframe without a server roundtrip.
 * The sandbox attribute restricts the iframe for security.
 */

import React, { useEffect, useRef, useState } from 'react';

function LivePreview({ code }) {
  const iframeRef = useRef(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Debounce preview updates to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = code || '<p style="color:#888; font-family:sans-serif; padding:20px;">Start writing HTML to see live preview...</p>';
        setLastUpdate(Date.now());
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="live-preview">
      <iframe
        ref={iframeRef}
        title="Live Preview"
        sandbox="allow-scripts allow-modals"
        className="preview-iframe"
      />
      <div className="preview-footer">
        Last updated: {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default LivePreview;
