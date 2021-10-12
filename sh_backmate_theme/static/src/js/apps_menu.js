odoo.define('backmate_backend_theme.AppsMenu', function (require) {
"use strict";

var Widget = require('web.Widget');
var AppsMenu = require('web.AppsMenu');
var session = require('web.session');
var rpc = require('web.rpc');

var theme_style = 'default';


rpc.query({
    model: 'sh.back.theme.config.settings',
    method: 'search_read',
    domain: [['id','=',1]],
    fields: ['theme_style']
}).then(function(data) {
    if (data) {
    	 if(data[0]['theme_style']=='style_7'){
    		 theme_style = 'style7';
    	 }else{
    		 theme_style = 'default';
    	 }
    }
});

var AppsMenu = AppsMenu.include({

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Called when clicking on an item in the apps menu.
     *
     * @private
     * @param {MouseEvent} ev
     */
	 init: function (parent, menuData) {
	        this._super.apply(this, arguments);
	        this.theme_style = theme_style;
	 },
	 _onAppsMenuItemClicked: function (ev) {
		 this._super.apply(this, arguments);
		 	if(this.theme_style=='style7'){
				 $("body").removeClass("sh_sidebar_background_enterprise");
				 $(".sh_search_container").css("display","none");
		 		$(".sh_backmate_theme_appmenu_div").removeClass("show")
		     	$(".o_action_manager").removeClass("d-none");
		     	$(".o_menu_brand").css("display","block");
		     	$(".full").removeClass("sidebar_arrow");
		     	$(".o_menu_sections").css("display","block");
		 	}
	    },
	    
	  openFirstApp: function () {
		
	        if (!this._apps.length) {
	            return
	        }
	        if(this.theme_style=='style7'){
	        	$(".sh_backmate_theme_appmenu_div").addClass("show")
	        	$("body").addClass("sh_sidebar_background_enterprise");
	        //	$(".sh_search_container").css("display","block");
	        	 $(".sh_backmate_theme_appmenu_div").css("opacity","1");
	        	$(".o_action_manager").addClass("d-none");
	        	$(".full").addClass("sidebar_arrow");
	        	$(".o_menu_brand").css("display","none");
	        	$(".o_menu_sections").css("display","none");
	        }else{
	        	   var firstApp = this._apps[0];
	  	       this._openApp(firstApp);
	        }
	        
	     
	    },


});

return AppsMenu;


});
