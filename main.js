import express from 'express'
import XLSX from 'xlsx'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const port = 3000

app.use(express.json())

const db = new sqlite3.Database('catalogs.db')

const CATALOG_SCHEMAS = {
    general_catalog: {
        'AUTHOR': 'TEXT',
        'BORN-DIED': 'TEXT',
        'TITLE': 'TEXT',
        'DATE': 'TEXT',
        'TECHNIQUE': 'TEXT',
        'LOCATION': 'TEXT',
        'URL': 'TEXT',
        'FORM': 'TEXT',
        'TYPE': 'TEXT',
        'SCHOOL': 'TEXT',
        'TIMEFRAME': 'TEXT'
    },
    bio_catalog: {
        'ARTIST': 'TEXT',
        'BIRTH DATA': 'TEXT',
        'PROFESSION': 'TEXT',
        'SCHOOL': 'TEXT',
        'URL': 'TEXT'
    }
}

function excelToDb(filename, tableName) {
    try {
        const workbook = XLSX.readFile(join(__dirname, 'catalogs', filename))
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet)

        if (data.length === 0) {
            throw new Error(`No data found in ${filename}`)
        }

        const schema = CATALOG_SCHEMAS[tableName]
        const columns = Object.keys(schema)

        const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ${columns.map(col => `"${col}" ${schema[col]}`).join(',\n            ')}
        )`

        db.serialize(() => {
            db.run(`DROP TABLE IF EXISTS ${tableName}`)
            db.run(createTable)

            const stmt = db.prepare(`
                INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')})
                VALUES (${columns.map(() => '?').join(', ')})
            `)

            data.forEach((row, index) => {
                stmt.run(...columns.map(col => row[col] || null))
                if ((index + 1) % 100 === 0) {
                    console.log(`Processed ${index + 1} records for ${tableName}`)
                }
            })

            stmt.finalize()
            console.log(`Completed import of ${data.length} records into ${tableName}`)
        })
    } catch (error) {
        console.error(`Error processing ${filename}:`, error)
    }
}

excelToDb('catalog.xlsx', 'general_catalog')
excelToDb('bio_catalog.xlsx', 'bio_catalog')

app.get('/', (req, res) => {
    res.json({
        message: 'Art Catalog API',
        endpoints: {
            '/general': 'Get general catalog entries',
            '/bio': 'Get artist biographies'
        }
    })
})

app.get('/general', (req, res) => {
    db.all('SELECT * FROM general_catalog', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

app.get('/bio', (req, res) => {
    db.all('SELECT * FROM bio_catalog', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

// Cleanup on exit
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed')
        process.exit(0)
    })
})