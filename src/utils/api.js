const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone';

export async function searchCharacters(name, world = '', datacenter = '') {
    try {
        // Create a hidden iframe to load the Lodestone page
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Load the search URL in the iframe
        const params = new URLSearchParams({
            q: name.trim(),
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        }).toString();

        return new Promise((resolve, reject) => {
            iframe.onload = () => {
                try {
                    const doc = iframe.contentDocument;
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

                    document.body.removeChild(iframe);
                    resolve({ characters });
                } catch (error) {
                    document.body.removeChild(iframe);
                    reject(error);
                }
            };

            iframe.onerror = () => {
                document.body.removeChild(iframe);
                reject(new Error('Failed to load Lodestone page'));
            };

            iframe.src = `${LODESTONE_URL}/character/?${params}`;
        });
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

export async function getCharacterDetails(characterId) {
    try {
        // Create iframes for profile and jobs
        const profileIframe = document.createElement('iframe');
        const jobsIframe = document.createElement('iframe');
        profileIframe.style.display = 'none';
        jobsIframe.style.display = 'none';
        document.body.appendChild(profileIframe);
        document.body.appendChild(jobsIframe);

        // Load both pages simultaneously
        const [profileData, jobsData] = await Promise.all([
            new Promise((resolve, reject) => {
                profileIframe.onload = () => {
                    try {
                        const doc = profileIframe.contentDocument;
                        resolve({
                            name: doc.querySelector('.frame__chara__name').textContent.trim(),
                            title: doc.querySelector('.frame__chara__title')?.textContent.trim() || '',
                            server: doc.querySelector('.frame__chara__world').textContent.trim(),
                            portrait: doc.querySelector('.character__detail__image img').src,
                            bio: doc.querySelector('.character__selfintroduction')?.textContent.trim() || ''
                        });
                    } catch (error) {
                        reject(error);
                    } finally {
                        document.body.removeChild(profileIframe);
                    }
                };
                profileIframe.src = `${LODESTONE_URL}/character/${characterId}/`;
            }),
            new Promise((resolve, reject) => {
                jobsIframe.onload = () => {
                    try {
                        const doc = jobsIframe.contentDocument;
                        resolve(parseJobs(doc));
                    } catch (error) {
                        reject(error);
                    } finally {
                        document.body.removeChild(jobsIframe);
                    }
                };
                jobsIframe.src = `${LODESTONE_URL}/character/${characterId}/class_job`;
            })
        ]);

        return {
            character: {
                ...profileData,
                jobs: jobsData
            }
        };
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