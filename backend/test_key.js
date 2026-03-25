const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = 'AIzaSyCMrmXFT5HmaFsIxeTq3fUeTtp24j_o1oI';
  // Attempt to use v1 instead of v1beta
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' }, { apiVersion: 'v1' });

  try {
    const result = await model.generateContent('Say hello in one word.');
    const response = await result.response;
    console.log('OK_V1_RESULT:' + response.text().trim());
  } catch (err) {
    console.log('ERR_V1_MSG:' + err.message);
  }
}

test();
