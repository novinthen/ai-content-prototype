// ai-content-backend/server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// --- Firebase Admin and Google AI Setup ---
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// --- List of Cabangs ---
// This list is used to generate content for each branch.
const CABANGS = [
    "CABANG – KEPONG", "CABANG - KLANG", "CABANG - AMPANG", "CABANG - KAJANG",
    "CABANG - PETALING JAYA", "CABANG - RAWANG", "CABANG - SHAH ALAM", "CABANG - SUBANG JAYA",
    "CABANG - PUCHONG", "CABANG - SERI KEMBANGAN", "CABANG - CYBERJAYA", "CABANG - PUTRAJAYA",
    "CABANG - BANGI", "CABANG - SEMENYIH", "CABANG - CHERAS"
];

// --- Express App Setup ---
const app = express();
const corsOptions = {
  origin: ['https://news-gen-frontend.vercel.app', 'http://localhost:3000'], // Allow both Vercel and local development
  methods: "GET,POST,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Helper Function for AI Content Generation ---
async function generateAIContent(articleText, type, cabang) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const proAntiInstruction = type === 'PRO' ? "supportive and positive" : "critical and opposing";
    const prompt = `
      Based on the following news article text, create a Facebook post and a Tweet for the branch "${cabang}".
      The tone should be ${proAntiInstruction} towards the main subject of the article.
      Format the output as a valid JSON object with two keys: "facebookPost" and "tweet".

      Article Text:
      """
      ${articleText.substring(0, 3000)}
      """
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    // Clean the response to ensure it is valid JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
}

// --- API Routes ---

// GET /: Health check route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Backend is running successfully." });
});


// POST /generate: Scrape a URL and generate content for all cabangs
app.post('/generate', async (req, res) => {
    const { url, type } = req.body;
    if (!url || !type) {
        return res.status(400).json({ error: 'URL and type are required.' });
    }

    try {
        // 1. Scrape article text from the URL
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const articleText = $('body').text().replace(/\s\s+/g, ' ').trim();

        if (!articleText) {
            return res.status(400).json({ error: 'Could not extract text from the URL.' });
        }

        // 2. Generate content for each cabang and store it
        const generationPairs = [];
        for (const cabang of CABANGS) {
            const aiContent = await generateAIContent(articleText, type, cabang);
            generationPairs.push({
                cabang: cabang,
                facebookPost: aiContent.facebookPost,
                tweet: aiContent.tweet
            });
        }

        // 3. Save the new generation to Firestore
        const generationDoc = {
            articleUrl: url,
            type: type,
            timestampGenerated: admin.firestore.FieldValue.serverTimestamp(),
            pairs: generationPairs,
            views: []
        };
        const docRef = await db.collection('generations').add(generationDoc);

        res.status(201).json({ message: 'Generation complete!', id: docRef.id });

    } catch (error) {
        console.error('Error in /generate:', error);
        res.status(500).json({ error: 'Failed to generate content.' });
    }
});

// GET /generations: Fetch all archived generations for the admin dashboard
app.get('/generations', async (req, res) => {
    try {
        const snapshot = await db.collection('generations').orderBy('timestampGenerated', 'desc').get();
        const generations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(generations);
    } catch (error) {
        console.error('Error in /generations:', error);
        res.status(500).json({ error: 'Failed to fetch generations.' });
    }
});

// GET /generations/:cabang: Fetch content for a specific user/cabang
app.get('/generations/:cabang', async (req, res) => {
    const { cabang } = req.params;
    if (!cabang) {
        return res.status(400).json({ error: 'Cabang parameter is required.' });
    }

    try {
        const snapshot = await db.collection('generations').orderBy('timestampGenerated', 'desc').get();
        if (snapshot.empty) {
            return res.json([]);
        }

        const availableContent = snapshot.docs.map(doc => {
            const data = doc.data();
            const pair = data.pairs.find(p => p.cabang.toUpperCase() === cabang.toUpperCase());
            if (!pair) return null;

            return {
                id: doc.id,
                articleUrl: data.articleUrl,
                type: data.type,
                timestamp: data.timestampGenerated.toDate(),
                pair: pair
            };
        }).filter(Boolean); // Filter out any null entries

        if (availableContent.length === 0) {
            return res.json({ error: `No content found for ${cabang}` });
        }

        res.status(200).json(availableContent);

    } catch (error) {
        console.error(`Error fetching content for ${cabang}:`, error);
        res.status(500).json({ error: 'Failed to fetch content.' });
    }
});

// POST /view: Log when a user views content
app.post('/view', async (req, res) => {
    const { generationId, cabang } = req.body;
    if (!generationId || !cabang) {
        return res.status(400).json({ error: 'generationId and cabang are required.' });
    }

    try {
        const docRef = db.collection('generations').doc(generationId);
        await docRef.update({
            views: admin.firestore.FieldValue.arrayUnion({
                cabang: cabang,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            })
        });
        res.status(200).json({ message: 'View logged successfully.' });
    } catch (error) {
        console.error('Error logging view:', error);
        res.status(500).json({ error: 'Failed to log view.' });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
