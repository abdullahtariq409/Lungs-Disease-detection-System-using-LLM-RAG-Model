import React, { useState } from 'react';

const LLMChatRoom = () => {
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'You can ask any medical question about your chest X-ray or health.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5005/llmanswers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessages((prev) => [
          ...prev,
          { sender: 'llm', text: data.answer }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'llm', text: data.message || 'Error getting answer.' }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'llm', text: 'Failed to connect to LLM service.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-200">
      <h3 className="text-xl font-bold mb-4 text-indigo-700 text-center">LLM Medical Chatroom</h3>
      <div className="h-64 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-3 border border-indigo-100">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-indigo-500 text-white'
                  : msg.sender === 'llm'
                  ? 'bg-green-100 text-gray-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-green-100 text-gray-800 animate-pulse">
              LLM is typing...
            </div>
          </div>
        )}
      </div>
      <form className="flex gap-2" onSubmit={handleSend}>
        <input
          type="text"
          className="flex-1 border-2 border-indigo-200 rounded p-2 focus:ring-2 focus:ring-blue-300"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          required
        />
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded shadow"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LLMChatRoom;
