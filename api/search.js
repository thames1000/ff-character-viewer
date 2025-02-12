const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const { character_name, world, datacenter } = req.query;
    
    try {
        const params = new URLSearchParams({
            q: character_name,
            worldname: world || '',
            classjob: '',
            race_tribe: '',
            blog_lang: 'en',
            page: '1'
        });

        console.log('Fetching from Lodestone with params:', params.toString());
        const response = await fetch(`https://na.finalfantasyxiv.com/lodestone/character/?${params}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const characters = [];
        $('.entry').each((i, el) => {
            const $entry = $(el);
            const link = $entry.find('a.entry__link').attr('href');
            const id = link ? link.split('/')[3] : null;
            
            if (id) {
                characters.push({
                    id,
                    name: $entry.find('.entry__name').text().trim(),
                    world: $entry.find('.entry__world').text().trim(),
                    avatar: $entry.find('.entry__chara__face img').attr('src'),
                    rank: $entry.find('.entry__chara__class').text().trim(),
                    level: $entry.find('.entry__chara__level').text().trim()
                });
            }
        });

        console.log(`Found ${characters.length} characters`);
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json({ characters });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
};
