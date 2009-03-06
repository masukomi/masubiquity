CmdUtils.CreateCommand({
	previewDelay : 500,
	name: "tweeted",
	synonyms: ["twat"], // an arguably better past tense of tweet
	icon: "http://assets3.twitter.com/images/favicon.ico",
	author: { name: "masukomi", email: "masukomi@masukomi.org"},
	license: "MPL",
	takes: {'number': noun_arb_text},
	description: "Displays the most recent tweets for you.",
	help: "<p>Displays the most recent tweets for you. <br />Defaults to 6 but you can specify "+
		"any number less than 200 with like this: \"tweeted 5\".</p><p>You'll need a "+
		"<a href=\"http://twitter.com\">Twitter account</a>, obviously.  If you're not "+
		"already logged in you'll be asked to log in.</p>",
	preview: function(previewBlock, directObj) {
		  //how many do they want?
		  var howMany = directObj.text;
		  if (howMany && howMany >200){
		      howMany = 6;
		  } else if (! howMany){
		      howMany = 6;
		  }
		CmdUtils.log("howMany: " + howMany);
		  previewHTML = "Retrieves the last ${howMany} tweets on your timeline.";
		//previewBlock += CmdUtils.renderTemplate(previewHTML, {"howMany":howMany});

		  // the list
		  //
		  jQuery.get( "http://twitter.com/statuses/friends_timeline.json?count=" + howMany, function(raw_timeline){
		      eval("var recentTweets = " + raw_timeline + ";");
			previewHTML = "<table>";
			var tweetplate="<tr><td colspan='2'><a href='http://twitter.com/${tweet.user.screen_name}'>${tweet.user.name}</a> (${tweet.created_at})</td></tr><tr><td style='padding-left:1em;'><image src='${tweet.user.profile_image_url}' width='48' height='48'></td><td valign='top'>${tweet.text}</td></tr>\n";
			 
			for (var i =0; i < recentTweets.length; i++){
				var tweet = recentTweets[i]; // a hash
				tweet.created_at = tweet.created_at.replace(/ \+.*/, ""); // chop off the excess precision
				tweet.text = tweet.text.replace(/(https*:\/\/.*?)(\s|$)/g, "<a href='$1'>$1</a>").replace(/@(\w+)/, "<a href='http://twitter.com/$1'>@$1</a>"); //make the urls into links
				var rendered = CmdUtils.renderTemplate(tweetplate, {"tweet":tweet});
				//CmdUtils.log(rendered);
				previewHTML += rendered.replace(/<a href/g, "<a style='color:#CCCCFF;' href");
			}
		      previewBlock.innerHTML = previewHTML + "</table>";
			//CmdUtils.log("preview should be: " + previewHTML + "</table>");
		});
		
	  


	},
	execute: function(directObj, mods) {
	displaMessage("tweeted displays your timeline in the preview.");
	  return;
	}
});
