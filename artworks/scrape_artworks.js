import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch } from 'puppeteer';
import { access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RETRIES = 3;
const DELAY_MS = 1000;
const RETRY_DELAY = 2000;
const TIMEOUT_MS = 30000;

async function retry(fn, retries = MAX_RETRIES) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return retry(fn, retries - 1);
        }
        throw error;
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getArtworksOfArtist(page, artistUrl) {
    try {
        const baseURL = new URL(artistUrl).origin;

        await retry(async () => {
            await page.goto(artistUrl, {
                waitUntil: 'networkidle0',
                timeout: TIMEOUT_MS
            });
        });

        await page.waitForSelector('div.IilBJf.BHleke', {
            timeout: 5000
        }).catch(() => null);
        console.log('Page loaded successfully');

        let clickCount = 0;
        while (true) {
            try {
                // :not([aria-hidden="true"])
                // #exp_tab_popular > div > div > div.bYeTje.CMCEae.BcYSHe
                // querySelector("#exp_tab_popular > div > div > div.bYeTje.CMCEae.BcYSHe > div")
                const nextButton = await page.waitForSelector('#exp_tab_popular > div > div > div.bYeTje.CMCEae.BcYSHe > div', {
                    visible: true,
                    timeout: TIMEOUT_MS
                });

                const isHidden = await nextButton.evaluate(element => {
                    return element.getAttribute('aria-hidden') === 'true';
                });

                if (isHidden) {
                    console.log('Reached end of pagination');
                    break;
                }

                await nextButton.evaluate(button => {
                    if (!button.isConnected) throw new Error('Button not connected to DOM');
                    button.scrollIntoView();
                });

                await retry(async () => {
                    // await page.evaluate((button) => {
                    //     button.style.background = 'yellow';
                    // }, nextButton);
                    await nextButton.click();
                    await page.waitForNetworkIdle({ timeout: TIMEOUT_MS });
                }, MAX_RETRIES);

                clickCount++;

                await delay(DELAY_MS);
                await page.waitForSelector('div.IilBJf.BHleke', {
                    timeout: TIMEOUT_MS
                });

            } catch (error) {
                console.warn(`Pagination error on click ${clickCount}: ${error.message}`);
                break;
            }
        }

        // #exp_tab_popular > div > div > div.IilBJf.BHleke
        const artworks_container = await page.$$('div.IilBJf.BHleke');

        // BATCH SELECTOR
        // #exp_tab_popular > div > div > div.IilBJf.BHleke > span > div:nth-child(1)

        // ARTWORK SELECTOR
        // #exp_tab_popular > div > div > div.IilBJf.BHleke > span > div:nth-child(1) > div.vyQv6.uxE5j

        await Promise.all(artworks_container.map(async (artwork) => {
            const span = await artwork.$('span');

            const divContents = await span.$$eval('div', (divs, baseURL) => {
                const links = divs.reduce((acc, div) => {
                    const anchors = Array.from(div.querySelectorAll('a'));
                    return [...acc, ...anchors];
                }, []);

                return links.map(link => ({
                    title: link.getAttribute('title'),
                    href: baseURL + link.getAttribute('href')
                }));
            }, baseURL);

            console.log('Artwork:', divContents);
            return divContents;
        }));

    } catch (error) {
        console.error(`Error scraping ${artistUrl}:`, error.message);
    }
}

(async () => {
    const browser = await launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36');

        const artistsPath = path.resolve(__dirname, '../artists/artists_data.json');
        await access(artistsPath);

        const rawData = await readFile(artistsPath, 'utf-8');
        const artistsData = JSON.parse(rawData);

        const artistsArray = artistsData.pop?.[0]?.map(artist => ({
            name: artist.artist,
            url: artist.link,
            worksCount: parseInt(artist.works, 10),
            thumbnail: artist.thumbnail
        }));

        if (!Array.isArray(artistsArray) || artistsArray.length === 0) {
            throw new Error(`Invalid artists data structure`);
        }

        console.log('Artists count:', artistsArray.length);
        const results = {};

        for (const artist of artistsArray) {
            console.log(`Processing: ${artist.name}`);
            results[artist.name] = await getArtworksOfArtist(page, artist.url);
            break;
        }

        // await writeFile(
        //     path.resolve(__dirname, 'artworks_count.json'),
        //     JSON.stringify(results, null, 2)
        // );

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        // await browser.close();
    }
})();