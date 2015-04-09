// This module serves the documents requests (static contents)
module.exports = function DocumentsKeeper (html_dir) {

  var express = require('express');
  var router = express.Router();
  var fs = require('fs');
  var path = require('path');

  // POST getDocument - gets a requested document
  router.post("/getDocument", function(req, res, next) {
    fs.readFile(path.join (__dirname, '../', html_dir, 'documents/', req.body.document), 'utf8', 
      function (err, data) {
        if (err) { res.status(500).send ("Get document failed"); return; }
        res.send (data); // Send file contents back
      }
    );
  });
  
  return router;
}