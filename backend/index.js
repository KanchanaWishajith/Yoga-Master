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

//routes for users
app.post('/new-user', async (req, res) => {
  const newUser = req.body;
  const result = await userCollections.insertOne(newUser);
  res.send(result);
});
//get the users
app.get('/users', async (req, res) => {
  const result = await userCollections.find({}).toArray();
  res.send(result);
});

//get user by id
app.get('/user/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await userCollections.findOne(query);
  res.send(result);
});

//get user by email
app.get('/user/:email', async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await userCollections.findOne(query);
  res.send(result);
});



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

//cart info by user email
app.get('/cart/:email', async (req, res) => {
  const email = req.params.email;
  const query = {userMail: email};
  const projection = {classId: 1};
  const carts = await cartCollections.find(query, {projection: projection});
  const classIds = carts.map((cart) => new ObjectId(cart.classId));
  const query2 = {_id: {$in: classIds}};
  const result = await classCollections.find(query2).toArray();
  res.send(result);
});

//delete cart item
app.delete('/delete-cart-item/:id', async (req, res) =>{
  const id = req.params.id;
  const query = {classId: id};
  const result = await cartCollections.deleteOne(query);
  res.send(result);
});

//Enrollment Routes
app.get("/popular_classes", async (req, res) =>{
  const result = await classCollections.find().sort({totalEnrolled: -1}).limit(6).toArray();
  res.send(result);
});

app.get('/popular-instructors', async (req, res) =>{
  const pipeline = [
    {
      $group: {
        _id: "$instructorEmail",
        totalEnrolled: { $sum: "$totalEnrolled"}
      }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "email",
          as: "instructor"
        }
      },
      {
        $project: {
          _id: 0,
          instructor: {
            $arrayElemAt: ["$instructor", 0]
          },
          totalEnrolled: 1
        }
      },
      {
        $sort: {totalEnrolled: -1}
      },
      {
        $limit: 6
      }
    ];
    const result = await classCollections.aggregate(pipeline).toArray();
    res.send(result);
});

//admin status
app.get('/admin-stats', async (req, res) =>{
  const approvedClasses = ((await classCollections.find({status: 'approved'})).toArray()).length;
  const pendingClasses = ((await classCollections.find({status: 'pending'})).toArray()).length;
  const insertOnes = ((await classCollections.find({role: 'instructor'})).toArray()).length;
  const totalClasses = ((await classCollections.find()).toArray()).length;
  const totalEnrolled = ((await enrolledCollections.find()).toArray()).length;

  const result = {
    approvedClasses: approvedClasses,
    pendingClasses: pendingClasses,
    insertOnes: insertOnes,
    totalClasses: totalClasses,
    totalEnrolled: totalEnrolled
  };
  res.send(result);
});

//get all instructors
app.get('/instructors', async (req, res) =>{
  const result = await userCollections.find({role: 'instructor'}).toArray();
  res.send(result); 
});

//get enrolled classes
app.get('/enrolled-classes/:email', async (req, res) =>{
  const email = req.params.email;
  const query = {userEmail: email};
  const pipeline = [
    {
      $match: query
    },
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "class"
      }
    },
    {
      $unwind: "$class"
    },
    {
      $lookup: {
        from: "users",
        localField: "classes.instructorEmail",
        foreignField: "email",
        as: "instructor"
      }
    }, {
      $project: {
        _id: 0,
        instructor: {
          $arrayElemAt: ["$instructor", 0]
        },
        classes: 1
      }
    }
  ];
  const result = await enrolledCollections.aggregate(pipeline).toArray();
  res.send(result);
});

//apply for instructor
app.post('/ass-instructor', async (req, res) =>{
  const data = req.body;
  const result = await appliedCollections.insertOne(data);
  res.send(result);
});

//get applied instructors by email
app.get('/applied-instructors/:email',async (req, res) => {
  const email = req.params.email;
  const result = await appliedCollections.findOne({email});
  res.send(result);
});




app.get('/', (req, res) => {
  res.send('Hello World! 2024 Kanchana');
});

app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});


//2.30
