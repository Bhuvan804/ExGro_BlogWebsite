var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Notification = require("../models/notification");
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "expressloud",
  api_key: "891833253342346",
  api_secret: "SlzmxgQ_qmNP2MSZOwL7dhg8KGM"
});

router.get("/contact", function(req, res){
  res.render("contact");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

// root route
router.get("/", function(req, res) {
  // if (req.user) {
  //   return res.redirect("/blogs");
  // } else {
    User.findById(req.params.user_id, function(err, foundUser) {
    Campground.find()
      .exec(function(err, campgrounds) {
        if (err) {
          req.flash("error", "Something went wrong");
          res.render("error");
        }
            res.render("landing", {
              campgrounds: campgrounds,
            });
          });
      });
  });
  // }

router.get("/about", function(req, res) {
  res.render("about");
});

// show register form
router.get("/register", function(req, res) {
  if (req.user) {
    return res.redirect("/blogs");
  } else {
    res.render("register");
  }
});

// handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        bio: req.body.bio
      });
     if(req.body.adminCode === 'ExGro') {
      newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.firstName);
           res.redirect("/"); 
        });
    });
});


// show login form
router.get("/login", function(req, res) {
  if (req.user) {
    return res.redirect("/blogs");
  } else {
    res.render("login");
  }
});

// handle login logic
router.post(
  "/login",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/blogs",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: true
  }),
  function(req, res) {req.flash("success", "Welcome back!");}
);

// logout route
router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "See you later!");
  res.redirect("/");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'express.it.out.loud@gmail.com',
          pass: '1Prachi6@2eshA6'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'express.it.out.loud@gmail.com',
        subject: 'Express Password Reset',
        text: 'Hi\nYou are receiving this because you (or someone else) have requested the reset of the password for your account.\n' +
          'Please click on the following link to reset your password:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has been expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has been expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            console.log(err);
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'express.it.out.loud@gmail.com',
          pass: '1Prachi6@2eshA6'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'express.it.out.loud@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hi,\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/blogs');
  });
});


// user profile
router.get("/users/:user_id", function(req, res) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "This user doesn't exist");
      return res.render("error");
    }
    Campground.find()
      .where("author.id")
      .equals(foundUser._id)
      .exec(function(err, campgrounds) {
        if (err) {
          req.flash("error", "Something went wrong");
          res.render("error");
        }
        Comment.find()
          .where("author.id")
          .equals(foundUser._id)
          .exec(function(err, ratedCount) {
            if (err) {
              req.flash("error", "Something went wrong");
              res.render("error");
            }
            res.render("users/show", {
              user: foundUser,
              campgrounds: campgrounds,
              reviews: ratedCount
            });
          });
      });
  });
});

// edit profile
router.get("/users/:user_id/edit", middleware.isLoggedIn, middleware.checkProfileOwnership, function(req, res) {
    res.render("users/edit", {
      user: req.user
    });
  }
);

// update profile
router.put("/users/:user_id", upload.single("image"), middleware.checkProfileOwnership, function(req, res) {
    User.findById(req.params.user_id, async function(err, user) {
      if (err) {
        req.flash("error", err.message);
      } else {
        if (req.file) {
          try {
            await cloudinary.v2.uploader.destroy(user.imageId);
            var result = await cloudinary.v2.uploader.upload(req.file.path);
            user.imageId = result.public_id;
            user.image = result.secure_url;
          } catch (err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
        }
        user.email = req.body.email;
        user.bio = req.body.bio;
        user.firstName = req.body.firstName;
        user.save();
        req.flash("success", "Updated your profile!");
        res.redirect("/users/" + req.params.user_id);
      }
    });
  }
);

// delete user
router.delete("/users/:user_id", middleware.checkProfileOwnership, function(req, res) {
  User.findById(req.params.user_id, async function(err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    if (user.image === "") {
      user.remove();
      res.redirect("/");
    } else {
      try {
        await cloudinary.v2.uploader.destroy(user.imageId);
        user.remove();
        res.redirect("/");
      } catch (err) {
        if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
      }
    }
  });
});

module.exports = router;


// ====================================================================================================================================================================
