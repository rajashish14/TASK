const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const ejs = require("ejs");
const collection = require("./mongoose")
const bodyParser = require("body-parser");
const session = require('express-session');

const app = express();

const secretKey = 'thisismystronsecretkeyforaunthentification';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');


app.get("/", (req,res) => {
    res.render("login");
})

app.get("/register", (req,res) => {
    res.render("register");
})

app.get('/home', (req, res) => {
    if (!req.session.collection) {
        return res.redirect('/');
    }
    res.render('home', { collection: req.session.collection });
});

app.get('/reset-password', (req, res) => {
    res.render("reset", {showNewPassword: false});
});


app.post("/register", async(req,res) => {
    const data = {
        
        username: req.body.username,
        password: req.body.password,
    };
    const existingUser = await collection.findOne({username: data.username});
    if(existingUser){
        res.send("User already exists. Please choose a different username.");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    const userdata = await collection.insertMany(data);
    console.log(userdata);
    const accessToken = jwt.sign({ username: data.username }, 'secretKey');
    req.session.collection = data;
    res.redirect('/home');
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
                const accessToken = jwt.sign({ username: check.username }, 'secretKey');
               
                req.session.collection = check;
                res.redirect('/home');
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

app.post("/reset-password", async (req, res) => {
    const { username, newPassword } = req.body;
    
    try {
        const existingUser = await collection.findOne({ username: username });
        if (!existingUser) {
            return res.send("User does not exist.");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();

        res.redirect("/home");  
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect("/");
    });
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'secretKey', (err, collection) => {
        if (err) return res.sendStatus(403);
        req.collection = collection;
        next();
    });
}

  app.get('/protected', authenticateToken, (req, res) => {
    res.send('Welcome to the protected route!');
});

const port = 3000;
app.listen(port, () => {
    console.log('server running on Port: ${port}');
    
})