var express = require('express');
var app = express();
var path = require('path');

var html_dir = './public/'; // A convenient variable to refer to the public directory

/////////////////
// Load routes //
/////////////////
var Routes = require('./routes/index');
var routes = new Routes (html_dir);
var nodesRoutes  = require('./routes/nodes');

/////////////////////////////////////
// Specify middleware mount points //
/////////////////////////////////////
app.use('/', routes); // Redirect all '/'-level requests
app.use('/nodes', nodesRoutes); // Redirect all '/nodes'-level requests
// Other routes here

// Static content
app.use (express.static( path.join (__dirname, 'public')));

//////////////////////////////////////////////////
// Start the server on RHC specific ip and port //
//////////////////////////////////////////////////
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server = app.listen (port, ipaddress, function () {

  var host = server.address().address;
  var port = server.address().port;
  console.log('App started listening at http://%s:%s', host, port); // Only for logging purposes

});