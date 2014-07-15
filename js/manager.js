
require(["js/game.js"], function(){

	//play a solo game
	SoloManager =function(hostname, peerlist, game) {
		this.init = function(hostname, peerlist, game){
			this.host = hostname;
			this.peers = peerlist;
			this.game = game;
			this.keys = [];
		}
		this.input = function(peername, code, isdown){
			if(peername == this.host){
				this.keys.push({time:0, code:code, down:isdown});
			}
		}
		this.start = function(){ //start new round
			this.keys.clear(); //clear keys
		}
		//push changes to game
		this.update = function(game){
			//send data to peers.

		}
		this.init(hostname, peerlist, game);
	}

	RoundRobinManager = function(host, plist, game){

	}
	AnarchyManager = function(host, plist, game){

	}
	DemocracyManager = function(host, plist, game){

	}
	ScatterManager = function(host, plist, game){

	}
})
