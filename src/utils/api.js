const BASE_URL = window.location.hostname === 'localhost'
    ? ''
    : 'https://thames1000.github.io/ff-character-viewer';

export async function searchCharacters(name, world = '', datacenter = '') {
    try {
        const params = new URLSearchParams({
            character_name: name.trim(),
            world: world.trim(),
            datacenter: datacenter.trim()
        });

        const response = await fetch(`${BASE_URL}/api/search?${params}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to search characters');
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getCharacterDetails(characterId) {
    const response = await fetch(`${BASE_URL}/api/character/${characterId}`);
    if (!response.ok) {
        throw new Error('Failed to get character details');
    }
    return response.json();
} 