const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const CLIENT_ID = 'fxxny3g1a5svpmrqphc4nz8suq4etx';
const CLIENT_SECRET = 'c5iw3gkqipzq2hi90dwh061ktsskrx';
let ACCESS_TOKEN = '';

// Configurez CORS pour autoriser uniquement votre domaine frontend
const corsOptions = {
    origin: 'https://basilelgr.github.io', // Domaine de votre frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes HTTP autorisées
    credentials: true, // Si vous utilisez des cookies ou des sessions
};

// Appliquez les options CORS au middleware
app.use(cors(corsOptions));

// Fonction pour obtenir un access token
const getAccessToken = async () => {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
        },
    });
    ACCESS_TOKEN = response.data.access_token;
};

// Route pour récupérer les clips Twitch
app.get('/clips', async (req, res) => {
    try {
        const username = 'kamet0';
        if (!ACCESS_TOKEN) await getAccessToken();

        // Récupère l'ID du broadcaster
        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: { login: username },
        });

        const broadcaster_id = userResponse.data.data[0].id;

        // Récupère les clips du broadcaster
        const clipsResponse = await axios.get('https://api.twitch.tv/helix/clips', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: {
                broadcaster_id,
                first: 10,
            },
        });

        // Vérifie que les URLs des clips sont valides
        const validClips = clipsResponse.data.data.map((clip) => ({
            ...clip,
            embed_url: `${clip.embed_url}&parent=basilelgr.github.io`, // Ajoute automatiquement le domaine parent
        }));

        res.json({ data: validClips });
    } catch (error) {
        console.error('Erreur lors de la récupération des clips:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001; // Render attribue un port via process.env.PORT
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
