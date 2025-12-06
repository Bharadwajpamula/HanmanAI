# 🦅 Hanuman AI - Your Personal Desktop Assistant

Hanuman AI is a powerful voice-activated desktop assistant that combines the intelligence of Google's Gemini AI with local system control. It allows you to control your computer, play music, and have intelligent conversations using natural language or voice commands.

## ✨ Features

- **🧠 Intelligent Chat**: Powered by Google's Gemini 2.0 Flash model for smart, context-aware responses.
- **🗣️ Voice Interaction**: Full speech-to-text (listen) and text-to-speech (speak) capabilities for a hands-free experience.
- **💻 Desktop Control**: Open local applications instantly (Calculator, Notepad, VS Code, Chrome, etc.).
- **🎵 Media Control**: Ask to play any song or video directly on YouTube.
- **🌐 Web Navigation**: Open specific websites with a simple command.
- **🎨 Modern UI**: A sleek, dark-themed interface built with React and Framer Motion for smooth animations.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion (for animations)
- **Backend**: Node.js, Express
- **AI Model**: Google Gemini 2.0 Flash
- **System Tools**: `open` and `child_process` for OS-level control

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- A Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup (Root Directory)

```bash
# Clone the repository
git clone <repository-url>
cd <repository-folder>

# Install backend dependencies
npm install

# Create a .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the backend server
node index.js
```

The backend usually runs on `http://localhost:5000`.

### 2. Frontend Setup (Client Directory)

Open a new terminal:

```bash
cd client

# Install frontend dependencies
npm install

# Start the frontend
npm run dev
```

The application will open in your browser (usually `http://localhost:5173`).

## 💡 How to Use

You can type commands or click the **Microphone** icon to speak.

**Examples:**
- *"Hello, who are you?"* (Chat)
- *"Open Calculator"* (Opens Windows Calculator)
- *"Play Believer on YouTube"* (Searches and plays the video)
- *"Open VS Code"* (Launches Visual Studio Code)
- *"Open google.com"* (Opens the website)

## ⚠️ Deployment Note

This application is designed primarily for **Local Use** because it controls your specific computer (opening apps, etc.). 

If you deploy this to a cloud server (like Render/Vercel):
- **Chat** features will work globally.
- **System Commands** (like "Open Calculator") will **NOT** work on your local machine (because the code is running on a cloud server).

**Recommended for Remote Use:** Use a tunneling service like **Ngrok** to expose your local server to the internet if you want to control your PC from your phone.
