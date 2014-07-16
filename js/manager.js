/*
TODO: key, steps, queue. play is a continuous loop that waits for more work.

*/
require(["js/game.js"], function(){
	ManagerFactory = {
		unpack: function(pkg,game,net){
			console.log(pkg, game);
			if(pkg.type == "SoloManager"){
				return new SoloManager(pkg.host, pkg.peers, game);
			}
			else if(pkg.type == "DemocracyManager"){
				return new DemocracyManager(pkg.host, pkg.peers, game, net)
			}
		}
	}
	Manager = function(hostname, peerlist, game){
		this.init = function(hostname, peerlist, game){
			this.host = hostname;
			this.peers = peerlist;
			this.game = game;

			this.timer = {
				unit: 1000, // 3 seconds
				step: 100, //correspond to one step
				chunk: 1,
				_timer: null,
				n: 0
			}
			this.callbacks = {};
			this.callbacks["update"] = {};
			this.callbacks["tick"] = {};
		}
		this.set_name = function(name){
			this.name = name;
			this.is_host = this.name == this.host;
		}
		this.pack = function(type){
			return {
				host: this.host,
				peers: this.peers,
				type: type
			}
		}
		this.speed = function(n){
			this.timer.chunk = n;
		}
		this.add = function(peername){
			this.peers.push(peername);
		}
		this.bind = function(evts, name, cbk){
			for(var i=0; i < evts.length; i++){
				this.callbacks[evts[i]][name] = cbk;
			}
		}
		this.recv = function(){

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
		this.input = function(code, isdown){
			
		}
		this.tick = function(){
			return {i:that.timer.n, n:that.timer.step};
		}
		this.start = function(){
			this.play();
		}
		this.play = function(){ //start new round
			var that = this;
			this.timer._timer = setInterval(function() {
			      // Do something after 5 seconds
			      var tdat = that.tick();
			      tdat.i = that.timer.n;
			      tdat.n = that.timer.step;
			      if(that.timer.n + 1 == that.timer.step) {
			      	var dat = that.update();
			      	that._trigger("update", dat);
			      }
			      that._trigger("tick", tdat);
			      //update step index
			      that.timer.n = (that.timer.n+1)%that.timer.step;
			}, this.timer.unit/this.timer.step);
		}
		//push changes to game
		this.update = function(){
			return {};
		}
		this.stop = function(){
			clearInterval(this.timer._timer);
		}
		this.init(hostname, peerlist, game);
	}
	DemocracyManager = function(hostname, peerlist, game, net){


		this.init = function(hostname, peerlist, game, net){
			console.log(this);
			this.net = net;
			this.consensus = {};
			this.gathered = 0;
			this.index = 0;
			this.__proto__.init(hostname, peerlist, game);
		}
		this.pack = function(){
			return this.__proto__.pack("DemocracyManager");
		}
		this.tick = function(){
			
		}
		this.recv = function(d){
			console.log("recv:",d);
			if(d.scmd == "c")
				this._consensus(d);
			else if(d.scmd == "k")
				this._key(d);
		}
		this._sync = function(k){


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
				this.play();
			}
			else {
				this.key = k.key;
				this.play();
			}
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
		this.start = function(){ //start new round
			if(this.is_host) this.play();
		}
		this.stop = function(){

		}
		this.input = function(code, isdown){
			if(!isdown) return;
			this._key({code:code});
			
		}
		this.tick = function(){
			if(this.key != null){
				if(this.timer.n == 0){
					this.game.input(this.key, true);
				}
				else if(this.timer.n == this.timer.step/2){
					this.game.input(this.key, false);
				}
			}
			this.game.step(this.timer.chunk);
			return {};
		}
		//push changes to game
		this.update = function(){
			
			clearInterval(this.timer._timer);
			if(this.is_host){
				this._consensus();
				console.log("consensus", this.key);
				
			}
			//increase the number of ticks.
			this.index+=1;
			return {keys: [this.key]};
		}
		this.init(hostname, peerlist, game, net);
	}
	DemocracyManager.prototype = new Manager();
	//play a solo game
	SoloManager = function(hostname, peerlist, game) {
		this.init = function(hostname, peerlist, game){
			console.log(this);
			this.__proto__.init(hostname, peerlist, game);
		}
		this.pack = function(){
			return this.__proto__.pack("SoloManager");
		}
		this.tick = function(){
			this.game.step(this.timer.chunk);
		}

		this.input = function(code, isdown){
			this.game.input(code, isdown);
		}
		//push changes to game
		this.update = function(game){
			
		}
		this.init(hostname, peerlist, game);
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
