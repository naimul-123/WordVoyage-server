const express = require('express');
const cors = require('cors');
const mongodb = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json())


const port = process.env.PORT || 5000

app.get('/', async (req, res) => {
    res.send(`Assignment 11 server is running Ok`)
})


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})