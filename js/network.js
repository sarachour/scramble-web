

require(["lib/peerjs/peer.min.js", "js/game.js"], function(name){
//var HOST = "curious-cube.csail.mit.edu";
//var HOST="192.168.1.140"
var HOST="127.0.0.1"
var PEERJS_KEY = "peerjs"
var PEERJS_PORT = 9000
var HTTP_PORT = 8000

this.LOCAL = function(relative){
	return ("http://"+HOST + ":" + HTTP_PORT + "/" +relative);
}

NetNode = function(name){
	this.init = function(name){
		//
		this.key = PEERJS_KEY
		this.host = HOST;
		this.port = PEERJS_PORT;
		this.name = name;
		this.peer = new Peer(name, {
			host: this.host,
			port: this.port,
			key: this.key
		});
		
		this.conns = {};
		this.streams = {};
		this.callbacks = {};
		//connection data
		this.callbacks["connect.request"] = {};
		this.callbacks["connect.accept"] = {};
		this.callbacks["connect.reject"] = {};
		this.callbacks["connect.ready"] = {};
		this.callbacks["connect.kick"] = {};
		this.callbacks["connect.close"] = {};
		this.callbacks["stream.call"] = {};
		this.callbacks["data.recv"] = {};
		this.callbacks["error"] = {};
		this.callbacks["ready"] = {};
		this._setup();
	}
	
	this.bind = function(evts, name, cbk){
		for(var i=0; i < evts.length; i++){
			this.callbacks[evts[i]][name] = cbk;
		}
	}
	this.bind_data = function(evts, name, cbk){
		for(var i=0; i < evts.length; i++){
			this.callbacks['data.recv'][evts[i]+":"+name] = (function(ccmd){ 
				return function(d){
					if(d.data.hasOwnProperty("cmd") && d.data.cmd == ccmd){
						cbk(d.data);
					}
				}
			})(evts[i])
		}
	}
	this.unbind_data = function(evts, name, cbk){
		for(var i=0; i < evts.length; i++){
			var cevt = evts[i];
			delete this.callbacks['data.recv'][evts[i]+":"+name];
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
	this._setup = function(){
		var that = this;
		this.peer.on('open', function(){
			that._trigger("ready",{});
		})
		this.peer.on('connection', function(conn) {
			that.conns[conn.peer] = {};
			that.conns[conn.peer].c = conn;
			that.conns[conn.peer].id = conn.id;
			that.conns[conn.peer].status = "opening";
			that.conns[conn.peer].c.on('open', function(){
				that.conns[conn.peer].status = "open";
				that._trigger("connect.request", {peer:conn.peer});
			});
			that.conns[conn.peer].c.on('close', function(){
				delete that.conns[conn.peer];
				that._trigger("connect.close", {peer:conn.peer});
			});
		});
		this.peer.on('call', function(call) {
		  // Answer the call, providing our mediaStream
		  that._trigger("stream.call", call);
		});
		this.peer.on('error', function(e){
			that._trigger("error", e);
		})
	}
	//request a connection
	this.request_connection = function(other){
		var that = this;
		if(!this.conns.hasOwnProperty(other)){
			that.conns[other] = {};
			that.conns[other].id = other;
			that.conns[other].status = "pending";
		}
		this.conns[other].c = this.peer.connect(other, {reliable:true});
		that.conns[other].c.on('data', function(d){
			if(d.cmd == "confirm"){
				if(d.status == true){
					that._trigger("connect.accept", {peer:other,status:"accept"});
					//remove self from server
				}
				else{
					that._trigger("connect.reject", {peer:other, status:"reject"});
				}
				//disconnect from server
				that.peer.disconnect();
				that.conns[other].c.send({cmd:"confirm.ack"})
				that.conns[other].c.on('data', function(){})
			}
			else{
				that._trigger("data.recv", {peer:other, data:d});
			}
		})
	}
	//view pending connections
	this.get_connections = function(){
		return this.conns;
	}
	this.get_n_connections = function(){
		return Object.keys(this.conns).length;
	}
	//accept connection
	this.accept_connection = function(other){
		var that = this;
		that.conns[other].c.send({cmd:"confirm",status:true})
		that.conns[other].c.on('data', function(d){
			var cmd = d.cmd;
			console.log(d);
			if(that.conns[other].status != "ready"){
				if(cmd == 'confirm.ack'){
					//send host info
					that.conns[other].status = "ready";
					that._trigger("connect.ready", {peer:other});

				}
				else{
					//start game.
					that.conns[other].status = "retry";
					that.conns[other].c.send({cmd:"confirm",status:true})
				}
			}
			else{
				that._trigger("data.recv", {peer:other, data:d, status: "ready"});
			}
		})
	}
	//reject connection
	this.reject_connection = function(other){
		var that = this;
		that.conns[other].c.send({cmd:"confirm",status:false})
		that.conns[other].c.on('data', function(d){
			var cmd = d.cmd;
			if(cmd == 'confirm.ack'){
				//send host info
				that.conns[other].status = "closed";
				that._trigger("connect.kick", {peer:other, status: "kick"});
				that.conns[other].close();

			}
			else{
				//start game.
				that.conns[other].status = "retry";
				that.conns[other].c.send({cmd:"confirm",status:false})
			}
		})
	}
	this.broadcast_data = function(data){
		for(var other in this.conns){
			if(this.conns[other].hasOwnProperty("c"))
				this.conns[other].c.send(data)
		}
	}
	this.send_data = function(other, data){
		if(this.conns.hasOwnProperty(other))
			this.conns[other].c.send(data)
	}
	this.recv_data = function(cbk){
		this.bind(["data.recv"], "RECV", cbk);
	}
	this.close = function(){
		this.peer.destroy();
	}
	this.init(name);
}

})