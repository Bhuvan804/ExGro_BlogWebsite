var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({ 
  cloud_name: "asmk", 
  api_key: "125792419914389", 
  api_secret: "vJcBAua8XhMcJaZvAL2Bm3fHdRk"
});


//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("blogs/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("blogs/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        firstName: req.user.firstName
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/blogs/' + campground.id);
      });
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("blogs/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("blogs/show", {campground: foundCampground});
        }
    });
});


// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
      if(err){
        req.flash("error", "You do not have permission to do that");
        console.log(err);
      } else{
          res.render("blogs/edit", {campground: foundCampground});
        }
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", upload.single('image'), function(req, res){
	delete req.body.campground.rating;
  
  // geocoder.geocode(req.body.location, function (err, data) {
    // var lat = data.results[0].geometry.location.lat;
    // var lng = data.results[0].geometry.location.lng;
    // var location = data.results[0].formatted_address;
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
          if(req.file){
            try{
              await cloudinary.v2.uploader.destroy(campground.imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path);
              campground.imageId = result.public_id;
              campground.image = result.secure_url;

            } catch(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
        campground.name = req.body.name ? req.body.name : campground.name;
        campground.description = req.body.description;
        campground.save();
        req.flash("success","Successfully Updated!");
        res.redirect("/blogs/" + campground._id);
      }
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", function(req, res) {
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.imageId);
        campground.remove();
        req.flash("success", campground.name + " deleted successfully!");
        res.redirect('/blogs');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

// Campground Like Route
// router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
//     Campground.findById(req.params.id, function (err, foundCampground) {
//         if (err) {
//             console.log(err);
//             return res.redirect("/blogs");
//         }

//         // check if req.user._id exists in foundCampground.likes
//         var foundUserLike = foundCampground.likes.some(function (like) {
//             return like.equals(req.user._id);
//         });

//         if (foundUserLike) {
//             // user already liked, removing like
//             foundCampground.likes.pull(req.user._id);
//         } else {
//             // adding the new user like
//             foundCampground.likes.push(req.user);
//         }

//         foundCampground.save(function (err) {
//             if (err) {
//                 console.log(err);
//                 return res.redirect("/blogs");
//             }
//             return res.redirect("/blogs/" + foundCampground._id);
//         });
//     });
// });

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;