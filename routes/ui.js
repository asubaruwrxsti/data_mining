const express = require('express')

function setupUIRoutes(db) {
    const router = express.Router()

    router.get(`/`, (req, res) => {
        res.render('index')
    })

    return router
}

module.exports = {
    setupUIRoutes
}