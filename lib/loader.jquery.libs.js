

JQ_LIB_LOADED = function(cbk){
	require(["lib/jquery/jquery-1.10.2.js"], function(){
		console.log("[LOADED] jquery");
		require(["lib/jquery/jquery-ui-1.10.4.min.js"], 
		function(){
			console.log("[LOADED] jquery.ui")
			require([
			 "lib/jquery/jquery.sizes.js",
			 "lib/jlayout/jlayout.border.js",
			 "lib/jquery/jquery.svg.min.js",
			 "lib/jquery/jquery-migrate-1.2.1.js",
			 ], 
			function(){
				console.log("[LOADED] sizes border")
				require(["lib/jlayout/jquery.jlayout.js"], 
					function(){
						console.log("[LOADED] jlayout");
						cbk();
					})
			})
		})
	});
}


