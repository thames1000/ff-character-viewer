import '../public/css/styles.css';
import { searchCharacters, getCharacterDetails } from './utils/api';

// DOM Elements
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#character-name');
const worldInput = document.querySelector('#world');
const datacenterInput = document.querySelector('#datacenter');
const resultsContainer = document.querySelector('#results');
const characterDetailsContainer = document.querySelector('#character-details');

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

async function handleSearch(event) {
    event.preventDefault();
    
    try {
        const { characters } = await searchCharacters(
            searchInput.value,
            worldInput.value,
            datacenterInput.value
        );

        displaySearchResults(characters);
    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = `<p class="error">Search failed: ${error.message}</p>`;
    }
}

function displaySearchResults(characters) {
    if (!characters || characters.length === 0) {
        resultsContainer.innerHTML = '<p>No characters found</p>';
        return;
    }

    resultsContainer.innerHTML = `
        <h2>Found ${characters.length} characters:</h2>
        <div class="character-grid">
            ${characters.map(character => `
                <div class="character-card">
                    <img src="${character.avatar || 'placeholder.png'}" alt="${character.name}" class="character-avatar">
                    <h3>${character.name}</h3>
                    <p>${character.world}</p>
                    <button onclick="showCharacterDetails('${character.id}')" class="select-character">
                        Select Character
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Expose this function to the global scope for the onclick handler
window.showCharacterDetails = async function(characterId) {
    try {
        const details = await getCharacterDetails(characterId);
        console.log('Character details:', details);

        if (!details) {
            throw new Error('No character details received');
        }

        const MAX_LEVEL = 100; // Current max level in FFXIV

        // Create sections for each role
        const jobSections = Object.entries(details.jobs || {}).map(([role, jobs]) => {
            // Sort jobs by level (highest first) and then by name
            const sortedJobs = Object.entries(jobs).sort((a, b) => {
                const levelA = parseInt(a[1].level) || 0;
                const levelB = parseInt(b[1].level) || 0;
                if (levelB !== levelA) {
                    return levelB - levelA;
                }
                return a[0].localeCompare(b[0]);
            });

            const jobList = sortedJobs.map(([jobName, jobInfo]) => {
                const level = parseInt(jobInfo.level) || 0;
                const isMaxLevel = level === MAX_LEVEL;
                
                return `
                    <div class="job-item ${isMaxLevel ? 'max-level' : ''}">
                        <div class="job-icon-container">
                            <img src="${jobInfo.icon || 'placeholder.png'}" alt="${jobName}" class="job-icon">
                            <span class="job-name">${jobName}</span>
                        </div>
                        <div class="job-info">
                            <span class="job-level">Level ${jobInfo.level}</span>
                            ${jobInfo.exp ? `<div class="job-exp">${jobInfo.exp}</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="job-section">
                    <h3 class="role-heading">${role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                    <div class="job-grid">
                        ${jobList}
                    </div>
                </div>
            `;
        }).join('');

        characterDetailsContainer.innerHTML = `
            <div class="character-details">
                <div class="character-header">
                    <img src="${details.portrait || 'placeholder.png'}" alt="${details.name}" class="character-portrait">
                    <div class="character-info">
                        <h2>${details.name}</h2>
                        <p>${details.server}</p>
                        ${details.bio ? `<p class="character-bio">${details.bio}</p>` : ''}
                    </div>
                </div>
                <div class="jobs-container">
                    ${jobSections}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error showing character details:', error);
        characterDetailsContainer.innerHTML = `
            <div class="error-message">
                <h2>Error Loading Character</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
};