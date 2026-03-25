// ═══════════════════════════════════════
//  MEDICHECK — app.js v3
//  New: Multilanguage (EN / HI / KN) + Voice Assistant (TTS)
// ═══════════════════════════════════════

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                 ? 'http://localhost:5005' 
                 : 'https://midiquery.onrender.com'; // Your actual Render URL

// ── STATE ──
let history = [];
try { history = JSON.parse(localStorage.getItem('medicheck_history') || '[]'); } catch(e) { history = []; }
let currentResult = null;
let isLoading = false;
let currentLang = localStorage.getItem('medicheck_lang') || 'en';
let voicePanelOpen = false;
let currentUtterance = null;

// ═══════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════
const i18n = {
  en: {
    nav_search: 'Search',
    nav_history: 'History',
    nav_about: 'About',
    hero_eyebrow: 'AI-powered · Instant · Free',
    hero_title_html: 'Know your<br><em>medicine.</em>',
    hero_sub: 'Get complete, clear information about any medicine — dosage timing, side effects, interactions, and safe alternatives. Powered by AI.',
    tab_name: 'By Name',
    tab_photo: 'Photo',
    search_placeholder: 'e.g. Paracetamol, Metformin, Amoxicillin…',
    btn_identify: 'Identify',
    btn_identify_photo: 'Identify from Photo',
    btn_lookup: 'Look Up',
    try_label: 'Try:',
    upload_title: 'Drop your medicine photo here',
    upload_sub: 'or click to browse — JPG, PNG, WebP up to 10MB',
    barcode_hint: 'Find the barcode on the medicine packaging or bottle label',
    history_title: 'Search History',
    clear_all: 'Clear all',
    about_title: 'About MediCheck',
    about_lead: 'MediCheck helps patients and caregivers quickly understand their medicines. No jargon. No confusion.',
    about_card1_title: 'Three ways to identify',
    about_card1_desc: 'Type the name, upload a photo of the pill or packaging, or enter the barcode from the label.',
    about_card2_title: 'Timing guidance',
    about_card2_desc: 'Clearly shows whether to take before or after food, morning or night, and how often.',
    about_card3_title: 'Safety first',
    about_card3_desc: 'Highlights critical side effects, drug interactions, and items to avoid.',
    about_card4_title: 'Alternatives',
    about_card4_desc: 'Shows generic versions and alternative medicines for an informed conversation with your doctor.',
    about_card5_title: 'Multilanguage',
    about_card5_desc: 'Available in English, Hindi, and Kannada — switch anytime from the top navigation.',
    about_card6_title: 'Voice Assistant',
    about_card6_desc: 'Tap the speaker button after identifying a medicine to hear the full summary read aloud.',
    disclaimer_title: '⚕️ Medical Disclaimer',
    disclaimer_text: 'MediCheck provides general information only. Always follow your doctor\'s or pharmacist\'s specific instructions. This app is not a substitute for professional medical advice.',
    voice_settings: 'Voice Settings',
    voice_speed: 'Speed',
    voice_lang_label: 'Read in',
    btn_read_aloud: 'Read Aloud',
    btn_stop: 'Stop',
    history_empty: 'No searches yet. Identify a medicine to get started.',
    loading_identifying: 'Identifying medicine…',
    loading_photo: 'Analysing medicine photo…',
    toast_enter_name: 'Please enter a medicine name',
    toast_select_photo: 'Please select a photo first',
    toast_network: 'Network error. Is the server running?',
    toast_copied: 'Summary copied to clipboard',
    toast_copy_fail: 'Could not copy to clipboard',
    toast_history_cleared: 'History cleared',
    toast_no_result: 'No medicine result to read',
    toast_tts_unavailable: 'Text-to-speech not supported in this browser',
    label_overview: 'Overview',
    label_when_to_take: 'When to Take',
    label_dosage: 'Dosage',
    label_side_effects: 'Side Effects',
    label_precautions: 'Precautions & Avoid',
    label_interactions: 'Drug Interactions',
    label_alternatives: 'Alternatives & Generics',
    label_storage: 'Storage',
    label_additional: 'Additional Info',
    label_watch_for: '⚠ Watch for',
    label_pregnancy: 'Pregnancy',
    label_half_life: 'Half-life',
    label_confidence: 'AI Confidence',
    label_generic: 'Generic',
    label_otc: '✓ Over-the-counter',
    label_rx: 'Rx Prescription',
    label_controlled: '⚠ Controlled',
    label_no_precautions: 'No specific precautions listed.',
    food_before: '🌅 Before Food',
    food_after: '🍽️ After Food',
    food_with: '🥗 With Food',
    food_any: '⏰ Any Time',
    label_time_of_day: 'Time of day',
    label_frequency: 'Frequency',
    label_as_directed: 'As directed',
    btn_print: '🖨 Print',
    btn_copy: '📋 Copy Summary',
    btn_new_search: '🔍 New Search',
    btn_read_result: '🔊 Read Aloud',
  },

  hi: {
    nav_search: 'खोजें',
    nav_history: 'इतिहास',
    nav_about: 'जानकारी',
    hero_eyebrow: 'AI-संचालित · तत्काल · निःशुल्क',
    hero_title_html: 'अपनी<br><em>दवाई जानें।</em>',
    hero_sub: 'किसी भी दवाई की पूरी जानकारी पाएं — खुराक का समय, दुष्प्रभाव, अन्य दवाओं से प्रतिक्रिया और सुरक्षित विकल्प। AI द्वारा संचालित।',
    tab_name: 'नाम से',
    tab_photo: 'फ़ोटो',
    search_placeholder: 'उदा. पैरासिटामोल, मेटफॉर्मिन, एमोक्सिसिलिन…',
    btn_identify: 'पहचानें',
    btn_identify_photo: 'फ़ोटो से पहचानें',
    btn_lookup: 'खोजें',
    try_label: 'आज़माएं:',
    upload_title: 'यहाँ दवाई की फ़ोटो डालें',
    upload_sub: 'या क्लिक करके चुनें — JPG, PNG, WebP, 10MB तक',
    barcode_hint: 'दवाई की पैकेजिंग या लेबल पर बारकोड देखें',
    history_title: 'खोज इतिहास',
    clear_all: 'सब हटाएं',
    about_title: 'MediCheck के बारे में',
    about_lead: 'MediCheck मरीजों और देखभाल करने वालों को उनकी दवाइयां समझने में मदद करता है। कोई जटिल शब्द नहीं।',
    about_card1_title: 'तीन तरीकों से पहचान',
    about_card1_desc: 'नाम टाइप करें, फ़ोटो अपलोड करें, या लेबल से बारकोड डालें।',
    about_card2_title: 'समय की जानकारी',
    about_card2_desc: 'खाने से पहले या बाद में, सुबह या रात — सब स्पष्ट रूप से दिखाया जाता है।',
    about_card3_title: 'सुरक्षा पहले',
    about_card3_desc: 'महत्वपूर्ण दुष्प्रभाव, दवाओं की प्रतिक्रिया और सावधानियां दिखाता है।',
    about_card4_title: 'विकल्प',
    about_card4_desc: 'जेनेरिक और वैकल्पिक दवाइयां दिखाता है ताकि आप डॉक्टर से बेहतर बात कर सकें।',
    about_card5_title: 'बहुभाषी',
    about_card5_desc: 'अंग्रेजी, हिंदी और कन्नड़ में उपलब्ध — ऊपर से भाषा बदलें।',
    about_card6_title: 'वॉयस असिस्टेंट',
    about_card6_desc: 'दवाई पहचाने के बाद स्पीकर बटन दबाएं और पूरी जानकारी सुनें।',
    disclaimer_title: '⚕️ चिकित्सा अस्वीकरण',
    disclaimer_text: 'MediCheck केवल सामान्य जानकारी प्रदान करता है। हमेशा अपने डॉक्टर या फार्मासिस्ट के निर्देशों का पालन करें।',
    voice_settings: 'आवाज़ सेटिंग',
    voice_speed: 'गति',
    voice_lang_label: 'भाषा में पढ़ें',
    btn_read_aloud: 'ज़ोर से पढ़ें',
    btn_stop: 'रोकें',
    history_empty: 'अभी तक कोई खोज नहीं। दवाई पहचानने के लिए शुरू करें।',
    loading_identifying: 'दवाई पहचानी जा रही है…',
    loading_photo: 'दवाई की फ़ोटो विश्लेषण हो रही है…',
    toast_enter_name: 'कृपया दवाई का नाम दर्ज करें',
    toast_select_photo: 'कृपया पहले फ़ोटो चुनें',
    toast_network: 'नेटवर्क त्रुटि। क्या सर्वर चल रहा है?',
    toast_copied: 'सारांश क्लिपबोर्ड पर कॉपी हो गया',
    toast_copy_fail: 'कॉपी नहीं हो सका',
    toast_history_cleared: 'इतिहास साफ़ हो गया',
    toast_no_result: 'पढ़ने के लिए कोई परिणाम नहीं',
    toast_tts_unavailable: 'इस ब्राउज़र में Text-to-Speech उपलब्ध नहीं है',
    label_overview: 'सारांश',
    label_when_to_take: 'कब लें',
    label_dosage: 'खुराक',
    label_side_effects: 'दुष्प्रभाव',
    label_precautions: 'सावधानियाँ',
    label_interactions: 'दवाओं की प्रतिक्रिया',
    label_alternatives: 'विकल्प और जेनेरिक',
    label_storage: 'भंडारण',
    label_additional: 'अतिरिक्त जानकारी',
    label_watch_for: '⚠ ध्यान रखें',
    label_pregnancy: 'गर्भावस्था',
    label_half_life: 'अर्ध-जीवन',
    label_confidence: 'AI विश्वास',
    label_generic: 'जेनेरिक',
    label_otc: '✓ बिना पर्चे के उपलब्ध',
    label_rx: 'Rx पर्चे की ज़रूरत',
    label_controlled: '⚠ नियंत्रित',
    label_no_precautions: 'कोई विशेष सावधानी नहीं।',
    food_before: '🌅 खाने से पहले',
    food_after: '🍽️ खाने के बाद',
    food_with: '🥗 खाने के साथ',
    food_any: '⏰ कभी भी',
    label_time_of_day: 'दिन का समय',
    label_frequency: 'आवृत्ति',
    label_as_directed: 'निर्देशानुसार',
    btn_print: '🖨 प्रिंट करें',
    btn_copy: '📋 सारांश कॉपी करें',
    btn_new_search: '🔍 नई खोज',
    btn_read_result: '🔊 ज़ोर से पढ़ें',
  },

  kn: {
    nav_search: 'ಹುಡುಕಿ',
    nav_history: 'ಇತಿಹಾಸ',
    nav_about: 'ಬಗ್ಗೆ',
    hero_eyebrow: 'AI-ಚಾಲಿತ · ತಕ್ಷಣ · ಉಚಿತ',
    hero_title_html: 'ನಿಮ್ಮ<br><em>ಔಷಧಿ ತಿಳಿಯಿರಿ.</em>',
    hero_sub: 'ಯಾವುದೇ ಔಷಧಿಯ ಸಂಪೂರ್ಣ ಮಾಹಿತಿ ಪಡೆಯಿರಿ — ಡೋಸೇಜ್ ಸಮಯ, ಅಡ್ಡ ಪರಿಣಾಮಗಳು, ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ಸುರಕ್ಷಿತ ಪರ್ಯಾಯಗಳು. AI ಮೂಲಕ.',
    tab_name: 'ಹೆಸರಿನಿಂದ',
    tab_photo: 'ಫೋಟೋ',
    search_placeholder: 'ಉದಾ. ಪ್ಯಾರಾಸಿಟಮಾಲ್, ಮೆಟ್‌ಫಾರ್ಮಿನ್…',
    btn_identify: 'ಗುರುತಿಸಿ',
    btn_identify_photo: 'ಫೋಟೋದಿಂದ ಗುರುತಿಸಿ',
    btn_lookup: 'ಹುಡುಕಿ',
    try_label: 'ಪ್ರಯತ್ನಿಸಿ:',
    upload_title: 'ಔಷಧಿ ಫೋಟೋ ಇಲ್ಲಿ ಹಾಕಿ',
    upload_sub: 'ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ — JPG, PNG, WebP 10MB ವರೆಗೆ',
    barcode_hint: 'ಔಷಧಿ ಪ್ಯಾಕೇಜಿಂಗ್ ಅಥವಾ ಲೇಬಲ್‌ನಲ್ಲಿ ಬಾರ್‌ಕೋಡ್ ಹುಡುಕಿ',
    history_title: 'ಹುಡುಕಾಟ ಇತಿಹಾಸ',
    clear_all: 'ಎಲ್ಲ ತೆಗೆಯಿರಿ',
    about_title: 'MediCheck ಬಗ್ಗೆ',
    about_lead: 'MediCheck ರೋಗಿಗಳು ಮತ್ತು ಆರೈಕೆದಾರರಿಗೆ ತಮ್ಮ ಔಷಧಿಗಳನ್ನು ಸರಳವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
    about_card1_title: 'ಮೂರು ರೀತಿಯ ಗುರುತಿಸುವಿಕೆ',
    about_card1_desc: 'ಹೆಸರು ಟೈಪ್ ಮಾಡಿ, ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಅಥವಾ ಬಾರ್‌ಕೋಡ್ ನಮೂದಿಸಿ.',
    about_card2_title: 'ಸಮಯ ಮಾರ್ಗದರ್ಶನ',
    about_card2_desc: 'ಊಟದ ಮೊದಲು ಅಥವಾ ನಂತರ, ಬೆಳಿಗ್ಗೆ ಅಥವಾ ರಾತ್ರಿ — ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸಲಾಗಿದೆ.',
    about_card3_title: 'ಸುರಕ್ಷತೆ ಮೊದಲು',
    about_card3_desc: 'ಮಹತ್ವದ ಅಡ್ಡ ಪರಿಣಾಮಗಳು, ಔಷಧ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳನ್ನು ಎತ್ತಿ ತೋರಿಸುತ್ತದೆ.',
    about_card4_title: 'ಪರ್ಯಾಯಗಳು',
    about_card4_desc: 'ವೈದ್ಯರೊಂದಿಗೆ ತಿಳಿದ ಮಾತುಕಥೆಗಾಗಿ ಜೆನೆರಿಕ್ ಮತ್ತು ಪರ್ಯಾಯ ಔಷಧಿಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.',
    about_card5_title: 'ಬಹುಭಾಷೆ',
    about_card5_desc: 'ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ಲಭ್ಯ — ಮೇಲಿನ ನ್ಯಾವಿಗೇಷನ್‌ನಿಂದ ಬದಲಾಯಿಸಿ.',
    about_card6_title: 'ಧ್ವನಿ ಸಹಾಯಕ',
    about_card6_desc: 'ಔಷಧಿ ಗುರುತಿಸಿದ ನಂತರ ಸ್ಪೀಕರ್ ಬಟನ್ ಒತ್ತಿ ಸಂಪೂರ್ಣ ಸಾರಾಂಶ ಕೇಳಿ.',
    disclaimer_title: '⚕️ ವೈದ್ಯಕೀಯ ಹಕ್ಕು ನಿರಾಕರಣೆ',
    disclaimer_text: 'MediCheck ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ ನೀಡುತ್ತದೆ. ಯಾವಾಗಲೂ ನಿಮ್ಮ ವೈದ್ಯರ ಅಥವಾ ಫಾರ್ಮಾಸಿಸ್ಟ್ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ.',
    voice_settings: 'ಧ್ವನಿ ಸೆಟ್ಟಿಂಗ್',
    voice_speed: 'ವೇಗ',
    voice_lang_label: 'ಭಾಷೆಯಲ್ಲಿ ಓದಿ',
    btn_read_aloud: 'ಜೋರಾಗಿ ಓದಿ',
    btn_stop: 'ನಿಲ್ಲಿಸಿ',
    history_empty: 'ಇನ್ನೂ ಯಾವ ಹುಡುಕಾಟವಿಲ್ಲ. ಔಷಧಿ ಗುರುತಿಸಿ ಪ್ರಾರಂಭಿಸಿ.',
    loading_identifying: 'ಔಷಧಿ ಗುರುತಿಸಲಾಗುತ್ತಿದೆ…',
    loading_photo: 'ಔಷಧಿ ಫೋಟೋ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
    toast_enter_name: 'ದಯವಿಟ್ಟು ಔಷಧಿ ಹೆಸರು ನಮೂದಿಸಿ',
    toast_select_photo: 'ದಯವಿಟ್ಟು ಮೊದಲು ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ',
    toast_network: 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ಸರ್ವರ್ ಚಾಲನೆಯಲ್ಲಿದೆಯೇ?',
    toast_copied: 'ಸಾರಾಂಶ ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ',
    toast_copy_fail: 'ನಕಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
    toast_history_cleared: 'ಇತಿಹಾಸ ತೆಗೆದು ಹಾಕಲಾಗಿದೆ',
    toast_no_result: 'ಓದಲು ಯಾವ ಫಲಿತಾಂಶವೂ ಇಲ್ಲ',
    toast_tts_unavailable: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ Text-to-Speech ಲಭ್ಯವಿಲ್ಲ',
    label_overview: 'ಅವಲೋಕನ',
    label_when_to_take: 'ಯಾವಾಗ ತೆಗೆದುಕೊಳ್ಳಬೇಕು',
    label_dosage: 'ಡೋಸ್',
    label_side_effects: 'ಅಡ್ಡ ಪರಿಣಾಮಗಳು',
    label_precautions: 'ಎಚ್ಚರಿಕೆಗಳು',
    label_interactions: 'ಔಷಧ ಪ್ರತಿಕ್ರಿಯೆಗಳು',
    label_alternatives: 'ಪರ್ಯಾಯಗಳು ಮತ್ತು ಜೆನೆರಿಕ್',
    label_storage: 'ಸಂಗ್ರಹಣೆ',
    label_additional: 'ಹೆಚ್ಚುವರಿ ಮಾಹಿತಿ',
    label_watch_for: '⚠ ಗಮನಿಸಿ',
    label_pregnancy: 'ಗರ್ಭಾವಸ್ಥೆ',
    label_half_life: 'ಅರ್ಧ-ಜೀವನ',
    label_confidence: 'AI ವಿಶ್ವಾಸ',
    label_generic: 'ಜೆನೆರಿಕ್',
    label_otc: '✓ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇಲ್ಲದೆ ಸಿಗುತ್ತದೆ',
    label_rx: 'Rx ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಬೇಕು',
    label_controlled: '⚠ ನಿಯಂತ್ರಿತ',
    label_no_precautions: 'ಯಾವ ವಿಶೇಷ ಎಚ್ಚರಿಕೆಯೂ ಇಲ್ಲ.',
    food_before: '🌅 ಊಟದ ಮೊದಲು',
    food_after: '🍽️ ಊಟದ ನಂತರ',
    food_with: '🥗 ಊಟದೊಂದಿಗೆ',
    food_any: '⏰ ಯಾವ ಸಮಯದಲ್ಲಾದರೂ',
    label_time_of_day: 'ದಿನದ ಸಮಯ',
    label_frequency: 'ಆವರ್ತನ',
    label_as_directed: 'ಸೂಚಿಸಿದಂತೆ',
    btn_print: '🖨 ಮುದ್ರಿಸಿ',
    btn_copy: '📋 ಸಾರಾಂಶ ನಕಲಿಸಿ',
    btn_new_search: '🔍 ಹೊಸ ಹುಡುಕಾಟ',
    btn_read_result: '🔊 ಜೋರಾಗಿ ಓದಿ',
  }
};

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n['en'][key] || key;
}

// ═══════════════════════════════════════
//  LANGUAGE SYSTEM
// ═══════════════════════════════════════
function setLanguage(lang) {
  if (!i18n[lang]) return;
  currentLang = lang;
  localStorage.setItem('medicheck_lang', lang);

  // update active lang button
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  // update html lang attribute
  document.documentElement.lang = lang;

  // update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key === 'hero_title_html') {
      el.innerHTML = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  // update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // sync voice panel language select to match UI language
  const voiceSel = document.getElementById('voice-lang-select');
  if (voiceSel) {
    const map = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
    voiceSel.value = map[lang] || 'en-IN';
  }

  // re-render result if present
  if (currentResult) {
    const content = document.getElementById('result-content');
    if (content) content.innerHTML = buildResultHTML(currentResult);
  }

  // re-render history if visible
  if (document.getElementById('page-history').style.display !== 'none') {
    renderHistory();
  }
}

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  navigate('home');
  loadSuggestions();
  updateHistoryBadge();
  setupDragDrop();
  setLanguage(currentLang);

  // voice speed slider
  const speedSlider = document.getElementById('voice-speed');
  const speedVal = document.getElementById('speed-val');
  if (speedSlider && speedVal) {
    speedSlider.addEventListener('input', () => {
      speedVal.textContent = parseFloat(speedSlider.value).toFixed(1) + '×';
    });
  }
});

// ═══════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const el = document.getElementById('page-' + page);
  if (el) { el.style.display = 'block'; el.classList.add('active'); }

  const btn = document.getElementById('nav-' + page);
  if (btn) btn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'history') renderHistory();
}

// ═══════════════════════════════════════
//  TAB SWITCH
// ═══════════════════════════════════════
function switchTab(tab) {
  ['text', 'photo', 'barcode'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.itab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

// ═══════════════════════════════════════
//  SUGGESTIONS
// ═══════════════════════════════════════
async function loadSuggestions() {
  const row = document.getElementById('suggestions-row');
  if (!row) return;
  const defaults = ['Paracetamol','Ibuprofen','Metformin','Amoxicillin','Omeprazole','Aspirin'];
  try {
    const res = await fetch(`${API_BASE}/api/medicine/suggestions`);
    const json = await res.json();
    const names = json.data ? json.data.slice(0, 6).map(d => d.name) : defaults;
    renderSuggestions(names);
  } catch(e) {
    renderSuggestions(defaults);
  }
}

function renderSuggestions(names) {
  const row = document.getElementById('suggestions-row');
  if (!row) return;
  row.innerHTML = '';
  const lbl = document.createElement('span');
  lbl.className = 'suggestions-label';
  lbl.textContent = t('try_label');
  row.appendChild(lbl);
  names.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.textContent = name;
    btn.onclick = () => quickSearch(name);
    row.appendChild(btn);
  });
}

function quickSearch(name) {
  navigate('home');
  const input = document.getElementById('med-input');
  if (input) input.value = name;
  switchTab('text');
  setTimeout(doSearch, 80);
}

// ═══════════════════════════════════════
//  LOADING
// ═══════════════════════════════════════
function showLoading(msg) {
  isLoading = true;
  const lo = document.getElementById('loading-overlay');
  const rw = document.getElementById('result-wrapper');
  if (lo) { lo.style.display = 'block'; document.getElementById('loading-msg').textContent = msg || t('loading_identifying'); }
  if (rw) rw.style.display = 'none';
  document.querySelectorAll('.btn-primary').forEach(b => b.disabled = true);
}

function hideLoading() {
  isLoading = false;
  const lo = document.getElementById('loading-overlay');
  if (lo) lo.style.display = 'none';
  document.querySelectorAll('.btn-primary').forEach(b => b.disabled = false);
}

// ═══════════════════════════════════════
//  SEARCH BY TEXT
// ═══════════════════════════════════════
async function doSearch() {
  if (isLoading) return;
  const input = document.getElementById('med-input');
  const query = input ? input.value.trim() : '';
  if (!query) { showToast(t('toast_enter_name'), true); return; }

  showLoading(`${t('loading_identifying').replace('…','')} "${query}"…`);

  try {
    const res = await fetch(`${API_BASE}/api/medicine/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    if (!res.ok) { hideLoading(); showToast((json.error || 'Error') + (json.suggestion ? ' — ' + json.suggestion : ''), true); return; }
    handleResult(json.data, query);
  } catch(e) {
    hideLoading();
    showToast(t('toast_network'), true);
  }
}

// ═══════════════════════════════════════
//  SEARCH BY PHOTO
// ═══════════════════════════════════════
function handlePhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('photo-preview');
  const previewWrap = document.getElementById('preview-wrap');
  const previewName = document.getElementById('preview-name');
  const reader = new FileReader();
  reader.onload = e => {
    if (preview) { preview.src = e.target.result; }
    if (previewWrap) previewWrap.style.display = 'block';
    if (previewName) previewName.textContent = file.name;
  };
  reader.readAsDataURL(file);
}

async function searchByPhoto() {
  if (isLoading) return;
  const fileInput = document.getElementById('photo-input');
  if (!fileInput || !fileInput.files[0]) { showToast(t('toast_select_photo'), true); return; }

  showLoading(t('loading_photo'));

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/api/medicine/image`, { method: 'POST', body: formData });
    const json = await res.json();
    if (!res.ok) { hideLoading(); showToast((json.error || 'Error') + (json.suggestion ? ' — ' + json.suggestion : ''), true); return; }
    handleResult(json.data, 'Photo upload');
  } catch(e) {
    hideLoading();
    showToast(t('toast_network'), true);
  }
}

// ═══════════════════════════════════════
//  SEARCH BY BARCODE
// ═══════════════════════════════════════
async function searchByBarcode() {
  if (isLoading) return;
  const input = document.getElementById('barcode-input');
  const barcode = input ? input.value.trim() : '';
  if (!barcode) { showToast(t('toast_enter_name'), true); return; }

  showLoading(`Looking up barcode ${barcode}…`);

  try {
    const res = await fetch(`${API_BASE}/api/medicine/barcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode })
    });
    const json = await res.json();
    if (!res.ok) { hideLoading(); showToast((json.error || 'Error') + (json.suggestion ? ' — ' + json.suggestion : ''), true); return; }
    handleResult(json.data, barcode);
  } catch(e) {
    hideLoading();
    showToast(t('toast_network'), true);
  }
}

// ═══════════════════════════════════════
//  DRAG & DROP
// ═══════════════════════════════════════
function setupDragDrop() {
  const zone = document.getElementById('upload-label');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--blue)'; zone.style.background = 'var(--blue-light)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; zone.style.background = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileInput = document.getElementById('photo-input');
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      handlePhotoSelect(fileInput);
    } else {
      showToast('Please drop an image file', true);
    }
  });
}

// ═══════════════════════════════════════
//  HANDLE RESULT
// ═══════════════════════════════════════
function handleResult(data, query) {
  currentResult = data;
  hideLoading();
  addToHistory(data, query);

  const html = buildResultHTML(data);
  const wrapper = document.getElementById('result-wrapper');
  const content = document.getElementById('result-content');

  if (wrapper && content) {
    content.innerHTML = html;
    wrapper.style.display = 'block';
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // show voice FAB
  const fab = document.getElementById('voice-fab');
  if (fab) fab.style.display = 'flex';
}

// ═══════════════════════════════════════
//  BUILD RESULT HTML (i18n-aware)
// ═══════════════════════════════════════
function buildResultHTML(d) {
  const confidence = d.confidence || 'Medium';
  const dots = ['High', 'Medium', 'Low'].map((level, i) => {
    const filled = (confidence === 'High' && i <= 2) ||
                   (confidence === 'Medium' && i <= 1) ||
                   (confidence === 'Low' && i === 0);
    const cls = filled ? `filled-${confidence.toLowerCase()}` : '';
    return `<div class="cdot ${cls}"></div>`;
  }).join('');

  const foodKey = { before: 'food_before', after: 'food_after', with: 'food_with', any: 'food_any' }[d.timing?.food] || 'food_any';
  const foodClass = { before: 'food-before', after: 'food-after', with: 'food-with', any: 'food-any' }[d.timing?.food] || 'food-any';
  const foodLabel = t(foodKey);

  const timeOfDay = Array.isArray(d.timing?.time_of_day)
    ? d.timing.time_of_day.map(ti => ti.charAt(0).toUpperCase() + ti.slice(1)).join(' & ')
    : (d.timing?.time_of_day || t('label_as_directed'));

  const commonSE = (d.side_effects?.common || []).map(se => `<span class="se-tag">${escHtml(se)}</span>`).join('');

  const precautions = (d.precautions || []).map(p => `<div class="precaution-item">${escHtml(p)}</div>`).join('');

  const interactions = (d.interactions || []).map(item => {
    const sevCls = { Major: 'sev-major', Moderate: 'sev-moderate', Minor: 'sev-minor' }[item.severity] || 'sev-minor';
    return `<div class="interaction-item">
      <div class="interaction-severity ${sevCls}">${item.severity}</div>
      <div class="interaction-right">
        <div class="interaction-drug">${escHtml(item.drug)}</div>
        <div class="interaction-reason">${escHtml(item.reason)}</div>
      </div>
    </div>`;
  }).join('');

  const alts = (d.alternatives || []).map(alt =>
    `<button class="alt-item" onclick="quickSearch('${escHtml(alt)}')" title="Search ${escHtml(alt)}">
      <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.4"/><path d="M9 9l2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      ${escHtml(alt)}
    </button>`
  ).join('');

  return `
<div class="result-card">
  <div class="result-header">
    <div class="result-header-left">
      <div class="result-name">${escHtml(d.name || 'Unknown Medicine')}</div>
      <div class="result-generic">${t('label_generic')}: <span>${escHtml(d.generic || '—')}</span></div>
      <div class="result-meta-badges">
        ${d.drug_class ? `<span class="meta-badge drug-class">💊 ${escHtml(d.drug_class)}</span>` : ''}
        ${d.otc ? `<span class="meta-badge otc">${t('label_otc')}</span>` : `<span class="meta-badge rx">${t('label_rx')}</span>`}
        ${d.controlled ? `<span class="meta-badge controlled">${t('label_controlled')}</span>` : ''}
        ${d.pregnancy_category ? `<span class="meta-badge preg">Pregnancy: ${escHtml(d.pregnancy_category)}</span>` : ''}
      </div>
    </div>
    <div class="confidence-wrap">
      <span class="confidence-label">${t('label_confidence')}</span>
      <div class="confidence-dots">${dots}</div>
      <span style="font-size:12px;color:var(--text-3)">${confidence}</span>
    </div>
  </div>

  <div class="result-grid">
    <div class="rsection full-width">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--blue-light)">📋</span>${t('label_overview')}</div>
      <p class="result-desc">${escHtml(d.description || '—')}</p>
    </div>

    <div class="rsection">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--green-light)">⏰</span>${t('label_when_to_take')}</div>
      <div class="food-badge ${foodClass}">${foodLabel}</div>
      ${d.timing?.food_note ? `<p style="font-size:13px;color:var(--text-3);margin-bottom:12px">${escHtml(d.timing.food_note)}</p>` : ''}
      <div class="timing-grid">
        <div class="timing-item">
          <div class="timing-item-label">${t('label_time_of_day')}</div>
          <div class="timing-item-value">${escHtml(timeOfDay)}</div>
        </div>
        <div class="timing-item">
          <div class="timing-item-label">${t('label_frequency')}</div>
          <div class="timing-item-value">${escHtml(d.timing?.frequency || t('label_as_directed'))}</div>
        </div>
      </div>
    </div>

    <div class="rsection no-right">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--purple-light)">💉</span>${t('label_dosage')}</div>
      <div class="dosage-main">${escHtml(d.dosage?.standard || '—')} <span style="font-size:18px;color:var(--text-3)">${escHtml(d.dosage?.unit || '')}</span></div>
      <p class="dosage-detail">${escHtml(d.dosage?.detail || d.dosage?.per_dose || '—')}</p>
      ${d.dosage?.max_daily ? `<div class="dosage-max">⚠ ${escHtml(d.dosage.max_daily)}</div>` : ''}
    </div>

    <div class="rsection">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--orange-light)">⚠️</span>${t('label_side_effects')}</div>
      ${commonSE ? `<div class="se-common">${commonSE}</div>` : ''}
      ${d.side_effects?.important ? `
        <div class="se-important">
          <div>
            <div class="se-imp-label">${t('label_watch_for')}</div>
            <div class="se-imp-text">${escHtml(d.side_effects.important)}</div>
          </div>
        </div>` : ''}
    </div>

    <div class="rsection no-right">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--orange-light)">🚫</span>${t('label_precautions')}</div>
      <div class="precaution-list">${precautions || `<p style="font-size:14px;color:var(--text-3)">${t('label_no_precautions')}</p>`}</div>
    </div>

    ${d.interactions && d.interactions.length > 0 ? `
    <div class="rsection full-width">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--red-light)">🔗</span>${t('label_interactions')}</div>
      <div class="interaction-list">${interactions}</div>
    </div>` : ''}

    ${d.alternatives && d.alternatives.length > 0 ? `
    <div class="rsection full-width">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--blue-light)">🔄</span>${t('label_alternatives')}</div>
      <div class="alt-list">${alts}</div>
    </div>` : ''}

    <div class="rsection ${d.pregnancy_note || d.half_life ? '' : 'full-width'}">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--surface-2)">📦</span>${t('label_storage')}</div>
      <div class="storage-row">🌡️ <span>${escHtml(d.storage || 'Store as per label instructions.')}</span></div>
    </div>

    ${d.pregnancy_note || d.half_life ? `
    <div class="rsection no-right">
      <div class="rsection-title"><span class="rsection-title-icon" style="background:var(--purple-light)">ℹ️</span>${t('label_additional')}</div>
      <div class="misc-list">
        ${d.pregnancy_note ? `<div class="misc-row"><span class="misc-row-label">${t('label_pregnancy')}</span><span class="misc-row-val" style="max-width:60%;text-align:right;font-size:12.5px">${escHtml(d.pregnancy_note)}</span></div>` : ''}
        ${d.half_life ? `<div class="misc-row"><span class="misc-row-label">${t('label_half_life')}</span><span class="misc-row-val">${escHtml(d.half_life)}</span></div>` : ''}
      </div>
    </div>` : ''}
  </div>

  <div class="result-actions">
    <button class="btn-ghost" onclick="window.print()">${t('btn_print')}</button>
    <button class="btn-ghost" onclick="copyResult()">${t('btn_copy')}</button>
    <button class="btn-ghost" onclick="readAloud()">🔊 ${t('btn_read_result').replace('🔊','').trim()}</button>
    <button class="btn-ghost" onclick="navigate('home');document.getElementById('med-input').focus()">${t('btn_new_search')}</button>
  </div>
</div>`;
}

// ═══════════════════════════════════════
//  VOICE ASSISTANT
// ═══════════════════════════════════════
function toggleVoicePanel() {
  voicePanelOpen = !voicePanelOpen;
  const panel = document.getElementById('voice-panel');
  if (panel) panel.classList.toggle('open', voicePanelOpen);
}

function updateVoiceLang() {
  // just reading from select when needed
}

function buildSpeechText(d) {
  if (!d) return '';
  const timeOfDay = Array.isArray(d.timing?.time_of_day)
    ? d.timing.time_of_day.join(' and ')
    : (d.timing?.time_of_day || 'as directed');
  const sideEffects = (d.side_effects?.common || []).join(', ');
  const precautions = (d.precautions || []).join('. ');
  const interactions = (d.interactions || []).map(i => `${i.drug} — ${i.reason}`).join('. ');

  // English base text (TTS engines handle it best)
  return [
    `${d.name}.`,
    d.generic ? `Generic name: ${d.generic}.` : '',
    d.drug_class ? `Drug class: ${d.drug_class}.` : '',
    d.description ? `About this medicine: ${d.description}` : '',
    `When to take: ${d.timing?.food === 'after' ? 'after food' : d.timing?.food === 'before' ? 'before food' : d.timing?.food === 'with' ? 'with food' : 'any time'}.`,
    `Time of day: ${timeOfDay}.`,
    d.timing?.frequency ? `Frequency: ${d.timing.frequency}.` : '',
    d.dosage?.standard ? `Dosage: ${d.dosage.standard} ${d.dosage.unit || ''}. ${d.dosage.detail || ''}` : '',
    d.dosage?.max_daily ? `Maximum daily dose: ${d.dosage.max_daily}.` : '',
    sideEffects ? `Common side effects include: ${sideEffects}.` : '',
    d.side_effects?.important ? `Important warning: ${d.side_effects.important}.` : '',
    precautions ? `Precautions: ${precautions}.` : '',
    interactions ? `Drug interactions: ${interactions}.` : '',
    d.storage ? `Storage: ${d.storage}` : '',
    'This information is for general guidance only. Always consult your doctor or pharmacist.'
  ].filter(Boolean).join(' ');
}

function readAloud() {
  if (!currentResult) { showToast(t('toast_no_result'), true); return; }
  if (!window.speechSynthesis) { showToast(t('toast_tts_unavailable'), true); return; }

  stopSpeech();

  const text = buildSpeechText(currentResult);
  const utterance = new SpeechSynthesisUtterance(text);

  // get selected voice language
  const voiceSel = document.getElementById('voice-lang-select');
  const voiceLang = voiceSel ? voiceSel.value : 'en-IN';
  utterance.lang = voiceLang;

  // speed
  const speedSlider = document.getElementById('voice-speed');
  utterance.rate = speedSlider ? parseFloat(speedSlider.value) : 0.9;

  // try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang === voiceLang) ||
                voices.find(v => v.lang.startsWith(voiceLang.split('-')[0])) ||
                voices.find(v => v.lang.startsWith('en'));
  if (match) utterance.voice = match;

  // FAB state
  const fab = document.getElementById('voice-fab');
  if (fab) fab.classList.add('speaking');

  utterance.onend = () => { if (fab) fab.classList.remove('speaking'); currentUtterance = null; };
  utterance.onerror = () => { if (fab) fab.classList.remove('speaking'); currentUtterance = null; };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);

  // close panel
  voicePanelOpen = false;
  const panel = document.getElementById('voice-panel');
  if (panel) panel.classList.remove('open');
}

function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  const fab = document.getElementById('voice-fab');
  if (fab) fab.classList.remove('speaking');
  currentUtterance = null;
}

// Load voices asynchronously (some browsers need this)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

// ═══════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════
function addToHistory(data, query) {
  const entry = {
    id: Date.now(),
    name: data.name || query,
    generic: data.generic || '',
    drug_class: data.drug_class || '',
    time: new Date().toISOString(),
    data
  };
  history = [entry, ...history.filter(h => h.name !== entry.name)].slice(0, 30);
  try { localStorage.setItem('medicheck_history', JSON.stringify(history)); } catch(e) {}
  updateHistoryBadge();
}

function updateHistoryBadge() {
  const badge = document.getElementById('history-badge');
  if (!badge) return;
  if (history.length > 0) { badge.textContent = history.length; badge.style.display = 'inline-flex'; }
  else { badge.style.display = 'none'; }
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (history.length === 0) {
    list.innerHTML = `<div class="history-empty"><div class="history-empty-icon">🔍</div>${t('history_empty')}</div>`;
    return;
  }
  list.innerHTML = history.map(entry => {
    const timeStr = formatRelativeTime(entry.time);
    return `
      <div class="history-item" onclick="replayHistory(${entry.id})">
        <div class="history-icon">💊</div>
        <div class="history-info">
          <div class="history-name">${escHtml(entry.name)}</div>
          <div class="history-sub">${escHtml(entry.generic || entry.drug_class || '')}</div>
        </div>
        <div class="history-time">${timeStr}</div>
      </div>`;
  }).join('');
}

function replayHistory(id) {
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  navigate('home');
  setTimeout(() => handleResult(entry.data, entry.name), 100);
}

function clearHistory() {
  history = [];
  try { localStorage.removeItem('medicheck_history'); } catch(e) {}
  updateHistoryBadge();
  renderHistory();
  showToast(t('toast_history_cleared'));
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ═══════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════
function copyResult() {
  if (!currentResult) return;
  const d = currentResult;
  const timeOfDay = Array.isArray(d.timing?.time_of_day)
    ? d.timing.time_of_day.join(' & ')
    : (d.timing?.time_of_day || 'As directed');
  const text = [
    `Medicine: ${d.name} (${d.generic})`,
    `Class: ${d.drug_class}`,
    ``,
    `WHEN TO TAKE:`,
    `  Food: ${d.timing?.food || 'as directed'} — ${d.timing?.food_note || ''}`,
    `  Time: ${timeOfDay}`,
    `  Frequency: ${d.timing?.frequency || 'as directed'}`,
    ``,
    `DOSAGE: ${d.dosage?.standard} ${d.dosage?.unit} — ${d.dosage?.detail}`,
    d.dosage?.max_daily ? `  ⚠ ${d.dosage.max_daily}` : '',
    ``,
    `SIDE EFFECTS:`,
    `  Common: ${(d.side_effects?.common || []).join(', ')}`,
    d.side_effects?.important ? `  Watch for: ${d.side_effects.important}` : '',
    ``,
    `PRECAUTIONS:`,
    ...(d.precautions || []).map(p => `  • ${p}`),
    ``,
    `STORAGE: ${d.storage}`,
    ``,
    `Generated by MediCheck — For informational purposes only. Consult your doctor or pharmacist.`
  ].filter(l => l !== undefined && l !== null).join('\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast(t('toast_copied')))
    .catch(() => showToast(t('toast_copy_fail'), true));
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
