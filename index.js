
const express = require('express')
const app = express();
const port = process.env.PORT = 5000;
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

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
        const MenuCollection = client.db("fambzoneDB").collection("menu");
        const ReviewCollection = client.db("fambzoneDB").collection("review");
        const CartCollection = client.db("fambzoneDB").collection("carts");


        app.get('/menu', async (req, res) => {
            const MenuResult = await MenuCollection.find().toArray();
            res.send(MenuResult);
        });
        app.get('/review', async (req, res) => {
            const ReviesResult = await ReviewCollection.find().toArray();
            res.send(ReviesResult);
        });
        app.post('/carts', async (req, res) => {
            const CartItem = req.body;
            const result = await CartCollection.insertOne(CartItem);
            res.send(result);
        })
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Server is Runnig at http://localhost:${port}`)
})


