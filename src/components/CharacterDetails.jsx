import React, { useState, useEffect } from 'react';
import { getCharacterDetails } from '../utils/api';
import JobList from './JobList';

function CharacterDetails({ characterId }) {
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const { character } = await getCharacterDetails(characterId);
                setCharacter(character);
            } catch (err) {
                setError('Failed to load character details');
                console.error('Details error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [characterId]);

    if (loading) {
        return <div className="loading">Loading character details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!character) {
        return null;
    }

    return (
        <div className="character-details">
            <div className="character-header">
                <img
                    src={character.portrait}
                    alt={character.name}
                    className="character-portrait"
                />
                <div className="character-info">
                    <h2>{character.name}</h2>
                    <p className="character-title">{character.title}</p>
                    <p className="character-server">{character.server}</p>
                </div>
            </div>

            <div className="jobs-section">
                <div className="combat-jobs">
                    <h3>Combat Jobs</h3>
                    <JobList title="Tanks" jobs={character.jobs.tank} />
                    <JobList title="Healers" jobs={character.jobs.healer} />
                    <JobList title="DPS" jobs={character.jobs.dps} />
                </div>

                <div className="crafting-jobs">
                    <h3>Crafters & Gatherers</h3>
                    <JobList title="Crafters" jobs={character.jobs.crafting} />
                    <JobList title="Gatherers" jobs={character.jobs.gathering} />
                </div>
            </div>
        </div>
    );
}

export default CharacterDetails; 