const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const CLIENT_ID = 'fxxny3g1a5svpmrqphc4nz8suq4etx';
const CLIENT_SECRET = 'c5iw3gkqipzq2hi90dwh061ktsskrx';
let ACCESS_TOKEN = '';

const corsOptions = {
    origin: 'https://basilelgr.github.io',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

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

app.get('/clips', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    try {
        if (!ACCESS_TOKEN) await getAccessToken();

        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: { login: username },
        });

        const broadcaster_id = userResponse.data.data[0].id;

        const started_at = new Date();
        started_at.setDate(started_at.getDate() - 7);
        const started_at_iso = started_at.toISOString();

        const clipsResponse = await axios.get('https://api.twitch.tv/helix/clips', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: {
                broadcaster_id,
                first: 20,
                started_at: started_at_iso,
            },
        });

        const validClips = clipsResponse.data.data.map((clip) => ({
            ...clip,
            embed_url: `${clip.embed_url}&parent=basilelgr.github.io`,
        }));

        res.json({ data: validClips });
    } catch (error) {
        console.error('Erreur lors de la récupération des clips:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
