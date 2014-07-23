/*
Commands: 

host-info: get host info: rom, save-state
ready: peer is ready, commence game
collect: collect input timestep
step: execute key for step - all peers step

*/
require(["js/network.js", "js/game.js"], function(){
GamePeer = function(name, color, canv){
	this.init = function(name,color,canv){
		var that = this;
		this.name = name;
		that.color = color;
		this.net = new NetNode(name);
		this.game = new SkinnyGame(canv);
		this.net.bind(["ready"], "net.peer.ready", function(p){
			that._trigger("net.peer.ready",  p);
		})
		this.net.bind([ "error"], "handle.error", function(p){
			that._trigger("net.error", p)
		})
		//on any outcome, we update the status
		this.net.bind(["connect.accept", "connect.reject", "connect.close"], "net.host.status", function(p){
			that._trigger(["net.host.status"],  p);
		})
		//if this connection has been accepted, respond
		this.net.bind(["connect.accept"], "net.host.send.peerinfo", function(p){
			that.net.send_data(that.host, {
				cmd:"peer-info",
				name: that.name,
				color: that.color
			});
		})
		this.net.bind_data(['init'], "init_game", function(d){
			that.game.setDimensions(d.dimensions);
			that.game.setControls(d.controls);
			that.manager = ManagerFactory.unpack(d.manager,that.game, that.net, that.name, d.peer);
			that.manager.start();
			//bind manager callbacks
			that.manager.bind(["update"], "game.update", function(d){
				that._trigger("game.update", d);
			})

			that.manager.bind(["tick"], "game.tick", function(d){
				that._trigger("game.tick", d);
			})
			that._trigger(["game.init"],  d);
		});
		this.net.bind_data(['upd'], "pass_manager", function(d){
			if(that.hasOwnProperty('manager'))
				that.manager.recv(d);
		});
		this.callbacks = {};
		this.callbacks["net.host.status"] = {};
		this.callbacks["net.peer.ready"] = {};
		this.callbacks["game.init"] = {};
		this.callbacks["game.tick"] = {};
		this.callbacks["game.update"] = {};
		this.callbacks["net.error"] = {};
	}
	this.close = function(){
		this.net.close();
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
	this.stop = function(){
		if(this.hasOwnProperty("manager"))
			this.manager.stop();
	}
	this.start = function(){
		if(this.hasOwnProperty("manager"))
			this.manager.start();
	}
	this.input = function(code, down){
		if(this.hasOwnProperty("manager"))
			this.manager.input(code, down);
	}
	this.join = function(host){
		this.host = host;
		this.net.request_connection(host);
	}

	this.init(name,color,canv);
}
})
