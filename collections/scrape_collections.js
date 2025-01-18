import { launch } from 'puppeteer';
import { writeFile } from 'fs/promises';
import { get } from 'http';

function getResultsFromCategory(categoryContent) {
    if (typeof categoryContent !== 'string') {
        throw new TypeError('categoryContent must be a string');
    }
    const collectionsPattern = /<a[^>]*href="\/partner\/(?<collection>[^"]+)"[^>]*title="(?<title>[^"]+)"[^>]*>.*?<div[^>]*data-bgsrc="(?<thumbnail>[^"]+)".*?<h4[^>]*title="(?<location>[^"]+)">/gs;

    return [...categoryContent.matchAll(collectionsPattern)].map(({ groups }) => ({
        collection: groups.collection,
        title: groups.title,
        thumbnail: groups.thumbnail,
        link: `https://artsandculture.google.com/partner/${groups.collection}`
    }));
}

async function scrollToEnd(page) {
    let previousHeight;
    while (true) {
        const currentHeight = await page.evaluate('document.body.scrollHeight');
        if (previousHeight === currentHeight) break;
        if (currentHeight >= 10000) break;
        previousHeight = currentHeight;
        console.log(`Scrolling to ${currentHeight}`);
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function getCollectionsInfo() {
    const browser = await launch({
        headless: "new"
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36');

    await page.goto('https://artsandculture.google.com/partner', {
        waitUntil: 'networkidle0'
    });

    const results = {};

    let tablist = await page.$('div[role="tablist"]');
    let tabs = await tablist.$$('div[role="tab"]');
    let tabIds = await Promise.all(tabs.map(async tab => {
        return tab.evaluate(node => node.getAttribute('data-tabid'));
    }));
    // get only the popular tab
    tabIds = tabIds.slice(0, 1);

    for (let tabId of tabIds) {
        await page.goto(`https://artsandculture.google.com/partner?tab=${tabId}`, {
            waitUntil: 'networkidle0'
        });

        await scrollToEnd(page);

        const categoryContent = await page.content();
        results[tabId] = {};
        getResultsFromCategory(categoryContent).forEach(result => {
            results[tabId][result.collection] = result;
        });
        console.log(`Tab ${tabId} done!, ${Object.keys(results[tabId]).length} collections found`);
    }

    await browser.close();
    return results;
}

(async () => {
    try {
        const result = await getCollectionsInfo();
        const jsonString = JSON.stringify(result, null, 2);

        console.log(`JSON String Length: ${jsonString.length} bytes`);

        const filePath = './collections/collections_data.json';
        console.log(`Writing to file: ${filePath}`);

        await writeFile(filePath, jsonString);
    } catch (error) {
        console.error(error);
    }
})();