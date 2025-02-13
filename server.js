const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://na.finalfantasyxiv.com/lodestone/'
};

app.get('/api/search', async (req, res) => {
    try {
        const { name } = req.query;
        const searchUrl = `https://na.finalfantasyxiv.com/lodestone/character/?q=${encodeURIComponent(name)}&worldname=_region_2&classjob=&race_tribe=&blog_lang=ja&blog_lang=en&blog_lang=de&blog_lang=fr&order=`;

        console.log('Searching:', searchUrl);
        const response = await fetch(searchUrl, { headers });
        if (!response.ok) {
            throw new Error(`Lodestone search failed: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        
        console.log('Search response length:', html.length);
        console.log('Response snippet:', html.substring(0, 500));
        
        res.send(html);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message || 'Failed to search characters' });
    }
});

app.get('/api/character/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/`;
        console.log('Fetching character details:', url);
        
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Lodestone character fetch failed: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('Character response length:', html.length);
        res.send(html);
    } catch (error) {
        console.error('Character details error:', error);
        res.status(500).json({ error: error.message || 'Failed to get character details' });
    }
});

app.get('/api/character/:id/class_job', async (req, res) => {
    try {
        const { id } = req.params;
        const url = `https://na.finalfantasyxiv.com/lodestone/character/${id}/class_job/`;
        console.log('Fetching job details:', url);
        
        const response = await fetch(url, { headers });
        console.log('Job response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Lodestone job fetch failed: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        
        // Save HTML to a debug file
        fs.writeFileSync('job_debug.html', html);
        
        console.log('Job response length:', html.length);
        console.log('Job HTML structure:');
        
        // Log the structure of job elements
        const jobMatches = html.match(/<div class="character__job.*?<\/div>/gs);
        if (jobMatches) {
            console.log(`Found ${jobMatches.length} job elements`);
            jobMatches.forEach((match, i) => {
                if (i < 5) { // Log first 5 matches as example
                    console.log(`\nJob ${i + 1}:`, match.substring(0, 500));
                }
            });
        }

        // Check if we got a valid response with job data
        if (!html.includes('character__content') && !html.includes('character-content')) {
            console.log('Invalid job response - no job data found');
            throw new Error('Invalid job data response from Lodestone');
        }

        res.send(html);
    } catch (error) {
        console.error('Class/job error:', error);
        res.status(500).json({ 
            error: `Failed to get class/job information: ${error.message}`,
            url: `https://na.finalfantasyxiv.com/lodestone/character/${req.params.id}/class_job/`
        });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'An unexpected error occurred',
        details: err.message
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
