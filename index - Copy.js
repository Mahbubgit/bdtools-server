const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

// function to verify JWT Token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  // verify a token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }
    console.log('decoded', decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jj6dq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    // to connect to database tools-portal/tools

    await client.connect();
    const toolsCollection = client.db('bdtools_portal').collection('tools');
    const reviewsCollection = client.db('bdtools_portal').collection('reviews');
    const orderCollection = client.db('bdtools_portal').collection('order');
    const userCollection = client.db('bdtools_portal').collection('users');


    // Authentication
    app.post('/login', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      });
      res.send({ accessToken });
    });
    /*****************************USER API***************************************** */

    // to Get all user

    //   app.get('/user', verifyJWT, async (req, res) => {
    //     const users = await userCollection.find().toArray();
    //     res.send(users);
    // });

    // To add an user to database
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };

      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      res.send({ result, token });
    });


    /********************TOOLS API*************************** */
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

    /******************************Order API************************************ */

    // to post an order/ PURCHASE/ORDER API

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result);
    })

    // For Cancel/delete an Order / DELETE ORDER API

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted your order.");
      }
      res.send(result);
    });

    // to get order data of a particular client/customer

    app.get('/order', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      // console.log('email', email, ', decodedEmail', decodedEmail);
      if (email === decodedEmail) {
          const query = { email: email };
          const result = await orderCollection.find(query).toArray();
          res.send(result);
      }
      else {
          return res.status(403).send({ message: 'Forbidden Access' });
      }

    });


    // to payment of an Order / PAYMENT ORDER API

    // app.get('/order/:id', verifyJWT, async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: ObjectId(id) };
    //     const purchaseOrder = await orderCollection.findOne(query);
    //     res.send(purchaseOrder);
    // });

    // to get all orders
    // app.get('/order', async (req, res) => {
    //   const query = {};
    //   const cursor = orderCollection.find(query);
    //   const orders = await cursor.toArray();
    //   res.send(orders);
    // });

    /********************Review API******************************** */
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