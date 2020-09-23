var mongoose = require("mongoose");
var Comment = require("./comment");
var Review = require("./review");

var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   // cost: Number,
   // location: String,
   // lat: Number,
   // lng: Number,
   imageId: String,
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      firstName: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
    //  ],
    // likes: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "User"
    //     }
   ],
	reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Campground", campgroundSchema);