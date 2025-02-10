const express = require('express')

function setupUIRoutes(db, port = 3000) {
    const router = express.Router()

    router.get(`/`, (req, res) => {
        res.render('index', { port })
    })

    return router
}

module.exports = {
    setupUIRoutes
}