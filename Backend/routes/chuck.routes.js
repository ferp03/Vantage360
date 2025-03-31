const express = require('express');
const router = express.Router();

// Chuck Norris jokes
router.post('/chuckNorris', (req, res) => {
    const { category, num } = req.body;
    console.log(category);
  
    let url = 'https://api.chucknorris.io/jokes/random';
    if (category !== 'none') {
      url = `https://api.chucknorris.io/jokes/random?category=${category}`;
    }
  
    const promises = Array.from({length: num}, () =>
      fetch(url)
        .then(response => response.json())
    );
  
    Promise.all(promises)
      .then(jokes => {
        console.log(jokes);
        res.json({jokes});
      })
      .catch(error => {
        console.error('Error fetching jokes:', error);
        res.status(500).json({ error: 'Failed to fetch jokes' });
      });
  });

// Chuck Norris categories
router.get('/categories', (req, res) => {
    fetch('https://api.chucknorris.io/jokes/categories')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        res.json({ categories: data});
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
      });
  });

module.exports = router;
