import React, { useState } from 'react';

function SearchForm({ onSearch }) {
    const [formData, setFormData] = useState({
        name: '',
        world: '',
        datacenter: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-group">
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Character Name"
                    required
                />
                <input
                    type="text"
                    name="world"
                    value={formData.world}
                    onChange={handleChange}
                    placeholder="World (optional)"
                />
                <input
                    type="text"
                    name="datacenter"
                    value={formData.datacenter}
                    onChange={handleChange}
                    placeholder="Data Center (optional)"
                />
                <button type="submit">Search</button>
            </div>
        </form>
    );
}

export default SearchForm; 