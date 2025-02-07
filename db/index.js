import sqlite3 from 'sqlite3'
import { excelToDb } from './utils.js'

let instance = null
export class Database {
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

export const getDB = () => {
    return Database.getInstance()
}
export async function insertData(db) {
    try {
        excelToDb(db, 'catalog.xlsx', 'general_catalog')
        excelToDb(db, 'bio_catalog.xlsx', 'bio_catalog')
        console.log('[Database] All imports completed successfully')
    } catch (error) {
        console.error('[Database] Import error:', error)
    }
}