import speech_recognition as sr
import pyttsx3
import pywhatkit
import webbrowser
import os
import subprocess
import google.generativeai as genai
import re
import shutil
import json
import time
import threading
from datetime import datetime
import requests
import fitz  # PyMuPDF
from deep_translator import GoogleTranslator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize recognizer and speech engine
recognizer = sr.Recognizer()
engine = pyttsx3.init()

# Setup Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Fallback or error if not found?
    print("Warning: GEMINI_API_KEY not found in .env")
    
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.0-flash-exp") # Updated to latest model mentioned in README or just gemini-pro? README says Gemini 2.0 Flash


def speak(text):
    print("Assistant:", text)
    engine.say(text)
    engine.runAndWait()

# ================== Existing Functions ==================
def open_website(command):
    match = re.search(r"open (.+)", command.lower())
    if match:
        site = match.group(1).strip().replace(" ", "")
        if not site.startswith("http"):
            url = f"https://{site}.com"
        else:
            url = site
        try:
            webbrowser.open(url)
            speak(f"Opening {site}")
        except Exception:
            speak(f"Couldn't open {site}")
    else:
        speak("Couldn't figure out the website to open.")

def open_application(command):
    match = re.search(r"open (.+)", command.lower())
    if match:
        app_name = match.group(1).strip().lower()
        try:
            if shutil.which(app_name):
                subprocess.Popen([app_name])
                speak(f"Opening {app_name}")
                return
            else:
                possible_paths = [
                    f"C:/Program Files/{app_name}/{app_name}.exe",
                    f"C:/Program Files (x86)/{app_name}/{app_name}.exe",
                    f"C:/Windows/System32/{app_name}.exe"
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        os.startfile(path)
                        speak(f"Opening {app_name}")
                        return
                speak(f"App '{app_name}' not found.")
        except Exception:
            speak(f"Error launching {app_name}")
    else:
        speak("Couldn't figure out the app to open.")

def play_on_yt(command):
    if "play" in command:
        song = command.replace('play', '')
        pywhatkit.playonyt(song)
        speak(f"Playing {song.strip()}")

def ask_gemini(prompt):
    try:
        refined_prompt = (
            f"Answer this like a friendly voice assistant, keep it within 1–2 paragraphs:\n\n{prompt}"
        )
        response = model.generate_content(refined_prompt)
        reply = response.text.strip()
        print("Gemini:", reply)
        speak(reply)
    except Exception as e:
        print("Gemini Error:", e)
        speak("Hmm, I had trouble answering that.")

# ================== New Features ==================

# 1. Reminders
reminders_file = "reminders.json"

def load_reminders():
    if os.path.exists(reminders_file):
        with open(reminders_file, "r") as f:
            return json.load(f)
    return []

def save_reminders(reminders):
    with open(reminders_file, "w") as f:
        json.dump(reminders, f, indent=4)

def add_reminder(command):
    match = re.search(r"remind me to (.+) at (\d{1,2}(:\d{2})?\s?(am|pm)?)", command, re.IGNORECASE)
    if match:
        task = match.group(1).strip()
        time_str = match.group(2).strip()
        reminder_time = datetime.strptime(time_str, "%I:%M %p") if ":" in time_str else datetime.strptime(time_str, "%I %p")
        now = datetime.now()
        reminder_time = reminder_time.replace(year=now.year, month=now.month, day=now.day)
        if reminder_time < now:
            reminder_time = reminder_time.replace(day=now.day + 1)
        reminders = load_reminders()
        reminders.append({"task": task, "time": reminder_time.strftime("%Y-%m-%d %H:%M:%S")})
        save_reminders(reminders)
        speak(f"Reminder set for {task} at {reminder_time.strftime('%I:%M %p')}")
    else:
        speak("Couldn't understand the reminder time.")

def reminder_checker():
    while True:
        reminders = load_reminders()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for reminder in reminders[:]:
            if reminder["time"] <= now:
                speak(f"Reminder: {reminder['task']}")
                reminders.remove(reminder)
                save_reminders(reminders)
        time.sleep(30)

threading.Thread(target=reminder_checker, daemon=True).start()

# 2. Daily Planner
def daily_planner():
    prompt = "Create a productive daily plan hour by hour from 8 AM to 10 PM."
    try:
        response = model.generate_content(prompt)
        plan = response.text.strip()
        speak("Here's your plan for the day.")
        print(plan)
        speak(plan[:500])
    except Exception:
        speak("Couldn't create a plan right now.")

# 3. Summarize PDFs
def summarize_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        prompt = f"Summarize this document:\n\n{text[:5000]}"
        response = model.generate_content(prompt)
        summary = response.text.strip()
        speak("Here's the summary.")
        print(summary)
    except Exception:
        speak("Couldn't read or summarize the PDF.")

# 5. News Summary
def get_news():
    api_key = "YOUR_NEWSAPI_KEY"
    url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={api_key}"
    try:
        response = requests.get(url).json()
        articles = response.get("articles", [])[:5]
        news_text = "\n".join([f"{i+1}. {a['title']}" for i, a in enumerate(articles)])
        prompt = f"Summarize these headlines:\n{news_text}"
        result = model.generate_content(prompt)
        summary = result.text.strip()
        speak("Today's news summaries:")
        speak(summary)
    except Exception:
        speak("Couldn't fetch or summarize news.")

# 6. Translator
def translate_text(command):
    match = re.search(r"translate ['\"](.+?)['\"] to (\w+)", command)
    if match:
        text = match.group(1)
        lang = match.group(2).lower()
        try:
            result = GoogleTranslator(source='auto', target=lang).translate(text)
            speak(f"The translation is: {result}")
        except Exception as e:
            print(f"Translation Error: {e}")
            speak("Translation failed.")
    else:
        speak("Please specify what and which language to translate to.")

# 7. Contextual Conversation
conversation_context = []
def ask_gemini_contextual(prompt):
    global conversation_context
    conversation_context.append({"role": "user", "parts": [prompt]})
    try:
        response = model.generate_content(conversation_context)
        reply = response.text.strip()
        conversation_context.append({"role": "model", "parts": [reply]})
        print("Gemini:", reply)
        speak(reply)
    except Exception:
        speak("Couldn't answer with context.")

# 8. Code Generator
def generate_code(command):
    prompt = f"Write a Python script that: {command.replace('generate code', '').strip()}"
    try:
        response = model.generate_content(prompt)
        code = response.text.strip()
        print(code)
        speak("Here's the code I generated.")
    except Exception:
        speak("I couldn't generate the code.")

# Smart Email Composer
def write_email(command):
    match = re.search(r"write (?:an )?email to ([\w\.-]+@[\w\.-]+)", command)
    if match:
        email_to = match.group(1)
        intent_text = command.replace(match.group(0), "").strip()
        if not intent_text:
            speak("What should the email be about?")
            return
        prompt = f"Write a formal email to {email_to}. Purpose: {intent_text}. Keep it polite."
        try:
            response = model.generate_content(prompt)
            email_body = response.text.strip()
            print(f"Generated Email:\n{email_body}")
            speak("Here is the drafted email.")
            speak(email_body)
        except Exception:
            speak("Couldn't generate the email.")
    else:
        speak("Please provide a valid email address.")

# ================== Command Dispatcher ==================
def process_command(command):
    command = command.lower()
    if "open" in command:
        open_website(command)
        open_application(command)
    elif "play" in command:
        play_on_yt(command)
    elif "remind me" in command:
        add_reminder(command)
    elif "plan my day" in command:
        daily_planner()
    elif "summarize pdf" in command:
        summarize_pdf(command.replace("summarize pdf", "").strip())
    elif "news" in command:
        get_news()
    elif "translate" in command:
        translate_text(command)
    elif "context" in command:
        ask_gemini_contextual(command)
    elif "generate code" in command:
        generate_code(command)
    elif "write email" in command:
        write_email(command)
    else:
        ask_gemini(command)

# --- Main Loop ---
if __name__ == "__main__":
    speak("Hanuman assistant is ready.")
    while True:
        print("Listening for 'Hanuman' wake word...")
        try:
            with sr.Microphone() as source:
                recognizer.adjust_for_ambient_noise(source)
                audio = recognizer.listen(source, timeout=10, phrase_time_limit=15)
                wake_word = recognizer.recognize_google(audio)

                if wake_word.lower() == "hanuman":
                    speak("Yeah, what do you need?")
                    while True:
                        try:
                            with sr.Microphone() as source:
                                recognizer.adjust_for_ambient_noise(source)
                                print("Listening...")
                                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                                command = recognizer.recognize_google(audio)
                                print("User:", command)

                                if command.lower() in ["exit", "quit", "stop hanuman"]:
                                    speak("Goodbye!")
                                    exit()

                                process_command(command)
                                speak("Anything else?")
                        except sr.UnknownValueError:
                            speak("Didn't get that. Can you say it again?")
                        except Exception as err:
                            print(f"Error: {err}")
                            speak("Something went wrong.")
        except sr.UnknownValueError:
            continue
        except sr.WaitTimeoutError:
            print("Listening timed out. Retrying...")
            continue
        except sr.RequestError as e:
            print(f"Request error: {e}")
        except KeyboardInterrupt:
            speak("Goodbye!")
            break
