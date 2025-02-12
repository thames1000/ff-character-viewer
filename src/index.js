import { searchCharacters, getCharacterDetails } from './utils/api.js';
import { renderSearchResults, renderCharacterDetails } from './components/CharacterDisplay.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const resultsContainer = document.getElementById('results');
    const detailsContainer = document.getElementById('character-details');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('character-name').value;
        const world = document.getElementById('world').value;
        const datacenter = document.getElementById('datacenter').value;

        try {
            resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
            detailsContainer.innerHTML = '';

            const data = await searchCharacters(name, world, datacenter);
            renderSearchResults(data.characters, resultsContainer, async (characterId) => {
                try {
                    detailsContainer.innerHTML = '<div class="loading">Loading character details...</div>';
                    const characterData = await getCharacterDetails(characterId);
                    renderCharacterDetails(characterData.character, detailsContainer);
                } catch (error) {
                    detailsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                }
            });
        } catch (error) {
            resultsContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    });
}); 