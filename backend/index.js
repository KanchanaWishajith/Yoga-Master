const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

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

async function run() {
  try {
    await client.connect();

    const database = client.db("yoga-master");
    classCollections = database.collection("classes"); // Assign to global variable

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


app.get('/', (req, res) => {
  res.send('Hello World! 2024 Kanchana');
});

app.listen(port, () => {
  console.log(`Server running on port ${port} 🚀`);
});
