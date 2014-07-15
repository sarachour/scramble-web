/*
Commands: 

host-info: get host info: rom, save-state
ready: peer is ready, commence game
collect: collect input timestep
step: execute key for step - all peers step

*/
require(["js/network.js", "js/game.js"], function(){
GamePeer = function(name, canv){
	this.init = function(name,canv){
		var that = this;
		this.name = name;
		this.game = new Game();
		this.game.canvas(canv);
		this.net = new NetNode(name);
		this.net.bind(["connect.accept","connect.reject", "error"], "print", function(p){
			console.log("MSG:", p);
		})
		this.net.bind(["connect.accept", "connect.reject", "connect.close"], "update.host.status", function(p){
			that._trigger(["update.host.status"],  p);
		})
		this.net.bind_data(['init'], "init_game", function(d){
			that.game.unpack(d.game);
			that._trigger(["game.init"],  d);
		});
		this.callbacks = {};
		this.callbacks["update.host.status"] = {};
		this.callbacks["game.init"] = {};
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
		console.log("sending to host..");
	}
	this.join = function(host){
		this.net.request_connection(host);
	}

	this.init(name,canv);
}
})
