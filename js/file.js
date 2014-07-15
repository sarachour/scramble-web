
FileUtils = new function(){
	this.init = function(){
		this.reader = new FileReader();
	}
	//read files into array
	this.read = function(files, cbk){
		var N = files.length;
		var that = this;
		var cfxn = function(i,n){
			if(i < n){
				that.reader.onload = function(data){
						that.data[i] = {};
						that.data[i].d = that.reader.result;
						that.data[i].f = files[i];
						cfxn(i+1,n);
					}	
				that.reader.readAsBinaryString(files[i]);	
			}
			else {
				cbk(that.data);
			}
		}
		that.data = [];
		cfxn(0,N);


	}
	this.extension = function(files, cbk){

	}
	this.init();
}