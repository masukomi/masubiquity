const MOO_PREFIX = "MOO_"
const MOO_LIST = MOO_PREFIX + "LIST";

//PREFS will be used for storing color prefs 
const MOO_PREFS= MOO_PREFIX + "PREFS";

var store = Application.storage;
//var prefs = Application.prefs;

var moo_template = "\
<div style='font-weight: bold;'>Your Todo list has ${entries.length} item{if entries.length != 1}s{/if}:</div> \
<div style='overflow: auto; height: 450px; width:475;font-size:10pt;'> \
{for entry in entries} \
  <div style='width: 100%;{if parseInt(entry_index) % 2 == 0}background: #444444;{else}background: #555555;{/if}'><span style='color: #FF9966;'>${parseInt(entry_index) +1 })</span> ${entry}</div> \
{/for}</div>"; 

CmdUtils.CreateCommand({
	name: "todo",
	synonyms: ["moo"],
	icon: "http://example.com/example.png",
	homepage: "http://example.com/",
	author: { name: "masukomi", email: "masukomi@masukomi.org"},
	license: "MIT",
	description: "",
	help: "<dl>\
<dt style='font-style:italic; border-bottom: solid 1px #cccccc;'>todo</dt><dd>displays your list of todo items</dd> \
<dt style='font-style:italic; border-bottom: solid 1px #cccccc;'>todo add &lt;message&gt;<dd>adds an item to your todo list.<br />Example: todo @home pick up groceries.</dd> \
<dt style='font-style:italic; border-bottom: solid 1px #cccccc;'>todo finish OR done &lt;item number&gt;</dt> \
	<dd>removes the item with the corresponding number from your list.<br />Example: todo finish 4</dd> \
<dt style='font-style:italic; border-bottom: solid 1px #cccccc;'>todo set &lt;at word&gt; &lt;color&gt;</dt> \
	<dd>Set the highlight color for a specific at word. <nobr>Example: todo set @work #ff3333</nobr><br />Check out the <a style='color:#9999FF;' href='http://www.visibone.com/colorlab/'>Visibone Color Lab</a> for colors.</dd> \
</dl>",
	takes: {"(add OR finish) message OR item number": noun_arb_text},
	preview: function( pblock, input ) {
		var params = this.parseParams(input);
		var data =this.getList();
		if (data.length  > 0){
			for (var i =0; i < data.length; i++){
				data[i] = this.highlightAtWords(data[i]);
			}
			
			pblock.innerHTML = CmdUtils.renderTemplate(moo_template, {'entries': data});
		} else {
			pblock.innerHTML = this.help;
		}
	},
	execute: function(input) {
		var params = this.parseParams(input);
		if (params.command != 'show'){
			// get the stored data
			if (params.command == 'add' || params.command == 'remove' || params.command == 'clear'){
				var data = this.getList(); 
				if (params.command == 'add'){
					data.push(params.payload);
					displayMessage("Item added to list");
				} else if (params.command == 'remove'){
					
					var item = params.payload;
					if (item != -1){
						item--;
						if (item < data.length){
							data.splice(item,1);
							displayMessage("Item removed from list");
						} else {
							displayMessage("Please pick a number that corresponds to an item in the list.");
						}
					} else {
						displayMessage("You must specify the number of the item you want removed");
					}
				} else if (params.command == 'clear'){
					//
					if (confirm("Are you sure you want to delete the whole list?")){
						data = [];
						displayMessage("List cleared.");
					} else {
						displayMessage("List untouched.");
					}
				}
				// store the results.
				this.setList(data);
			} else if (params.command == 'set_color'){
				var color = params.payload.color;
				var atWord = params.payload.atWord;
				if (atWord != null && color != null){
					if (/^#\w{3,6}$/.test(color)){
						var prefs = this.getPrefs();
						prefs['colors'][atWord] = color;
						this.setPrefs(prefs);
						displayMessage("@"+atWord + " will now be " + color);
					} else {
						displayMessage("Please enter a hex color\nlike #FF3333");
					}
				}
			}
		}
	},
	highlightAtWords: function(text){
		var atWord = text.replace(/^\s*@(\w+)(\s+.*|$)/, "$1"); 
		if (atWord != text){
			var prefs =  this.getPrefs();
			var color = prefs['colors'][atWord];
			var undefined_var;
			if (color === undefined_var){
				color = prefs['colors']['default'];
			}
			var replacement =  text.replace(/^\s*\@(\w+)(\s+.*?|$)/, "<span style='color: " + color + ";'>@$1</span>" + "$2");
			return replacement;
		}
		return text;
	},
	parseParams: function(params){
		// todo add <message>
		// todo finish <item number>
			// todo done <item number>
		// todo clear 
		var response = {'command' : 'show'};
		var undefined_var;
		var paramsS = "";
		if (params === undefined_var || params == null){
			paramsS = "";
		} else {
			paramsS = params.text;
		}
		if (paramsS != '' && /\S+/.test(paramsS)){
			// there's *something* there
			var firstWord = paramsS.replace(/^\s*(\S+).*/, "$1");
			if (/add/i.test(firstWord)){
				var message = paramsS.replace(/^\s*\S+\s+(.*?)/, "$1");
				response.command = 'add';
				response.payload = message;
			} else if (/finish|done|rm/i.test(firstWord)){
				response.command = 'remove';
				var itemNum = paramsS.replace(/^\s*\S+\s+(\d+).*?/, "$1");
				if (itemNum != '' ){
					response.payload = parseInt(itemNum);
				} else {
					response.palyoad = -1;
				}
			} else if (/set/i.test(firstWord)){
				// they want us to set a color
				response.command = 'set_color';
				if (/^\s*set\s+@*\w+(\s+|\s+=\s+)\S+\s*$/i.test(paramsS)){
					var atWord = paramsS.replace(/^\s*set\s+@*(\w+)(\s+|\s+=\s+)\S+\s*$/, "$1");
					var color = paramsS.replace(/^\s*set\s+@*\w+(\s+|\s+=\s+)(\S+)\s*$/, "$2");
					response.payload={'atWord':atWord, 'color':color};
				} else {
					response.payload={'atWord':null, 'color':null};
				}
			} else if (/clear/i.test(firstWord)){
				response.command = 'clear';
			}
		}
		
		return response;
	},
	
	hasList: function () {
		return store.has(MOO_LIST);
	},

	getList: function () {
		if (this.hasList()) {
			return JSONstring.toObject(store.get(MOO_LIST,'[]'));
		}else{
			return [];
		}
	},

	setList: function (list){
		store.set(MOO_LIST, JSONstring.make(list));
	},

	hasPrefs: function () {
		return store.has(MOO_PREFS);
	},

	getPrefs: function () {
		var defaultPrefs = '{"colors":{"default":"#9999ff"}}';
		if (this.hasPrefs()) {
			return JSONstring.toObject(store.get(MOO_PREFS, defaultPrefs));
		}else{
			return JSONstring.toObject(defaultPrefs);
		}
	},

	setPrefs: function (prefs){
		store.set(MOO_PREFS, JSONstring.make(prefs));
	}
	

	
});

/*
JSONstring v 1.01
copyright 2006 Thomas Frank
(small sanitizer added to the toObject-method, May 2008)

This EULA grants you the following rights:

Installation and Use. You may install and use an unlimited number of copies of the SOFTWARE PRODUCT.

Reproduction and Distribution. You may reproduce and distribute an unlimited number of copies of the SOFTWARE PRODUCT either in whole or in part; each copy should include all copyright and trademark notices, and shall be accompanied by a copy of this EULA. Copies of the SOFTWARE PRODUCT may be distributed as a standalone product or included with your own product.

Commercial Use. You may sell for profit and freely distribute scripts and/or compiled scripts that were created with the SOFTWARE PRODUCT.

Based on Steve Yen's implementation:
http://trimpath.com/project/wiki/JsonLibrary

Sanitizer regExp:
Andrea Giammarchi 2007

*/

JSONstring={
	compactOutput:false, 		
	includeProtos:false, 	
	includeFunctions: false,
	detectCirculars:false,
	restoreCirculars:false,
	make:function(arg,restore) {
		this.restore=restore;
		this.mem=[];this.pathMem=[];
		return this.toJsonStringArray(arg).join('');
	},
	toObject:function(x){
		if(!this.cleaner){
			try{this.cleaner=new RegExp('^("(\\\\.|[^"\\\\\\n\\r])*?"|[,:{}\\[\\]0-9.\\-+Eaeflnr-u \\n\\r\\t])+?$')}
			catch(a){this.cleaner=/^(true|false|null|\[.*\]|\{.*\}|".*"|\d+|\d+\.\d+)$/}
		};
		if(!this.cleaner.test(x)){return {}};
		eval("this.myObj="+x);
		if(!this.restoreCirculars ){return this.myObj};
		if(this.includeFunctions){
			var x=this.myObj;
			for(var i in x){if(typeof x[i]=="string" && !x[i].indexOf("JSONincludedFunc:")){
				x[i]=x[i].substring(17);
				eval("x[i]="+x[i])
			}}
		};
		this.restoreCode=[];
		this.make(this.myObj,true);
		var r=this.restoreCode.join(";")+";";
		eval('r=r.replace(/\\W([0-9]{1,})(\\W)/g,"[$1]$2").replace(/\\.\\;/g,";")');
		eval(r);
		return this.myObj
	},
	toJsonStringArray:function(arg, out) {
		if(!out){this.path=[]};
		out = out || [];
		var u; // undefined
		switch (typeof arg) {
		case 'object':
			this.lastObj=arg;
			if(this.detectCirculars){
				var m=this.mem; var n=this.pathMem;
				for(var i=0;i<m.length;i++){
					if(arg===m[i]){
						out.push('"JSONcircRef:'+n[i]+'"');return out
					}
				};
				m.push(arg); n.push(this.path.join("."));
			};
			if (arg) {
				if (arg.constructor == Array) {
					out.push('[');
					for (var i = 0; i < arg.length; ++i) {
						this.path.push(i);
						if (i > 0)
							out.push(',\n');
						this.toJsonStringArray(arg[i], out);
						this.path.pop();
					}
					out.push(']');
					return out;
				} else if (typeof arg.toString != 'undefined') {
					out.push('{');
					var first = true;
					for (var i in arg) {
						if(!this.includeProtos && arg[i]===arg.constructor.prototype[i]){continue};
						this.path.push(i);
						var curr = out.length; 
						if (!first)
							out.push(this.compactOutput?',':',\n');
						this.toJsonStringArray(i, out);
						out.push(':');                    
						this.toJsonStringArray(arg[i], out);
						if (out[out.length - 1] == u)
							out.splice(curr, out.length - curr);
						else
							first = false;
						this.path.pop();
					}
					out.push('}');
					return out;
				}
				return out;
			}
			out.push('null');
			return out;
		case 'unknown':
		case 'undefined':
		case 'function':
			if(!this.includeFunctions){out.push(u);return out};
			arg="JSONincludedFunc:"+arg;
			out.push('"');
			var a=['\n','\\n','\r','\\r','"','\\"'];
			arg+=""; for(var i=0;i<6;i+=2){arg=arg.split(a[i]).join(a[i+1])};
			out.push(arg);
			out.push('"');
			return out;
		case 'string':
			if(this.restore && arg.indexOf("JSONcircRef:")==0){
				this.restoreCode.push('this.myObj.'+this.path.join(".")+"="+arg.split("JSONcircRef:").join("this.myObj."));
			};
			out.push('"');
			var a=['\n','\\n','\r','\\r','"','\\"'];
			arg+=""; for(var i=0;i<6;i+=2){arg=arg.split(a[i]).join(a[i+1])};
			out.push(arg);
			out.push('"');
			return out;
		default:
			out.push(String(arg));
			return out;
		}
	}
};


