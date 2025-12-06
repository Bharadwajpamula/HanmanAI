require('dotenv').config();

async function checkModelsRaw() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log("No API Key found");
        return;
    }

    console.log(`Checking models with key: ${key.substring(0, 5)}...`);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (data.models) {
            console.log("\n✅ Available Models for this Key:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` - ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("No models returned. raw response:", data);
        }

    } catch (e) {
        console.error("Network error:", e);
    }
}

checkModelsRaw();
