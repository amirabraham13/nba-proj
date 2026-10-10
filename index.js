const scraper = require("./basketball.js");
const fs = require('fs');

async function main() {
    try {
        const playerInfo = await scraper.searchGames();
        console.log(`\nAll Player Game stats scraped.`);

        const headers = Object.keys(playerInfo[0]);

const csv = [
  headers.join(','),
  ...playerInfo.map(row =>
    headers.map(header => {
      let value = row[header];

      if (header === 'stats') {
        value = JSON.stringify(value ?? {});
      }

      return `"${String(value ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  )
].join('\n');

fs.writeFileSync('basic_stats.csv', csv);

    }
    catch (error) {
        console.log(error);
        console.log("ERROR: Restart Scraping Script");
    }
}

main();