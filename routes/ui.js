import express from 'express'

export function setupUIRoutes(db) {
    const router = express.Router()

    router.get(`/`, (req, res) => {
        res.render('index')
    })

    return router
}