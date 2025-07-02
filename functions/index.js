// functions/index.js
const functions = require("firebase-functions");
const {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} 
= require("@google/generative-ai");

// Access API key securely.
let GEMINI_API_KEY;
if (functions.config().gemini && functions.config().gemini.apikey) {
  GEMINI_API_KEY = functions.config().gemini.apikey;
} 
else {
  GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
}

if
 (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Please set it via 'firebase functions:config:set gemini.apikey=\"YOUR_KEY\"' or in a .env file locally.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-pro"});

exports.chatWithGemini =
functions.https.onCall(async (data, context) => {
  const userMessage = data.message;
  if (!userMessage) {
    throw new functions.https.HttpsError("invalid-argument", "The request must contain a message.");
  }

  try {
    const chat = model.startChat({
      generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.7,
        topP: 0.9,
        topK: 40,
    },
    safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();
        return {text: text};
} catch (error) {
    console.error("Error communicating with Gemini ", "Failed to get response from AI. Please try again.", error.message);
    }
  });