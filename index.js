var fs = require('fs');
var Handlebars = require('handlebars');
var template = fs.readFileSync('./html_template/index.html',{encoding:"utf8"});

var request = require("request")
    
var posts = [];
var open = 0;
var maxPosts = 10;


var url = "http://api.massrelevance.com/ZDFM/hs-comments.json";


function save(){

	if (open>0) return;
	console.log("save json");

	fs.writeFile("stream.json", JSON.stringify(posts, null, 4), function(err) {
	    if(err) {
	      console.log(err);
	    } else {
	      console.log("JSON saved to " + "stream.json");
	      writeHTML(posts);
	    }
	}); 

}

function addFB(post){
	//get face
	console.log("get fb face");
	
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

			newpost.image64 = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts.push(newpost);
			open--;
			save();
	    }
	});

}


function addtw(post){
	console.log("get tw face")	

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

			newpost.image64 = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

			posts.push(newpost);
			open--;
			save();

		}
	});

}


request({
    url: url,
    json: true
}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
        //console.log(body) // Print the json response

        for (var i = 0; i<body.length && i<maxPosts; i++) {
        	var nw = body[i].network;
        	if (nw == "facebook"){
        		addFB(body[i]);
        		open++;
        	} else if ( nw == "twitter"){
        		addtw(body[i]);
        		open++;
        	}
        };
    }
});





function writeHTML(posts){

	console.log("created_html");

	//neues html
	var savehtml = renderTemplate(template, posts);


	//dateinmane
	var fout = "posts.html";
	var path = "./html_template";
	var saveas = path + "/" + fout;

	console.log("save template");
	

	//fs.writeSync(saveas, savehtml, {encoding:"UTF-8"});
	fs.writeFile(saveas, savehtml, 0, { encoding: "utf8" }, function(err){
		console.log("done");
		//process.kill();
	});
}


function renderTemplate(html,data){
	var template = Handlebars.compile(html);
	var text = template({items:data});
	//return new Handlebars.SafeString(text);
	return (text);
}


// db.getAttachment("_design/tweetrenderdb", "templates/"+config.version+"/rendersource.html", function(err, repl){
// 			if (!err){
// 				var template_html = repl.body.toString('utf8');
// 				var target_html = renderTemplate(template_html, { code:RenderRequest.code,
// 																  bgimageurl: RenderRequest.bgimageurl,
// 																  size: (RenderRequest.screensize==1)?"klein":"gross"
// 																});

// 				db.saveAttachment( self.doc , 	//doc.id
// 				{ name : 'rendersource.html',
// 				  'Content-Type' : 'text/html;charset=utf-8',
// 				  body : target_html
// 				},
// 				uploadComplete("datastore.saveRendersourceComplete"));
// 			}
// 		});