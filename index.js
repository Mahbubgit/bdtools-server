const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jj6dq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    // to connect to database tools-portal/tools

    await client.connect();
    const toolsCollection = client.db('bdtools_portal').collection('tools');
    const reviewsCollection = client.db('bdtools_portal').collection('reviews');
    const orderCollection = client.db('bdtools_portal').collection('order');

    // to get all tools / TOOLS API

    app.get('/tools', async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });
    
    // to get individual tool/ Find a tool API

    app.get('/tool/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });

    // to post an order/ PURCHASE/ORDER API

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result);
    })

    // to get all reviews / REVIEWS API

    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

  }
  finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello BDTools!')
})

app.listen(port, () => {
  console.log(`BDTools app listening on port ${port}`)
})