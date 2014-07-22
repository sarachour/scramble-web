
define(["js/gbc.js"/*, "js/gba.js"*/], function(){
	SkinnyGame = function(canv){
		this.init = function(canv){
			this.targ = canv; 
			//canv
			this.canv = document.createElement('canvas');
			this.cctx = this.canv.getContext('2d')
			//set minimum size
			var minsiz = this.targ.width < this.targ.height ? this.targ.width : this.targ.height;
			this.targ.width = minsiz;
			this.targ.height = minsiz;
			this.tctx = this.targ.getContext('2d')
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
		this.controls = function(){
			return this.ctrls;
		}
		this.init(canv);
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
})