/*
Commands: 

host-info: get host info: rom, save-state
ready: peer is ready, commence game
collect: collect input timestep
step: execute key for step - all peers step

*/
define(["js/network.js", "js/game.js",  "js/manager.js"], function(){


GameHost = function(name, color,canv){
	this.init = function(name,color,canv){
		var that = this;
		this.name = name;
		this.color = color;
		this.net = new NetNode(name);
		this.peer_info = {n:0, peers:{}};
		this.game = new Game();
		this.game.canvas(canv); 
		//this.manager = new SoloManager(this.game);
		this.manager = new DemocracyManager(this.game, this.net, this.name, this.name);
		//this.manager = new WatchManager(this.game, this.net, this.name, this.name);
		
		this.net.bind(["connect.request"],"allow_or_reject", function(p){
			p.accept = function(){
				that.net.accept_connection(p.peer);
			}
			p.reject = function(){
				that.net.reject_connection(p.peer);
			}
			that._trigger("net.peer.request", p);
		})
		this.net.bind([ "error"], "handle.error", function(p){
			that._trigger("net.error", p)
		})
		this.net.bind(["connect.ready"], "send_game", function(p){
			var pkg = {
				cmd:"init", 
				peer: that.name,
				color: that.color,
				controls:that.game.controls(),
				dimensions: that.game.dimensions(),
				manager: that.manager.pack()
			};
			that.net.send_data(p.peer, pkg);

		})
		this.net.bind(["connect.request", "connect.ready", "connect.kick", "error"], "print", function(p){
			console.log("MSG:", p);
		})

		this.net.bind(["connect.request", "connect.ready", "connect.kick", "connect.close"], "net_peer_list", function(p){
			var conns = that.net.get_connections()
			var n = 0;
			for(var k in that.peer_info.peers){
				if(!conns.hasOwnProperty(k)){
					delete that.peer_info.peers[k];
				}
				else n+=1;
			}
			that.peer_info.n = n;
			that._trigger("game.peer.list", that.peer_info);
		})
		this.net.bind_data(['upd'], "pass_manager", function(d){
			that.manager.recv(d);
		});	
		this.net.bind_data(['peer-info'], "peer_info_store", function(d){
			if(!that.peer_info.hasOwnProperty(d.name)){
				that.peer_info.n+=1; //increment count
			}
			that.peer_info.peers[d.name] = {color:d.color};
			that._trigger("game.peer.list", that.peer_info);
		});	
		//bind manager callbacks
		this.manager.bind(["update"], "game.update", function(d){
			that._trigger("game.update", d);
		})

		this.manager.bind(["tick"], "game.tick", function(d){
			that._trigger("game.tick", d);
		})

		this.callbacks = {};
		this.callbacks["net.error"] = {};
		this.callbacks["net.peer.request"] = {};
		this.callbacks["game.peer.list"] = {};
		this.callbacks["game.tick"] = {};
		this.callbacks["game.update"] = {};
	}
	this.setManager = function(name){
		this.manager = ManagerFactory.unpack(name,that.game, that.net, that.name, d.peer);
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

	this.init(name,color,canv);
}



	
})
