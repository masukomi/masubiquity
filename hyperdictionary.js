CmdUtils.CreateCommand({
	name: "hyperdictionary",
	synonyms: ["hdict", "dict", "dictionary"],
	//icon: "http://www.hyperdictionary.com/favicon.ico",
	// if only they had an icon.
	author: { name: "masukomi", email: "masukomi@masukomi.org"},
	license: "Public Domain",
	//homepage: "...",
	description: "Looks up word definitions at hyperdictionary.com ",
	help: "Just type in the word you want to look up.",
	takes: {"search string": noun_arb_text},
	preview: function( pblock, input ) {
		var template = "Will look up ${query}";
		var query = input.text;
		if (query == null || query.length ==0){ query = "...";}
		pblock.innerHTML = CmdUtils.renderTemplate(template, {"query": query});
	},
	execute: function(input) {
		var searchTemplate="http://www.hyperdictionary.com/search.aspx?define=${search_term}";
		CmdUtils.getDocument().location = 
			CmdUtils.renderTemplate(searchTemplate, {"search_term": escape(input.text)});
	}

});



