const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const CLIENT_ID = 'fxxny3g1a5svpmrqphc4nz8suq4etx';
const CLIENT_SECRET = 'c5iw3gkqipzq2hi90dwh061ktsskrx';
let ACCESS_TOKEN = '';

app.use(cors());

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
    const username = 'hakaiwrld';
    if (!ACCESS_TOKEN) await getAccessToken();

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': CLIENT_ID,
            Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        params: { login: username },
    });

    const broadcaster_id = userResponse.data.data[0].id;

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

    res.json(clipsResponse.data);
});

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
});