import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const artists = JSON.parse(
    readFileSync(
        join(__dirname, '../artists_with_details.json'),
        'utf8'
    )
);

function extractDate(dateString) {
    // Check if dateString is null or undefined
    if (!dateString) return null;

    // Try ISO format in parentheses first - (YYYY-MM-DD)
    const isoMatch = dateString.match(/\((\d{4}-\d{2}-\d{2})\)/);
    if (isoMatch) return isoMatch[1];

    // Try to match dates like "11 January 1893" or "January 11, 1893"
    const monthNames = 'January|February|March|April|May|June|July|August|September|October|November|December';
    const writtenDateMatch = dateString.match(
        new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})|` +
            `(${monthNames})\\s+(\\d{1,2}),?\\s+(\\d{4})`)
    );

    if (writtenDateMatch) {
        let day, month, year;
        if (writtenDateMatch[1]) { // European format: "11 January 1893"
            day = writtenDateMatch[1];
            month = writtenDateMatch[2];
            year = writtenDateMatch[3];
        } else { // American format: "January 11, 1893"
            month = writtenDateMatch[4];
            day = writtenDateMatch[5];
            year = writtenDateMatch[6];
        }

        const months = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };

        day = day.padStart(2, '0');

        return `${year}-${months[month]}-${day}`;
    }

    const yearMatch = dateString.match(/\b(\d{4})\b/);
    if (yearMatch) return `${yearMatch[1]}-00-00`;

    return null;
}

function extractArtistInfo(artistData) {
    const result = {
        name: artistData.name,
        birthDate: null,
        deathDate: null,
        country: null
    };

    // Extract dates
    result.birthDate = extractDate(artistData.born);
    if (artistData.died) {
        result.deathDate = extractDate(artistData.died);
    }

    // Extract country from the last comma-separated part
    if (!artistData.born) return result;
    const birthParts = artistData.born.split(',');
    result.country = cleanCountryName(birthParts[birthParts.length - 1].trim());

    return result;
}

function cleanCountryName(country) {
    if (!country) return null;
    
    let cleaned = country
        .replace(/[\d\.\(\)]/g, '')
        .trim()
        .toLowerCase();
    
    // Country name mappings
    const countryMappings = {
        'western australia': 'australia',
        'new south wales': 'australia',
        'german empire': 'german',
        'holy roman empire': 'german',
        'russian empire': 'russian',
        'ottoman empire': 'turkish',
        'kingdom of': '',
        'republic of': '',
        'united states of america': 'usa',
        'united states': 'usa',
        'us': 'usa',
        'mandatory palestine': 'palestine',
    };

    for (const [key, value] of Object.entries(countryMappings)) {
        if (cleaned.includes(key)) {
            cleaned = cleaned.replace(key, value);
        }
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned || null;
}

const formattedArtists = artists.map(extractArtistInfo);
const outputPath = join(__dirname, '../artists_with_details_formatted.json');
try {
    writeFileSync(outputPath, JSON.stringify(formattedArtists, null, 2));
    console.log(`Formatted ${formattedArtists.length} artists`);
    console.log(`File written to: ${outputPath}`);
} catch (error) {
    console.error('Error writing file:', error);
}