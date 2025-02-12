const api = require('./utils/api.js');

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
            const { characters } = await api.searchCharacters(name, world, datacenter);
            displaySearchResults(characters);
        } catch (error) {
            errorEl.textContent = error.message || 'Failed to search characters. Please try again.';
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
            <img src="${char.avatar}" alt="${char.name}" class="character-avatar">
            <div class="character-info">
                <h4>${char.name}</h4>
                <p>${char.world} [${char.datacenter}]</p>
                <p>${char.rank} (${char.level})</p>
            </div>
        `;
        
        const button = document.createElement('button');
        button.textContent = 'View Details';
        button.addEventListener('click', () => showCharacterDetails(char.id));
        card.appendChild(button);
        
        return card;
    }
});

// Make showCharacterDetails available globally
window.showCharacterDetails = async function(characterId) {
    const detailsEl = document.getElementById('characterDetails');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    detailsEl.innerHTML = '';

    try {
        const character = await api.getCharacterDetails(characterId);
        displayCharacterDetails(character);
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to load character details. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        loadingEl.style.display = 'none';
    }
};

function displayCharacterDetails(character) {
    const detailsEl = document.getElementById('characterDetails');
    
    const details = document.createElement('div');
    details.className = 'character-details';
    details.innerHTML = `
        <div class="character-header">
            <img src="${character.portrait}" alt="${character.name}" class="character-portrait">
            <div class="character-header-info">
                <h2>${character.name}</h2>
                ${character.title ? `<h3>"${character.title}"</h3>` : ''}
                <p>${character.server}</p>
                ${character.bio ? `<p class="character-bio">${character.bio}</p>` : ''}
            </div>
        </div>
        <div class="character-jobs">
            <div class="job-category">
                <h3>Combat Jobs</h3>
                <div class="job-grid">
                    ${displayJobCategory('Tanks', character.jobs.tank)}
                    ${displayJobCategory('Healers', character.jobs.healer)}
                    ${displayJobCategory('DPS', character.jobs.dps)}
                </div>
            </div>
            <div class="job-category">
                <h3>Other Jobs</h3>
                <div class="job-grid">
                    ${displayJobCategory('Crafting', character.jobs.crafting)}
                    ${displayJobCategory('Gathering', character.jobs.gathering)}
                </div>
            </div>
        </div>
    `;

    detailsEl.innerHTML = '';
    detailsEl.appendChild(details);
}

function displayJobCategory(title, jobs) {
    if (!jobs || Object.keys(jobs).length === 0) return '';

    const jobElements = Object.entries(jobs).map(([job, data]) => `
        <div class="job-item">
            <img src="${data.icon}" alt="${job}" class="job-icon">
            <span class="job-level">${data.level}</span>
        </div>
    `).join('');

    return `
        <div class="job-section">
            <h4>${title}</h4>
            <div class="job-items">
                ${jobElements}
            </div>
        </div>
    `;
}
