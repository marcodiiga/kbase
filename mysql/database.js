// This module implements a connection pooling mechanism to improve performances.
// Threads waiting for work are kept around instead of being spawned each time
// (node.js module-instanced objects are shared if not called by different npm modules)
var mysql = require('mysql');
var url = require('url');


// Use standard OpenShift-provided authentication variables
var parsedURL = url.parse (process.env.OPENSHIFT_MYSQL_DB_URL);
var pool = mysql.createPool({
  host: parsedURL.host.split(':')[0],
  port: parsedURL.host.split(':')[1],
  user: parsedURL.auth.split(':')[0],
  password: parsedURL.auth.split(':')[1],
  database: "kbase",
  connectionLimit: 10,
  supportBigNumbers: true
});

// ~-~-~-~ Module APIs ~-~-~-~

// Get the root node of the knowledge base. Requires a callback function with the following signature
// callback (bool success, [json_object results])
exports.getRootNode = function (callback) {
  var sql = "SELECT * FROM nodes WHERE id=1"; // Root node always has id=1
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    // Execute the query
    connection.query (sql, function(err, results) {
      connection.release(); // Return the connection to the pool
      if(err) { console.log (err); callback (true); return; }
      callback(false, results);
    });
  });
};

// Get a node in the knowledge base. Requires a node id and a callback function with the following signature
// callback (bool success, [json_object results])
exports.getNodeData = function (id, callback) {
  var sql = "SELECT * FROM nodes WHERE id=?";
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    // Execute the query
    connection.query (sql, [id], function(err, results) {
      connection.release(); // Return the connection to the pool
      if(err) { console.log (err); callback (true); return; }
      callback(false, results);
    });
  });
};

// Get the children nodes of a node. Requires a node id and a callback function with the following signature
// callback (bool success, [json_object results])
exports.getChildrenNodes = function (id, callback) {
  // Select all the nodes that have the 'id' node as a parent
  var sql = "SELECT nodes.* FROM kbase.connections INNER JOIN kbase.nodes ON connections.endNode = nodes.id WHERE connections.startNode=?";
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    // Execute the query
    connection.query (sql, [id], function(err, results) {
      connection.release(); // Return the connection to the pool
      if(err) { console.log (err); callback (true); return; }
      callback(false, results);
    });
  });
};

// Get the parent nodes of a node. Requires a node id and a callback function with the following signature
// callback (bool success, [json_object results])
exports.getParentNodes = function (id, callback) {
  // Select all the nodes that have the 'id' node as a child
  var sql = "SELECT nodes.* FROM kbase.connections INNER JOIN kbase.nodes ON connections.startNode = nodes.id WHERE connections.endNode=?";
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    // Execute the query
    connection.query (sql, [id], function(err, results) {
      connection.release(); // Return the connection to the pool
      if(err) { console.log (err); callback (true); return; }
      callback(false, results);
    });
  });
};

// Perform a query to find a list of matching nodes in the kbase (up to a fixed maximum).
// Requires a query and a callback function with the following signature: callback (bool success, [json_object results])
exports.getNodesMatchingQuery = function (query, callback) {
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    
    // Select all the nodes that match a regex query  
    var sql = "SELECT id, text FROM kbase.nodes WHERE text REGEXP " + 
      connection.escape(query) + " LIMIT 10"; // Limit 10 rows in return
    
    // Execute the query
    connection.query (sql, function(err, results) {
      connection.release(); // Return the connection to the pool
      // If there's an error but it is NOT a malformed regex query (we don't care in that case), report it
      if(err && !(err.code == 'ER_REGEXP_ERROR' && err.errno == 1139)) { 
        console.log (err); callback (true); return; 
      }
      callback(false, results);
    });
  });
};

// Get at most one node that links to the specified document. Requires a document and a callback function with the following signature
// callback (bool success, [json_object results])
exports.getNodeWhoseDocumentIs = function (document, callback) {
  // Ask the pool for a connection
  pool.getConnection(function(err, connection) {
    if(err) { console.log (err); callback (true); return; } // Failed
    
    var sql = "SELECT id FROM kbase.nodes WHERE document = " + // Trust no-one
      connection.escape(document) + " LIMIT 1";
    
    // Execute the query
    connection.query (sql, function(err, results) {
      connection.release(); // Return the connection to the pool
      if(err) { console.log (err); callback (true); return; }
      callback(false, results);
    });
  });
};