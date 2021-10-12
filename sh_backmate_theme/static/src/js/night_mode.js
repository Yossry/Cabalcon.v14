//===========================================
// Night Mode
//===========================================

odoo.define('sh_backmate_theme.night_mode_systray', function (require) {
    "use strict";

    var core = require('web.core');
    var Dialog = require('web.Dialog');
    var Widget = require('web.Widget');
    var rpc = require('web.rpc');    
    var SystrayMenu = require('web.SystrayMenu');
    var session = require('web.session');
    var _t = core._t;
    var QWeb = core.qweb;
    
    var NightModeTemplate = Widget.extend({
        template: "NightModeTemplate",
        events: {
            'click #sun_button': '_click_sun_button',
			'click #moon_button': '_click_moon_button',
        },
        init: function () {
        	 this._super.apply(this, arguments);
             var self = this;
     		var currentTheme = localStorage.getItem('theme');
     		this.day_mode = true;
     		if (currentTheme == 'dark') {
     			this.day_mode = false;
     			$("#sun_button").css("display","block");
     			$("#moon_button").css("display","none");
     			document.documentElement.setAttribute('data-theme', currentTheme);
     		}else if((currentTheme == 'light')) {
     			$("#sun_button").css("display","none");
     			$("#moon_button").css("display","block");
     			this.day_mode = true;
     		    document.documentElement.setAttribute('data-theme', currentTheme);
     		}else{
     			$("#sun_button").css("display","none");
     			$("#moon_button").css("display","block");
     			this.day_mode = true;
     		    document.documentElement.setAttribute('data-theme', 'light');
     		}
        },

        _click_moon_button: function (ev) {
        	ev.preventDefault();
            var self = this;
 		        document.documentElement.setAttribute('data-theme', 'dark');
 		       localStorage.setItem('theme', 'dark');
		    	rpc.query({
	                model: 'sh.back.theme.config.settings',
	                method: 'activate_primary_variable_scss',
	               args: [[]],
	            } ,{async: false}).then(function(output) {
	            });
		      location.reload(true);
        },
        _click_sun_button: function (ev) {
        	ev.preventDefault();
            var self = this;
 		        document.documentElement.setAttribute('data-theme', 'light');
 		       localStorage.setItem('theme', 'light');
		    	rpc.query({
	                model: 'sh.back.theme.config.settings',
	                method: 'deactivate_primary_variable_scss',
	               args: [[]],
	            } ,{async: false}).then(function(output) {
	            });
		      location.reload(true);
        },

    });

    NightModeTemplate.prototype.sequence = 10;

    SystrayMenu.Items.push(NightModeTemplate);

    
   return {
	   NightModeTemplate: NightModeTemplate,
   };
});