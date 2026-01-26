const express = require('express');
const router = express.Router();

// GET route to serve the form
router.get('/form', (req, res) => {
    res.sendFile('index.html', { root: './src/public' });
});

// POST route to handle form submission
router.post('/form', (req, res) => {
    const formData = req.body;
    // Process the form data here (e.g., save to database, etc.)
    res.send(`Form submitted successfully! Received data: ${JSON.stringify(formData)}`);
});

module.exports = router;