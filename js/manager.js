
require(["js/game.js"], function(){
	ManagerFactory = {
		unpack: function(pkg,game){
			console.log(pkg, game);
			if(pkg.type == "SoloManager"){
				return new SoloManager(pkg.host, pkg.peers, game);
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
		this.input = function(peername, code, isdown){
			
		}
		this.tick = function(){

		}
		this.start = function(){ //start new round
			var that = this;
			this.timer._timer = setInterval(function() {
			      // Do something after 5 seconds
			      that.tick();
			      if(that.timer.n == that.timer.step) {
			      	that.update();
			      	that._trigger("update", {});
			      }
			      that._trigger("tick", {i:that.timer.n, n:that.timer.step});
			      //update step index
			      that.timer.n = (that.timer.n+1)%that.timer.step;
			}, this.timer.unit/this.timer.step);
		}
		//push changes to game
		this.update = function(game){
			
		}
		this.stop = function(){
			clearInterval(this.timer._timer);
		}
		this.init(hostname, peerlist, game);
	}
	DemocracyManager = function(host, plist, game){

	}
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
		this.input = function(peername, code, isdown){
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
