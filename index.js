require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const open = require('open');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection (Optional if reminders removed, but keeping connection logic for now)

// if (process.env.MONGO_URI) {
//   mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('MongoDB Connected'))
//     .catch(err => console.log('MongoDB connection error:', err));
// } else {
//   console.log('MONGO_URI not set – skipping MongoDB connection.');
// }


// Gemini Setup
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Helper: Open Application
const openApplication = (appName) => {
    // Basic mapping for common apps
    const appMap = {
        'calculator': 'calc',
        'notepad': 'notepad',
        'paint': 'mspaint',
        'explorer': 'explorer',
        'chrome': 'chrome',
        'edge': 'msedge',
        'vscode': 'code',
    };

    const command = appMap[appName.toLowerCase()] || appName;

    try {
        // Try opening as a generic start command
        exec(`start ${command}`, (err) => {
            if (err) {
                console.error(`Could not open ${appName}:`, err);
            }
        });
        return `Opening ${appName}`;
    } catch (e) {
        return `Failed to open ${appName}`;
    }
};

// Routes

// 1. Chat & Command Processing
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).send('No prompt provided');

    const lowerPrompt = prompt.toLowerCase();
    let responseText = "";
    let action = null;

    console.log("Received prompt:", lowerPrompt);

    // --- Command Parsing Logic ---

// Open Website
if (lowerPrompt.startsWith('open ')) {
    const target = prompt.substring(5).trim();
    if (target) {
        // Check if it's a known app or website
        if (target.includes('.') && !target.includes(' ')) {
            const url = target.startsWith('http') ? target : `https://${target}`;
            responseText = `Open this URL in your browser: ${url}`;
            action = 'open_url';
            return res.json({ reply: responseText, action, url });
        } else {
            // Try opening as app
            responseText = openApplication(target);
            action = 'open_app';
        }
    }
}
    // Play on YouTube
    else if (lowerPrompt.startsWith('play ') || lowerPrompt.includes(' play ')) {
        // Extract song name properly
        let query = lowerPrompt.replace('play', '').trim();
        // If query is empty, maybe fallback or ask "play what?"
        // But assuming user said "Play X" or "can you play X"

        console.log("Playing on YT:", query);

        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        // Open URL using child_process for Windows to be sure, or 'open' package
        try {
            await open(url);
        } catch (err) {
            // Fallback for windows if 'open' fails
            exec(`start "" "${url}"`);
        }
        responseText = `Playing ${query} on YouTube`;
        action = 'play_yt';
    }
    // General AI Query
    else {
        // Contextual Chat
        try {
            const result = await model.generateContent(`You are Hanuman, a helpful AI assistant. Answer this query concisely: ${prompt}`);
            responseText = result.response.text();
            action = 'chat';
        } catch (e) {
            console.error("Gemini Error:", e);
            responseText = `I'm having trouble connecting to my brain right now. Error details: ${e.message || e.toString()}`;
        }
    }

    res.json({ reply: responseText, action });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
