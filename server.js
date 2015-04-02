var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('All systems up\'n\'running. You\'re connected to the web server.');
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server = app.listen(port, ipaddress, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App started listening at http://%s:%s', host, port);

});