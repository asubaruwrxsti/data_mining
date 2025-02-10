const express = require('express')

function setupRoutes(db) {
    const router = express.Router()

    router.get('/', (req, res) => {
        res.json({
            message: 'Art Catalog API',
            endpoints: {
                '/general': 'Get general catalog entries',
                '/general/unique-locations': 'Get unique painting locations from general catalog',
                '/bio': 'Get artist biographies',
                '/bio/artist-locations': 'Get unique artist locations from bio catalog',
                '/bio/artist-artworks': 'Get artist artworks',
                '/bio/artist-timeline': 'Get artist timeline',
            }
        })
    });

    router.get('/general', (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        console.log(`[API] Fetching bio catalog with limit: ${limit}`)

        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        db.all('SELECT * FROM general_catalog LIMIT ?', [limit], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                limit: limit,
                data: rows
            });
        });
    });

    router.get('/general/unique-locations', (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        console.log(`[API] [API] Fetching unique locations from general_catalog with limit: ${limit}`)

        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        db.all('SELECT DISTINCT LOCATION FROM general_catalog ORDER BY LOCATION LIMIT ?', [limit], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                limit: limit,
                count: rows.length,
                data: rows
            });
        });
    });

    router.get('/bio', (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        console.log(`[API] Fetching bio catalog with limit: ${limit}`)

        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        db.all('SELECT * FROM bio_catalog LIMIT ?', [limit], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                limit: limit,
                data: rows
            });
        });
    });

    router.get('/bio/search', (req, res) => {
        const artistName = req.query.artistName;

        if (!artistName) {
            res.status(400).json({ error: 'Artist name is required' });
            return;
        }

        console.log(`[API] Searching for artist: ${artistName}`)

        db.all('SELECT * FROM bio_catalog WHERE ARTIST LIKE ?', [`%${artistName}%`], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                artist: artistName,
                data: rows
            });
        });
    });

    router.get('/bio/artist-locations', (req, res) => {
        const limit = parseInt(req.query.limit) || 30;
        console.log(`[API] Fetching unique artist locations from bio_catalog with limit: ${limit}`)

        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        db.all('SELECT DISTINCT SCHOOL as LOCATION FROM bio_catalog ORDER BY SCHOOL LIMIT ?', [limit], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                limit: limit,
                count: rows.length,
                data: rows
            });
        });
    });

    router.get('/bio/artist-artworks', (req, res) => {
        const artist = req.query.artist;
        if (!artist) {
            res.status(400).json({ error: 'Artist name is required' });
            return;
        }

        const limit = parseInt(req.query.limit) || 30;
        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        console.log(`[API] Fetching artist timeline for ${artist} with limit: ${limit}`)

        db.all(`SELECT 
                ARTIST, 
                "BORN-DIED",
                json_group_array(
                    json_object(
                        'title', TITLE,
                        'date', DATE,
                        'location', LOCATION,
                        'timeframe', TIMEFRAME,
                        'price', general_catalog.PRICE
                    )
                ) AS artworks
            FROM bio_catalog 
            RIGHT JOIN general_catalog ON bio_catalog.ARTIST = general_catalog.AUTHOR 
            WHERE bio_catalog.ARTIST = '?'
            GROUP BY ARTIST LIMIT ?;`,
            [artist, limit], (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    artist: artist,
                    data: rows
                });
            });
    });

    router.get('/bio/artist-timeline', (req, res) => {
        const artist = req.query.artist;
        if (!artist) {
            res.status(400).json({ error: 'Artist name is required' });
            return;
        }

        const limit = parseInt(req.query.limit) || 30;
        console.log(`[API] Fetching artist timeline for ${artist} with limit: ${limit}`)

        if (limit <= 0) {
            res.status(400).json({ error: 'Limit must be a positive number' });
            return;
        }

        console.log(`[API] Fetching artist timeline for ${artist}`)

        db.all(`SELECT 
                TITLE,
                CASE 
                    WHEN DATE LIKE 'c.%' THEN substr(DATE, instr(DATE, 'c.') + 3, 4)
                    WHEN DATE LIKE 'before%' THEN substr(DATE, instr(DATE, 'before') + 7, 4)
                    WHEN DATE LIKE '%-%' THEN substr(DATE, 1, instr(DATE, '-') - 1)
                    ELSE substr(DATE, 1, 4)
                END AS YEAR,
                LOCATION
            FROM general_catalog 
            WHERE AUTHOR = ?
            ORDER BY CAST(YEAR AS INTEGER) LIMIT ?;`,
            [artist, limit], (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    artist: artist,
                    data: rows
                });
            });
    });

    return router
}

module.exports = {
    setupRoutes
}