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
			this.time_chunk = 16.75; //number of milliseconds to wait before stepping.
			this.input_chunk = 4; //number of time units per input.
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

		this.clear = function(){
			this.queue = [];
		}
		this.delay = function(){
			var padding = this.time_chunk*0.1;
			return this.time_chunk*this.input_chunk+padding;
		}
		this.input = function(keys){
			this.queue.push(keys);
		}
		this.stop = function(){
			this.pause = true;
		}
		this.run = function(){
			//run the game loop
			var that = this;
			this.CALLBACK = function(){
				if(that.i == that.input_chunk-1){
			      if(that.queue.length > 0 && that.pause == false && that.game.ready()){
			      	var e = that.queue.shift(); //take move
			      	this.n++;
			      	that._up_keys = [];
			      	for(var i=0; i < e.length; i++){
			      		var c= e[i].code;
			      		if(e[i].down) that.game.input(c,true);
			      		else that._up_keys.push(c);
			      	}
			      	that.game.step(that.step_chunk);
			      	console.log("INPUT:",that.idx);
		  	  		that.idx+=1;
			      	that.i = (that.i + 1)%that.input_chunk;
			      }
		  	  }
		  	  else{
		  	  	if(Math.floor(that.input_chunk/2) == that.i ){
		  	  		for(var i=0; i < that._up_keys.length; i++){
		  	  			var c = that._up_keys[i];
		  	  			that.game.input(c,false);
		  	  		}
		  	  	}
		  	  	that.game.step(that.step_chunk);
		  	  	that.i = (that.i + 1)%that.input_chunk;
		  	  }

		  	  that._interval = setTimeout(function(){that.CALLBACK();}, that.time_chunk)
			}
			if(this._interval == null){
				this._interval = setTimeout(this.CALLBACK, this.time_chunk);
			}
			this.pause = false;
		}
		this.init(game);
	}
	InputLoop = function(n, nticks){
		this.init = function(n, nticks){
			this._interval = null;
			this.n_ticks = nticks;
			this.n = n;
			this.i = 0;
			this.callbacks = {};
			this.callbacks['tick'] = {};
			this.callbacks['update'] = {};
			this.pause = false;
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
			this.pause = true;
		}
		this.run = function(){
			var that = this;
			this.CALLBACK = function() {
				if(that.pause){
					that._interval = null;
					return;
				}
				that._trigger('tick', {i:that.i, n:that.n_ticks});
				if(that.i == that.n_ticks-1){
					that._trigger('update', {});
				}
				that.i = (that.i + 1)%that.n_ticks;
			  	that._interval = setTimeout(that.CALLBACK, that.n/that.n_ticks);
			}
			if(this._interval == null){
				this._interval = setTimeout(this.CALLBACK,this.n/this.n_ticks);
			}
			this.pause = false;
		}
		this.init(n, nticks);
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
			this.is_host = (name == host);
			if(this.is_host){
				this.input_loop = new InputLoop(this.game.delay(), 10);
					this.input_loop.bind(['tick'], "update.tick", function(t){
					that._trigger('tick', t);
				});
				this.input_loop.bind(['update'], "update.upd", function(u){
					that.update();
					u.keys = that.key;
					that._trigger('update',u);
				})
			}
			this.consensus = {};
		}
		this.start = function(){
			//this.__proto__.start();
			if(this.is_host) this.input_loop.run();
		}
		this.stop = function(){
			this.__proto__.stop();
			if(this.is_host) this.input_loop.stop();
		}
		this.update = function(){
			if(this.is_host) this._consensus();
			
		}
		this.pack = function(){
			return this.__proto__.pack("DemocracyManager");
		}
		this.recv = function(d){
			if(d.scmd == "c")
				this._consensus(d);
			else if(d.scmd == "k")
				this._key(d);
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
				this.game.input(this.key);

			}
			else {
				this.key = k.key;
				this.game.input(this.key);
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
			this.__proto__.init(game);
			this.net = net;
			this.host = host;
			this.name = name;
			this.is_host = (name == host);
			this.keys = [];
			
			this.input_loop = new InputLoop(this.game.delay(), 10);
	
			this.input_loop.bind(['tick'], "update.tick", function(t){
				that._trigger('tick', t);
			});
			this.input_loop.bind(['update'], "update.upd", function(u){
				u.keys = that.keys;
				that.update();
				that._trigger('update',u);
			})
			
		}
		this.recv = function(d){
			this.game.input(d.keys);
		}
		this.start = function(){
			this.__proto__.start();
			if(this.is_host) this.input_loop.run();
		}
		this.stop = function(){
			//this.__proto__.stop();
			if(this.is_host) this.input_loop.stop();
		}
		this.pack = function(){
			return this.__proto__.pack("WatchManager");
		}
		this.input = function(code, isdown){
			if(this.is_host) this.keys.push({code:code, down:isdown});
		}
		this.update = function(){
			if(this.is_host){
				this.game.input(this.keys);
				this.net.broadcast_data({cmd:"upd", keys: this.keys});
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
	WatchManager.prototype = new Manager();
	//play a solo game
	SoloManager = function(game) {
		this.init = function(game){
			var that = this;
			this.__proto__.init(game);
			this.keys = [];
			this.input_loop = new InputLoop(this.game.delay(), 10);
			this.input_loop.bind(['tick'], "update.tick", function(t){
				that._trigger('tick', t);
			});
			this.input_loop.bind(['update'], "update.upd", function(u){
				that.update();
				that._trigger('update',u);
			})
		}
		this.start = function(){
			this.__proto__.start();
			this.input_loop.run();
		}
		this.pack = function(){
			return this.__proto__.pack("SoloManager");
		}
		this.input = function(code, isdown){
			this.keys.push({code:code, down:isdown});
		}
		this.update = function(){
			this.game.clear();
			this.game.input(this.keys);
			this.keys = []; // input update
		}
		this.init(game);
	}
	SoloManager.prototype = new Manager();
	//Scheme: 
	RoundRobinManager = function(host, plist, game){

	}
	AnarchyManager = function(host, plist, game){

	}
	
	ScatterManager = function(host, plist, game){

	}
})
