

require(function(){
	//this is just a dummy frame
	GBCFrame = function(host,net){
		this.init = function(host,net){
			this.canv = null;
			

		}
		this.create = function(canv){
			this.canv = canv;
			var minsiz = this.canv.width < this.canv.height ? this.canv.width : this.canv.height;
			this.canv.height = minsiz;
			this.canv.width = minsiz;
		}
		this.load = function(rdata){

		}
		this.start = function(){

			
		}
		this.clock = function(){

		}
		this.ready = function() {

		}

		this.step = function(n){

			//this.gbc.handleSTOP();
		}

		this.input = function(key, down){

		}
		this.write = function(s){

		}
		this.state = function(){

		}
		this.save = function(){

		}
		this.controls = function(){
			return {
				svg: "res/image/gbc.svg",
				map: function(code){
					for(var k in this.keys){
						var ky = this.keys[k];
						if(ky.map == code){
							return ky;
						}
					}
					return null;
				},
				keys: {
					right: {
						map:"right",
						code:"right",
						description: "move right.",
						image: {on:"right_on", off:"right_off", out:"right_out"}
					},
					left: {
						map:"left",
						code:"left",
						description: "move left.",
						image: {on:"left_on", off:"left_off", out:"left_out"}
					},
					up: {
						map:"up",
						code:"up",
						description: "move up.",
						image: {on:"up_on", off:"up_off", out:"up_out"}
					},
					down: {
						map:"down",
						code:"down",
						description: "move down.",
						image: {on:"down_on", off:"down_off", out:"down_out"}
					},
					a: {
						map: "s",
						code:"a",
						description: "a button.",
						image: {on:"a_on", off:"a_off", out:"a_out"}
					},
					b: {
						map: "a",
						code:"b",
						image: {on:"b_on", off:"b_off", out:"b_out"}
					},
					select: {
						map: "w",
						code: "select",
						image: {on:"sel_on", off:"sel_off", out:"sel_out"}
					},
					start: {
						map: "q",
						code: "start",
						image: {on:"start_on", off:"start_off", out:"start_out"}
					}
				}

			};
		}
		this.init(host,net);
	}


}