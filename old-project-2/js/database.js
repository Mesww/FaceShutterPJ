const { MongoClient } = require('mongodb');

// MongoDB Connection URI
const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection URI

// Database Name
const dbName = 'test'; // Replace with your database name

async function main() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Connect to the specific database
        const database = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);

        // Perform actions here (query, insert, update, delete, etc.)
        // Example: Query documents from a collection
        const collection = database.collection('students');
        const query = { student_id: '123456' }; // Example query
        const student = await collection.findOne(query);
        console.log('Found student:', student);
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        // Close the connection
        await client.close();
        console.log('MongoDB connection closed.');
    }
}

// Run the main function
main().catch(console.error);


const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;


// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Endpoint to get student information by student ID
app.get('/api/students/:studentId', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        const database = client.db(dbName);
        const collection = database.collection('students');

        const query = { student_id: studentId };
        const student = await collection.findOne(query);

        client.close();

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(student); // Send student data back to the client
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

