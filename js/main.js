
require.config({
    wrap: true
  });
require(
	[
	"lib/loader.jquery.libs.js",
	"lib/requirejs/domready.js",
	"js/file.js",
	"js/network.js",
	"js/peer.js",
	"js/host.js"], function(){

globals = {
	peer: null
}

function handleInput(e, isdown){
	var keymap = {
		37: "left",
		38: "up",
		39: "right",
		40: "down"
	}
	var code = String.fromCharCode(e.which).toLowerCase();
	if(keymap.hasOwnProperty(e.which))
		code = keymap[e.which];

	if(globals.peer != null){
		var ctrl = globals.peer.controls();
		if(ctrl != null){
			var entry = ctrl.map(code);
			if(entry != null){
				console.log(entry);
				var img = "#"+entry.image.on;
				globals.peer.input(code, isdown);
				if(isdown) $(img).show();
				else $(img).hide();
	  			return false;
			}
		}
		
	}
	return true;
}
function setupMain(){
	
	$("#main").layout({resize:false});
	$(".centered").center();

	$("#game,#controls-container").keydown( function(e) {
	  return handleInput(e,true);
	});
	$("#game,#controls-container").keyup( function(e) {
	  return handleInput(e,false);
	});
	
	
	var config = {
		preserveAspectRatio:"xMinYMin meet",
		width:"100%", 
		height:"100%"
	};
	$("#controls").svg({settings:config})

}

function createHost(name){
	var canv = $("#screen", $("#main"))[0];
	var rom = $("#rom", $("#setup"))[0].files;
	var sav = $("#save", $("#setup"))[0].files;

	if(rom.length == 0){
		error("please specify a game to play");
		return;
	}
	if(globals.peer == null)
		globals.peer = new GameHost(name,canv);

	if(sav.length > 0)
		FileUtils.read([rom[0], sav[0]], function(d){
			var rom = d[0]; var sav = d[1];
			globals.peer.create(rom, sav);
			var ctrls= globals.peer.controls();
			$("#controls").svg('get').load(ctrls.svg, {
				onLoad:function(){
					var bbox = $("g")[0].getBBox();
					var bboxstr = bbox.x + "," + bbox.y + "," + bbox.width + "," + bbox.height;
					$("#controls").svg('get').configure($('#controls').svg('get').root(), {viewBox:bboxstr});
				}
			});
			$(".centered").center();
		})
	else
		FileUtils.read([rom[0]], function(d){
			var rom = d[0];
			globals.peer.create(rom, null);
			var ctrls= globals.peer.controls();
			$("#controls").svg('get').load(LOCAL(ctrls.svg), {
				onLoad:function(){
					var bbox = $("g")[0].getBBox();
					var bboxstr = bbox.x + "," + bbox.y + "," + bbox.width + "," + bbox.height;
					$("#controls").svg('get').configure($('#controls').svg('get').root(), {viewBox:bboxstr});
				}
			});
			$(".centered").center();
		})

	globals.peer.bind(["update.peer.list"], "update.ui", function(plist){
		var tbl = $("#host-list");
		tbl.empty();
		console.log("UPDATE",plist);
		var header = $("<tr/>").append($("<td/>").html("Name")).append($("<td/>").html("Status")); 
		tbl.append(header);
		for(var peer in plist){
			if(peer != "EVENT"){
				var row = $("<tr/>").append($("<td/>").html(peer)).append($("<td/>").html(plist[peer].status)); 
				tbl.append(row);
			}

		}
	})
	
	$("#setup").fadeOut(200);
	
}
function createPeer(name){
	var canv = $("#screen", $("#main"))[0];
	var host = $("#host-name", $("#setup")).val();
	if(host == ""){
		error("please specify a host name.");
		return;
	}
	if(globals.peer == null){
		globals.peer = new GamePeer(name,canv);
	}

	globals.peer.join(host);

	globals.peer.bind(["update.host.status"], "update.host.page", function(pstat){
		if(pstat.status == "accept"){
			alert("Connection Successful: connected to "+pstat.peer);
			
		}
		else {
			alert("Rejected by host: "+pstat.peer);
			$("#setup").fadeIn(200);
		}
	})
	globals.peer.bind(["game.init"], "game.init.ui", function(){
		var ctrls= globals.peer.controls();
		$("#controls").svg('get').load(ctrls.svg, {
			onLoad:function(){
				var bbox = $("g")[0].getBBox();
				var bboxstr = bbox.x + "," + bbox.y + "," + bbox.width + "," + bbox.height;
				$("#controls").svg('get').configure($('#controls').svg('get').root(), {viewBox:bboxstr});
			}
		});
		$(".centered").center();
	})

	$("#setup").fadeOut(200);
	$(".centered").center();
}

function setupWizard(){
	function error(s){
		alert(s)
	}

   $("#host", $("#setup")).hide();

	$('input[name="game-type"]:radio').change(function(v){
		console.log("changed",this.value);
		if(this.value == "make"){
			$("#client", $("#setup")).fadeOut(200, function(){
				$("#host", $("#setup")).fadeIn(200);
			});
			
		}
		else{
			$("#host", $("#setup")).fadeOut(200, function(){
				$("#client", $("#setup")).fadeIn(200);
			});
			
		}
	});

	$("#ok", $("#setup")).click(function(){
		var name = $("#peer-name", $("#setup")).val();
		var type = $('input[name="game-type"]:checked').val();
		if(name == ""){
			error("please specify a peer name.");
			return;
		}
		if(type == "make"){
			createHost(name);
		}
		else if(type == "join"){
			createPeer(name);
		}
	})

}

(function(){
	JQ_LIB_LOADED(function(){
		jQuery.fn.center = function () {
		    this.parent().css("position","absolute");
		    var t = this.parent().css("top");
		    var l = this.parent().css("left");
		    
		    this.css("position","absolute");
		    this.css("top", ((this.parent().height() - this.outerHeight()) / 2) + this.parent().scrollTop() + "px");
		    this.css("left", ((this.parent().width() - this.outerWidth()) / 2) + this.parent().scrollLeft() + "px");
		    return this;
		}

		setupMain();
		setupWizard();
	})
})()


})
