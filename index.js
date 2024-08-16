
const express = require('express')
const app = express();
const port = process.env.PORT = 5000;
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

//middleware
app.use(cors());
app.use(express.json());

//DataBase Connected
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9v5xfpg.mongodb.net/?appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const UserCollection = client.db("fambzoneDB").collection("users");
        const MenuCollection = client.db("fambzoneDB").collection("menu");
        const ReviewCollection = client.db("fambzoneDB").collection("review");
        const CartCollection = client.db("fambzoneDB").collection("carts");

        //  jwt ralated api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESE_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({ token });
        });

        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESE_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })

        }
        //use verify admin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await UserCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();

        }

        //user Operation
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            console.log(req.headers)
            const result = await UserCollection.find().toArray();
            res.send(result);
        });
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await UserCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin })
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            //inser email if user doesnt exist:
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await UserCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already Exists', insertedId: null });
            }
            const result = await UserCollection.insertOne(user);
            res.send(result);
        });

        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await UserCollection.deleteOne(query);
            res.send(result);

        });

        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UserCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        //menu operation
        app.get('/menu', async (req, res) => {
            const MenuResult = await MenuCollection.find().toArray();
            res.send(MenuResult);
        });

        // review operation
        app.get('/review', async (req, res) => {
            const ReviesResult = await ReviewCollection.find().toArray();
            res.send(ReviesResult);
        });


        //Carts Operation
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await CartCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/carts', async (req, res) => {
            const CartItem = req.body;
            const result = await CartCollection.insertOne(CartItem);
            res.send(result);
        });


        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await CartCollection.deleteOne(query);
            res.send(result);
        });



        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");

    } finally {

        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Server is Runnig at http://localhost:${port}`)
})


