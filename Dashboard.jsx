import React, { useState, useRef } from 'react';
import Navbar from './Navbar';
import Content from './Content';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [resetKey, setResetKey] = useState(0);
  const reportChoiceRef = useRef(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handler to reset dashboard state and set reportChoice to 'no' if Home
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      setResetKey(prev => prev + 1);
      reportChoiceRef.current = 'null';
    }
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5005/llmanswers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chatInput }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setChatMessages((msgs) => [
          ...msgs,
          { sender: 'bot', text: data.answer }
        ]);
      } else {
        setChatMessages((msgs) => [
          ...msgs,
          { sender: 'bot', text: 'Error: ' + (data.message || 'Unknown error') }
        ]);
      }
    } catch (err) {
      setChatMessages((msgs) => [
        ...msgs,
        { sender: 'bot', text: 'Network error.' }
      ]);
    }
    setLoading(false);
    setChatInput('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className='bg-gradient-to-br from-black to-pink-600 p-1  min-h-screen'>
      <div className="bg-gradient-to-r mb-3 from-white via-blue-50 to-white rounded-2xl shadow-xl p-6 max-w-xl mx-auto mt-1 animate-fade-in rounded-b-lg border-b-2 border-blue-500">
        <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
      <Content activeTab={activeTab} key={resetKey} externalReportChoice={reportChoiceRef.current} />

      {/* Floating Chatbot Icon */}
      <button
        onClick={() => setShowChatbot((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%)',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Open Chatbot"
      >
        {/* Simple chat icon SVG */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M12 3C6.48 3 2 6.92 2 12c0 2.08.8 3.97 2.13 5.44L2 21l3.72-1.17C7.7 20.6 9.79 21 12 21c5.52 0 10-3.92 10-9s-4.48-9-10-9zm0 16c-1.93 0-3.68-.5-5.09-1.36l-.36-.22-2.19.69.7-2.09-.23-.37C4.5 15.68 4 13.93 4 12c0-4.08 3.58-7 8-7s8 2.92 8 7-3.58 7-8 7z"/>
        </svg>
      </button>

      {/* Floating Chatbot Window */}
      {showChatbot && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '40px',
            width: '350px',
            height: '408px', // reduced by 2px
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s',
          }}
        >
          <div style={{
            background: 'linear-gradient(90deg, #ff6ec4 0%, #7873f5 100%)',
            color: 'white',
            padding: '12px 16px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            Chatbot
            <button
              onClick={() => setShowChatbot(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer'
              }}
              aria-label="Close Chatbot"
            >
              ×
            </button>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f9f9f9' }}>
            {/* Chat messages */}
            {chatMessages.length === 0 && (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '40%' }}>
                Ask me anything about the reports!
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  margin: '8px 0',
                  textAlign: msg.sender === 'user' ? 'right' : 'left'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: msg.sender === 'user' ? '#e0e7ff' : '#ffe4f7',
                    color: '#333',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    maxWidth: '80%',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ color: '#aaa', textAlign: 'left', margin: '8px 0' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#ffe4f7',
                    color: '#333',
                    borderRadius: '12px',
                    padding: '8px 12px',
                  }}
                >
                  ...
                </span>
              </div>
            )}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #eee', background: '#fff' }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type your question..."
              style={{
                width: '75%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                marginRight: '8px'
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !chatInput.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(90deg, #ff6ec4 0%, #7873f5 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
