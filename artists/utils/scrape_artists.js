import { launch } from 'puppeteer';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
    const browser = await launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://en.wikipedia.org/wiki/List_of_modern_artists';
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const artistList = await page.evaluate(() => {
        const headings = document.querySelectorAll('div.mw-heading.mw-heading2');
        let results = [];

        headings.forEach((heading) => {
            let sibling = heading.nextElementSibling;
            while (sibling && sibling.tagName !== 'DIV') {
                if (sibling.tagName === 'UL') {
                    const listItems = sibling.querySelectorAll('li');
                    listItems.forEach((li) => {
                        const anchor = li.querySelector('a');
                        if (anchor) {
                            results.push({
                                name: anchor.textContent.trim(),
                                url: 'https://en.wikipedia.org' + anchor.getAttribute('href')
                            });
                        }
                    });
                }
                sibling = sibling.nextElementSibling;
            }
        });
        console.log(`Found ${results.length} artists`);
        return results;
    });

    const artistsWithDetails = [];
    for (const artist of artistList) {
        console.log(`Processing ${artist.name}`);
        await page.goto(artist.url, { waitUntil: 'domcontentloaded' });

        const details = await page.evaluate(() => {
            const infobox = document.querySelector('.infobox');
            let born = null;
            let died = null;

            if (infobox) {
                const bornRow = Array.from(infobox.querySelectorAll('tr')).find(row =>
                    row.querySelector('th')?.textContent.trim() === 'Born'
                );
                if (bornRow) {
                    born = bornRow.querySelector('td')?.textContent.trim();
                }

                const diedRow = Array.from(infobox.querySelectorAll('tr')).find(row =>
                    row.querySelector('th')?.textContent.trim() === 'Died'
                );
                if (diedRow) {
                    died = diedRow.querySelector('td')?.textContent.trim();
                }
            }

            return { born, died };
        });

        artistsWithDetails.push({
            ...artist,
            ...details
        });

        // delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    const outputPath = join(__dirname, '../artists_with_details.json');
    try {
        writeFileSync(outputPath, JSON.stringify(artistsWithDetails, null, 2));
        console.log(`Processed ${artistsWithDetails.length} artists`);
        console.log(`File written to: ${outputPath}`);
    } catch (error) {
        console.error('Error writing file:', error);
    }

    await browser.close();
})();