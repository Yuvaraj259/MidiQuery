const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  require('dotenv').config();
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.models) {
      console.log('--- FOUND MODELS ---');
      json.models.forEach(m => {
        console.log('MODELID:' + m.name.replace('models/', ''));
      });
      console.log('--- END MODELS ---');
    } else {
      console.log('NO_MODELS_FOUND:' + JSON.stringify(json));
    }
  } catch (err) {
    console.log('LIST_ERROR:' + err.message);
  }
}

listModels();
