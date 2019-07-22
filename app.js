var express = require('express')
var path = require('path');
var app = express();
var session = require('express-session');
var nodemailer = require("nodemailer");
var multer=require('multer');
//var popups = require('popups');
var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
var GitHubStrategy = require('passport-github').Strategy;

passport.serializeUser(function(user,done){
    done(null,user);
});

passport.deserializeUser(function(user,done){
    done(null,user);
});

passport.use(new GitHubStrategy({
    clientID: 'Iv1.240606520851954b',
    clientSecret: '71b7d9fa7fb7569c3b594b3d8c3e6a959cc60c89',
    callbackURL: "http://localhost:8000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    //User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(null, profile);
    })
);

var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "adhishanand9@gmail.com",
        pass: "########"
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
  image: String,
  joinedcommunities: Array,
  requestedcommunities: Array,
});

var userdetails = mongoose.model("userdetails", userSchema);

var tagSchema = mongoose.Schema({
    tagname: String,
    creator: String,
	creationdate: String,
	flag: String
});
var communitySchema =mongoose.Schema({
  comname:String,
  communitydescription:String,
  membershiprule:String,
  location:String,
  owner:String,
  ownerid:String,
  createdate:String,
  image:String,
  communitystatus:String,
  communitymembers:Number,
  joinedmembers: Array,
  requestedmembers: Array,
});
var tagdetails = mongoose.model('tagdetails',tagSchema );
var communitydetails = mongoose.model('communitydetails',communitySchema );
app.get('/auth/github',
  passport.authenticate('github'));

  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login.html' }),
    function(req, res) {
      // Successful authentication, redirect home.
      userdetails.find({
          email: req.session.passport.user._json.email
      }).exec(function(error,data){
          if(data.length != 0){
              req.session.isLogin = 1;
              req.session.userName = data.username;
              req.session.passWord = data.password;
              req.session.data = data;
              req.session.data.image = "default.png"
              res.redirect('/' + data[0].role + '/profile');
          } else{
              var data = new Object({
                  name: req.session.passport.user._json.name,
                  email: req.session.passport.user._json.email,
                  city: req.session.passport.user._json.location,
                  status: "pending",
                  dob: "09/12/1998",
                  phoneno: "8968327087",
                  gender: "male",
                  image: "default.png",
                  role: "user",
                  flag: "1",
                  password: "f"
              });
              req.session.isLogin = 1;
              let newUser = new userdetails(data);
              newUser.save().then(result=>{
                  req.session.data = [result];
                  console.log("User added via Github");
                  var mailData = {
                      from: "adhishanand9@gmail.com",
                      to: req.session.data[0].email,
                      subject: "Code Quotient Confirmation Mail",
                      text: "Hello " + req.session.data[0].name + " this is confirmation mail. Your Password is " + req.session.data[0].password + "."
                  }
                  smtpTransport.sendMail(mailData,function(error,info){
                      if(error){
                          console.log(mailData.to)
                          console.log(error)
                      } else{
                          console.log("Mail sent: "+ info.response);
                      }
                  })
                  res.redirect('/editProfile');
              });
          }
      });
  });
const storage = multer.diskStorage({
    destination: './Public/uploads',
    filename: function (req, file, cb) {
        // null as first argument means no error
        cb(null, req.session.data[0]._id + path.extname(file.originalname))
        req.session.data[0].image = req.session.data[0]._id + path.extname(file.originalname);
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
const storage2 = multer.diskStorage({
    destination: './Public/uploads',
    filename: function (req, file, cb) {
        // null as first argument means no error
        cb(null, req.session.data[0].name + path.extname(file.originalname))
        //req.session.data[0].image = req.session.data[0].name + path.extname(file.originalname);
    }
})
const upload2 = multer({
    storage: storage2,
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
            res.render('editprofile', { msg: err})
        }else{
            // If file is not selected
            if (req.file == undefined) {
                res.render('editprofile', { msg: 'No file selected!' })

            }
            else{
                res.render('editprofile',{data: req.session.data})
            }
        }

    })
})
app.post('/uploadCommunity', (req, res) => {

    upload2(req, res, (err) => {
        if (err){
            res.render('addcommunity', {data: req.session.data})
        }else{
            // If file is not selected
            if (req.file == undefined) {
                res.render('addcommunity', { data: req.session.data })

            }
            else{
                res.render('addcommunity',{data: req.session.data})
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

app.post('/login',function(req,res){
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

app.get("/admin/userlist",function(req,res){
    if(req.session.isLogin){
        userdetails.find({}).exec(function(error, data) {
            res.render('userlist', {data: data});
        });
    } else{
        res.redirect('/')
    }
});

app.get("/admin/profile", function(req, res) {
    if(req.session.isLogin)
        res.render('homepage', {data: req.session.data});
    else
        res.redirect('/')
})
app.get("/superadmin/profile", function(req, res) {
    if(req.session.isLogin)
        res.render('homepage', {data: req.session.data});
    else
        res.redirect('/')
})

app.get('/changePassword',function(req,res){
    if(req.session.isLogin)
        res.render('changepassword',{data: req.session.data});
    else
        res.redirect('/')
});

app.get('/admin/adduser',function(req,res){
    if(req.session.isLogin)
        res.render('adduser',{data: req.session.data});
    else
        res.redirect('/')
});

app.get('/tag',function(req,res){
    if(req.session.isLogin)
        res.render('tag',{data: req.session.data});
    else
        res.redirect('/')
});

//app.get('/communtiy/communityList',function(req,res){
//  if(req.session.isLogin){
//    res.render('communitylist',{data: req.session.data});
//}else{
//    res.redirect('/')
//}
//});
app.get('/communtiy/communityList',function(req,res){
    if(req.session.isLogin){
        communitydetails.find({}).exec(function(error, data) {
			 res.render('communitylist', {communitydata: data,data: req.session.data});
      //  console.log(communitydata);
		});
    } else {
        res.redirect('/');
    }
})
app.get('/logout',function(req,res){
    req.session.isLogin = 0;
    res.redirect('/');
});

app.get('/',function(req,res){
    if(req.session.isLogin){
        console.log("Already Logged in");
        res.render('homepage',{data: req.session.data});
    } else {
        console.log("New User Logging In");
        res.sendFile(path.join(__dirname,'Public','Login.html'));
    }
});
app.get('/logout',function(req,res){
    req.session.isLogin = 0;
    res.redirect('/');
});
//console.log(email);
app.get('/profile',function(req,res){
    if(req.session.isLogin)
        res.render('profile',{data: req.session.data});
    else
        res.redirect('/');
})

app.get('/editProfile',function(req,res){
    if(req.session.isLogin)
        res.render('editprofile',{data: req.session.data});
    else
        res.redirect('/');
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
            city: req.body.city,
            image: req.session.data[0].image,
            status:"confirmed",
            flag:req.body.flag
        },
        {
            new: true,
            runValidators: true
        })
        .then(data=>{
            req.session.data=[data];
            console.log(data);
            res.send(data);
        })
        .catch(err=>{
            console.log('Error');
            console.error(err);
            res.send(error);
        })
});
app.post('/updateCommunityDetails',function(req,res){
    console.log(req.body);
    if(req.session.isLogin){
        if(req.body.buttontext == "Join"){
          userdetails.findOneAndUpdate(
          {
            _id: req.session.data[0]._id
          },
          {
            $push: {joinedcommunities: req.body.id}
          },
          {
            new: true,
            runValidators: true
          })
          .then(data=>{
          if(data == null)
					     res.send("Error")
					else
          {
            communitydetails.findOneAndUpdate(
							{ _id: req.body.id },
							{$push: {joinedmembers: req.session.data[0]._id},
              communitymembers:req.body.members
              },
							{new: true,
							runValidators: true}).then(data => {
							if(data == null)
							       res.send("Error")
							else{
                     res.send("Added");
              }
						})
            }
                })
        } else{
          userdetails.findOneAndUpdate(
				  {
            _id: req.session.data[0]._id
          },
				  {
            $push: {requestedcommunities: req.body.id}
          },
				  {
            new: true,
            runValidators: true})
          .then(data => {
          if(data == null)
            res.send("Error")
          else{
            communitydetails.findOneAndUpdate(
            { _id: req.body.id },
            {$push: { requestedmembers: req.session.data[0]._id}},
            {new: true,
            runValidators: true}).then(data => {
            if(data == null)
              res.send("Error");
            else
              res.send("Added");
            })

            }
			})
      }
    }
});
//app.post('/getUserData',function(req,res){
//    console.log("hello world")
//    userdetails.countDocuments(function(error,count){
  //      var start = parseInt(req.body.start);
    //    var len = parseInt(req.body.length);
      //  userdetails.find({}).skip(start).limit(len)
      //  .then(data=>{
        //    console.log(data)
          //  res.send({"recordsTotal" : count, "recordsFiltered": count,data})
    //    })
    //    .catch(err=>{
    //        res.send(err);
    //    })
    //})
//});
//function to send mail
app.post('/sendMail',function(req,res){
  console.log(req.body);
  var mailOptions={
      to : req.body.to,
      subject : req.body.subject,
      text : req.body.text
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

app.post("/updateState", function (request, response) {
	userdetails.updateOne({_id: request.body.id}, {flag: request.body.state}).exec(data => console.log("state updated"));
	response.send("state updated");
});

app.post('/tag',function(req,res){
    console.log(req.body);
    let newTag = new tagdetails({
        tagname: req.body.name,
        creationdate: req.body.creationdate,
        creator: req.session.data[0].name,
        flag: req.body.flag
    })
    newTag.save().then(data=>{
        console.log(data);
        res.send(data);
    })
    .catch(err => {
        console.error(err)
        res.send(error)
    })
})

app.post("/getUserData", function (req, res) {
	var flag;
	if(req.body.role === 'All' && req.body.status === 'All') {
      userdetails.countDocuments(function(e,count){
      var start = parseInt(req.body.start);
      var len = parseInt(req.body.length);
      userdetails.find({
      }).skip(start).limit(len).then(data=> {
      	if(req.body.search.value) {
					data = data.filter((value) => {
						flag = value.email.includes(req.body.search.value) || value.phoneno.includes(req.body.search.value)
						 || value.city.includes(req.body.search.value) || value.status.includes(req.body.search.value)
						 || value.role.includes(req.body.search.value);
						return flag;
					})
				}
                res.send({"recordsTotal": count, "recordsFiltered" : count, data})
                }).catch(err => {
      	    res.send(err)
     	})
   });
}

else if(req.body.role === 'All' && req.body.status !== 'All')
{
  console.log(req.body);
  var length;
      userdetails.countDocuments(function(e,count){
      var start=parseInt(req.body.start);
      var len=parseInt(req.body.length);

      userdetails.find({status: req.body.status}).then(data => length = data.length);

      userdetails.find({ status: req.body.status }).skip(start).limit(len)
	    .then(data=> {
      if (req.body.search.value){
				data = data.filter((value) => {
					flag = value.email.includes(req.body.search.value) || value.phoneno.includes(req.body.search.value)
						 || value.city.includes(req.body.search.value) || value.status.includes(req.body.search.value)
						 || value.role.includes(req.body.search.value);
						return flag;
					});
			}
      res.send({"recordsTotal": count, "recordsFiltered" : length, data})
     	}).catch(err => {
      	res.send(err)
     })
   });
}

else if(req.body.role !== 'All' && req.body.status === 'All')
{
	console.log(req.body);
	var length;
	userdetails.countDocuments(function(e,count){
		var start=parseInt(req.body.start);
		var len=parseInt(req.body.length);

		userdetails.find({role: req.body.role}).then(data => length = data.length);
	  userdetails.find({ role: req.body.role }).skip(start).limit(len).then(data=> {
      if (req.body.search.value) {
				data = data.filter((value) => {
					flag = value.email.includes(req.body.search.value) || value.phoneno.includes(req.body.search.value)
						 || value.city.includes(req.body.search.value) || value.status.includes(req.body.search.value)
						 || value.role.includes(req.body.search.value);
						return flag;
				})
			}
            res.send({"recordsTotal": count, "recordsFiltered" : length, data})
        }).catch(err => {
      	res.send(err)
        })
   });
}
	else {
		var length;
		userdetails.countDocuments(function(e,count){
			var start=parseInt(req.body.start);
			var len=parseInt(req.body.length);
			userdetails.find({role: req.body.role, status: req.body.status}).then(data => length = data.length);

      userdetails.find({role: req.body.role, status: req.body.status}).skip(start).limit(len).then(data=> {
			if(req.body.search.value) {
				data = data.filter((value) => {
					flag = value.email.includes(req.body.search.value) || value.phoneno.includes(req.body.search.value)
						 || value.city.includes(req.body.search.value) || value.status.includes(req.body.search.value)
						 || value.role.includes(req.body.search.value);
						return flag;
					})
				}
			    res.send({"recordsTotal": count, "recordsFiltered" : length, data})
                }).catch(err => {
      	        res.send(err)
            })
        });
	}
})

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
	    dob: "",
        role: req.body.role,
        status: req.body.status,
        flag: req.body.flag,
        image:'default.png'
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
app.post('/community/AddCommunity',function(req,res){
    console.log(req.body);
    let newCommunity = new communitydetails({
        comname: req.body.communityname,
        communitydescription: req.body.descriptiontextarea,
        membershiprule: req.body.membershiprule,
        location: req.session.data[0].city,
        owner: req.session.data[0].name,
        createdate: req.body.createdate,
        ownerid: req.session.data[0]._id,
        image: '/images/defaultcommunity.jpg',
        communitystatus: 'active',
        communitymembers: '1',
        joinedmembers: [req.session.data[0]._id],
        requestedmembers: [],
    })
    newCommunity.save()
     .then(data => {
       console.log(data)
       res.send(data)
     })
     .catch(err => {
       console.error(err)
       res.send(error)
     })
})
app.get('/tag/tagslist',function(req,res){
    if(req.session.isLogin){
        tagdetails.find({}).exec(function(error, data) {
			res.render('tagslist', {tagdata: data,data: req.session.data});
      //console.log(tagdata);
		});
    } else {
        res.redirect('/');
    }
})
app.get('/communtiy/communitypanel',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({$or: [
    {joinedmembers: req.session.data[0]._id},
    {requestedmembers: req.session.data[0]._id}
  ]}).then(data => {
    res.render('communitypanel', {data: req.session.data, communtiydata: data});
  })
  } else {
      res.redirect('/');
  }
});
app.get('/communtiy/communitypanellist',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({joinedmembers: {$ne: req.session.data[0]._id},
          requestedmembers: {$ne: req.session.data[0]._id}}).exec((error, d) => {
         res.render('communitypanellist', {data: req.session.data, communtiydata: d});
     })
  } else {
      res.redirect('/');
  }
})
app.get('/community/communityprofile/:id',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({
          _id: req.params.id,
      }).exec(function(error,data){
          console.log(data);
          res.render('communityprofile', {communitydata: data,data: req.session.data});
      });
  } else {
      res.redirect('/');
  }
})
app.get('/community/manageCommunity/:id',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({
          _id: req.params.id,
      }).exec(function(error,data){
          console.log(data);
          res.render('managecommunity', {communitydata: data,data: req.session.data});
      });
  } else {
      res.redirect('/');
  }
})
app.get('/community/discussion/:id',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({
          _id: req.params.id,
      }).exec(function(error,data){
          console.log(data);
          res.render('discussion', {communitydata: data,data: req.session.data});
      });
  } else {
      res.redirect('/');
  }
})

app.get('/community/AddCommunity',function(req,res){
  if(req.session.isLogin){
      communitydetails.find({}).exec(function(error, data) {
    res.render('addcommunity', {communtiydata: data,data: req.session.data});
  });
  } else {
      res.redirect('/');
  }
})
app.get("/community/cancelRequest/:id", function(req, res) {
	if(req.session.isLogin) {
		userdetails.findOneAndUpdate({_id: req.session.data[0]._id},{$pullAll: {requestedcommunities: [req.params.id]}}).exec((error, d) => {
			if(d == null)
				res.send("error");
			else {
				communitydetails.findOneAndUpdate({_id: req.params.id},{$pullAll: {requestedmembers: [req.session.data[0]._id]}}).then(data => {
					req.session.data = [d];
					res.render('communitypanel', {data: req.session.data, communtiydata: [data]});
				})
			}
		})
	}
	else
		response.redirect("/");
})
app.post('/tag',function(req,res){
    console.log(req.body);
    let newTag = new tagdetails({
        tagname: req.body.name,
        creationdate: req.body.creationdate,
        creator: req.session.data[0].name,
        flag: req.body.flag
    })
    newTag.save().then(data=>{
        console.log(data);
        res.send(data);
    })
    .catch(err => {
        console.error(err)
        res.send(error)
    })
});

app.listen(8000);

console.log("Running on port 8000");
