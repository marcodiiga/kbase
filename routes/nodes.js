// This module serves the nodes requests on the database
var express = require('express');
var router = express.Router();

//* POST getRoot node *//
//  req.originalUrl -> '/nodes/getRoot'
//  req.baseUrl     -> '/nodes'
//  req.path        -> '/getRoot'
router.post("/getRoot", function(req, res, next) {
  // Contact the mysql daemon and ask for the root node (with id=1)
  //res.send("cazzo");
  
  console.log ("hello here");
});
  
module.exports = router;