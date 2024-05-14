// const express = require('express');
// const bodyParser = require('body-parser');
// const {MongoClient} = require('mongodb');
import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'

const app = express();
dotenv.config();
// app.use(express.json())
// app.use(bodyParser.json());


let nextId = 1;
// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

const mongoUrl = process.env.MONGO_URL;
// const dbName = "stagingDB";
mongoose.connect(mongoUrl).then(()=>{
    console.log("Database is connected successful");

}).catch((error)=>console.log("Error>>"+error));

const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    phone:String,
    countryCode:String,
    password:String
});

const UserModel = mongoose.model("members", userSchema);
app.use(express.json());
    
app.get("/development/get-data",async (req,res)=>{
    try {
        const result = await UserModel.find();
        res.json(result);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
});

/// Get search api
app.get("/development/get-search/:username",async(req,res)=>{
  const username = req.params.username;
  try {
      const user = await UserModel.findOne({ username });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
  }


});

/// Post registration api 
    app.post("/development/registration", async (req, res) => {       
        try {
           
            const {username, password, phone, email, countryCode} = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const bodyData =  {username, password:hashedPassword, phone, email, countryCode};
            const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }] });
            if (existingUser) {
             const statusCode = 400;
              return res.status(400).json({ error: 'User already exists with this email or contact number',statusCode });
            }
          const result = await UserModel(bodyData);
          await result.save();
          const statusCode = 201;
          res.status(201).json({result,statusCode});
          console.log("All data: "+bodyData);
        } catch (error) {
          console.error('Error inserting data:', error);
         // res.status(401).json({ error: 'Internal server error' });
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      

/// Post login api
    app.post('/development/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      // Find the user by username
      const user = await UserModel.findOne({ email });
  
      if (!user) {
        const statusCode = 400;
        return res.status(404).json({ error: 'User not found',statusCode });
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password,(err,result)=>{
        if(err || !result){
          const statusCode = 401;
           return res.status(401).json({error: "Invalid email or password",statusCode})
        }
        const statusCode = 201;
        const token = jsonwebtoken.sign({ userId: user._id }, 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InJlZ2lzdHJhdGlvbjIiLCJwYXNzd29yZCI6IkdoQDEyMzQ1In0.4P6Ym1dwJw5HOpJXjjB1K-qN8DBzkBGWzmw4xZiTnXQ', { expiresIn: '1h' });  
      res.status(201).json({ token,statusCode });
      });
  
      // if (!passwordMatch) {
      //   return res.status(401).json({ error: 'Invalid credentials' });
      // }
  
      // If the password is correct, generate a JWT token
      
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
/// Middleware to authenticate JWT tokens
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) {
      return res.sendStatus(401);
    }
  
    jsonwebtoken.verify(token, 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InJlZ2lzdHJhdGlvbjIiLCJwYXNzd29yZCI6IkdoQDEyMzQ1In0.4P6Ym1dwJw5HOpJXjjB1K-qN8DBzkBGWzmw4xZiTnXQ', (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  }
  app.get("/development/data",authenticateToken,async (req,res)=>{
   res.json(req.user);
   const result = await UserModel.find();
   res.json(result);
});

  

