/*
TODO: key, steps, queue. play is a continuous loop that waits for more work.

*/
require(["js/game.js"], function(){
	ManagerFactory = {
		unpack: function(pkg,game,net,name, host){
			if(pkg == "DemocracyManager"){
				return new DemocracyManager(game, net,name, host)
			}
			else if(pkg == "WatchManager"){
				return new WatchManager(game, net,name, host)
			}
			else if(pkg == "AnarchyManager"){
				return new AnarchyManager(game, net,name, host)
			}
		}
	}
	
	Manager = function(game){
		this.init = function(game){
			var that = this;
			//if we're skinny, don't run a gameloop
			if(game == null) return;
			if(game.type == "SkinnyGame") {
				this.game = new SkinnyPlayLoop(game);
			}
			else {
				this.game = new PlayLoop(game);
				this.game.bind(['tick'], "update.tick", function(t){
					var fb = that.game.getFrameBuffer();
					if(that.frame_info.i == that.frame_info.batch_size-1){
						that._trigger('show', that.frame_info.frames); //show the frames
						//trigger show
						that.frame_info.frames = [];
					}
					that.frame_info.frames.push(fb);
					that.frame_info.i = (that.frame_info.i + 1)%that.frame_info.batch_size;
				});
				this.game.bind(['update'], "update.upd", function(u){
					u.keys = that.key;
					that._trigger('update',u);
				})
				this.frame_info = {
					i:0,
					batch_size: Math.round(15),
					frames: []
				};
			}

			
			this.callbacks = {};
			this.callbacks['tick'] = {};
			this.callbacks['show'] = {};
			this.callbacks['update'] = {};
		}
		this.pack = function(type){
			return type;
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
			console.log("Triggered",evt);
			for(var n in this.callbacks[evt]){
				this.callbacks[evt][n](args);
			}
		}
		this.init(game);
	}
	ConsensusManager = function(game, net, name, host){
		this.init = function(game, net, name, host){
			this.__proto__.init(game);
			var that = this;

			this.net = net;
			this.host = host;
			this.name = name;
			this.is_host = (name == host);

			this.key = [];
			this.paused = false;
			this.input_idx = 0;

			if(this.is_host && this.game != undefined){
				this.bind(['show'], "update.show", function(frames){
					console.log("send fb");
					that.net.broadcast_data({cmd:"upd", scmd:"d", fb: frames});
					that._trigger('tick', frames);
				});
				this.bind(['update'], "update.upd", function(u){
					that.update();
					u.keys = that.key;
				})
			}
			this.consensus = {};
		}
		this.start = function(){
			this.__proto__.start();
			this.paused = false;
		}
		this.stop = function(){
			this.__proto__.stop();
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
			if(d.scmd == "d"){
				console.log("recv fb");
				this.game.frame(d.fb);
			}
			else if(d.scmd == "c")
				this._consensus(d);
			else if(d.scmd == "k")
				this._key(d);
			else if(d.scmd == "p")
				this.stop();
		}
		this.decide = function(){
			key = [];
			return key;
		}
		this._consensus = function(k){
			if(this.is_host){
				if(!this.paused){
					this.key = this.decide();
					var d = {cmd:"upd", scmd:"c", key:this.key};
					console.log(d);
					this.net.broadcast_data(d);
					this.consensus = {};
					this.game.input(this.key)
					this.input_idx = 0;
				}
				else{
					var d = {cmd:"upd", scmd:"p"};
					this.net.broadcast_data(d);
				}
			}
			else {
				if(!this.paused){
					this.key = k.key;
				}
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
				this.consensus[k.peer] = {code:k.code, down:k.down, order: this.input_idx};
				this.input_idx++;
			}
		}
		this.input = function(code, isdown){
			this._key({code:code, down:isdown, peer:this.name});
		}
		this.init(game, net, name, host);
	}
	ConsensusManager.prototype = new Manager();

	DemocracyManager = function(game, net, name, host){
		this.init = function(game, net, name, host){
			this.__proto__.init(game,net,name,host);
			//overwrite
			this.__proto__.decide = this.decide;
		}
		this.decide = function(game, net, name, host){
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
			var key = [];
			for(var p in codes){
				if(codes[p].cnt >= npeers){
					key.push(codes[p].data);
				}
			}
			return key;
		}
		this.init(game, net, name, host);
	}
	DemocracyManager.prototype = new ConsensusManager();

	AnarchyManager = function(game, net, name, host){
		this.init = function(game, net, name, host){
			this.__proto__.init(game,net,name,host);
			//overwrite
			this.__proto__.decide = this.decide;
		}
		this.decide = function(game, net, name, host){
			var codes = {}; 
			var felem = null; var fval = 0;
			for(var p in this.consensus){
				var k = this.consensus[p];
				if(felem == null || k.order < fval){
					felem = k;
					fval = k.order;
				}
			}
			//if its the first element
			var key = [];
			if(felem != null){
				key.push(felem);
			}
			return key;
		}
		this.init(game, net, name, host);
	}
	AnarchyManager.prototype = new ConsensusManager();

	WatchManager = function(game, net, name, host) {
		this.init = function(game, net, name, host){
			this.__proto__.init(game);
			var that = this;
			this.net = net;
			this.host = host;
			this.name = name;
			this.is_host = (name == host);
			this.keys = [];
			
			this.paused = false;
			if(this.is_host){
				
				this.game.bind(['tick'], "update.tick", function(t){
					that.net.broadcast_data({cmd:"upd", subcmd:"d", fb: that.game.getFrameBuffer()});
					that._trigger('tick', t);
				});
				this.game.bind(['update'], "update.upd", function(u){
					u.keys = that.keys;
					that.update();
					that._trigger('update',u);
				})
			}
			
		}
		this.recv = function(d){
			if(d.subcmd == "d"){
				this.game.show(d.fb);
			}
			else
				this._trigger('update',{keys:d.keys});
		}
		this.start = function(){
			this.__proto__.start();
			this.paused = false;
		}
		this.stop = function(){
			this.__proto__.stop();
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
				this.net.broadcast_data({cmd:"upd", subcmd:"d", keys: this.keys});
				this.keys = []; // input update
			}
		}
		this.init(game, net, name, host);
	}
	WatchManager.prototype = new Manager();
	//Scheme: 
	RoundRobinManager = function(host, plist, game){

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
