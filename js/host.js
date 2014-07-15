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
		this.manager = new SoloManager(this.name, [], this.game);

		this.net.bind(["connect.request"],"allow_or_reject", function(p){
			var result = window.confirm("Allow "+p.peer+" to connect?");
			if(result == true) that.net.accept_connection(p.peer);
			else that.net.reject_connection(p.peer);
		})
		this.net.bind(["connect.ready"], "send_game", function(p){
			var pkg = {
				cmd:"init", 
				game:that.game.pack('create')
			};
			that.net.send_data(p.peer, pkg);
		})
		this.net.bind(["connect.request", "connect.ready", "connect.kick", "error"], "print", function(p){
			console.log("MSG:", p);
		})
		this.net.bind(["connect.request", "connect.ready", "connect.kick", "connect.close"], "update_peer_list", function(p){
			that._trigger(["update.peer.list"], that.net.get_connections());
		})

		this.callbacks = {};
		this.callbacks["update.peer.list"] = {};
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
	}
	this.create = function(romdata, savdata){
		var that = this;
		this.game.create(romdata, savdata);
		//handle peer connections
		
		
	}
	this.kick = function(name){
		if(this.peer.connections.hasOwnProperty(name)){
			var conns = this.peer.connections[name];
			for(var i=0; i < conns.length; i++){
				conns[i].close();
			}
		}

	}

	this.init(name,canv);
}



	
})
