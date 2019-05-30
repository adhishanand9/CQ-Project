var express = require('express')
var path = require('path');
var app = express();
var session = require('express-session');
var nodemailer = require("nodemailer");
var multer=require('multer');
//var popups = require('popups');
var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "adhishanand9@gmail.com",
        pass: "thebatman@0087"
    }
});
//Access Static files
app.use(express.static(path.join(__dirname,'Public')));
app.set('view engine', 'ejs');
app.use( express.static( "Public" ) );
//BodyParser
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(session({secret: 'cQpOrTaL',saveUninitialized:true,resave:true}));

// Connect with db
var mongoose = require('mongoose')
var mongoDb = 'mongodb://localhost/myDB'

mongoose.connect(mongoDb, function (error) {
	if(error) {
		throw error;
	}
	console.log("Db opened Successfully");
});
mongoose.set('useFindAndModify', false);
var userSchema = mongoose.Schema({
	name: String,
	email: String,
	password: String,
	city: String,
	phoneno: String,
	gender: String,
	dob: String,
	role: String,
  status:String,
  flag: String,
});

var userdetails = mongoose.model("userdetails", userSchema);

app.post('/Login',function(req,res){
    console.log(req.body);
    userdetails.find({
        email: req.body.userName,
        password: req.body.passWord
    }).exec(function(error,data){
        console.log(data);
        req.session.isLogin = 1;
        req.session.userName = req.body.userName;
        req.session.password = req.body.passWord;
        req.session.data = data;
        res.send(data);
    });
});

const storage = multer.diskStorage({
    destination: './Public/uploads',
    filename: function (req, file, cb) {
      console.log(req.session.data[0]._id);
        // null as first argument means no error
        cb(null, req.session.data[0].email )
    }
})
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter: function (req, file, cb) {
        sanitizeFile(file, cb);
    }
}).single('files')
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err){
            res.render('editprofile',{data: req.session.data})
            console.log("File Not Uploaded Due To Error")
        }else{
            // If file is not selected
            if (req.file == undefined) {
                res.render('editprofile', {data: req.session.data})
                console.log("File Not Uploaded")
            }
            else{
                res.render('editprofile', {data: req.session.data})
                //console.log(email)
                console.log("File Uploaded Successfully")
            }
        }

    })
})
function sanitizeFile(file, cb) {
    // Define the allowed extension
    let fileExts = ['png', 'jpg', 'jpeg', 'gif']
    // Check allowed extensions
    let isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
    // Mime type must be an image
    let isAllowedMimeType = file.mimetype.startsWith("image/")
    if(isAllowedExt && isAllowedMimeType){
        return cb(null ,true) // no errors
    }
    else{
        // pass error msg to callback, which can be displaye in frontend
        cb('Error: File type not allowed!')
    }
}
app.get("/admin/userlist",function(req,res){
    userdetails.find({}).exec(function(error,data){
    res.render('userlist',{data: req.session.data});
    });
});

app.get("/admin/profile", function(req, res) {
    res.render('homepage', {data: req.session.data});
})

app.get('/changePassword',function(req,res){
    res.render('changepassword',{data: req.session.data});
});

app.get('/admin/adduser',function(req,res){
    res.render('adduser',{data: req.session.data});
});

app.get('/tag',function(req,res){
    res.render('tag',{data: req.session.data});
});

app.get('/communtiy/communityList',function(req,res){
    res.render('communitylist',{data: req.session.data});
});
app.get('/logout',function(req,res){
    req.session.isLogin = 0;
    res.redirect('/');
});

app.get('/',function(req,res){
    console.log(req.body);
    if(req.session.isLogin){
        console.log("Already Logged in");
        res.render('homepage',{data: req.session.data});
    } else {
        console.log("New User");
        res.sendFile(path.join(__dirname,'Public','Login.html'));
    }
});
//console.log(email);
app.get('/profile',function(req,res){
    res.render('profile',{data: req.session.data});
})

app.get('/editProfile',function(req,res){
    res.render('editprofile',{data: req.session.data});
})



//Function to update the password
app.put('/changePassword',function(req,res){
    console.log(req.body);
    userdetails.findOneAndUpdate(
        {
            _id: req.body._id,
            password: req.body.oldPassword  // search query
        },
        {
          password: req.body.newPassword   // field:values to update
        },
        {
          new: true,                       // return updated doc
          runValidators: true              // validate before update
        })
        .then(data => {
            console.log(data)
            res.send(data)
          })
          .catch(err => {
            console.error(err)
            res.send(error)
          })
});
app.put('/updateUserDetails',function(req,res){
    console.log(req.body);
    userdetails.findOneAndUpdate(
        {
            _id: req.body._id,
            email: req.body.email
        },
        {
            name: req.body.name,
            dob : req.body.dob,
            gender: req.body.gender,
            phoneno: req.body.phoneno,
            city: req.body.city
        },
        {
            new: true,
            runValidators: true
        })
        .then(data=>{
            console.log(data);
            res.send(data);
        })
        .catch(err=>{
            console.log('eror aya');
            console.error(err);
            res.send(error);
        })
});
app.post('/getUserData',function(req,res){
    console.log("hello world")
    userdetails.countDocuments(function(error,count){
        var start = parseInt(req.body.start);
        var len = parseInt(req.body.length);
        userdetails.find({}).skip(start).limit(len)
        .then(data=>{
            console.log(data)
            res.send({"recordsTotal" : count, "recordsFiltered": count,data})
        })
        .catch(err=>{
            res.send(err);
        })
    })
});
//Function to add in the database
app.post('/admin/adduser',function (req, res) {
    console.log(req.body);
    let newUser = new userdetails({
        name: req.body.name,
	    email: req.body.email,
	    password: req.body.password,
	    city: req.body.city,
	    phoneno: req.body.phoneno,
	    gender: "male",
      dob: "11/08/1999",
      role: req.body.role,
      status: req.body.status,
      flag: req.body.flag
    })
    newUser.save()
     .then(data => {
       console.log(data)
       res.send(data)
     })
     .catch(err => {
       console.error(err)
       res.send(error)
     })
     var mailOptions={
         to : req.body.email,
         subject : "Welcome to CQ",
         text : "Welcome to CQ and your password is "+req.body.password+"."
     }
     console.log(mailOptions);
     smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
             console.log(error);
         res.end("error");
      }else{
             console.log("Message sent: " + response.message);
         res.end("sent");
          }
 });

});

app.listen(8000);

console.log("Running on port 8000");
