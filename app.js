// Test JavaScript file for search functionality
const express = require('express');
const app = express();

// Test endpoints
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test endpoint' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});