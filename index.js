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

/// Post registration api 
    app.post("/development/registration", async (req, res) => {       
        try {
            const {username, password, phone, email, countryCode} = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const bodyData =  {username, password:hashedPassword, phone, email, countryCode};
          const result = await UserModel(bodyData);

          await result.save();
          res.status(201).json({result});
         // res.status(201).json({ message: 'Data saved successful' });
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
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password,(err,result)=>{
        if(err || !result){
           return res.status(401).json({error: "Invalid email or password"})
        }
        const token = jsonwebtoken.sign({ userId: user._id }, 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InJlZ2lzdHJhdGlvbjIiLCJwYXNzd29yZCI6IkdoQDEyMzQ1In0.4P6Ym1dwJw5HOpJXjjB1K-qN8DBzkBGWzmw4xZiTnXQ', { expiresIn: '1h' });  
      res.json({ token });
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

  

