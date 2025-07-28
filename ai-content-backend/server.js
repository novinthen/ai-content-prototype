// ai-content-backend/server.js

const express = require('express');
const cors = require('cors'); // Import the cors package
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');
require('dotenv').config();

// --- Firebase Admin Setup ---
// Make sure your serviceAccountKey.json is in the same directory
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Express App Setup ---
const app = express();

// --- CORS Configuration ---
// This is the crucial part to fix the error.
// It allows requests ONLY from your frontend application.
const corsOptions = {
  origin: 'https://news-gen-frontend.vercel.app' // Or your frontend's URL
};

app.use(cors(corsOptions)); // Use the cors middleware
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Routes ---
// These routes are based on your frontend code's API calls.

// Route for generating content (from AdminDashboard.js)
app.post('/generate', async (req, res) => {
  // Your generation logic will go here
  console.log('Generate request received:', req.body);
  // Add your implementation for scraping and AI generation
  res.json({ message: "Generation started successfully." });
});

// Route for fetching all generations (from AdminDashboard.js)
app.get('/generations', async (req, res) => {
  console.log('Fetching all generations');
  // Your logic to get all generations from Firestore
  res.json([]); // Placeholder response
});

// Route for fetching generations for a specific cabang (from UserInterface.js)
app.get('/generations/:cabang', async (req, res) => {
  const { cabang } = req.params;
  console.log(`Fetching generations for cabang: ${cabang}`);
  // Your logic to get generations for a specific cabang
  res.json([]); // Placeholder response
});

// Route for logging a view (from UserInterface.js)
app.post('/view', async (req, res) => {
  console.log('View received:', req.body);
  // Your logic to log a view in Firestore
  res.json({ message: "View logged." });
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
