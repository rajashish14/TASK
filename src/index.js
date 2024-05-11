const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const session = require('express-session');
const jwt = require('jsonwebtoken');
const ejs = require("ejs");
const collection = require("./mongoose")
const bodyParser = require("body-parser");

const app = express();

const secretKey = 'thisismystronsecretkeyforaunthentification';

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}))

// middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('view engine', 'ejs');


app.get("/", (req,res) => {
    res.render("login");
})

app.get("/register", (req,res) => {
    res.render("register");
})



app.post("/register", async(req,res) => {
    const data = {
        
        username: req.body.username,
        password: req.body.password
    }
    const existingUser = await collection.findOne({username: data.username});
    if(existingUser){
        res.send("User already exists. Please choose a different username.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    const userdata = await collection.insertMany(data);
    console.log(userdata);
    res.render("home");
})

app.post("/login", async(req, res) => {
    try{
        const check = await collection.findOne({username: req.body.username});
        if(!check){
            res.send("username cannot find.");
        }
        else{
            const ispass = await bcrypt.compare(req.body.password, check.password);
            if(ispass){
                res.render("home");
            }
            else{
                res.send("INCORRECT PASSWORD");  
            }
        }
       
    }
    catch (error) {
        console.error("An error occurred during login:", error);
        res.status(300).send("Internal Server Error");
}
})

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect("/");
    });
});

// Add this middleware to verify JWT token for protected routes
function verifyToken(req, res, next) {
    const token = req.cookies.jwt; // Assuming you're storing JWT token in a cookie named 'jwt'
    if (!token) {
      return res.redirect("/login");
    }
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.redirect("/login");
      }
      req.user = decoded;
      next();
    });
  }
  
  // Protected route
  app.get('/protected', verifyToken, (req, res) => {
    res.render("home");
  });


  // Protected endpoint
// app.get('/protected', (req, res) => {
//     const token = req.session.token;
//     if (!token) {
//         return res.status(401).send("Unauthorized");
//     }
//     jwt.verify(token, secretKey, (err, decoded) => {
//         if (err) {
//             return res.status(403).send("Forbidden");
//         }
//         // You can access the user data from decoded
//         res.send("Welcome to the protected route");
//     });
// });


const port = 5000;
app.listen(port, () => {
    console.log('server running on Port: ${port}');
    
})