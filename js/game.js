
define(["js/gbc.js"/*, "js/gba.js"*/], function(){
	SkinnyGame = function(canv){
		this.init = function(canv){
			this.targ = canv; 
			this.type = "SkinnyGame"
			//canv
			this.canv = document.createElement('canvas');
			this.cctx = this.canv.getContext('2d')
			//set minimum size
			var minsiz = this.targ.width < this.targ.height ? this.targ.width : this.targ.height;
			this.targ.width = minsiz;
			this.targ.height = minsiz;
			this.tctx = this.targ.getContext('2d')
			this.paused =false;
		}
		this.setDimensions = function(dim){
			this.dims = dim;
			this.canv.width = this.dims.w;
			this.canv.height = this.dims.h;
			this.cctx = this.canv.getContext('2d')
		}
		this.setControls = function(ctrls){
			this.ctrls = ctrls;
		}
		this.show = function(fb){
			if(this.paused) return;
			var imgData=this.cctx.getImageData(0,0,this.canv.width,this.canv.height);
			var idatView= new Uint8ClampedArray(imgData.data);
			var fbu8 = new Uint8ClampedArray(fb);
			for(var i=0; i < imgData.data.length; i++){
				imgData.data[i] = fbu8[i];
			}
			imgData.data.set(fbu8);
			this.cctx.putImageData(imgData,0,0);
			this.tctx.drawImage(this.canv, 0, 0, this.targ.width, this.targ.height);
		}
		this.run = function(){
			this.paused = false;
		}
		this.stop = function(){
			this.paused = true;
		}
		this.controls = function(){
			return this.ctrls;
		}
		this.init(canv);
	}

	SkinnyPlayLoop = function(game){
		this.init = function(game){
			this.queue = [];
			this.n = 0;

			this.time_chunk = 17; //number of milliseconds to wait before stepping.
			this.game = game;
			this.pause = false;

			this._interval = null;
			this.idx = 0;
			this.callbacks = {};
			this.callbacks['tick'] = {};

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
		this.frame = function(frames){
			var up = [];
			var down = []
			for(var i=0; i < frames.length; i++){
				this.queue.push(frames[i]);
			}
		}
		this.stop = function(){
			this.pause = true;
		}
		this.run = function(){
			//run the game loop
			var that = this;
			this.CALLBACK = function(){
				if(that.queue.length > 0 && that.pause == false){
					while(that.queue.length > 60)
						that.queue.shift();
					var e = that.queue.shift(); //take move
					this.n++;
					that.game.show(e);
				//console.log("run",that.idx, diff);
				}
				that._trigger('tick', {});
		  		that._interval = setTimeout(function(){that.CALLBACK();}, that.time_chunk)
			}
			if(this._interval == null){
				this._interval = setTimeout(this.CALLBACK, this.time_chunk);
			}
			this.pause = false;
		}
		this.init(game);
	}
	Game = function(){
		this.init = function(){
			this.type = null;
			this.game = {};
			this.sav = {};
			this.emul = null;
		}
		this.canvas = function(c){
			this.canv = c;
		}
		this.controls = function(){
			if(this.emul != null)
				return this.emul.controls();
			else
				return null;
		}
		this.dimensions = function(){
			return this.emul.dimensions();
		}
		this.input = function(key, isdown){
			this.emul.input(key, isdown);
		}
		this.save = function(){
			this.sav.data = this.emul.save();
			return this.sav.data;
		}
		this.state = function(){
			this.emul.state();
		}
		this.write = function(data){
			this.sav.data = data;
			this.emul.write(data);
		}
		this.step = function(n){
			this.emul.step(n);
		}
		this.screen = function(){
			return this.emul.screen();
		}
		this.create = function(rom, save){
			var name = rom.f.name;
			if(name.substr(name.length-4) == ".gbc"){
				this.type = "gbc";
				this.game.info = rom.f;
				this.game.data = rom.d;
				//initialize emulator
				this.emul = new GameboyColorView();
				this.emul.create(this.canv);
				this.emul.load(this.game.data);
				this.emul.start();
				//initial save

				if(save != null){
					this.sav.info = save.f;
					this.sav.data = save.d;
					this.state();
				}
				else{
					this.sav.info = null;
					this.sav.data = null;
					this.save();
				}
			}
			//gba games
			else if(name.substr(name.length-4) == ".gba"){

			}
		}

		this.init();
	}

	PlayLoop = function(game){
		this.init = function(game){
			this.queue = [];
			this.n = 0;

			this.time_chunk = 17; //number of milliseconds to wait before stepping.
			this.input_chunk = 2; //number of time units per input.
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
			var up = [];
			var down = []
			for(var i=0; i < keys.length; i++){
				if(keys[i].down) down.push(keys[i]);
				else up.push(keys[i]); 
			}
			this.queue.push(down);
			this.queue.push(up);
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
				that._trigger('tick', {});
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
})