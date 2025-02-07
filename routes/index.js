import express from 'express'

export function setupRoutes(db) {
    const router = express.Router()

    router.get('/', (req, res) => {
        res.json({
            message: 'Art Catalog API',
            endpoints: {
                '/general': 'Get general catalog entries',
                '/general/unique-locations': 'Get unique painting locations from general catalog',
                '/bio': 'Get artist biographies',
                '/bio/artist-locations': 'Get unique artist locations from bio catalog'
            }
        })
    })

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

    return router
}