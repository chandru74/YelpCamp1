var express = require('express');
var app = express();
app.set('view engine','ejs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Campground = require('./models/campground');
var Comment = require('./models/comment');
var seedDB = require('./seed');
var User = require('./models/user');
var passport = require('passport');
var LocalStratergy = require('passport-local');


mongoose.connect("mongodb://localhost:27017/yelp_camp",{useNewUrlParser:true,useUnifiedTopology:true});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

seedDB();

//PASSPORT CONFIGURATION
app.use(require('express-session')({
    secret:"beat IT",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentuser = req.user;
    next();
})

app.get('/',(req,res)=>{
    res.render("landing");
})

app.get('/campgrounds',(req,res)=>{
    //get all campgrounds from DB
    Campground.find({},(error,allcampgrounds)=>{
        if(error){
            console.log("error");
        }else{
            res.render("campgrounds/index",{campgrounds:allcampgrounds});
        }
    })
   
})
app.get('/campgrounds/new',(req,res)=>{
    res.render("campgrounds/new");
})

app.get('/campgrounds/:id',(req,res)=>{
    Campground.findById(req.params.id).populate("comments").exec((err,foundCamp)=>{
        if(err){
            console.log("something went wrong bruh");
        }else{
            res.render("campgrounds/show",{campground:foundCamp});
        }
    })
})

app.post('/campgrounds',(req,res)=>{
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCamp = {name:name,image:image,description:desc};
    Campground.create(
        newCamp,(error,campground)=>{
            if(error){
                console.log("error");
            }else{
                console.log("newly added campground");
                res.redirect('/campgrounds');
            }
        }
    )
    
})

//========================
//COMMENTS
//========================

app.get('/campgrounds/:id/comment/new',isLoggedIn,(req,res)=>{
    Campground.findById(req.params.id,(err,foundCamp)=>{
        if(err){
            console.log("something went wrong bruh");
        }else{
            res.render("comments/new",{campground:foundCamp});
        }
    })
})

app.post('/campgrounds/:id/comment',(req,res)=>{
    Campground.findById(req.params.id,(err,campground)=>{
        if(err){
            console.log("something went wrong bruh");
        }else{
            Comment.create(req.body.comment,(err,comment)=>{
                if(err){
                    console.log("something went wrong bruh");
                }else{
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect('/campgrounds/' + campground._id);
                }
            })
        }
    })
})


//APP ROUTES

app.get('/register',(req,res)=>{
    res.render("register")
})

app.post('/register',(req,res)=>{
    var newUser = new User({username:req.body.username});
    User.register(newUser,req.body.password,(err,user)=>{
        if(err){
            console.log(err)
            return res.redirect('/register')
        }
        passport.authenticate("local")(req,res,()=>{
            res.redirect('/campgrounds')
        })
    })
})

app.get('/login',(req,res)=>{
    res.render("login")
})

app.post('/login',passport.authenticate("local",{
    successRedirect:'/campgrounds',
    failureRedirect:"/login"
}),(req,res)=>{

})

app.get('/logout',(req,res)=>{
    req.logOut();
    res.redirect("/login");
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

app.listen(4000,()=>{
    console.log("Listening Bruh")
})