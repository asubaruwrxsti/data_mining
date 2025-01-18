import { launch } from 'puppeteer';
import { writeFile } from 'fs/promises';

async function getResultsFromCategory(categoryContent) {
    const artistsPattern = /cobject","(?<artist>[^"]+)","(?<works>[^ ]+) \w+","(?<thumbnail>[^"]+)","(?<link>[^"]+)/gm;

    return [...categoryContent.matchAll(artistsPattern)].map(({ groups }) => ({
        artist: groups.artist,
        works: groups.works,
        thumbnail: `https:${groups.thumbnail}`,
        link: `https://artsandculture.google.com${JSON.parse(`"${groups.link}"`)}`,
    }));
}

async function getArtistsInfo() {
    const browser = await launch({
        headless: "new"
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36');

    await page.goto('https://artsandculture.google.com/category/artist', {
        waitUntil: 'networkidle0'
    });

    const data = await page.content();
    const results = {};

    const popularCategoryPattern = /"PopularAssets:(?<content>.+?)\["stella\.pr/gm;
    const popularMatches = [...data.matchAll(popularCategoryPattern)];
    results.pop = await Promise.all(popularMatches.map(async ({ groups }) => {
        return await getResultsFromCategory(groups.content);
    }));

    await browser.close();
    return results;
}

(async () => {
    try {
        const result = await getArtistsInfo();
        const jsonString = JSON.stringify(result, null, 2);

        const filePath = './artists/artists_data.json';
        await writeFile(filePath, jsonString);

        console.log('File written successfully');
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
    }
})();