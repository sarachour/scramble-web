/*
TODO: key, steps, queue. play is a continuous loop that waits for more work.

*/
require(["js/game.js"], function(){
	ManagerFactory = {
		unpack: function(pkg,game,net,name, host){
			if(pkg.type == "SoloManager"){
				return new SoloManager(game);
			}
			else if(pkg.type == "DemocracyManager"){
				return new DemocracyManager(game, net,name, host)
			}
			else if(pkg.type == "WatchManager"){
				return new WatchManager(game, net,name, host)
			}
		}
	}
	PlayLoop = function(game){
		this.init = function(game){
			this.queue = [];
			this.n = 0;
			this.time_chunk = 17; //number of milliseconds to wait before stepping.
			this.input_chunk = 1; //number of time units per input.
			this.step_chunk = 1; //smallest unit, amount you step per time unit
			this._interval= null;
			this.game = game;
			this.i = this.input_chunk-1;
			this.pause = false;
			this._up_keys = [];

			this.idx = 0;
			this.callbacks = {};
			this.callbacks['tick'] = {};
			this.callbacks['update'] = {};

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
		this.input = function(keys){
			if(keys.length == 0) this.queue.push([]);
			else{
				for(var i=0; i < keys.length; i++){
					this.queue.push([keys[i]]);
				}
			}
			
		}
		this.getFrameBuffer = function(){
			return this.game.screen();
		}
		this.stop = function(){
			this.pause = true;
		}
		this.run = function(){
			//run the game loop
			var that = this;
			this.CALLBACK = function(){
				if(that.queue.length > 0 && that.pause == false){
					var e = that.queue.shift(); //take move
					this.n++;
					for(var i=0; i < e.length; i++){
						that.game.input(e[i].code,e[i].down);
					}
					that.game.step(that.step_chunk);
				//console.log("run",that.idx, diff);
				}
				if(that.i == that.input_chunk-1){
					that._trigger('update', {});
				}
				that.i = (that.i + 1)%that.input_chunk;
		  		that._interval = setTimeout(function(){that.CALLBACK();}, that.time_chunk)
			}
			if(this._interval == null){
				this._interval = setTimeout(this.CALLBACK, this.time_chunk);
			}
			this.pause = false;
		}
		this.init(game);
	}
	Manager = function(game){
		this.init = function(game){
			this.game = new PlayLoop(game);
			this.callbacks = {};
			this.callbacks['tick'] = {};
			this.callbacks['update'] = {};
		}
		this.pack = function(type){
			return {
				type: type
			}
		}
		this.start = function(){
			this.game.run();
		}
		this.stop = function(){
			this.game.stop();
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
		this.init(game);
	}
	DemocracyManager = function(game, net, name, host){
		this.init = function(game, net, name, host){
			this.__proto__.init(game);
			var that = this;
			this.net = net;
			this.host = host;
			this.name = name;
			this.key = [];
			this.paused = false;
			this.is_host = (name == host);
			if(this.is_host){
				this.game.bind(['tick'], "update.tick", function(t){
					that._trigger('tick', t);
				});
				this.game.bind(['update'], "update.upd", function(u){
					that.update();
					u.keys = that.key;
					that._trigger('update',u);
				})
			}
			this.consensus = {};
		}
		this.start = function(){
			this.__proto__.start();
			this.paused = false;
		}
		this.stop = function(){
			this.paused = true;
		}
		this.update = function(){
			if(!this.paused) {
				this._consensus();
			}
		}
		this.pack = function(){
			return this.__proto__.pack("DemocracyManager");
		}
		this.recv = function(d){
			if(d.scmd == "c")
				this._consensus(d);
			else if(d.scmd == "k")
				this._key(d);
			else if(d.scmd == "s")
				this._sync(d)
		}
		this._consensus = function(k){
			if(this.is_host){
				var codes = {}; 
				var npeers = Math.floor(this.net.get_n_connections()/2);
				for(var p in this.consensus){
					var k = this.consensus[p];
					var tag = k.code+"."+k.down; //down and code
					if(!codes.hasOwnProperty(tag)){
						codes[tag] = {cnt:0, data:k};
					}
					codes[tag].cnt++;
				}
				this.key = [];
				for(var p in codes){
					if(codes[p].cnt >= npeers){
						this.key.push(codes[p].data);
					}
				}
				var d = {cmd:"upd", scmd:"c", key:this.key};
				this.net.broadcast_data(d);
				this.consensus = {};
				/*
				if(this.key.length == 0) this.game.input([]);
				for(var i=0; i < this.key.length; i++){
					this.game.input([this.key[i]]);
				}
				*/
				this.game.input(this.key)

			}
			else {
				this.key = k.key;
				/*
				if(this.key.length == 0) this.game.input([]);
				for(var i=0; i < this.key.length; i++){
					this.game.input([this.key[i]]);
				}
				*/
				this.game.input(this.key)
				this._trigger('update',{keys:this.key});
			}
			
			//console.log("idx", this.key);
			
		}
		this._key = function(k){
			if(!this.is_host){
				this.net.send_data(this.host, {
					cmd: "upd",
					scmd: "k",
					code: k.code,
					down: k.down,
					peer: this.name
				})
			}
			else{
				var code = k.code;
				this.consensus[k.peer] = {code:k.code, down:k.down};
			}
		}
		this.input = function(code, isdown){
			this._key({code:code, down:isdown, peer:this.name});
		}
		this.init(game, net, name, host);
	}
	DemocracyManager.prototype = new Manager();
	
	WatchManager = function(game, net, name, host) {
		this.init = function(game, net, name, host){
			var that = this;
			
			this.net = net;
			this.host = host;
			this.name = name;
			this.is_host = (name == host);
			this.keys = [];
			
			this.paused = false;
			if(this.is_host){
				this.__proto__.init(game);
				this.game.bind(['tick'], "update.tick", function(t){
					that._trigger('tick', t);
				});
				this.game.bind(['update'], "update.upd", function(u){
					u.keys = that.keys;
					that.update();
					that._trigger('update',u);
				})
			}
			else {
				this.game = game;
			}
			
		}
		this.recv = function(d){
			console.log("RECV", d);
			this.game.show(d.fb);
			this._trigger('update',{keys:d.keys});
		}
		this.start = function(){
			this.__proto__.start();
			this.paused = false;
		}
		this.stop = function(){
			//this.__proto__.stop();
			this.paused = true;
		}
		this.pack = function(){
			return this.__proto__.pack("WatchManager");
		}
		this.input = function(code, isdown){
			if(this.is_host && !this.paused) 
				this.keys.push({code:code, down:isdown});
		}
		this.update = function(){
			if(this.is_host && !this.paused){
				this.game.input(this.keys);
				this.net.broadcast_data({cmd:"upd", keys: this.keys, fb: this.game.getFrameBuffer()});
				this.keys = []; // input update
			}
		}
		this.init(game, net, name, host);
	}
	WatchManager.prototype = new Manager();
	//Scheme: 
	RoundRobinManager = function(host, plist, game){

	}
	AnarchyManager = function(host, plist, game){

	}
	
	ScatterManager = function(host, plist, game){

	}
	//Scheme: 
	RoundRobinManager = function(host, plist, game){

	}
	AnarchyManager = function(host, plist, game){

	}
	
	ScatterManager = function(host, plist, game){

	}
})
