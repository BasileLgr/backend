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
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials',
            },
        });
        ACCESS_TOKEN = response.data.access_token;
    } catch (error) {
        console.error('Erreur lors de la récupération du token d\'accès:', error.message || error);
    }
};

const calculateStartDate = (duration) => {
    if (duration === 'All') return null;
    const startDate = new Date();
    if (duration === '24h') startDate.setDate(startDate.getDate() - 1);
    else if (duration === '7J') startDate.setDate(startDate.getDate() - 7);
    else if (duration === '30J') startDate.setDate(startDate.getDate() - 30);
    return startDate.toISOString();
};

app.get('/clips', async (req, res) => {
    const { username, gameName, duration = '7J', limit = 12, cursor = null } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Le paramètre username est requis' });
    }

    try {
        if (!ACCESS_TOKEN) await getAccessToken();

        const startDate = calculateStartDate(duration);

        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: { login: username },
        });

        if (!userResponse.data.data.length) {
            return res.status(404).json({ error: 'Diffuseur introuvable' });
        }

        const broadcaster_id = userResponse.data.data[0].id;

        const clipsParams = {
            broadcaster_id,
            first: limit,
        };
        if (cursor) clipsParams.after = cursor;
        if (startDate) clipsParams.started_at = startDate;

        const clipsResponse = await axios.get('https://api.twitch.tv/helix/clips', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: clipsParams,
        });

        let clips = clipsResponse.data.data;

        if (gameName) {
            const gameResponse = await axios.get('https://api.twitch.tv/helix/games', {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
                params: { name: gameName },
            });

            if (!gameResponse.data.data.length) {
                return res.status(404).json({ error: 'Jeu introuvable' });
            }

            const game_id = gameResponse.data.data[0].id;

            clips = clips.filter((clip) => clip.game_id === game_id);
        }

        const validClips = clips.map((clip) => ({
            ...clip,
            video_url: clip.thumbnail_url.replace('-preview-480x272.jpg', '.mp4'), // Assure le lien vidéo correct
            embed_url: `${clip.embed_url}&parent=basilelgr.github.io`,
        }));

        const pagination = clipsResponse.data.pagination || null;

        res.json({ data: validClips, pagination });
    } catch (error) {
        console.error('Erreur lors de la récupération des clips:', error.message || error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

const generateDownloadUrl = (thumbnailUrl) => {
    return thumbnailUrl.replace(/-preview-\d+x\d+\.jpg$/, '.mp4');
};

app.get('/clips', async (req, res) => {
    const { username, gameName, duration = '7J', limit = 12, offset = null } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Le paramètre username est requis' });
    }

    try {
        if (!ACCESS_TOKEN) await getAccessToken();

        const startDate = calculateStartDate(duration);

        const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: { login: username },
        });

        if (!userResponse.data.data.length) {
            return res.status(404).json({ error: 'Diffuseur introuvable' });
        }

        const broadcaster_id = userResponse.data.data[0].id;

        const clipsParams = {
            broadcaster_id,
            first: limit,
        };
        if (offset) clipsParams.after = offset;
        if (startDate) clipsParams.started_at = startDate;

        const clipsResponse = await axios.get('https://api.twitch.tv/helix/clips', {
            headers: {
                'Client-ID': CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
            params: clipsParams,
        });

        let clips = clipsResponse.data.data;

        if (gameName) {
            const gameResponse = await axios.get('https://api.twitch.tv/helix/games', {
                headers: {
                    'Client-ID': CLIENT_ID,
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
                params: { name: gameName },
            });

            if (!gameResponse.data.data.length) {
                return res.status(404).json({ error: 'Jeu introuvable' });
            }

            const game_id = gameResponse.data.data[0].id;

            clips = clips.filter((clip) => clip.game_id === game_id);
        }

        const validClips = clips.map((clip) => ({
            ...clip,
            embed_url: `${clip.embed_url}&parent=basilelgr.github.io`,
            download_url: generateDownloadUrl(clip.thumbnail_url),
        }));

        const pagination = clipsResponse.data.pagination || null;

        res.json({ data: validClips, pagination });
    } catch (error) {
        console.error('Erreur lors de la récupération des clips:', error.message || error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend démarré sur le port ${PORT}`);
});
