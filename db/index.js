const sqlite3 = require('sqlite3')
const { excelToDb } = require('./utils.js')

let instance = null
class Database {
    constructor() {
        if (instance) {
            throw new Error('Database instance already exists')
        }
        this.db = new sqlite3.Database('catalogs.db', (err) => {
            if (err) {
                console.error('[Database] Connection error:', err)
            } else {
                console.log('[Database] Connected successfully')
            }
        })
        instance = this
    }

    static getInstance() {
        if (!instance) {
            instance = new Database()
        }
        return instance.db
    }
}

const getDB = () => {
    return Database.getInstance()
}

async function insertData(db) {
    try {
        excelToDb(db, 'catalog.xlsx', 'general_catalog')
        excelToDb(db, 'bio_catalog.xlsx', 'bio_catalog')
        console.log('[Database] All imports completed successfully')
    } catch (error) {
        console.error('[Database] Import error:', error)
    }
}

module.exports = {
    Database,
    getDB,
    insertData
}