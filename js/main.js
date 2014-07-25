
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
	peer: null,
	 timer : {
		n: 10,
		update: function(pct){
			var limit = this.n*pct;
			for(var i=0; i < limit; i++){
				$(("#timer"+i)).show();
			}
			for(var i=limit; i < this.n; i++){
				$(("#timer"+i)).hide();
			}
		}
	},
	choice: function(title, message, cbk){
		var ctx = $("#dialog-choice").clone();

		$("#dialogs").fadeIn(200);
		$("#message", ctx).html(message);
		$("#title",ctx).html(title)

		$("#yes", ctx).click(function(){
			cbk(true);
			ctx.remove();
			var len = $("#dialogs").children().length 
			if(len == 0){
				$("#dialogs").fadeOut(200);
			}
		});
		$("#no", ctx).click(function(){
			cbk(false);
			ctx.remove();
			var len = $("#dialogs").children().length 
			if(len == 0){
				$("#dialogs").fadeOut(200);
			}
		});
		$("#dialogs").append(ctx);
		ctx.center();
	},
	confirm: function(title, message, cbk){
		var ctx = $("#dialog-confirm").clone();
		$("#dialogs").fadeIn(200);
		$("#message", ctx).html(message);
		$("#title",ctx).html(title)

		$("#ok", ctx).click(function(){
			cbk();
			ctx.remove();
			var len = $("#dialogs").children().length 
			if(len == 0){
				$("#dialogs").fadeOut(200);
			}
		});
		$("#dialogs").append(ctx);
		ctx.center();
	}
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
			var name = ctrl.map[code];
			if(name != undefined){
				var entry = ctrl.keys[name];
				var img = "#"+entry.image.on;
				globals.peer.input(name, isdown);
				if(isdown) $(img).show();
				else $(img).hide();
	  			return false;
			}
		}
		
	}
	return true;
}
function setupTimer(){
	var generateWedgeString = function(startX, startY, startAngle, endAngle, radius){
        var x1 = startX + radius * Math.cos(Math.PI * startAngle/180);
        var y1 = startY + radius * Math.sin(Math.PI * startAngle/180);
        var x2 = startX + radius * Math.cos(Math.PI * endAngle/180);
        var y2 = startY + radius * Math.sin(Math.PI * endAngle/180);

        var pathString = "M"+ startX + " " + startY + " L" + x1 + " " + y1 + " A" + radius + " " + radius + " 0 0 1 " + x2 + " " + y2 + " z";

        return pathString;

    }


    var n = globals.timer.n;
    var wdeg = 360/n;
    var pad = 1;
    var rad = 35;
    var cx = rad;
    var cy = rad;

    var config = {
		width:(rad*2)+"px",
		height:(rad*2)+"px"
	};
	$("#timer").svg({settings:config});
    var sv = $("#timer").svg('get');

    
    for(var i=0; i < n; i++){
    	var wstr = generateWedgeString(cx,cy,i*wdeg+pad, (i+1)*wdeg-pad, rad);
    	var set = {d: wstr}
    	sv.path(wstr, {fill:"white", id:("timer"+i)});
    	
    }
	
	
    sv.circle(cx,cy,rad/2, {fill:"grey", stroke:"grey"});
}

function setupMain(){
	
	$("#main").layout({resize:false});
	$(".scramble-centered").center();

	$("#game,#controls-container").keydown( function(e) {
	  return handleInput(e,true);
	});
	$("#game,#controls-container").keyup( function(e) {
	  return handleInput(e,false);
	});
	
	$("#dialogs").hide();
	var config = {
		preserveAspectRatio:"xMinYMin meet",
		width:"100%", 
		height:"100%"
	};
	$("#controls").svg({settings:config})

	setupTimer();
}


function setupWizard(){
	function error(s){
		alert(s)
	}

   globals.info = {
   		name: null,
   		color: null,
   		rom: null,
   		host:null,
   		is_host: false,
   		rom_loaded: false,
   		rom_blob: null,
   		save: null,
   		save_loaded: false,
   		save_blob: null,
   		manager: null,
   		onerror: function(){

   		}

   };
   globals.info.fadein = 400;
   globals.info.ready1 = function(){
   		return (globals.info.name != null && globals.info.color != null && globals.info.name != "");
   }
   globals.info.ready2 = function(){
   		h = ((globals.info.rom != null && globals.info.rom_loaded) && 
   			(globals.info.no_save || (globals.info.save != null && globals.info.save_loaded)));
   		c = (globals.info.host != null && globals.info.host != "")
   		return (globals.info.is_host && h) || (!globals.info.is_host && c)
   }
   globals.info.ready3h = function(){
   		return (globals.info.manager != null && globals.info.manager != "");
   }
   globals.info.stage2 = function(){
   	if(globals.info.ready1()){
		$("#game-mode-div", $("#setup")).fadeIn(globals.info.fadein);
		var v = $("#game-mode").val();
		if(v == "host"){
			globals.info.is_host = true;
			$("#client", $("#setup")).fadeOut(globals.info.fadein*2, function(){
				$("#host", $("#setup")).fadeIn(globals.info.fadein*2);
			});
			
		}
		else{
			globals.info.is_host = false;
			$("#host", $("#setup")).fadeOut(globals.info.fadein*2, function(){
				$("#client", $("#setup")).fadeIn(globals.info.fadein*2);
			});
		}
	}
	else{
		$("#client, #host, #game-mode-div", $("#setup")).fadeOut(globals.info.fadein);
	}
   }
   globals.info.stage3h = function(){
   		if(globals.info.ready2()){
   			var canv = $("#screen", $("#main"))[0];
   			//attempt to create the game
   			if(globals.peer != null){
   				globals.peer.close();	
			}
			globals.peer = new GameHost(globals.info.name,globals.info.color,canv);
			globals.peer.create(globals.info.rom_blob, globals.info.save_blob);
			globals.peer.bind(["net.peer.request"], "net.peer.request.dialog", function(d){
				globals.peer.stop();
				globals.choice("Connection Request", "Peer "+d.peer+" wants to connect. Allow?", function(y){
					if(y)
						d.accept();
					else
						d.reject();
					globals.peer.start();
				});
			})
			globals.peer.bind(["game.tick"], "update.wedge", function(d){
				var frac = d.i/d.n;
				globals.timer.update(frac);
			})
			globals.peer.bind(["game.peer.list"], "update.setup.list", function(plist){
				$("#peerlist").empty();
				for(var name in plist.peers){
					ctx = $("#dummy-peer-entry").clone();
					$("#name", ctx).html(name);
					$("#color", ctx).css("background-color", "green")
					$("#peerlist").append(ctx);
				}
			})
			globals.peer.bind(["game.update"], "update.past.keys", function(d){
				var ctrls= globals.peer.controls();
				if(ctrls != null){
					if(d.hasOwnProperty("keys")){
						var k = d.keys;
						if(k.length > 0) console.log(d);
						for(var i=0; i < k.length; i++){
							var ky = k[i];
							if(ctrls.keys.hasOwnProperty(ky.code)){
								if(ky.down) $("#"+ctrls.keys[ky.code].image.out).show();
								else $("#"+ctrls.keys[ky.code].image.out).hide();
							}
						}
					}
				}
			})
			//initialize controls
			var ctrls= globals.peer.controls();
			$("#controls").svg('get').load(ctrls.svg, {
				onLoad:function(){
					var bbox = $("g")[0].getBBox();
					var bboxstr = bbox.x + "," + bbox.y + "," + bbox.width + "," + bbox.height;
					$("#controls").svg('get').configure($('#controls').svg('get').root(), {viewBox:bboxstr});
					for(k in ctrls.keys){
						var ky = ctrls.keys[k];
						$("#"+ky.image.on).hide();
						$("#"+ky.image.out).hide();
					}
				}
			});

   			$(".scramble-stage3").fadeIn(globals.info.fadeIn);
   		}
   		else {
   			$(".scramble-stage3").fadeOut(globals.info.fadeIn);
   		}
   }
   globals.info.stage5c = function(){
   			console.log("FINAL STAGE ");
   			$(".scramble-stage1, .scramble-stage2, .scramble-stage3, .scramble-stage4").fadeOut(globals.info.fadein, function(){
   				$("#screen").center();
   			});
   }
   globals.info.stage4c = function(){
   		if(globals.info.connected){
   			console.log("CONNECTED");
   			$("#progressbar").progressbar("option", {value:100})
   			$("#progressbar").find( ".ui-progressbar-value" ).css({
	          "background": 'green'
	        });
	        $("#status", $("#progressbar")).html("Connected!");
	        globals.info.stage5c();
   		}
   }
   globals.info.stage3c = function(){
   		if(globals.info.ready2()){
   			var canv = $("#screen", $("#main"))[0];
   			if(globals.peer != null){
   				globals.peer.close();
   			}
   			globals.info.onerror = function(){
				globals.info.host = null;
				globals.info.stage3c();
			}
	   		globals.peer = new GamePeer(globals.info.name,globals.info.color,canv);
	   		globals.peer.bind(["net.host.status"], "net.host.page", function(pstat){
				if(pstat.status == "accept"){
					//make progress bar ready
					globals.info.connected = true;
					globals.info.stage4c();
				}
				else {
					globals.confirm("Host Rejection", "You were rejected by peer "+globals.info.host, function(){
						globals.info.host = null;
						globals.info.stage3c();
					});
					
				}
			})
			globals.peer.bind(["net.error"], "net.error.dialog", function(e){
				var msg = e.message;
				globals.confirm("Network Error", msg, function(){globals.info.onerror()})
				globals.info.onerror();
			})

			//initialize controls
			globals.peer.bind(["game.init"], "game.init.ui", function(){
				var ctrls= globals.peer.controls();
				$("#controls").svg('get').load(ctrls.svg, {
					onLoad:function(){
						var bbox = $("g")[0].getBBox();
						var bboxstr = bbox.x + "," + bbox.y + "," + bbox.width + "," + bbox.height;
						$("#controls").svg('get').configure($('#controls').svg('get').root(), {viewBox:bboxstr});
						for(k in ctrls.keys){
							var ky = ctrls.keys[k];
							$("#"+ky.image.on +",#"+ky.image.out).hide();
						}
					}
				});
				
				$(".scramble-centered").center();
			})
			globals.peer.bind(["game.tick"], "update.wedge", function(d){
				var frac = d.i/d.n;
				globals.timer.update(frac);
			})
			globals.peer.bind(["game.update"], "update.past.keys", function(d){
				var ctrls= globals.peer.controls();
				if(ctrls != null){
					if(d.hasOwnProperty("keys")){
						var k = d.keys;
						if(k.length > 0) console.log(d);
						for(var i=0; i < k.length; i++){
							var ky = k[i];
							if(ctrls.keys.hasOwnProperty(ky.code)){
								if(ky.down) $("#"+ctrls.keys[ky.code].image.out).show();
								else $("#"+ctrls.keys[ky.code].image.out).hide();
							}
						}
					}
				}
			})
			globals.peer.bind(["net.peer.ready"], "start.join", function(){
				globals.peer.join(globals.info.host);
			})
			//display stuff
	   		$("#host", $("#setup-page2")).hide();

	   		$(".scramble-stage4").fadeIn(globals.info.fadeIn, function(){
				
	   		});
	   		$(".scramble-stage3, .scramble-stage1, .scramble-stage2").fadeOut(globals.info.fadein)
   		}
   		else {
   			$(".scramble-stage3, .scramble-stage1, .scramble-stage2").fadeIn(globals.info.fadein)
   			$("#host", $("#setup")).hide();
   			$(".scramble-stage4").fadeOut(globals.info.fadeIn);
   		}
   }
   globals.info.stage5h = function(){
   			console.log("FINAL STAGE ");
   			$(".scramble-stage1, .scramble-stage2, .scramble-stage3, .scramble-stage4").fadeOut(globals.info.fadein, function(){
   				globals.peer.start();	
   				$("#screen").center();
   			});
   			
   }
   globals.info.stage4h = function(){
   		if(globals.info.ready3h()){
   			globals.peer.setManager(globals.info.manager);
   			$("#client", $("#setup-page2")).hide();
   			$(".scramble-stage3, .scramble-stage1, .scramble-stage2").fadeOut(globals.info.fadein)
   			$(".scramble-stage4, .scramble-stage5").fadeIn(globals.info.fadein);
   		}
   		else{
   			$(".scramble-stage3, .scramble-stage1, .scramble-stage2").fadeIn(globals.info.fadein)
   			$(".scramble-stage4").fadeOut(globals.info.fadeIn);
   		}
   }
   //update first pass
   $("#color-chooser").farbtastic(function(col){
   		console.log("changed color!", col);
   		$(".scramble-game-color").css("background-color", col);
   		globals.info.color = col;
   		globals.info.stage2();
   });

   $("#peer-name").keypress(function(e){
   		var v = $(this).val();
   		globals.info.name = v;
   		globals.info.stage2();
   })
   $("#peer-name").change(function(e){
   		var v = $(this).val();
   		globals.info.name = v;
   		globals.info.stage2();
   })

   $( "#game-styles" ).tabs({event:"mouseover"})
   $("#solo").click(function(){
   		globals.info.manager = "WatchManager"; 
   		globals.info.stage4h();
   	});
   $("#democracy").click(function(){
   		globals.info.manager = "DemocracyManager"; 
   		globals.info.stage4h();
   	});
   $("#anarchy").click(function(){
   		globals.info.manager = "AnarchyManager"; 
   		globals.info.stage4h();
   	});
   $("#liberty").click(function(){
   		globals.info.manager = "ScatterManager"; 
   		globals.info.stage4h();
   	});
   $("#communism").click(function(){
   		globals.info.manager = "CarouselManager"; 
   		globals.info.stage4h();
   	});

   $( "#game-styles" ).addClass( "ui-tabs-vertical ui-helper-clearfix scramble-rounded" );
    $( "#game-styles li" ).removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );
  
    $( ".ui-list" ).selectable();

    $( "#progressbar" ).progressbar({
      value: false
    }).css('width', "300px");

    //hide stuff.
   $("#host, #client, #game-mode", $("#setup")).hide();
   $("#client", $("#setup")).hide();
   $("#game-mode-div", $("#setup")).hide();
   $(".setup-stage2, .scramble-stage3, .scramble-stage4, .scramble-stage5").hide();


   $("#game-mode").toggleSwitch({
	  highlight: true, // default
	  width: 50, // default
	  change: function(evt, e) {
	    // default null
	    globals.info.stage2();
	  }
	})

   $("#host-name").change(function(e){
   		var v = $(this).val();
   		globals.info.host = v;
   		globals.info.stage3c();
   })

   $("#rom").change(function(e){
   		var path = $(this).val();
   		var rom = $("#rom", $("#setup"))[0].files;
   		globals.info.rom = path;

   		FileUtils.read([rom[0]], function(d){
   			if(d.length > 0){
				var rom = d[0]; 
				globals.info.rom_loaded = true;
				globals.info.rom_blob = rom;
				globals.info.stage3h();
			}
		})
   })
   $("#savest").change(function(e){
   		var path = $(this).val();
   		var sav = $("#save", $("#setup"))[0].files;
   		globals.info.save = path;

   		FileUtils.read([sav[0]], function(d){
   			if(d.length > 0){
				var save = d[0]; 
				globals.info.save_loaded = true;
				globals.info.save_blob = save;
				globals.info.stage3h();
			}
		})
   })
   $("#no-save").change(function(e){
   		var v = $(this).val();
   		if(v == "on"){
   			globals.info.no_save = true;
   		}
   		else{
   			globals.info.no_save = false;
   		}
   		globals.info.stage3h();
   })
   $("#start-game").click(function(){
   		globals.info.stage5h();
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
		$(".scramble-centered").center();
	})
})()


})
