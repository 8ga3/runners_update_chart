const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const path = require('path');

const app = express();
const PORT = 3000;
app.use(cors());  // CORSを許可
app.use(express.json());

// public フォルダ内の静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        const timeList = document.querySelector('table'); // タイムリストのテーブルを取得
        const rows = timeList.querySelectorAll('tr');

        const distances = [];
        const lapTimes = [];
        let halfLapTime = 0.0;

        rows.forEach((row, index) => {
            if (index === 0) return; // ヘッダー行をスキップ
            const cells = row.querySelectorAll('td');
            const point = cells[0].textContent.trim();
            const lapTime = cells[2].textContent.trim();

            if (point !== 'Start' && lapTime) {
                if (point === '中間') {
                    const timeParts = lapTime.split(':').map(Number);
                    const timeInSeconds = (timeParts[0] * 60 + timeParts[1]) * 60 + timeParts[2];
                    halfLapTime = timeInSeconds;
                    // distances.push(21.0975);
                    // lapTimes.push(timeInSeconds);
                } else if (point === 'Finish') {
                    const timeParts = lapTime.split(':').map(Number);
                    const timeInSeconds = (timeParts[0] * 60 + timeParts[1]) * 60 + timeParts[2];
                    distances.push(42.195);
                    lapTimes.push(timeInSeconds);
                }
                else {
                    const distance = parseFloat(point.replace('km', ''));
                    const timeParts = lapTime.split(':').map(Number);
                    let timeInSeconds = (timeParts[0] * 60 + timeParts[1]) * 60 + timeParts[2];
                    if (distance == 25) {
                        timeInSeconds += halfLapTime;
                    }
                    distances.push(distance);
                    lapTimes.push(timeInSeconds);
                }
            }
        });

        res.json({ distances, lapTimes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log('Server running on port 3000');
});
