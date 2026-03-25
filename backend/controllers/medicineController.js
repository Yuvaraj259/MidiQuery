const Groq = require('groq-sdk');

// ─── INIT CLIENT ───
const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Please set it in your .env file.');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const TEXT_MODEL = 'llama-3.3-70b-versatile'; 
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ─── SYSTEM PROMPT ───
const SYSTEM_PROMPT = `You are an expert clinical pharmacist and drug information specialist with 20 years of experience. 

When given any medicine name, description, image, or barcode code, analyze it and return ONLY a valid JSON object. No markdown fences, no preamble, no explanation. ONLY the JSON.

Return this exact structure:
{
  "name": "Brand name (most common trade name)",
  "generic": "Generic/INN/chemical name",
  "drug_class": "Pharmacological class (e.g. NSAID, ACE Inhibitor, Antibiotic)",
  "confidence": "High" | "Medium" | "Low",
  "description": "2-3 sentence overview of what this medicine is used to treat and how it works.",
  "timing": {
    "food": "before" | "after" | "with" | "any",
    "food_note": "Brief reason (e.g. reduces gastric irritation, improves absorption)",
    "time_of_day": ["morning"] | ["night"] | ["morning","night"] | ["any time"],
    "frequency": "Once daily" | "Twice daily" | "Three times daily" | "Four times daily" | "As needed" | "Every 4-6 hours"
  },
  "dosage": {
    "standard": "e.g. 500mg",
    "unit": "mg | ml | mcg | tablet(s) | capsule(s)",
    "per_dose": "e.g. 1-2 tablets per dose",
    "max_daily": "e.g. Max 4g per day — do not exceed",
    "detail": "Complete dosage sentence for a patient to understand clearly"
  },
  "side_effects": {
    "common": ["effect 1", "effect 2", "effect 3", "effect 4"],
    "important": "The one most critical rare-but-serious adverse effect to watch for (e.g. liver toxicity, anaphylaxis)"
  },
  "precautions": [
    "Avoid alcohol — increases toxicity risk",
    "Avoid grapefruit juice — inhibits metabolism",
    "Do not use in patients with kidney disease without medical supervision"
  ],
  "interactions": [
    { "drug": "Drug name", "severity": "Major" | "Moderate" | "Minor", "reason": "Clear patient-friendly explanation of why" },
    { "drug": "Another drug", "severity": "Major", "reason": "Explanation" }
  ],
  "alternatives": ["generic name 1", "brand name 2", "generic name 3"],
  "storage": "Clear storage instructions (e.g. Store below 25°C, away from moisture and sunlight. Keep out of reach of children.)",
  "pregnancy_category": "A" | "B" | "C" | "D" | "X" | "Unknown",
  "pregnancy_note": "Brief note about use in pregnancy",
  "otc": true | false,
  "controlled": false | true,
  "half_life": "e.g. 4-6 hours (optional, include if well known)"
}

If the medicine cannot be identified, return:
{ "error": "Medicine not found", "suggestion": "Helpful message to the user about what to try instead" }

CRITICAL: Return ONLY the raw JSON object. Nothing else whatsoever.`;

// ─── HELPER: Parse response ───
function parseResponse(text) {
  try {
    const clean = text.trim();
    // Sometimes models add markdown fences, let's be safe
    const jsonStr = clean.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.error) {
      const err = new Error(parsed.error);
      err.suggestion = parsed.suggestion;
      err.statusCode = 404;
      throw err;
    }

    return parsed;
  } catch (error) {
    if (error.statusCode === 404) throw error;
    console.error('Failed to parse Groq response:', text);
    throw new Error('Invalid response format from AI');
  }
}

// ─── CONTROLLER: Identify by text ───
const identifyByText = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid medicine name (at least 2 characters).' });
    }

    const groq = getClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Medicine: ${query}` }
      ],
      model: TEXT_MODEL,
      response_format: { type: 'json_object' }
    });

    const result = parseResponse(chatCompletion.choices[0].message.content);
    res.json({ success: true, data: result });

  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message, suggestion: err.suggestion });
    }
    next(err);
  }
};

// ─── CONTROLLER: Identify by image ───
const identifyByImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const groq = getClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the medicine shown in this image. Look at any text, pill markings, packaging, or visible labels. Return the full JSON profile.' },
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Data}` } }
          ]
        }
      ],
      model: VISION_MODEL,
      response_format: { type: 'json_object' }
    });

    const result = parseResponse(chatCompletion.choices[0].message.content);
    res.json({ success: true, data: result });

  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message, suggestion: err.suggestion });
    }
    next(err);
  }
};

// ─── CONTROLLER: Identify by barcode ───
const identifyByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.body;
    if (!barcode || typeof barcode !== 'string') {
      return res.status(400).json({ error: 'Please provide a barcode number.' });
    }

    const groq = getClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Identify medicine by barcode/NDC: ${barcode}` }
      ],
      model: TEXT_MODEL,
      response_format: { type: 'json_object' }
    });

    const result = parseResponse(chatCompletion.choices[0].message.content);
    res.json({ success: true, data: result });

  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message, suggestion: err.suggestion });
    }
    next(err);
  }
};

// ─── CONTROLLER: Quick suggestions ───
const getSuggestions = async (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'Paracetamol', generic: 'Acetaminophen', category: 'Pain Relief' },
      { name: 'Ibuprofen', generic: 'Ibuprofen', category: 'NSAID' },
      { name: 'Metformin', generic: 'Metformin HCl', category: 'Diabetes' },
      { name: 'Amoxicillin', generic: 'Amoxicillin', category: 'Antibiotic' },
      { name: 'Omeprazole', generic: 'Omeprazole', category: 'Antacid' },
      { name: 'Cetirizine', generic: 'Cetirizine HCl', category: 'Antihistamine' },
      { name: 'Aspirin', generic: 'Acetylsalicylic acid', category: 'Blood Thinner' },
      { name: 'Atorvastatin', generic: 'Atorvastatin', category: 'Statin' },
      { name: 'Lisinopril', generic: 'Lisinopril', category: 'ACE Inhibitor' },
      { name: 'Azithromycin', generic: 'Azithromycin', category: 'Antibiotic' }
    ]
  });
};

module.exports = { identifyByText, identifyByImage, identifyByBarcode, getSuggestions };
