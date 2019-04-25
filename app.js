var express = require('express')
var path = require('path')
var app = express()

app.use(express.static(path.join(__dirname,'public')))

app.use(express.urlencoded({extended: true}))
app.use(express.json())

var mongoose = require('mongoose');
var mongoDB = 'mongodb://localhost/cqDB';

mongoose.connect(mongoDB);
mongoose.connection.on('error',(err) => {
  console.log('DB connection Error');
})

mongoose.connection.on('connected',(err) => {
  console.log('DB connected');
})

var userSchema = new mongoose.Schema({
  Name: String,
  Email:String,
  UserPassword:String,
  Phone:Number,
  City:String,
  Role:String,
  DOB:Date,
  Gender:String,
})

var user = mongoose.model('User', userSchema);
