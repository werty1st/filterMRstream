/// <reference path="typings/node/node.d.ts"/>
var fs = require('fs');
var request = require("request");
var log = require('npmlog');
var Q = require("q");

log.heading = 'HSMRS';
log.level = 'silent';
log.level = 'debug';
log.level = 'info';
// log.verbose('verbose prefix', 'x = %j', {foo:{bar:'baz'}})
// log.info('info prefix', 'x = %j', {foo:{bar:'baz'}})
// log.warn('warn prefix', 'x = %j', {foo:{bar:'baz'}})
// log.error('error prefix', 'x = %j', {foo:{bar:'baz'}})

var express = require('express');
var app = express();
    app.enable('trust proxy');


var server = app.listen(process.env.PORT || 3000, function() {
    log.info('Listening on port', server.address().port);
});

var maxPosts = 10;
var maxage = 1;
var url = "http://api.massrelevance.com/ZDFM/hs-comments.json";


var posts = {};
var posts_out = {};
var open = 0;
var age = new Date();


function updatePosts() {
	age = new Date();
	log.info("Update Posts",age);
	posts_out = posts;
	posts = {};
}

//init fill
log.verbose("Starting up...");
getPosts().then( function () {

	//posts geladen
	updatePosts();
	
	app.get('/', function(req, res){
		log.http("Request received", age );
		res.setHeader('Cache-Control', 'no-chache,no-store');
		res.setHeader('Edge-Control', 'public, max-age=' + maxage * 60);
		res.setHeader('X-Next-Refresh', age);
		posts_out = Object.keys(posts_out).map(function (key) {return posts_out[key];});
		res.send(posts_out);
	});
	
});


//mainLoop
	setInterval( function() {
		 log.info("Reload Posts",age);
		 getPosts().then( updatePosts, function (error) {
			// If there's an error or a non-200 status code, log the error.
			if (open > maxPosts/2){
				log.error( open ,'requests didn\'t respond in time.' );
				//todo send error mail
			} else {
				log.warn( open ,'requests didn\'t respond in time.' );
				updatePosts();
			}
			
			} ); 
		 }, maxage * 60000 );
//endMainLoop

function getPosts(){

	var deferred = Q.defer();

	open = 0;
	request({
			    url: url,
			    json: true
			}, function (error, response, body) {

			    if (!error && response.statusCode === 200) {

			        for (var i = 0; i<body.length && i<maxPosts; i++) {
			        	var nw = body[i].network;
			        	var post = body[i];

			        	if (nw == "facebook"){
			        		open++;
							addFB(post, deferred.resolve, i);
			        	} else if ( nw == "twitter"){
							open++;
			        		addtw(post, deferred.resolve, i);
			        	}
			        };
			    }
			});
	setTimeout( deferred.reject, 10000);
	return deferred.promise;
}

function addFB(post, callback, index){
	//get face
	//console.log("get fb face");
	
	var fburl = "http://graph.facebook.com/"+post.from.id+"/picture";
	
	log.verbose("request #"+(index+1), "facebook");


	request({
	    url: fburl,
	    encoding: null
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {
	    	var newpost = {};

	    	log.verbose("response #"+(index+1), fburl);

	    	newpost.name 		= post.from.name;
	    	newpost.screen_name = post.from.broadcast_name;
	    	newpost.profile 	= "http://www.facebook.com/profile.php?id="+post.from.id;
	    	
	    	newpost.message 	= post.message;
	    	newpost.network 	= post.network;
	    	newpost.created_time = post.created_time;

			newpost.face = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts[index]=newpost;
			
	    }else {
			log.warn("request #"+(index+1), "failed");
		}
		open--;
		log.verbose("Pending requests ", open);
		if (open<=0) callback();		
	});

}


function addtw(post, callback, index){
	//console.log("get tw face")	

	var twurl = post.user.profile_image_url;
	log.verbose("request #"+(index+1), "twitter");

	request({
	    url: twurl,
	    encoding: null
	}, function (error, response, body) {

	    if (!error && response.statusCode === 200) {

	    	var newpost = {};

			log.verbose("response #"+(index+1), twurl);

	    	newpost.name 		= post.user.name;
	    	newpost.screen_name = post.user.screen_name;
	    	newpost.profile 	= "https://twitter.com/"+post.user.screen_name;
	    	
	    	newpost.message 	= post.text;
	    	newpost.network 	= post.network;
	    	newpost.created_time = new Date(post.created_at).toISOString();

			newpost.face = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts[index]=newpost;

		} else {
			log.warn("request #"+(index+1), "failed");
		}
		open--;
		log.verbose("Pending requests ", open);
		if (open<=0) callback();
		
	});

}