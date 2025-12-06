require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log("Reading API Key...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is not set in .env file");
        return;
    }
    console.log(`Key found (starts with: ${apiKey.substring(0, 4)}...)`);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try different models if one fails
    const models = ["gemini-1.5-flash", "gemini-pro"];

    for (const modelName of models) {
        try {
            console.log(`\nTesting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello from test script!");
            console.log(`✅ Success with ${modelName}! Response: ${result.response.text()}`);
            return; // Exit on success
        } catch (error) {
            console.error(`❌ Failed with ${modelName}:`);
            console.error(error.message);
            // console.error(JSON.stringify(error, null, 2));
        }
    }
}

testGemini();
