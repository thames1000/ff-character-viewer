const LODESTONE_URL = 'https://na.finalfantasyxiv.com/lodestone';
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
];

class LodestoneAPI {
    static async #fetchWithFallback(url) {
        let lastError;
        
        for (const proxy of CORS_PROXIES) {
            try {
                const response = await fetch(`${proxy}${encodeURIComponent(url)}`);
                if (response.ok) {
                    const text = await response.text();
                    // Validate that we got valid HTML content
                    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                        return text;
                    }
                    console.warn(`Invalid HTML content received from ${proxy}`);
                }
            } catch (error) {
                lastError = error;
                console.warn(`Failed to fetch with proxy ${proxy}:`, error);
                continue;
            }
        }
        
        throw new Error(`Failed to fetch valid content. Last error: ${lastError?.message}`);
    }

    static async searchCharacters(name, world = '', datacenter = '') {
        const params = new URLSearchParams({
            q: name.trim(),
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        }).toString();

        try {
            const text = await this.#fetchWithFallback(`${LODESTONE_URL}/character/?${params}`);
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            // Validate that we have search results
            const entries = doc.querySelectorAll('.entry');
            if (!entries || entries.length === 0) {
                return [];
            }

            const characters = Array.from(entries).map(entry => {
                try {
                    const link = entry.querySelector('a.entry__link');
                    const nameEl = entry.querySelector('.entry__name');
                    const worldEl = entry.querySelector('.entry__world');
                    const avatarEl = entry.querySelector('.entry__chara__face img');
                    const rankEl = entry.querySelector('.entry__chara__class');
                    const levelEl = entry.querySelector('.entry__chara__level');

                    if (!link || !nameEl || !worldEl || !avatarEl || !rankEl || !levelEl) {
                        console.warn('Missing required elements for character entry');
                        return null;
                    }

                    return {
                        id: link.href.split('/')[4],
                        name: nameEl.textContent.trim(),
                        world: worldEl.textContent.split('[')[0].trim(),
                        datacenter: worldEl.textContent.match(/\[(.*?)\]/)?.[1] || '',
                        avatar: avatarEl.src,
                        rank: rankEl.textContent.trim(),
                        level: levelEl.textContent.trim()
                    };
                } catch (error) {
                    console.warn('Failed to parse character entry:', error);
                    return null;
                }
            }).filter(char => char !== null);

            return characters;
        } catch (error) {
            console.error('Search error:', error);
            throw new Error('Failed to search characters. Please try again.');
        }
    }

    static async getCharacterDetails(characterId) {
        try {
            const [profile, jobs] = await Promise.all([
                this.#getProfile(characterId),
                this.#getJobs(characterId)
            ]);

            return {
                ...profile,
                jobs
            };
        } catch (error) {
            console.error('Character detail error:', error);
            throw new Error('Failed to retrieve character details. Please try again.');
        }
    }

    static async #getProfile(characterId) {
        const text = await this.#fetchWithFallback(`${LODESTONE_URL}/character/${characterId}/`);
        const doc = new DOMParser().parseFromString(text, 'text/html');

        try {
            const nameEl = doc.querySelector('.frame__chara__name');
            const titleEl = doc.querySelector('.frame__chara__title');
            const serverEl = doc.querySelector('.frame__chara__world');
            const portraitEl = doc.querySelector('.character__detail__image img');
            const bioEl = doc.querySelector('.character__selfintroduction');

            if (!nameEl || !serverEl || !portraitEl) {
                console.warn('Missing required elements for character profile');
                throw new Error('Failed to retrieve character profile. Please try again.');
            }

            return {
                name: nameEl.textContent.trim(),
                title: titleEl?.textContent.trim() || '',
                server: serverEl.textContent.trim(),
                portrait: portraitEl.src,
                bio: bioEl?.textContent.trim() || ''
            };
        } catch (error) {
            console.error('Failed to parse character profile:', error);
            throw new Error('Failed to retrieve character profile. Please try again.');
        }
    }

    static async #getJobs(characterId) {
        const text = await this.#fetchWithFallback(`${LODESTONE_URL}/character/${characterId}/class_job`);
        const doc = new DOMParser().parseFromString(text, 'text/html');

        const jobs = {
            tank: {},
            healer: {},
            dps: {},
            crafting: {},
            gathering: {}
        };

        try {
            doc.querySelectorAll('.character__job__role').forEach(roleSection => {
                roleSection.querySelectorAll('li').forEach(jobElement => {
                    const levelEl = jobElement.querySelector('.character__job__level');
                    const jobNameEl = jobElement.querySelector('.character__job__name');
                    const jobIconEl = jobElement.querySelector('img');

                    if (!levelEl || !jobNameEl || !jobIconEl) {
                        console.warn('Missing required elements for job entry');
                        return;
                    }

                    const level = levelEl.textContent.trim();
                    const jobName = jobNameEl.textContent.trim();
                    const jobIcon = jobIconEl.src;

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
        } catch (error) {
            console.error('Failed to parse character jobs:', error);
            throw new Error('Failed to retrieve character jobs. Please try again.');
        }

        return jobs;
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