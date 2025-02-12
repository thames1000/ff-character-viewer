const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const characterId = req.url.split('/').pop();
    
    try {
        console.log('Fetching character details for ID:', characterId);
        
        const [profileHtml, jobsHtml] = await Promise.all([
            fetch(`https://na.finalfantasyxiv.com/lodestone/character/${characterId}/`).then(r => r.text()),
            fetch(`https://na.finalfantasyxiv.com/lodestone/character/${characterId}/class_job`).then(r => r.text())
        ]);

        const $profile = cheerio.load(profileHtml);
        const $jobs = cheerio.load(jobsHtml);

        // Parse profile data
        const profile = {
            name: $profile('.frame__chara__name').text().trim(),
            title: $profile('.frame__chara__title').text().trim(),
            server: $profile('.frame__chara__world').text().trim(),
            portrait: $profile('.character__detail__image img').attr('src'),
            bio: $profile('.character__selfintroduction').text().trim()
        };

        // Parse jobs data
        const jobs = {
            tank: {},
            healer: {},
            dps: {},
            crafting: {},
            gathering: {}
        };

        $jobs('.character__job__role').each((_, roleSection) => {
            $jobs(roleSection).find('li').each((_, jobElement) => {
                const $job = $jobs(jobElement);
                const level = $job.find('.character__job__level').text().trim();
                const jobName = $job.find('.character__job__name').text().trim();
                const jobIcon = $job.find('img').attr('src');

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

        console.log('Successfully parsed character data');
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json({ ...profile, jobs });
    } catch (error) {
        console.error('Character detail error:', error);
        res.status(500).json({ error: error.message });
    }
};

function categorizeJob(jobAbbr) {
    const tanks = ['GLA', 'PLD', 'MRD', 'WAR', 'DRK', 'GNB'];
    const healers = ['CNJ', 'WHM', 'SCH', 'AST', 'SGE'];
    const crafters = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
    const gatherers = ['MIN', 'BTN', 'FSH'];

    if (tanks.includes(jobAbbr)) return 'tank';
    if (healers.includes(jobAbbr)) return 'healer';
    if (crafters.includes(jobAbbr)) return 'crafting';
    if (gatherers.includes(jobAbbr)) return 'gathering';
    return 'dps';
}

function getJobAbbr(jobName) {
    const jobMap = {
        'Gladiator': 'GLA', 'Paladin': 'PLD',
        'Marauder': 'MRD', 'Warrior': 'WAR',
        'Dark Knight': 'DRK', 'Gunbreaker': 'GNB',
        'Conjurer': 'CNJ', 'White Mage': 'WHM',
        'Scholar': 'SCH', 'Astrologian': 'AST',
        'Sage': 'SGE', 'Pugilist': 'PGL',
        'Monk': 'MNK', 'Lancer': 'LNC',
        'Dragoon': 'DRG', 'Rogue': 'ROG',
        'Ninja': 'NIN', 'Samurai': 'SAM',
        'Reaper': 'RPR', 'Archer': 'ARC',
        'Bard': 'BRD', 'Machinist': 'MCH',
        'Dancer': 'DNC', 'Thaumaturge': 'THM',
        'Black Mage': 'BLM', 'Arcanist': 'ACN',
        'Summoner': 'SMN', 'Red Mage': 'RDM',
        'Blue Mage': 'BLU', 'Carpenter': 'CRP',
        'Blacksmith': 'BSM', 'Armorer': 'ARM',
        'Goldsmith': 'GSM', 'Leatherworker': 'LTW',
        'Weaver': 'WVR', 'Alchemist': 'ALC',
        'Culinarian': 'CUL', 'Miner': 'MIN',
        'Botanist': 'BTN', 'Fisher': 'FSH'
    };

    return jobMap[jobName] || null;
}
