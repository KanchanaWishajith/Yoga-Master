const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId, ServerDescription } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@yoga-master.v1kbbtv.mongodb.net/?retryWrites=true&w=majority&appName=yoga-master`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ** Declare Global Collections **
let classCollections;
let userCollections;
let cartCollections;
let paymentCollections;
let enrolledCollections;
let appliedCollections;

async function run() {
  try {
    await client.connect();

    const database = client.db("yoga-master");
    classCollections = database.collection("classes"); // Assign to global variable
    userCollections = database.collection("users");
    cartCollections = database.collection("cart");
    paymentCollections = database.collection("payments");
    enrolledCollections = database.collection("enrolled");
    appliedCollections = database.collection("applied");

    console.log("Connected to MongoDB ✅");
  } catch (error) {
    console.error("MongoDB Connection Error ❌", error);
  }
}
run(); // Call the function

// ** Classes Route (Now it will work) **
app.get('/classes', async (req, res) => {
  try {
    if (!classCollections) {
      return res.status(500).send({ error: "Database not connected" });
    }
    
    const query = { status: 'approved' };
    const result = await classCollections.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch classes" });
  }
});

//get classes by instructor email address
app.get('/classes/:email', async (req, res) => {
  try {
      const email = req.params.email;

      // Basic email validation (optional)
      if (!email || !email.includes('@')) {
          return res.status(400).json({ error: 'Invalid email address' });
      }

      const query = { instructorEmail: email };
      const result = await classCollections.find(query).toArray();

      if (result.length === 0) {
          return res.status(404).json({ message: 'No classes found for this instructor' });
      }

      res.status(200).json(result);
  } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
//manage classes
app.get('/classes-manage', async(req, res) =>{
const result = await classCollections.find().toArray();
res.send(result);
});

//update classes statues and reason
app.patch('/change-status/:id', async(req, res) =>{
  const id = req.params.id;
  const status = req.body.status;
  const reason = req.body.reason;
  const filter = {_id: new ObjectId(id)};
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      status: status,
      reason: reason,
    },
  };
  const result = await classCollections.updateOne(filter, updateDoc, options);
  res.send(result);
});

//get approved classes
app.get('/approved-classes', async(req, res) =>{
  const query = { status: "approved"};
  const result = await classCollections.find(query).toArray();
  res.send(result);
});

//get single class details
app.get('/class/:id', async (req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await classCollections.findOne(query);
  res.send(result);
});

//update class details (all data)
app.put('/update-class/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updateClass = req.body;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        name: updateClass.name,
        description: updateClass.description, // Fixed case inconsistency
        price: updateClass.price,
        availableSeats: updateClass.availableSeats, // Removed incorrect function
        videoLink: updateClass.videoLink,
        status: 'pending',
      }
    };

    const result = await classCollections.updateOne(filter, updateDoc, options);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while updating the class.' });
  }
});

//Cart Routes !-----------------------------------
app.post('/add-to-cart', async (req, res) =>{
  const newCartItem = req.body;
  const result  = await cartCollections.insertOne(newCartItem);
  res.send(result);
});

//get Cart item by id
app.get('/cart-item/:id', async (req, res) =>{
  const id = req.params.id;
  const email = req.body.email;
  const query = {
    classId: id,
    userMail: email
  };
  const projection= {classId: 1};
  const result = await cartCollections.findOne(query, {projection: projection});
  res.send(result);
});


app.get('/', (req, res) => {
  res.send('Hello World! 2024 Kanchana');
});

app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});


//2.05
