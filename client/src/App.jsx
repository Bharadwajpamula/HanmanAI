import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaPaperPlane, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am HanmanAI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const res = await axios.post(`${API_URL}/chat`, { prompt: userMsg.text });
      const botMsg = { role: 'model', text: res.data.reply };
      setMessages(prev => [...prev, botMsg]);

      // Speak the response
      speak(res.data.reply);

    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, something went wrong." }]);
    }
  };

  const speak = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  // Web Speech API
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto send if desired, or let user edit
      // handleSend();
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', padding: '20px' }}>

      {/* Main Chat Area */}
      <motion.div
        className="glass-panel"
        style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden', height: '90vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaRobot color="#00d2ff" /> HANUMAN AI
          </h1>
        </header>

        <div className="chat-window" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' }}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
            >
              {msg.text}
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="input-area" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={startListening}
            style={{ borderRadius: '50%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isListening ? '#ff4b4b' : undefined }}
          >
            <FaMicrophone size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or speak a command (e.g., 'Play song')..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50px',
              padding: '0 20px',
              color: 'white',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
          <button
            className="btn-primary"
            onClick={handleSend}
            style={{ borderRadius: '50%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FaPaperPlane size={18} />
          </button>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            Try saying anything...
          </span>
        </div>
      </motion.div>

    </div>
  );
}

export default App;
