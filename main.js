import express from 'express'
import { insertData, getDB } from './db/index.js'
import { setupRoutes } from './routes/index.js'
import { setupUIRoutes } from './routes/ui.js'
import open from 'open'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
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

app.listen(port, () => {
    console.log(`[Server] Running at http://localhost:${port}`)

    open(`http://localhost:${port}/ui`).catch(err => {
        console.error(err);
    });
})

process.on('SIGINT', () => {
    console.log('\n[Server] Shutdown initiated')

    db.serialize(() => {
        db.run('SELECT 1', [], (err) => {
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