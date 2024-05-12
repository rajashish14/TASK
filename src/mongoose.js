const mongoose = require("mongoose");
// const dbURL = process.env.DB_URL;
const connect = mongoose.connect("mongodb+srv://ashishranjan1203:5ew3hCuNDeqN4WVV@cluster0.z8zlzpf.mongodb.net/data?retryWrites=true&w=majority&appName=Cluster0");
connect.then(() =>{
    console.log("MongooDB connected successfully");
})
.catch((error) => {
    console.log("failed:", error);
});


const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
     password: {
        type: String,
        required: true
    }
    
})



const collection = new mongoose.model("collection", loginSchema);
module.exports = collection;