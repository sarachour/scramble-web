define(["lib/loader.gbc.js"], function(){



GameboyColorView = function(){
	this.init = function(){
		this.canv = null;
		this.delay = 10;
		this.keymap = ["right", "left", "up", "down", "a", "b", "select", "start"];

		this.sram = {};
		this.sram.rtc = [];
		this.sram.mem = [];

		this.canv = document.createElement('canvas');
		this.targ = null;
		this.iterations = 0;

	}
	this.dimensions = function(){
		return {w: 160, h: 144};
	}
	this.create = function(canv){
		this.targ = canv;
		var minsiz = this.targ.width < this.targ.height ? this.targ.width : this.targ.height;
		this.targ.width = minsiz;
		this.targ.height = minsiz;
		this.tctx = this.targ.getContext('2d')
		this.canv.width = this.dimensions().w;
		this.canv.height = this.dimensions().h;
		this.cctx = this.canv.getContext('2d');
	}
	this.load = function(rdata){
		this.rom = rdata;
	}
	this.screen = function(){
		return this.cctx.getImageData(0,0,this.dimensions().w,this.dimensions().h).data;
	}
	this.start = function(){
		var that = this;
		if(this.canv == null || this.rom == null)
			return;

		this.gbc = new GameBoyCore(this.canv, this.rom);
		this.gbc.openMBC = function(){return that.sram.mem};
		this.gbc.openRTC = function(){return that.sram.rtc};
		this.gbc.start();
		this.gbc.stopEmulator &= 1;
		var dateObj = new Date();
		this.gbc.firstIteration = dateObj.getTime();
		this.gbc.iterations = 0;
		
	}

	this.step = function(){
		var that = this;
		this.i = 0;
		that.gbc.run();
		this.tctx.drawImage(this.canv, 0, 0, this.targ.width, this.targ.height);
		//this.gbc.handleSTOP();
	}

	this.input = function(key, down){
		var idx = this.keymap.indexOf(key);
		if(idx >= 0){
			this.gbc.handleSTOP();
			this.gbc.JoyPadEvent(idx, down);
		}
	}
	this.write = function(s){
		if(s.hasOwnProperty("mem"))
			this.sram.mem = s.mem;
		if(s.hasOwnProperty("rtc"))
			this.sram.rtc = s.rtc;
		if(s.hasOwnProperty("st"))
			this.sram.st = s.st;
	}

	this.state = function(){
		var that = this;
		this.start();
		this.gbc.stopEmulator &= 1;
		this.gbc.returnFromState(this.sram.st);
		this.gbc.returnFromRTCState(this.sram.rtc);
		//this.step(1);
	}
	this.save = function(){
		//this.sram = {};
		this.sram.mem = this.gbc.saveSRAMState();
		this.sram.rtc = this.gbc.saveRTCState();
		this.sram.st = this.gbc.saveState();

		return {mem: this.sram.mem, rtc: this.sram.rtc, st:this.sram.st};
	}
	this.controls = function(){
		return {
			svg: "res/image/gbc.svg",
			map: {
					right: "right",
					left: "left",
					up: "up",
					down: "down",
					s: "a",
					a: "b",
					w: "select",
					q: "start"
				},
			keys: {
				right: {
					description: "move right.",
					image: {on:"right_on", off:"right_off", out:"right_out"}
				},
				left: {
					description: "move left.",
					image: {on:"left_on", off:"left_off", out:"left_out"}
				},
				up: {
					description: "move up.",
					image: {on:"up_on", off:"up_off", out:"up_out"}
				},
				down: {
					description: "move down.",
					image: {on:"down_on", off:"down_off", out:"down_out"}
				},
				a: {
					description: "a button.",
					image: {on:"a_on", off:"a_off", out:"a_out"}
				},
				b: {
					image: {on:"b_on", off:"b_off", out:"b_out"}
				},
				select: {
					image: {on:"sel_on", off:"sel_off", out:"sel_out"}
				},
				start: {
					image: {on:"start_on", off:"start_off", out:"start_out"}
				}
			}

		};
	}
	this.init();
}

})