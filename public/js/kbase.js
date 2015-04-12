// Copyright (c) 2015, Alesiani Marco
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
// list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
// this list of conditions and the following disclaimer in the documentation and/or
// other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors
// may be used to endorse or promote products derived from this software without
// specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
// OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.

function KBase (map) { // Call initializeMapWithRoot() to initialize a KBase which uses the map object

  'use strict';
  var pendingAjaxCalls = 0;      

  // Escape html characters inside <code></code> tags
  function escapeHTMLintoCodeTags (text) {
    var codeRegEx = /(<\s*code[^>]*>)([\s\S]*?)(<\s*\/\s*code>)/gi;
    text = text.replace (codeRegEx, function (completeSubStr, group1, group2, group3) {
      return group1 + group2.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + group3;
    });
    return text;
  }
  
  function setDocumentHtml (document, htmlText) {
    $('#document').queue(function () { // (*)
      // Save the placeholder, this will have to be reinserted after the new document has been loaded
      var $placeHolder = $('#searchBoxPlaceHolder').clone();
      
      // Escape html characters inside <code></code> tags
      htmlText = escapeHTMLintoCodeTags (htmlText);

      $('#document').html (htmlText);
      $('#document').prepend ($placeHolder); // Makes room for the searchBox by reinserting the placeholder
      
      hljs.initHighlighting.called = false; // Hack to have the syntax highlighter redo all the work
      hljs.initHighlighting (); // Start the syntax highlighter on this document (<pre><code> blocks)

      // Enqueue the animation for the div's height to fit the entire content. This is necessary since scrollHeight
      // could not be calculated before. Now it's a valid value for the new document
      $('#document').animate({
        height: $('#document')[0].scrollHeight,
        opacity: 1
      }, 500);
      $.data($('#document')[0], "scrollHeight", $('#document')[0].scrollHeight); // Store this value, might be used later
                                                                                 // if the same document is asked again
      $(this).dequeue(); // Continue with the next queued animation (the (*) just enqueued)
    });      
  }
  
  function performPOSTDocumentRequest (document, callback) { // Load via ajax a requested document
    pendingAjaxCalls++;
    $.ajax({ // Ask for the parents of a node in the database
      type: "POST",
      url : "/documents/getDocument",
      data: JSON.stringify({document: document}),
      contentType: 'application/json',
      success : function(response) {
        callback (response);
        pendingAjaxCalls--;
      },
      error: function(xhr, ajaxOptions, thrownError) {
        $.error ("Ajax call error: (" + xhr.status + ") " + thrownError);
        pendingAjaxCalls--;
      }
    });
  }
  
  function performPOSTQueryOnKbase (nodeId, uri, callback, callbackIfNoResults) {
    pendingAjaxCalls++;
    $.ajax({ // Ask for a query on a node in the database
      type: "POST",
      url : uri,
      data: JSON.stringify({id: nodeId}),
      contentType: 'application/json',
      success : function(response) {
        if (response.length === 0 && typeof callbackIfNoResults != 'undefined')
          callbackIfNoResults ();
        else {
          $.each (response, function () {
            callback (this.id, this.document, this.text);
          });
        }
        pendingAjaxCalls--;
      },
      error: function(xhr, ajaxOptions, thrownError) {
        $.error ("Ajax call error: (" + xhr.status + ") " + thrownError);
        pendingAjaxCalls--;
      }
    });
  }
  
  // Load all the parents and children of a node and add them to the map
  function loadNodeParentsAndChildren (node) {
    // Get all this node's parents and children through an ajax query
    performPOSTQueryOnKbase (node.id, "/nodes/getParentNodes", function (id, document, text) {
      var parentNode = node.addChildNode (id, document, text);
      parentNode.callback = nodeClicked;
      parentNode.$element.addClass ('parent');
    });
    performPOSTQueryOnKbase (node.id, "/nodes/getChildrenNodes", function (id, document, text) {
      node.addChildNode (id, document, text).callback = nodeClicked;
    });
  }
  
  // Load a node's document if it isn't already loaded
  function loadNodeDocument (node) {
    // If there's any href (not already loaded), load the document asked
    if (node.href != undefined && $.data($('#document')[0], "currentDocument") != node.href) {
      performPOSTDocumentRequest (node.href, function (data) {
        setDocumentHtml (node.href, data);
      });
    } else if (node.href != undefined) { // Document is already loaded but perhaps the div is still collapsed, make sure it's visible
      // We can NOT get here if there's no document (node.href == undefined) so in that case no animation would be played
      $('#document').animate({
        height: $.data($('#document')[0], "scrollHeight"), // Scroll to its latest stored scrollHeight
        opacity: 1
      }, 500);
    }

    // Whatever the document asked (even undefined), store it into an HTML5 data attribute
    // and if there's something to show, make sure the document is shown with an animation
    if (node.href != undefined) {
      $.data($('#document')[0], "currentDocument", node.href);
    } else
      $.data($('#document')[0], "currentDocument", null);
  }
  
  function nodeClicked (node) { // Click handler for nodes
  
    $('#quicksearchBar').val(''); // Clear quicksearch query
  
    if (pendingAjaxCalls > 0)
      return; // If ajax calls are slow, we can't proceed (we might add duplicate nodes due to
              // dangling references and asynchronous callbacks)
      
    // Only case we don't hide the current document is when we already have the requested one
    if ($.data($('#document')[0], "currentDocument") != node.href) {
      $('#document').animate({
        height:  0,
        opacity: 0
      }, 500);
    }
    
    // Make this the new root node
    node.markAsSelected ();
    node.$element.removeClass ('parent');
    
    // Remove all the map nodes which aren't this one
    $.each (map.getNodes(), function () {
      if (this != node)
        this.deleteNode ();
    });
    
    loadNodeParentsAndChildren (node);
    
    loadNodeDocument (node);
  }
  
  this.loadNewRootNode = function (id) { // Load a completely new root node and all its associated data
  
    if (pendingAjaxCalls > 0)
      return; // If ajax calls are slow, we can't proceed (we might add duplicate nodes due to
              // dangling references and asynchronous callbacks)
              
    // Get the requested node information
    performPOSTQueryOnKbase (id, "/nodes/getNodeData", function (id, document, text) { 
      // Create this node as the root
      var rootNode = map.createRootNode (id, document, text);
      // Add every other related node
      loadNodeParentsAndChildren (rootNode);
      // Finally load the new document
      loadNodeDocument (rootNode);
    }, function () {
      $.error ("Error: no node with this id exists in the kbase: " + id);
      return;
    });
  
  }
  
  this.initializeMapWithRoot = function (map, rootId) { // First-time initialize the map with the kbase root or a given root node
    
    if (typeof rootId == "undefined") {
      // KBase root node requested   
      pendingAjaxCalls++;
      $.ajax({ // Ask for the root node in the database
        type: "POST",
        url : "/nodes/getRootNode",
        success : function(response) {
          if(response.length != 1) {
            $.error ("Expected one root node for kbase, got length of "+response.length);
            return;
          }
          var rootObj = response[0]; // {document, id, text}
          // Create the root node
          var rootNode = map.createRootNode (rootObj.id, rootObj.document, rootObj.text);
          rootNode.callback = nodeClicked;
          pendingAjaxCalls--;
          
          // Create the child nodes directly attached to the root
          pendingAjaxCalls++;
          $.ajax({
            type: "POST",
            url : "/nodes/getChildrenNodes",
            contentType: 'application/json',
            data: JSON.stringify({id: rootNode.id}),
            success : function(response) {
              $.each (response, function () {
                var newNode = rootNode.addChildNode(this.id, this.document, this.text);
                newNode.callback = nodeClicked;
              });
              pendingAjaxCalls--;
            },
            error: function(xhr, ajaxOptions, thrownError) {
              $.error ("Ajax call error: (" + xhr.status + ") " + thrownError);
              pendingAjaxCalls--;
            }
          });
        },
        error: function(xhr, ajaxOptions, thrownError) {
          $.error ("Ajax call error: (" + xhr.status + ") " + thrownError);
          pendingAjaxCalls--;
        }
      });
    } else {
      // Specific root node requested
      this.loadNewRootNode (rootId);
    }
  }
  
  return this;
} // KBase()