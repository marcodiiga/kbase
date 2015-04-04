var express = require('express');
var router = express.Router();

/* GET home page */
router.get('/', function(req, res, next) {
  res.sendfile (html_dir + 'index.html');
});

module.exports = router;
