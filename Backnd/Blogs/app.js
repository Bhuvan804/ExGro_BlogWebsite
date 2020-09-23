var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    // expressValidator = require("express-validator"),
    seedDB      = require("./seeds")
    
//requiring routes
var commentRoutes    = require("./routes/comments"),
	reviewRoutes     = require("./routes/reviews"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index")
    
mongoose.connect("mongodb+srv://Udhav:pujajoshi1@@asm.cpd5f.gcp.mongodb.net/Asm1?retryWrites=true&w=majority", {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(() => {
    console.log("Connected to DB");
  }).catch(err => {
    console.log("Error-----", err.message);
  });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));



app.use(flash());
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "SHINING LIKE A STAR",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/blogs", campgroundRoutes);
app.use("/blogs/:id/comments", commentRoutes);
app.use("/blogs/:id/reviews", reviewRoutes);

// app.listen(process.env.PORT, process.env.IP, function(){
//   console.log("STARTED!");
// })
// app.listen(3000, function(){
//   console.log("Started!");
// });

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});