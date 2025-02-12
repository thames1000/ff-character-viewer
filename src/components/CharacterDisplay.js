export function renderSearchResults(characters, container, onCharacterClick) {
    if (!characters.length) {
        container.innerHTML = '<div class="no-results">No characters found</div>';
        return;
    }

    container.innerHTML = `
        <div class="search-results">
            <h3>Found ${characters.length} characters:</h3>
            <div class="character-grid">
                ${characters.map(char => `
                    <div class="character-card" data-id="${char.id}">
                        <div class="character-header">
                            <img src="${char.avatar}" alt="${char.name}" class="character-avatar">
                            <div class="character-info">
                                <h3>${char.name}</h3>
                                <p>${char.world} [${char.datacenter}]</p>
                                <p>${char.rank}</p>
                            </div>
                        </div>
                        <button class="select-character">Select Character</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelectorAll('.character-card').forEach(card => {
        const selectBtn = card.querySelector('.select-character');
        selectBtn.addEventListener('click', () => {
            onCharacterClick(card.dataset.id);
            container.querySelectorAll('.character-card').forEach(c =>
                c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
}

export function renderCharacterDetails(character, container) {
    console.log('Rendering character details:', character);
    console.log('Character jobs:', character.jobs);

    container.innerHTML = `
        <div class="character-details">
            <div class="character-header">
                <img src="${character.portrait}" alt="${character.name}" class="character-portrait">
                <div class="character-info">
                    <h2>${character.name}</h2>
                    <p class="character-title">${character.title}</p>
                    <p class="character-server">${character.server}</p>
                </div>
            </div>

            <div class="jobs-section">
                <div class="combat-jobs">
                    <h3>Combat Jobs</h3>
                    
                    <div class="job-category">
                        <h4>Tanks</h4>
                        <div class="jobs-grid">
                            ${console.log('Tank jobs:', character.jobs.tank) || renderJobCategory(character.jobs.tank)}
                        </div>
                    </div>

                    <div class="job-category">
                        <h4>Healers</h4>
                        <div class="jobs-grid">
                            ${renderJobCategory(character.jobs.healer)}
                        </div>
                    </div>

                    <div class="job-category">
                        <h4>DPS</h4>
                        <div class="jobs-grid">
                            ${renderJobCategory(character.jobs.dps)}
                        </div>
                    </div>
                </div>

                <div class="crafting-jobs">
                    <h3>Crafters & Gatherers</h3>
                    
                    <div class="job-category">
                        <h4>Crafters</h4>
                        <div class="jobs-grid">
                            ${renderJobCategory(character.jobs.crafting)}
                        </div>
                    </div>

                    <div class="job-category">
                        <h4>Gatherers</h4>
                        <div class="jobs-grid">
                            ${renderJobCategory(character.jobs.gathering)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderJobCategory(jobs) {
    if (!jobs || Object.keys(jobs).length === 0) {
        return '<p class="no-jobs">No jobs available</p>';
    }

    console.log('Rendering job category:', jobs);

    return Object.entries(jobs)
        .map(([abbr, jobInfo]) => {
            console.log('Rendering job:', { abbr, jobInfo });
            return `
                <div class="job-item ${jobInfo.level === 100 ? 'max-level' : ''}">
                    <div class="job-name">${abbr}</div>
                    <img src="${jobInfo.icon}" alt="${abbr}" class="job-icon">
                    <div class="job-level">${jobInfo.level}</div>
                </div>
            `;
        }).join('');
} 