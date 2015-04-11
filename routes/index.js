// This module serves the /-level requests (i.e. the index page)
module.exports = function Router (html_dir) {
  
  var express = require('express');
  var router = express.Router();
  var path = require('path');
  var database = require('../mysql/database');

  /* GET home page */
  router.get('/', function(req, res, next) {
    res.sendFile (path.join (__dirname, '../', html_dir, 'index.html'));
  });
  
  /* GET a specific document (if at least a character is specified along with the root / )
     e.g. '/templates' -> redirects to '/?node=6'
  */
  router.get('/:document(\\w+)', function(req, res, next) {
    database.getNodeWhoseDocumentIs (req.params.document, function (err, results) {
      if (err || results.length != 1) { res.status(500).send ("Cannot find requested node"); return; }
      res.redirect('/?node=' + results[0].id); // Redirect the request with the proper node id
    });
  });
  
  return router;
};
