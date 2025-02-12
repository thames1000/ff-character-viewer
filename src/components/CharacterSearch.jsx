import React, { useState } from 'react';
import { searchCharacters } from '../utils/api';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import CharacterDetails from './CharacterDetails';

function CharacterSearch() {
    const [searchResults, setSearchResults] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (searchParams) => {
        try {
            setLoading(true);
            setError(null);
            setSelectedCharacter(null);
            const { characters } = await searchCharacters(
                searchParams.name,
                searchParams.world,
                searchParams.datacenter
            );
            setSearchResults(characters);
        } catch (err) {
            setError('Failed to search characters. Please try again.');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="character-search">
            <SearchForm onSearch={handleSearch} />

            {loading && <div className="loading">Searching...</div>}
            {error && <div className="error">{error}</div>}

            <div className="search-content">
                <SearchResults
                    characters={searchResults}
                    onSelectCharacter={setSelectedCharacter}
                    selectedId={selectedCharacter?.id}
                />
                {selectedCharacter && (
                    <CharacterDetails characterId={selectedCharacter.id} />
                )}
            </div>
        </div>
    );
}

export default CharacterSearch; 