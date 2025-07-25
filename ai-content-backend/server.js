require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
  res.send('Backend is up and running!');
});

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  databaseURL: 'https://ai-content-prototype.firebaseio.com'
});
const db = admin.firestore();
console.log('Firebase initialized successfully');

const CABANGS = [
  'CABANG – KEPONG', 'CABANG – BATU', 'CABANG – WANGSA MAJU', 'CABANG – SEGAMBUT',
  'CABANG – SETIAWANGSA', 'CABANG – TITIWANGSA', 'CABANG – BUKIT BINTANG',
  'CABANG – LEMBAH PANTAI', 'CABANG – SEPUTEH', 'CABANG – CHERAS',
  'CABANG – BANDAR TUN RAZAK', 'CABANG – PUTRAJAYA', 'CABANG – LABUAN'
];

async function scrapeArticle(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const articleText = $('article, .post-content, p').text().trim();
    if (!articleText) throw new Error('No content found');
    return articleText.slice(0, 5000);
  } catch (error) {
    throw new Error('Unable to fetch article—please check the link');
  }
}

async function generateContent(articleText, type) {
  const pairs = [];
  const model = 'gemini-1.5-flash';
  for (let i = 0; i < 13; i++) {
    const prompt = `Based on this article: "${articleText}". Generate one unique pair of social media content in formal Malay. ${
      type === 'PRO' 
        ? 'Supportive of Datuk Seri Anwar Ibrahim as PM, highlighting positives. Facebook: 6-10 sentences. Tweet: <280 chars, casual phrasing, condensed version.' 
        : 'Aggressively critical of Perikatan Nasional, pointing out flaws ethically. Facebook: 6-10 sentences. Tweet: <280 chars, casual phrasing, condensed version.'
    } Rephrase core ideas differently from previous pairs. Output as JSON: {facebookPost: "...", tweet: "..."}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      }
    );

    const generatedText = response.data.candidates[0].content.parts[0].text;
    const cleanedText = generatedText.replace(/```json|```/g, '').trim();
    const generated = JSON.parse(cleanedText);
    pairs.push({ cabang: CABANGS[i], ...generated });
  }
  return pairs;
}

app.post('/generate', async (req, res) => {
  const { url, type } = req.body;
  try {
    const articleText = await scrapeArticle(url);
    const pairs = await generateContent(articleText, type);
    const timestamp = admin.firestore.Timestamp.now();
    const docRef = await db.collection('generations').add({
      articleUrl: url,
      type,
      timestampGenerated: timestamp,
      pairs,
      views: []
    });
    res.json({ success: true, generationId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/generations', async (req, res) => {
  const snapshot = await db.collection('generations').orderBy('timestampGenerated', 'desc').get();
  const generations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(generations);
});

app.get('/generations/:cabang', async (req, res) => {
  const { cabang } = req.params;
  if (!CABANGS.includes(cabang)) return res.status(400).json({ error: 'Invalid Cabang name' });

  const snapshot = await db.collection('generations').orderBy('timestampGenerated', 'desc').get();
  const generations = snapshot.docs.map(doc => {
    const data = doc.data();
    const pair = data.pairs.find(p => p.cabang === cabang);
    return { id: doc.id, timestamp: data.timestampGenerated.toDate(), articleUrl: data.articleUrl, type: data.type, pair };
  }).filter(g => g.pair);
  if (generations.length === 0) return res.json({ error: 'No content available—contact admin' });
  res.json(generations);
});

app.post('/view', async (req, res) => {
  const { generationId, cabang } = req.body;
  const timestamp = admin.firestore.Timestamp.now();
  await db.collection('generations').doc(generationId).update({
    views: admin.firestore.FieldValue.arrayUnion({ cabang, timestampViewed: timestamp, generationId })
  });
  res.json({ success: true });
});
console.log('Routes defined: /generate, /generations, /generations/:cabang, /view');
app.listen(process.env.PORT || 5000, () => console.log(`Backend running on port ${process.env.PORT}`));
