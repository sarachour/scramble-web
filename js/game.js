
define(["js/gbc.js"/*, "js/gba.js"*/], function(){
	Game = function(){
		this.init = function(){
			this.type = null;
			this.game = {};
			this.sav = {};
			this.qsav = null; //a quick save after performing a batter save.
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
		this.pack = function(cmd, n, keys){
			this.save();
			if(cmd == "create")
				return {
					cmd: "create",
					type: this.type,
					game: {
						info: this.game.info,
						data: this.game.data
					},
					save: {
						data: this.sav.data
					}
				}
			else if(cmd == "sync")
				return {
					cmd: "sync",
					save: this.sav.data
				}
			else if(cmd == "qsync")
				return {
					cmd: "qsync",
					save: this.qsav
				}
			else if(cmd == "step")
				return {
					cmd: "step",
					n: n,
					keys: keys
				}
		}
		this.unpack = function(dat){
			if(dat.cmd == "create"){
				this.game.info = dat.game.info;
				this.game.data = dat.game.data;
				this.sav.data = dat.save.data;
				this.type = dat.type;
				if(dat.type == "gbc"){
					this.emul = new GameboyColorView();
					this.emul.create(this.canv);
					this.emul.load(this.game.data);
					this.emul.write(this.sav.data);
					this.emul.state();
				}
				else if(dat.type == "gba"){

				}
			}
		}
		this.ready = function(){
			return this.emul.ready();
		}
		this.clock = function(){
			return this.emul.clock();
		}
		this.input = function(key, isdown){
			this.emul.input(key, isdown);
		}
		this.qsave = function(){
			this.sav.data = this.emul.save();
			return this.sav.data;
		}
		this.save = function(){
			this.sav.data = this.emul.save();
			return this.sav.data;
		}
		this.state = function(){
			this.emul.qstate();
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