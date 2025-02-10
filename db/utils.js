const { join } = require('path')
const XLSX = require('xlsx')
const { CATALOG_SCHEMAS } = require('../constants/schemas')


function excelToDb(db, filename, tableName) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`[Import] Starting import of ${filename} into ${tableName}`)

            if (!CATALOG_SCHEMAS[tableName]) {
                throw new Error(`Invalid table name: ${tableName}`)
            }

            const filePath = join(process.cwd(), 'catalogs', filename)
            const workbook = XLSX.readFile(filePath)
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const data = XLSX.utils.sheet_to_json(sheet)

            if (data.length === 0) {
                throw new Error(`No data found in ${filename}`)
            }

            const schema = CATALOG_SCHEMAS[tableName]
            const columns = Object.keys(schema)

            db.serialize(() => {
                db.run(`DROP TABLE IF EXISTS ${tableName}`)
                    .run(`CREATE TABLE IF NOT EXISTS ${tableName} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ${columns.map(col => `"${col}" ${schema[col]}`).join(',\n                        ')}
                    )`, [], (err) => {
                        if (err) reject(err);

                        const stmt = db.prepare(`
                            INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')})
                            VALUES (${columns.map(() => '?').join(', ')})
                        `)

                        data.forEach((row) => {
                            stmt.run(...columns.map(col => row[col] || null))
                        })

                        stmt.finalize(() => {
                            console.log(`[Import] Successfully imported ${data.length} records into ${tableName}`)
                            resolve()
                        })
                    })
            })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    excelToDb
}