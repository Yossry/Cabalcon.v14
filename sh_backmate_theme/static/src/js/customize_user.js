odoo.define('sh_backmate_theme.UserMenu', function (require) {
    "use strict";
    var UserMenu = require('web.UserMenu');
    var config = require('web.config');
    var rpc = require('web.rpc')
    var core = require('web.core');

    var _t = core._t;
    var QWeb = core.qweb;
    
    UserMenu.include({
    	init: function () {
            this._super.apply(this, arguments);
        },
        
        start: function () { 
            var self = this;
            
            this._super.apply(this, arguments);
            rpc.query({
				model: 'sh.back.theme.config.settings',
				method: 'search_primary_var_template',
				args: [[]],
			}, {async: false}).then(function(output) {
				if(output){
					self.$el.find("#night_checkbox").prop( "checked", true );
				}else{
					self.$el.find("#night_checkbox").prop( "checked", false );
				}
			});
        },

    })

});
odoo.define('sh_backmate_theme.Dialog', function (require) {
	"use strict";

	var config = require("web.config");
	
	if (!config.device.isMobile) {
	    return;
	}
	var Dialog = require("web.Dialog");
	Dialog.include({
		 renderElement: function () {
		        this._super();
		        this.$modal.find(".modal-header").find("button.close").remove();
		        this.$modal.find(".modal-header").prepend("<button class='btn fa fa-arrow-left' data-dismiss='modal' aria-label='close'></button>")
		 }
	});


});

