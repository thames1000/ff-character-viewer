import React from 'react';
import CharacterSearch from './components/CharacterSearch';
import './App.css';

function App() {
    return (
        <div className="app">
            <header>
                <h1>FFXIV Character Search</h1>
            </header>
            <main>
                <CharacterSearch />
            </main>
            <footer>
                <p>Data from FFXIV Lodestone</p>
            </footer>
        </div>
    );
}

export default App; 