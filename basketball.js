const { chromium } = require('playwright');

const startMonth = 10;
const startDay = 21;
const startYear = 2025;

const allPlayers = [];


async function searchGames() {
    const browser = await chromium.launch({
        headless: true
    });
    const page = await browser.newPage();


    let startDate = new Date(Date.UTC(
        startYear,
        startMonth - 1,
        startDay
    ));

    // Change to whatever is the desired end date
    // of the scraper
    const endDate = new Date(Date.UTC(
        startYear,
        9,
        21
    ));

    while (startDate <= endDate) {
        const month = startDate.getUTCMonth() + 1;
        const day = startDate.getUTCDate();
        const year = startDate.getUTCFullYear();

        console.log('\n==============================');
        console.log(`Checking ${month}/${day}/${year}`);
        console.log('===============================');

        await page.goto(
            `https://www.basketball-reference.com/boxscores/?month=${month}&day=${day}&year=${year}`,
            { waitUntil: 'domcontentloaded' }
        );

        console.log("Rate Limiting: Please wait 5 seconds...");
        await new Promise((r) => setTimeout(r, 5000));

        await scrapeGames(page, month, day, year)
        
        startDate.setUTCDate(
            startDate.getUTCDate() + 1
        );
    }

    return allPlayers
}

async function scrapeGames(page, month, day, year) {
    const games = page.getByRole('link', {
        name: 'Box Score',
        exact: true
    });

    const gamesCount = await games.count();

    console.log(
        `${gamesCount} games played on ${month}/${day}/${year}`
    );

    if (gamesCount > 0) {
        const gameUrls = [];

        for (let i = 0; i < gamesCount; i++) {
            const linkHref = await games.nth(i).getAttribute('href');

            if (linkHref) {
                gameUrls.push(
                    new URL(
                        linkHref,
                        'https://www.basketball-reference.com'
                    ).href
                );
            }
        }

        for (let i = 0; i < gameUrls.length; i++)
            await scrapeGame(page, gameUrls, i, month, day, year)
    }
}

async function scrapeGame(page, gameUrls, i, month, day, year) {
    const gameUrl = gameUrls[i];

    const gameID = gameUrl.split('/').pop().replace('.html', '');

    console.log(`Scraping game ${i + 1}/${gameUrls.length}...ID: ${gameID}`);

    await page.goto(
        gameUrls[i],
        { waitUntil: 'domcontentloaded' }
    );

    console.log("Rate limiting: Please wait 5 seconds...");
    await new Promise((r) => setTimeout(r, 5000));
    
    const basic_tables = page.locator('table').filter({
        hasText: 'Basic Box Score Stats'
    });


const debug = await basic_tables.evaluateAll(tables =>
    tables.map((table, index) => ({
        index,
        rows: Array.from(table.querySelectorAll('tr'))
            .slice(0, 5)
            .map(row => row.querySelector('td, th')?.innerText.trim() ?? '')
    }))
);

const unique = [];

for (const object of debug) {
    const value = object.rows[2]; // 'player name' is the third item

    if (unique.some(item => item.value === value)) {
        continue;
    }

    unique.push({
        value: value,
        index: object.index
    });
}

const indexes = unique.map(item => item.index);

for (const tableIndex of [indexes[0], indexes[1]]) {
    const table = basic_tables.nth(tableIndex);
    const rows = table.locator('tbody tr');

    for (const row of await rows.all()) {
        const playerLink = row.locator('th a');

        if (await playerLink.count() == 0)
            continue

        const player = await playerLink.innerText();
        const values = await row.locator('th, td').allInnerTexts();

        const stats = {
            minutesPlayed: values[1],
            field_goals_made: values[2],
            field_goals_attempted: values[3],
            field_goal_percentage: values[4],
            three_point_made: values[5],
            three_point_attempted: values[6],
            three_point_percentage: values[7],
            free_throws_made: values[8],
            free_throws_attempted: values[9],
            free_throws_percentage: values[10],
            offensive_rebounds: values[11],
            defensive_rebounds: values[12],
            total_rebounds: values[13],
            assists: values[14],
            steals: values[15],
            blocks: values[16],
            turnovers: values[17],
            personal_fouls: values[18],
            points: values[19],
            game_score: values[20],
            plus_minus: values[21]
        };

                        allPlayers.push({
                            player,
                            date: `${month}/${day}/${year}`,
                            gameID,
                            gameUrl: gameUrls[i],
                            stats,
                            statsCategory: "Basic"
                        });
    }
}
    return;
}

module.exports = {
    searchGames
}