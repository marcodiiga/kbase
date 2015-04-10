// This module serves the nodes requests on the database
var express = require('express');
var router = express.Router();
var database = require('../mysql/database');

// POST getRootNode - gets the root node data for the entire kbase
//  req.originalUrl -> '/nodes/getRoot'
//  req.baseUrl     -> '/nodes'
//  req.path        -> '/getRoot'
router.post("/getRootNode", function(req, res, next) {
  // Contact the mysql daemon and ask for the root node (with id=1)
  database.getRootNode (function (err, results) {
    if (err) { res.status(500).send ("Node root query failed"); return; }
    res.send (results); // Send back the results as JSON for the root node
  });
});

// Returns the information associated with a given node (or an empty array if no node 
// with the given id exists)
router.post("/getNodeData", function(req, res, next) {
  database.getNodeData (req.body.id, function (err, results) {
    if (err) { res.status(500).send ("Node query failed"); return; }
    res.send (results); // Send back the results as JSON for the root node
  });
});

  // Ask for the children of a given parent node
router.post("/getChildrenNodes", function(req, res, next) {
  database.getChildrenNodes (req.body.id, function (err, results) {
    if (err) { res.status(500).send ("Node query failed"); return; }
    res.send (results); // Send back the results as JSON for the root node
  });
});

// Ask for the parents of a given node
router.post("/getParentNodes", function(req, res, next) {
  database.getParentNodes (req.body.id, function (err, results) {
    if (err) { res.status(500).send ("Node query failed"); return; }
    res.send (results); // Send back the results as JSON for the root node
  });
});

// Perform a query to find a list of matching nodes in the kbase (up to a fixed maximum)
router.post("/getNodesMatchingQuery", function(req, res, next) {
  database.getNodesMatchingQuery (req.body.query, function (err, results) {
    if (err) { res.status(500).send ("Node matching query failed"); return; }
    res.send (results); // Send back the results as JSON for the root node
  });
});
  
module.exports = router;