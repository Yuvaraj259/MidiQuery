const Groq = require('groq-sdk');

async function listModels() {
  require('dotenv').config();
  const apiKey = process.env.GROQ_API_KEY;
  const groq = new Groq({ apiKey });
  
  try {
    const list = await groq.models.list();
    console.log('--- GROQ MODELS ---');
    list.data.forEach(m => {
      console.log('MODELID:' + m.id);
    });
    console.log('--- END MODELS ---');
  } catch (err) {
    console.log('LIST_ERROR:' + err.message);
  }
}

listModels();
