const express = require('express');
const cors = require('cors');

const mongodb = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true

}));
app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT
const username = process.env.DB_USER
const password = process.env.DB_PASSWORD
const secret = process.env.SECREET_KEY

// middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'Not Authorized' })
    }

    jwt.verify(token, secret, async (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: err.message })
        }
        req.user = decoded;
        next();
    })
}

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

        const blogsCollection = client.db("blogDb").collection('blogs');
        const commentCollection = client.db("blogDb").collection('comments');
        const newsLetterCollection = client.db("blogDb").collection('newsLetter')
        app.get('/blogs', async (req, res) => {
            const title = req.query.title
            const category = req.query.category
            // console.log(searchQuery)
            let query = {}
            if (title) {
                query.title = { $regex: title, $options: 'i' };
            }

            if (category) {
                query.catagory = category;
            }



            const cursor = blogsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/comments', verifyToken, async (req, res) => {
            const id = req.query.blogId;
            const query = {
                blogId: id
            }

            const result = await commentCollection.find(query).toArray();
            res.send(result)

        })

        app.get('/recentBlogs', async (req, res) => {
            const cursor = blogsCollection.find().sort("createdAt", -1).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/featuredBlogs', async (req, res) => {
            const pipeline = [
                {
                    $addFields: {
                        textLength: {
                            $strLenCP: "$longDesc"
                        }
                    }
                },
                { $sort: { textLength: -1 } },
                { $limit: 10 }
            ]
            const result = await blogsCollection.aggregate(pipeline).toArray();

            res.send(result)
        })

        app.get('/blog/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new mongodb.ObjectId(id) }
            const result = await blogsCollection.findOne(query)
            res.send(result)

        })
        app.get('/mywishlist/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.user.email) {
                return res.status(403).send({ message: "Forbiden Acccess" })
            }
            // console.log(email)
            const query = { wishedEmail: email }
            const result = await blogsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/addblogs', async (req, res) => {
            const blog = req.body;

            const result = await blogsCollection.insertOne(blog);
            res.send(result)

        })

        app.put('/addtonewsletter', async (req, res) => {
            const { email } = req.body;
            const result = await newsLetterCollection.updateOne({}, { $addToSet: { newsLetterEmails: email } }, { upsert: true })
            res.send(result)
        })

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, secret, {
                expiresIn: '1h'
            });
            res.cookie('token', token, {
                httpOnly: true,
                secure: false
            }).send({ success: true })
        })
        app.put('/updateblog', async (req, res) => {
            const blog = req.body
            const id = blog._id;
            const filter = { _id: new mongodb.ObjectId(id) };
            const updatedBlog = {
                $set: {
                    title: blog.title,
                    imgUrl: blog.imgUrl,
                    catagory: blog.catagory,
                    shortDisc: blog.shortDisc,
                    longDesc: blog.longDesc
                }
            }

            const result = await blogsCollection.updateOne(filter, updatedBlog)

            res.send(result)
        })

        app.put('/addtowish', async (req, res) => {
            const wishInfo = req.body
            const { _id, email } = wishInfo

            const filter = { _id: new mongodb.ObjectId(_id) }
            const addtoWish = {
                $addToSet: {
                    wishedEmail: email
                }
            }
            const result = await blogsCollection.updateOne(filter, addtoWish)
            res.send(result)


        })

        app.put('/removefromwish', async (req, res) => {
            const { id, email } = req.body;

            const filter = { _id: new mongodb.ObjectId(id) }
            const addtoWish = {
                $pull: {
                    wishedEmail: email
                }
            }
            const result = await blogsCollection.updateOne(filter, addtoWish)
            res.send(result)
        })

        app.post('/addComment', async (req, res) => {
            const comment = req.body
            const result = await commentCollection.insertOne(comment)
            res.send(result)
        })

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