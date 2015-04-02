var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('All systems up\'n\'running. You\'re connected to the web server.');
});

var server = app.listen(process.env.OPENSHIFT_NODEJS_PORT, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App started listening at http://%s:%s', host, port);

});