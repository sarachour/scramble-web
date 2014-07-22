/*
Commands: 

host-info: get host info: rom, save-state
ready: peer is ready, commence game
collect: collect input timestep
step: execute key for step - all peers step

*/
define(["js/network.js", "js/game.js",  "js/manager.js"], function(){


GameHost = function(name,canv){
	this.init = function(name,canv){
		var that = this;
		this.name = name;
		this.net = new NetNode(name);
		this.game = new Game();
		this.game.canvas(canv); 
		//this.manager = new SoloManager(this.game);
		//this.manager = new DemocracyManager(this.game, this.net, this.name, this.name);
		this.manager = new WatchManager(this.game, this.net, this.name, this.name);
		
		this.net.bind(["connect.request"],"allow_or_reject", function(p){
			var result = window.confirm("Allow "+p.peer+" to connect?");
			if(result == true) that.net.accept_connection(p.peer);
			else that.net.reject_connection(p.peer);
		})
		this.net.bind(["connect.ready"], "send_game", function(p){
			var pkg = {
				cmd:"init", 
				peer: that.name,
				game:that.game.pack('create'),
				manager: that.manager.pack()
			};
			console.log("Sending Game");
			that.net.send_data(p.peer, pkg);

		})
		this.net.bind(["connect.request", "connect.ready", "connect.kick", "error"], "print", function(p){
			console.log("MSG:", p);
		})

		this.net.bind(["connect.request", "connect.ready", "connect.kick", "connect.close"], "update_peer_list", function(p){
			that._trigger("update.peer.list", that.net.get_connections());
		})
		this.net.bind_data(['upd'], "pass_manager", function(d){
			console.log("MGR", d);
			that.manager.recv(d);
		});	
		//bind manager callbacks
		this.manager.bind(["update"], "game.update", function(d){
			that._trigger("game.update", d);
		})

		this.manager.bind(["tick"], "game.tick", function(d){
			that._trigger("game.tick", d);
		})

		this.callbacks = {};
		this.callbacks["update.peer.list"] = {};
		this.callbacks["game.tick"] = {};
		this.callbacks["game.update"] = {};
	}
	this.controls = function(){
		return this.game.controls();
	}
	this.bind = function(evts, name, cbk){
		for(var i=0; i < evts.length; i++){
			this.callbacks[evts[i]][name] = cbk;
		}
	}
	this.unbind = function(evts, name){
		for(var i=0; i < evts.length; i++){
			delete this.callbacks[evts[i]][name];
		}
	}
	this._trigger = function(evt, args){
		args.EVENT = evt;
		for(var n in this.callbacks[evt]){
			this.callbacks[evt][n](args);
		}
	}
	this.input = function(code, down){
		console.log("entering into manager.");
		this.manager.input(code, down);
	}
	this.create = function(romdata, savdata){
		var that = this;
		this.game.create(romdata, savdata);
		//handle peer connections
		
		
	}
	this.start = function(){
		this.manager.start();
	}
	this.stop = function(){
		this.manager.stop();
	}

	this.init(name,canv);
}



	
})
