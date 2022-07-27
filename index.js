const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
    const serviceCollection = client.db('bdtools_portal').collection('tools');

    // to get all tools / TOOLS API

    app.get('/tools', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
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
