// This module serves the /-level requests (i.e. the index page)
module.exports = function Router (html_dir) {
  
  var express = require('express');
  var router = express.Router();
  var path = require('path');

  /* GET home page */
  router.get('/', function(req, res, next) {
    res.sendFile (path.join (__dirname, '../', html_dir, 'index.html'));
  });
  
  return router;
};
