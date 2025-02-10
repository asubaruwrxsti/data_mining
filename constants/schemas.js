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
        'TIMEFRAME': 'TEXT',
        'PRICE': 'TEXT'
    },
    bio_catalog: {
        'ARTIST': 'TEXT',
        'BIRTH DATA': 'TEXT',
        'PROFESSION': 'TEXT',
        'SCHOOL': 'TEXT',
        'URL': 'TEXT'
    }
}

module.exports = {
    CATALOG_SCHEMAS
}