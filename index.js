const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const toolsTypeCollection = client.db('bdtools_portal').collection('toolsType');


    // To verify whether an user is admin or not

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'Forbidden' });
      }
    }

    // Authentication

    app.post('/login', async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ accessToken });
    });

    // To create payment intent

    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const order = req.body;
      const orderPrice = order.orderPrice;
      const amount = orderPrice * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({ clientSecret: paymentIntent.client_secret })
    });


    /*****************************USER API***************************************** */

    // to view all user

    app.get('/allUser', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // to get user data of a particular user/client/customer from update profile data

    app.get('/user', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const result = await userCollection.find(query).toArray();
        res.send(result);
      }
      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }

    });

    // To update an user profile to database

    app.put('/user/profile/:email', async (req, res) => {
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

    // To show all user with role (make an admin)
    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

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

    // To pick an user who have admin role
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    })

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

    // To add a tool
    app.post('/tool', verifyJWT, verifyAdmin, async (req, res) => {
      const tool = req.body;
      const result = await toolsCollection.insertOne(tool);
      res.send(result);
    });

    // For Cancel/delete an Product or tool / DELETE TOOL API

    app.delete('/tool/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted your product.");
      }
      res.send(result);
    });

    /******************************ToolsType API************************************ */

    // to get all toolsType / TO SHOW ALL TOOLSTYPE API

    app.get('/toolsType', async (req, res) => {
      const query = {};
      const cursor = toolsTypeCollection.find(query);
      const toolsType = await cursor.toArray();
      res.send(toolsType);
    });

    /******************************Order API************************************ */

    // to post an order/ TO MAKE A PURCHASE/ORDER API

    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result);
    });

    // For Cancel/delete an Order / TO DELETE AN ORDER API 

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted your order.");
      }
      res.send(result);
    });

    // to get order data of a particular client/customer / To show an ORDER API

    app.get('/order', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
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

    app.get('/order/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const paymentOrder = await orderCollection.findOne(query);
      res.send(paymentOrder);
    });

    // to get all orders/ To show all ORDERS API (Manage Orders Api)

    app.get('/orders', async (req, res) => {
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // To ship an order by admin / SHIPMENT API By Admin

    app.put('/orders/shippedOrder/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const updateDoc = {
        $set: { status: 'shipped' },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    /********************Review API******************************** */

    // to get all reviews / To Show all REVIEWS API

    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });


    // to post a review/ Add a REVIEW API

    app.post('/review', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review)
      res.send(result);
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