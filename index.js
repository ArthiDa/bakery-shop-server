const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xofjcx1.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {

    const usersCollection = client.db('bakery_shop').collection('users');
    const productCollection = client.db('bakery_shop').collection('products');
    const orderCollection = client.db('bakery_shop').collection('orders');
    app.get('/users', async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    })
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = await usersCollection.findOne(query);
      console.log(user);
      res.send({ isAdmin: user?.role === 'admin' });
    })
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })
    app.get('/products', async (req, res) => {
      const query = {};
      const products = await productCollection.find(query).toArray();
      res.send(products);
    })
    app.post('/products', async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productCollection.insertOne(product);
      res.send(result);
    })
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    })
    app.post('/products/update/:id', async (req, res) => {
      const product = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: product.name,
          price: product.price,
          img: product.img,
          category: product.category,
          description: product.description,
          weight: product.weight
        }
      }
      const updatedProduct = await productCollection.updateOne(filter, updatedDoc);
      // console.log(updatedProduct);
      res.send(updatedProduct);
    })
    app.post('/product/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const deleteProduct = await productCollection.deleteOne(query);
      // console.log(deleteProduct);
      res.send(deleteProduct);
    })
    app.get('/order', async (req, res) => {
      const detailsOrder = await orderCollection.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'orderDetails'
          }
        },
        {
          $project:{
            orderDetails: 1,
            userEmail: 1
          }
        }
      ]).toArray();
      res.send(detailsOrder);
    })
    app.post('/order/:email', async (req, res) => {
      const order = req.body;
      console.log(order.productId);
      const id = new ObjectId(order.productId);
      order.productId = id;
      console.log(order.productId);
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })
    app.get('/details', async (req, res) => {
      const totalProducts = await productCollection.estimatedDocumentCount();
      const totalUsers = await usersCollection.estimatedDocumentCount();
      const totalOrders = await orderCollection.estimatedDocumentCount();
      const details = { totalProducts, totalUsers, totalOrders };
      res.send(details);
    })



  }
  finally {

  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('Bakery Shop Server is Running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})