var fs = require('fs');
var request = require("request")

var express = require('express');
var app = express();
    app.enable('trust proxy');


var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var maxPosts = 10;
var url = "http://api.massrelevance.com/ZDFM/hs-comments.json";


var posts = [];
var open = 0;
var age = new Date();
var maxage = 5;



//init fill
getPosts(function(){
	//console.log("init")
	age.setMinutes(new Date().getMinutes() + maxage);
});


app.get('/', function(req, res){

	function sendstream(){	
		res.setHeader('x-age', age);
		res.send(posts);		
	}

	if (age <= new Date() ){

		posts = [];
		//outdated get new	
		age.setMinutes(new Date().getMinutes() + maxage);
		getPosts( sendstream );
		
	} else {
		//send old
		sendstream();
	}

  
});

function getPosts( callback ){

	request({
			    url: url,
			    json: true
			}, function (error, response, body) {

			    if (!error && response.statusCode === 200) {
			        //console.log(body) // Print the json response

			        for (var i = 0; i<body.length && i<maxPosts; i++) {
			        	var nw = body[i].network;
			        	if (nw == "facebook"){
			        		addFB(body[i], callback);
			        		open++;
			        	} else if ( nw == "twitter"){
			        		addtw(body[i], callback);
			        		open++;
			        	}
			        };

			    }
			});

}

function addFB(post, callback){
	//get face
	//console.log("get fb face");
	
	var fburl = "http://graph.facebook.com/"+post.from.id+"/picture";

	request({
	    url: fburl,
	    encoding: null
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {
	    	var newpost = {};

	    	newpost.name 		= post.from.name;
	    	newpost.screen_name = post.from.broadcast_name;
	    	newpost.profile 	= "http://www.facebook.com/profile.php?id="+post.from.id;
	    	
	    	newpost.message 	= post.message;
	    	newpost.network 	= post.network;
	    	newpost.created_time = post.created_time;

			newpost.face = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts.push(newpost);
			open--;
			if (open<=0) callback();
	    }
	});

}


function addtw(post, callback){
	//console.log("get tw face")	

	var twurl = post.user.profile_image_url;

	request({
	    url: twurl,
	    encoding: null
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {

	    	var newpost = {};

	    	newpost.name 		= post.user.name;
	    	newpost.screen_name = post.user.screen_name;
	    	newpost.profile 	= "https://twitter.com/"+post.user.screen_name;
	    	
	    	newpost.message 	= post.text;
	    	newpost.network 	= post.network;
	    	newpost.created_time = new Date(Date.parse("Tue Feb 24 11:17:18 +0000 2015")).toISOString();

			newpost.face = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts.push(newpost);
			open--;
			if (open<=0) callback();

		}
	});

}