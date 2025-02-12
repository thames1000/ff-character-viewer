document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsEl = document.getElementById('searchResults');
    const detailsEl = document.getElementById('characterDetails');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('characterName').value;
        const world = document.getElementById('world').value;
        const datacenter = document.getElementById('datacenter').value;

        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        resultsEl.innerHTML = '';
        detailsEl.innerHTML = '';

        try {
            const characters = await LodestoneAPI.searchCharacters(name, world, datacenter);
            displaySearchResults(characters);
        } catch (error) {
            errorEl.textContent = 'Failed to search characters. Please try again.';
            errorEl.style.display = 'block';
        } finally {
            loadingEl.style.display = 'none';
        }
    });

    function displaySearchResults(characters) {
        if (!characters.length) {
            resultsEl.innerHTML = '<p>No characters found.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'character-grid';

        characters.forEach(char => {
            const card = createCharacterCard(char);
            grid.appendChild(card);
        });

        resultsEl.innerHTML = `<h3>Found ${characters.length} characters:</h3>`;
        resultsEl.appendChild(grid);
    }

    function createCharacterCard(char) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-header">
                <img src="${char.avatar}" alt="${char.name}" class="character-avatar">
                <div class="character-info">
                    <h3>${char.name}</h3>
                    <p>${char.world} [${char.datacenter}]</p>
                    <p>${char.rank}</p>
                </div>
            </div>
            <button onclick="showCharacterDetails('${char.id}')">View Details</button>
        `;
        return card;
    }
});

async function showCharacterDetails(characterId) {
    const detailsEl = document.getElementById('characterDetails');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    detailsEl.innerHTML = '';

    try {
        const character = await LodestoneAPI.getCharacterDetails(characterId);
        displayCharacterDetails(character);
    } catch (error) {
        errorEl.textContent = 'Failed to load character details. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        loadingEl.style.display = 'none';
    }
}

function displayCharacterDetails(character) {
    const detailsEl = document.getElementById('characterDetails');

    detailsEl.innerHTML = `
        <div class="character-header">
            <img src="${character.portrait}" alt="${character.name}" class="character-portrait">
            <div class="character-info">
                <h2>${character.name}</h2>
                ${character.title ? `<p class="character-title">${character.title}</p>` : ''}
                <p class="character-server">${character.server}</p>
            </div>
        </div>
        ${character.bio ? `<div class="character-bio">${character.bio}</div>` : ''}
        <div class="jobs-section">
            <div class="combat-jobs">
                <h3>Combat Jobs</h3>
                ${displayJobCategory('Tanks', character.jobs.tank)}
                ${displayJobCategory('Healers', character.jobs.healer)}
                ${displayJobCategory('DPS', character.jobs.dps)}
            </div>
            <div class="crafting-jobs">
                <h3>Crafters & Gatherers</h3>
                ${displayJobCategory('Crafters', character.jobs.crafting)}
                ${displayJobCategory('Gatherers', character.jobs.gathering)}
            </div>
        </div>
    `;
}

function displayJobCategory(title, jobs) {
    if (!Object.keys(jobs).length) return '';

    const jobItems = Object.entries(jobs).map(([abbr, job]) => `
        <div class="job-item ${job.level === 90 ? 'max-level' : ''}">
            <img src="${job.icon}" alt="${abbr}" class="job-icon">
            <div class="job-name">${abbr}</div>
            <div class="job-level">${job.level}</div>
        </div>
    `).join('');

    return `
        <div class="job-category">
            <h4>${title}</h4>
            <div class="jobs-grid">
                ${jobItems}
            </div>
        </div>
    `;
} 