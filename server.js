const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();

// Parse JSON data
app.use(bodyParser.json());

// Calculating distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Adding a new school
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Input validations
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required!' });
    }

    try {
        const query = 'INSERT INTO schoolss (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
        const values = [name, address, latitude, longitude];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('Error inserting data:', err.message);
                return res.status(500).json({ error: 'Database error!' });
            }

            res.status(201).json({ message: 'School added successfully!', schoolId: result.insertId });
        });
    } catch (error) {
        console.error('Error adding school:', error.message);
        res.status(500).json({ error: 'Internal server error!' });
    }
});

app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Input validations
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required!' });
    }

    const query = 'SELECT * FROM schoolss';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err.message);
            return res.status(500).json({ error: 'Database error!' });
        }

        // Calculate distances and sort
        const schoolsWithDistance = results.map((school) => {
            const distance = calculateDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                school.latitude,
                school.longitude
            );
            return { ...school, distance };
        });

        schoolsWithDistance.sort((a, b) => a.distance - b.distance);

        res.json(schoolsWithDistance);
    });
});

// Testing if server is running
app.get('/', (req, res) => {
    res.send('School Management API is running!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
