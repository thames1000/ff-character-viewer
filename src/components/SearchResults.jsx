import React from 'react';

function SearchResults({ characters, onSelectCharacter, selectedId }) {
    if (!characters.length) {
        return null;
    }

    return (
        <div className="search-results">
            <h3>Found {characters.length} characters:</h3>
            <div className="character-grid">
                {characters.map(char => (
                    <div
                        key={char.id}
                        className={`character-card ${selectedId === char.id ? 'selected' : ''}`}
                    >
                        <div className="character-header">
                            <img
                                src={char.avatar}
                                alt={char.name}
                                className="character-avatar"
                            />
                            <div className="character-info">
                                <h3>{char.name}</h3>
                                <p>{char.world} [{char.datacenter}]</p>
                                <p>{char.rank}</p>
                            </div>
                        </div>
                        <button
                            className="select-character"
                            onClick={() => onSelectCharacter(char)}
                        >
                            Select Character
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SearchResults; 