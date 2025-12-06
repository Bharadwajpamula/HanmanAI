require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("Test");
        console.log("gemini-1.5-flash is working!");
    } catch (e) {
        console.log("gemini-1.5-flash failed: " + e.message);
    }

    try {
        // Unfortunately listModels isn't directly exposed in the high-level helper easily in all versions, 
        // but let's try just testing the most common ones.
        const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
        for (const name of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: name });
                await model.generateContent("Hi");
                console.log(`✅ ${name} is AVAILABLE`);
            } catch (e) {
                console.log(`❌ ${name} failed: ${e.message.split('\n')[0]}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
listModels();
