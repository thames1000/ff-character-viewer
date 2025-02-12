const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone';

export async function searchCharacters(name, world = '', datacenter = '') {
    try {
        const params = new URLSearchParams({
            q: name.trim(),
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        }).toString();

        const response = await fetch(`${LODESTONE_URL}/character/?${params}`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const characters = Array.from(doc.querySelectorAll('.entry')).map(entry => {
            const charLink = entry.querySelector('a.entry__link').href;
            const charId = charLink.split('/').filter(Boolean)[2];
            const serverText = entry.querySelector('.entry__world').textContent;
            const [worldName = '', dcInfo = ''] = serverText.includes('[') ?
                serverText.split('[') : [serverText, ''];
            const dcName = dcInfo.replace(']', '').trim();

            return {
                id: charId,
                name: entry.querySelector('.entry__name').textContent.trim(),
                world: worldName.trim(),
                datacenter: dcName,
                avatar: entry.querySelector('.entry__chara__face img').src,
                rank: entry.querySelector('.entry__chara__class').textContent.trim(),
                level: entry.querySelector('.entry__chara__level').textContent.trim()
            };
        });

        return { characters };
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

export async function getCharacterDetails(characterId) {
    try {
        // Get profile
        const profileResponse = await fetch(`/lodestone/character/${characterId}/`);
        const profileText = await profileResponse.text();
        const profileDoc = new DOMParser().parseFromString(profileText, 'text/html');

        // Get jobs
        const jobsResponse = await fetch(`/lodestone/character/${characterId}/class_job`);
        const jobsText = await jobsResponse.text();
        const jobsDoc = new DOMParser().parseFromString(jobsText, 'text/html');

        const character = {
            name: profileDoc.querySelector('.frame__chara__name').textContent.trim(),
            title: profileDoc.querySelector('.frame__chara__title')?.textContent.trim() || '',
            server: profileDoc.querySelector('.frame__chara__world').textContent.trim(),
            portrait: profileDoc.querySelector('.character__detail__image img').src,
            bio: profileDoc.querySelector('.character__selfintroduction')?.textContent.trim() || '',
            jobs: parseJobs(jobsDoc)
        };

        return { character };
    } catch (error) {
        console.error('Character detail error:', error);
        throw error;
    }
}

function parseJobs(doc) {
    const jobs = {
        tank: {},
        healer: {},
        dps: {},
        crafting: {},
        gathering: {}
    };

    doc.querySelectorAll('.character__job__role').forEach(roleSection => {
        roleSection.querySelectorAll('li').forEach(jobElement => {
            const level = jobElement.querySelector('.character__job__level').textContent.trim();
            const jobName = jobElement.querySelector('.character__job__name').textContent.trim();
            const jobIcon = jobElement.querySelector('img').src;

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

function categorizeJob(jobName) {
    const tanks = ['PLD', 'WAR', 'DRK', 'GNB'];
    const healers = ['WHM', 'SCH', 'AST', 'SGE'];
    const crafters = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
    const gatherers = ['MIN', 'BTN', 'FSH'];

    if (tanks.includes(jobName)) return 'tank';
    if (healers.includes(jobName)) return 'healer';
    if (crafters.includes(jobName)) return 'crafting';
    if (gatherers.includes(jobName)) return 'gathering';
    return 'dps';
}

function getJobAbbr(jobName) {
    const jobAbbrs = {
        'Paladin': 'PLD',
        'Warrior': 'WAR',
        'Dark Knight': 'DRK',
        'Gunbreaker': 'GNB',
        'White Mage': 'WHM',
        'Scholar': 'SCH',
        'Astrologian': 'AST',
        'Sage': 'SGE',
        'Bard': 'BRD',
        'Black Mage': 'BLM',
        'Summoner': 'SMN',
        'Red Mage': 'RDM',
        'Blue Mage': 'BLU',
        'Carpenter': 'CRP',
        'Blacksmith': 'BSM',
        'Armorer': 'ARM',
        'Goldsmith': 'GSM',
        'Leatherworker': 'LTW',
        'Weaver': 'WVR',
        'Alchemist': 'ALC',
        'Culinarian': 'CUL',
        'Miner': 'MIN',
        'Botanist': 'BTN',
        'Fisher': 'FSH'
    };

    return jobAbbrs[jobName] || jobName;
} 