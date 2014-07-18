/*
TODO: key, steps, queue. play is a continuous loop that waits for more work.

*/
require(["js/game.js"], function(){
	ManagerFactory = {
		unpack: function(pkg,game,net,name, host){
			console.log(pkg, game);
			if(pkg.type == "SoloManager"){
				return new SoloManager(game);
			}
			else if(pkg.type == "DemocracyManager"){
				return new DemocracyManager(game, net,name, host)
			}
		}
	}
	PlayLoop = function(game){
		this.init = function(game){
			this.queue = [];
			this.n = 0;
			/*
			this.timer = {
				unit: 1000, // 3 seconds
				step: 100, //correspond to one step
				chunk: 1,
				_interval: null,
				n: 0
			}
			*/
			this.time_chunk = 10; //number of milliseconds to wait before stepping.
			this.input_chunk = 10; //number of time units per input.
			this.step_chunk = 1; //smallest unit, amount you step per time unit
			this._interval= null;
			this.game = game;
			this.i = this.input_chunk-1;
			this.pause = false;
			this._up_keys = [];
		}
		this.clear = function(){
			this.queue = [];
		}
		this.delay = function(){
			return this.time_chunk*this.input_chunk;
		}
		this.input = function(keys){
			this.queue.push(keys);
		}
		this.pause = function(){
			this.pause = true;
		}
		this.run = function(){
			//run the game loop
			var that = this;
			if(this._interval == null){
				this._interval = setInterval(function() {
				      if(that.i == that.input_chunk-1){
					      if(that.queue.length > 0 && that.pause == false){
					      	var e = that.queue.shift(); //take move
					      	this.n++;
					      	that._up_keys = [];
					      	for(var i=0; i < e.length; i++){
					      		var c= e[i].code;
					      		if(e[i].down) that.game.input(c,true);
					      		else that._up_keys.push(c);
					      	}
					      	that.game.step(that.step_chunk);
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
				  	  
				}, this.time_chunk);
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
		this.run = function(){
			var that = this;
			if(this._interval == null){
				this._interval = setInterval(function() {
					if(that.pause) return;
					that._trigger('tick', {i:that.i, n:that.n_ticks});
					if(that.i == that.n_ticks-1){
						that._trigger('update', {});
					}
					that.i = (that.i + 1)%that.n_ticks;
				  	  
				}, this.n/this.n_ticks);
			}
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
			this.game.pause();
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
			this.net = net;
			this.host = host;
			this.name = name;
			this.is_host = (name == host);
			this.consensus = {};
			this.index = 0;
			this.__proto__.init(game);
		}
		this.pack = function(){
			return this.__proto__.pack("DemocracyManager");
		}
		this.recv = function(d){
			console.log("recv:",d);
			if(d.scmd == "c")
				this._consensus(d);
			else if(d.scmd == "k")
				this._key(d);
		}
		this._consensus = function(k){
			if(this.is_host){
				var codes = {};
				var maxc = null;
				for(var p in this.consensus){
					var k = this.consensus[p];
					if(!codes.hasOwnProperty(k)){
						codes[k] = 0;
					}
					codes[k]++;
				}
				for(var c in codes){
					if(maxc == null || codes[maxc] < codes[c]){
						maxc = c;
					}
				}
				var d = {cmd:"upd", scmd:"c", key:maxc};
				for(var i=0; i < this.peers.length; i++){
					this.net.send_data(this.peers[i], d)
				}
				this.consensus = {};
				this.key = maxc;

			}
			else {
				this.key = k.key;
			}
			this.game.input([{code:this.key, down:true}]);
			this.game.input([{code:this.key, down:false}]);
			console.log("idx", this.index);
			
		}
		this._key = function(k){
			if(!this.is_host){
				this.net.send_data(this.host, {
					cmd: "upd",
					scmd: "k",
					code: k.code,
					peer: this.name
				})
			}
			else{
				var code = k.code;
				this.consensus[k.peer] = code;
			}
		}
		this.input = function(code, isdown){
			if(isdown) this._key(code);
		}
		this.init(game, net, name, host);
	}
	DemocracyManager.prototype = new Manager();
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
