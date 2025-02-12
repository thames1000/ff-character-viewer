const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '..'))); // Allow access to root directory

// Search characters
app.get('/api/search', async (req, res) => {
    try {
        const { character_name, world, datacenter } = req.query;
        console.log('Search params:', { character_name, world, datacenter });

        if (!character_name) {
            throw new Error('Character name is required');
        }

        // Build the search URL with correct parameters for Lodestone
        const searchParams = new URLSearchParams({
            q: character_name,
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        }).toString();

        const searchUrl = `https://na.finalfantasyxiv.com/lodestone/character/?${searchParams}`;
        console.log('Search URL:', searchUrl);

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Lodestone');
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const characters = [];

        // Parse search results
        $('.ldst__window').find('.entry').each((i, element) => {
            const charElement = $(element);

            // Get the character link and ID
            const charLink = charElement.find('a.entry__link').attr('href');
            if (!charLink) return;

            const charId = charLink.split('/').filter(Boolean)[2];

            // Get the server info
            const serverText = charElement.find('.entry__world').text().trim();
            const [worldName = '', dcInfo = ''] = serverText.includes('[') ?
                serverText.split('[') : [serverText, ''];
            const dcName = dcInfo.replace(']', '').trim();

            // Apply datacenter filter if provided
            if (datacenter && !dcName.toLowerCase().includes(datacenter.toLowerCase())) {
                return;
            }

            // Get character details
            const characterData = {
                id: charId,
                name: charElement.find('.entry__name').text().trim(),
                world: worldName.trim(),
                datacenter: dcName,
                avatar: charElement.find('.entry__chara__face img').attr('src'),
                rank: charElement.find('.entry__chara__class').text().trim(),
                level: charElement.find('.entry__chara__level').text().trim()
            };

            console.log('Found character:', characterData);
            characters.push(characterData);
        });

        console.log(`Found ${characters.length} characters`);
        res.json({ characters });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get character details
app.get('/api/character/:id', async (req, res) => {
    try {
        // First get the main character profile
        const profileResponse = await fetch(`https://na.finalfantasyxiv.com/lodestone/character/${req.params.id}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const profileHtml = await profileResponse.text();
        const profile$ = cheerio.load(profileHtml);

        // Then get the class/job page
        const jobsResponse = await fetch(`https://na.finalfantasyxiv.com/lodestone/character/${req.params.id}/class_job`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const jobsHtml = await jobsResponse.text();
        const jobs$ = cheerio.load(jobsHtml);

        // Parse character data
        const character = {
            name: profile$('.frame__chara__name').text().trim(),
            title: profile$('.frame__chara__title').text().trim(),
            server: profile$('.frame__chara__world').text().trim(),
            portrait: profile$('.character__detail__image img').attr('src'),
            bio: profile$('.character__selfintroduction').text().trim(),
            jobs: parseJobs(jobs$),
        };

        res.json({ character });
    } catch (error) {
        console.error('Character detail error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to parse jobs
function parseJobs($) {
    const jobs = {
        tank: {},
        healer: {},
        dps: {},
        crafting: {},
        gathering: {}
    };

    $('.character__job__role').each((i, roleSection) => {
        const $roleSection = $(roleSection);

        $roleSection.find('li').each((j, jobElement) => {
            const $job = $(jobElement);

            const level = $job.find('.character__job__level').text().trim();
            const jobName = $job.find('.character__job__name').text().trim();
            const jobIcon = $job.find('img').attr('src') || '';

            if (jobName && level) {
                const jobAbbr = getJobAbbr(jobName);
                if (jobAbbr) {
                    const category = categorizeJob(jobAbbr);
                    jobs[category][jobAbbr] = {
                        level: parseInt(level, 10),
                        icon: jobIcon
                    };
                }
            }
        });
    });

    return jobs;
}

// Helper function to get job abbreviations
function getJobAbbr(tooltip) {
    const jobMap = {
        'Paladin': 'PLD', 'Warrior': 'WAR', 'Dark Knight': 'DRK', 'Gunbreaker': 'GNB',
        'White Mage': 'WHM', 'Scholar': 'SCH', 'Astrologian': 'AST', 'Sage': 'SGE',
        'Monk': 'MNK', 'Dragoon': 'DRG', 'Ninja': 'NIN', 'Samurai': 'SAM',
        'Reaper': 'RPR', 'Bard': 'BRD', 'Machinist': 'MCH', 'Dancer': 'DNC',
        'Black Mage': 'BLM', 'Summoner': 'SMN', 'Red Mage': 'RDM', 'Blue Mage': 'BLU',
        'Carpenter': 'CRP', 'Blacksmith': 'BSM', 'Armorer': 'ARM', 'Goldsmith': 'GSM',
        'Leatherworker': 'LTW', 'Weaver': 'WVR', 'Alchemist': 'ALC', 'Culinarian': 'CUL',
        'Miner': 'MIN', 'Botanist': 'BTN', 'Fisher': 'FSH',
        // Base classes
        'Gladiator': 'GLA', 'Marauder': 'MRD', 'Conjurer': 'CNJ', 'Pugilist': 'PGL',
        'Lancer': 'LNC', 'Rogue': 'ROG', 'Archer': 'ARC', 'Thaumaturge': 'THM',
        'Arcanist': 'ACN'
    };

    for (const [name, abbr] of Object.entries(jobMap)) {
        if (tooltip.includes(name)) {
            return abbr;
        }
    }
    return null;
}

// Helper function to categorize jobs
function categorizeJob(jobAbbr) {
    if (['GLA', 'PLD', 'MRD', 'WAR', 'DRK', 'GNB'].includes(jobAbbr)) return 'tank';
    if (['CNJ', 'WHM', 'SCH', 'AST', 'SGE'].includes(jobAbbr)) return 'healer';
    if (['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'].includes(jobAbbr)) return 'crafting';
    if (['MIN', 'BTN', 'FSH'].includes(jobAbbr)) return 'gathering';
    return 'dps';
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 