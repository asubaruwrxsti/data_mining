const express = require('express')
const { getDB, insertData } = require('./db')
const { setupRoutes } = require('./routes')
const { setupUIRoutes } = require('./routes/ui')

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    if (Object.keys(req.query).length > 0) {
        console.log('Query params:', req.query)
    }
    next()
})

const db = getDB()
insertData(db)

app.use('/', setupRoutes(db))
app.use('/ui', setupUIRoutes(db))

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))

app.listen(port, async () => {
    console.log(`[Server] Running at http://localhost:${port}`)
    console.log(`[Server] Access the UI at http://localhost:${port}/ui`)
    console.log('[Server] Press CTRL+C to stop')
})

process.on('SIGINT', () => {
    console.log('\n[Server] Shutdown initiated')

    db.serialize(() => {
        db.run('SELECT 1', [], (_err) => {
            db.close((err) => {
                if (err) {
                    console.error('[Database] Error closing connection:', err)
                    process.exit(1)
                }
                console.log('[Database] Connection closed')
                console.log('[Server] Exiting...')
                process.exit(0)
            })
        })
    })
})