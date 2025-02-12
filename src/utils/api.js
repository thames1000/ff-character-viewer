export async function searchCharacters(name, world = '', datacenter = '') {
    try {
        // Format the parameters to match what the server expects
        const params = new URLSearchParams({
            character_name: name.trim(),
            world: world.trim(),
            datacenter: datacenter.trim()
        });

        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to search characters');
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getCharacterDetails(characterId) {
    const response = await fetch(`/api/character/${characterId}`);
    if (!response.ok) {
        throw new Error('Failed to get character details');
    }
    return response.json();
} 