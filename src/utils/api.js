const API_BASE = 'http://localhost:3001/api';

async function fetchWithProxy(url) {
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log('Fetching URL:', url);
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
}

export async function searchCharacters(name, world = '', datacenter = '') {
    try {
        const params = new URLSearchParams({
            name: name.trim(),
            world: world.trim(),
            datacenter: datacenter.trim()
        });

        const response = await fetch(`${API_BASE}/search?${params}`);
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Raw HTML snippet:', html.substring(0, 1000));

        const characters = parseCharacterSearchResults(html);
        return { characters };
    } catch (error) {
        console.error('Search error:', error);
        throw new Error('Failed to search characters. Please try again.');
    }
}

function parseCharacterSearchResults(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('Document body snippet:', doc.body.innerHTML.substring(0, 1000));
    
    // Find all entry divs directly
    const entries = doc.querySelectorAll('div.entry');
    console.log('Found entries:', entries.length);

    return Array.from(entries).map(entry => {
        try {
            // Look for the character link (not free company links)
            const linkElement = entry.querySelector('a[href^="/lodestone/character/"]');
            console.log('Link element:', linkElement?.outerHTML);

            if (!linkElement) {
                console.log('No character link found for entry:', entry.outerHTML);
                return null;
            }

            // Extract character ID from the href
            const idMatch = linkElement.getAttribute('href').match(/character\/(\d+)/);
            if (!idMatch) {
                console.log('No character ID found in href:', linkElement.href);
                return null;
            }

            // Get character info from the link's parent entry div
            const nameElement = entry.querySelector('.entry__name');
            const worldElement = entry.querySelector('.entry__world');
            const avatarElement = entry.querySelector('.entry__chara__face img');

            console.log('Parsing elements:', {
                id: idMatch[1],
                name: nameElement?.textContent,
                world: worldElement?.textContent,
                avatar: avatarElement?.src
            });

            if (!nameElement) {
                console.log('Missing name element');
                return null;
            }

            const result = {
                id: idMatch[1],
                name: nameElement.textContent.trim(),
                world: worldElement ? worldElement.textContent.trim() : '',
                avatar: avatarElement ? avatarElement.src : '',
                rank: '',
                level: ''
            };

            console.log('Successfully parsed character:', result);
            return result;
        } catch (error) {
            console.error('Error parsing entry:', error);
            return null;
        }
    }).filter(Boolean); // Remove any null entries
}

export async function getCharacterDetails(characterId) {
    try {
        console.log('Fetching character details for ID:', characterId);
        
        // First get basic character info
        const response = await fetch(`${API_BASE}/character/${characterId}`);
        if (!response.ok) {
            throw new Error(`Failed to get character details: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Basic info HTML snippet:', html.substring(0, 500));
        
        const basicInfo = parseCharacterDetails(html);
        console.log('Parsed basic info:', basicInfo);

        if (!basicInfo.name || !basicInfo.server) {
            throw new Error('Failed to parse basic character information');
        }

        // Then get job levels from the class/job page
        const jobResponse = await fetch(`${API_BASE}/character/${characterId}/class_job`);
        if (!jobResponse.ok) {
            throw new Error(`Failed to get job levels: ${jobResponse.status} ${jobResponse.statusText}`);
        }

        const jobHtml = await jobResponse.text();
        console.log('Job HTML snippet:', jobHtml.substring(0, 500));

        const jobLevels = parseJobLevels(jobHtml);
        console.log('Parsed job levels:', jobLevels);

        if (!jobLevels || Object.keys(jobLevels).length === 0) {
            console.warn('No job data found for character');
        }

        return {
            ...basicInfo,
            jobs: jobLevels || {} // Ensure jobs is always an object
        };
    } catch (error) {
        console.error('Character details error:', error);
        // Return a more informative error state
        return {
            name: 'Error Loading Character',
            server: error.message || 'Unknown error occurred',
            portrait: '',
            bio: 'There was a problem loading this character\'s information. Please try again.',
            jobs: {}
        };
    }
}

function parseCharacterDetails(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    console.log('Parsing character details from HTML:', doc.body.innerHTML.substring(0, 1000));

    // Get basic character info
    const nameElement = doc.querySelector('.frame__chara__name');
    const serverElement = doc.querySelector('.frame__chara__world');
    
    // Try multiple selectors for portrait
    const portraitSelectors = [
        '.character__detail__image img',  // Full body portrait
        '.character-block__face img',     // Face portrait
        '.frame__chara__face img',        // Alternative face
        'img.js__image_popup'             // Any character image
    ];
    
    let portraitElement = null;
    for (const selector of portraitSelectors) {
        portraitElement = doc.querySelector(selector);
        if (portraitElement) {
            console.log('Found portrait with selector:', selector);
            break;
        }
    }

    const bioElement = doc.querySelector('.character__selfintroduction');

    const result = {
        name: nameElement ? nameElement.textContent.trim() : '',
        server: serverElement ? serverElement.textContent.trim() : '',
        portrait: portraitElement ? portraitElement.src : '',
        bio: bioElement ? bioElement.textContent.trim() : ''
    };

    console.log('Parsed character details:', result);
    return result;
}

function parseJobLevels(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        console.log('Parsing job levels from HTML');

        const jobs = {};
        
        // Find all role sections
        const roleElements = doc.querySelectorAll('.character__job__role');
        console.log('Found role elements:', roleElements.length);
        
        roleElements.forEach(roleSection => {
            // Get role name from the heading
            const roleHeading = roleSection.querySelector('.heading--lead');
            let roleName = roleHeading ? roleHeading.textContent.trim().toLowerCase() : 'other';
            console.log('Processing role:', roleName);
            
            jobs[roleName] = {};

            // Find all job list items
            const jobElements = roleSection.querySelectorAll('ul.character__job > li');
            console.log(`Found ${jobElements.length} jobs in role ${roleName}`);

            jobElements.forEach(jobElement => {
                try {
                    // Get job name from the tooltip div
                    const jobNameElement = jobElement.querySelector('.character__job__name');
                    const jobName = jobNameElement ? 
                        (jobNameElement.getAttribute('data-tooltip') || jobNameElement.textContent)
                            .split('/')[0].trim() : null;

                    // Get job level
                    const levelElement = jobElement.querySelector('.character__job__level');
                    const level = levelElement ? levelElement.textContent.trim() : null;

                    // Get experience points
                    const expElement = jobElement.querySelector('.character__job__exp');
                    const exp = expElement ? expElement.textContent.trim() : '';

                    // Get job icon
                    const iconElement = jobElement.querySelector('.character__job__icon img');
                    const icon = iconElement ? iconElement.src : '';

                    console.log('Found job:', { jobName, level, exp, icon });

                    if (jobName && level) {
                        jobs[roleName][jobName] = {
                            level,
                            exp,
                            icon
                        };
                    }
                } catch (error) {
                    console.error('Error parsing job element:', error);
                }
            });

            // If no jobs were found in this role, delete the empty role object
            if (Object.keys(jobs[roleName]).length === 0) {
                delete jobs[roleName];
            }
        });

        console.log('Final parsed jobs:', jobs);
        return Object.keys(jobs).length > 0 ? jobs : {};
    } catch (error) {
        console.error('Error parsing job levels:', error);
        return {};
    }
}