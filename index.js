const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json())


const port = process.env.PORT || 5000
const username = process.env.DB_USER
const password = process.env.DB_PASSWORD || 5000

app.get('/', async (req, res) => {
    res.send(`Assignment 11 server is running Ok`)
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${username}:${password}@cluster0.nevhe4f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})