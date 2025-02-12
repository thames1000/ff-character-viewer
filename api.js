const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone';

class LodestoneAPI {
    static async searchCharacters(name, world = '', datacenter = '') {
        const params = new URLSearchParams({
            q: name.trim(),
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        }).toString();

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
            const characters = await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    try {
                        const doc = iframe.contentDocument;
                        const results = Array.from(doc.querySelectorAll('.entry')).map(entry => ({
                            id: entry.querySelector('a.entry__link').href.split('/')[4],
                            name: entry.querySelector('.entry__name').textContent.trim(),
                            world: entry.querySelector('.entry__world').textContent.split('[')[0].trim(),
                            datacenter: entry.querySelector('.entry__world').textContent.match(/\[(.*?)\]/)?.[1] || '',
                            avatar: entry.querySelector('.entry__chara__face img').src,
                            rank: entry.querySelector('.entry__chara__class').textContent.trim(),
                            level: entry.querySelector('.entry__chara__level').textContent.trim()
                        }));
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                };
                iframe.src = `${LODESTONE_URL}/character/?${params}`;
            });

            return characters;
        } finally {
            document.body.removeChild(iframe);
        }
    }

    static async getCharacterDetails(characterId) {
        const [profile, jobs] = await Promise.all([
            this.#getProfile(characterId),
            this.#getJobs(characterId)
        ]);

        return {
            ...profile,
            jobs
        };
    }

    static async #getProfile(characterId) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
            return await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    try {
                        const doc = iframe.contentDocument;
                        resolve({
                            name: doc.querySelector('.frame__chara__name').textContent.trim(),
                            title: doc.querySelector('.frame__chara__title')?.textContent.trim() || '',
                            server: doc.querySelector('.frame__chara__world').textContent.trim(),
                            portrait: doc.querySelector('.character__detail__image img').src,
                            bio: doc.querySelector('.character__selfintroduction')?.textContent.trim() || ''
                        });
                    } catch (error) {
                        reject(error);
                    }
                };
                iframe.src = `${LODESTONE_URL}/character/${characterId}/`;
            });
        } finally {
            document.body.removeChild(iframe);
        }
    }

    static async #getJobs(characterId) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
            return await new Promise((resolve, reject) => {
                iframe.onload = () => {
                    try {
                        const doc = iframe.contentDocument;
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
                                    const jobAbbr = this.#getJobAbbr(jobName);
                                    if (jobAbbr) {
                                        const category = this.#categorizeJob(jobAbbr);
                                        jobs[category][jobAbbr] = {
                                            level: parseInt(level, 10),
                                            icon: jobIcon
                                        };
                                    }
                                }
                            });
                        });

                        resolve(jobs);
                    } catch (error) {
                        reject(error);
                    }
                };
                iframe.src = `${LODESTONE_URL}/character/${characterId}/class_job`;
            });
        } finally {
            document.body.removeChild(iframe);
        }
    }

    static #getJobAbbr(jobName) {
        const jobAbbrs = {
            'Paladin': 'PLD', 'Warrior': 'WAR', 'Dark Knight': 'DRK', 'Gunbreaker': 'GNB',
            'White Mage': 'WHM', 'Scholar': 'SCH', 'Astrologian': 'AST', 'Sage': 'SGE',
            'Monk': 'MNK', 'Dragoon': 'DRG', 'Ninja': 'NIN', 'Samurai': 'SAM',
            'Reaper': 'RPR', 'Bard': 'BRD', 'Machinist': 'MCH', 'Dancer': 'DNC',
            'Black Mage': 'BLM', 'Summoner': 'SMN', 'Red Mage': 'RDM', 'Blue Mage': 'BLU',
            'Carpenter': 'CRP', 'Blacksmith': 'BSM', 'Armorer': 'ARM', 'Goldsmith': 'GSM',
            'Leatherworker': 'LTW', 'Weaver': 'WVR', 'Alchemist': 'ALC', 'Culinarian': 'CUL',
            'Miner': 'MIN', 'Botanist': 'BTN', 'Fisher': 'FSH'
        };
        return jobAbbrs[jobName] || jobName;
    }

    static #categorizeJob(jobAbbr) {
        const tanks = ['PLD', 'WAR', 'DRK', 'GNB'];
        const healers = ['WHM', 'SCH', 'AST', 'SGE'];
        const crafters = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
        const gatherers = ['MIN', 'BTN', 'FSH'];

        if (tanks.includes(jobAbbr)) return 'tank';
        if (healers.includes(jobAbbr)) return 'healer';
        if (crafters.includes(jobAbbr)) return 'crafting';
        if (gatherers.includes(jobAbbr)) return 'gathering';
        return 'dps';
    }
} 