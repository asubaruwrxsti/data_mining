import express from 'express'

export function setupRoutes(db) {
    const router = express.Router()

    router.get('/', (req, res) => {
        res.json({
            message: 'Art Catalog API',
            endpoints: {
                '/general': 'Get general catalog entries',
                '/bio': 'Get artist biographies'
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

    return router
}