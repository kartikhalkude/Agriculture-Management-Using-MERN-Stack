const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();

// MongoDB connection URI and database name
const uri = 'mongodb://localhost:27017'; // Change this if your MongoDB is hosted elsewhere
const dbName = 'agriculture';
const client = new MongoClient(uri);

let db, cropsCollection;

// Middleware
app.use(express.static(path.join(__dirname, '')));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
client.connect()
    .then(() => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
        cropsCollection = db.collection('crops');
    })
    .catch(err => console.error('Could not connect to MongoDB', err));

// Home route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle adding a crop
app.post('/add-crop', async (req, res) => {
    const { cropName, cropType, cropQuantity, season } = req.body;

    const newCrop = {
        name: cropName,
        type: cropType,
        quantity: parseInt(cropQuantity, 10),
        season: season,
    };

    try {
        await cropsCollection.insertOne(newCrop);
        console.log('New Crop Added:', newCrop);
        res.redirect('/');
    } catch (err) {
        console.error('Error adding crop:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to view all crops
app.get('/view-crops', async (req, res) => {
    try {
        const crops = await cropsCollection.find().toArray();
        res.json(crops);
    } catch (err) {
        console.error('Error retrieving crops:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to delete a crop
app.post('/delete-crop', async (req, res) => {
    const { cropId } = req.body;

    try {
        await cropsCollection.deleteOne({ _id: new MongoClient.ObjectId(cropId) });
        console.log('Crop Deleted:', cropId);
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting crop:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to update a crop
app.post('/update-crop', async (req, res) => {
    const { cropId, newCropQuantity, newSeason } = req.body;

    try {
        await cropsCollection.updateOne(
            { _id: new MongoClient.ObjectId(cropId) },
            { $set: { quantity: parseInt(newCropQuantity, 10), season: newSeason } }
        );
        console.log('Crop Updated:', cropId);
        res.sendStatus(204);
    } catch (err) {
        console.error('Error updating crop:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to search for crops
app.get('/search-crop', async (req, res) => {
    const { term } = req.query;

    try {
        const results = await cropsCollection.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { type: { $regex: term, $options: 'i' } }
            ]
        }).toArray();
        res.json(results);
    } catch (err) {
        console.error('Error searching crops:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
