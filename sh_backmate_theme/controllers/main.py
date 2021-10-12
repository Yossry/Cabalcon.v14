# Part of Softhealer Technologies.
import json
from odoo import http
from odoo.http import request
import base64
from io import BytesIO
from odoo.tools.misc import file_open


class Main(http.Controller):

    def _get_manifest_json(self, company):
        if not company:
            company = 1
        pwa_config = http.request.env['sh.pwa.config'].sudo().search(
            [('company_id', '=', int(company))], limit=1)
        vals = {
            "name": "Softhealer-APP",
            "short_name": "SH-APP",
            "scope": "/",
            "start_url": "/web",
            "background_color": "purple",
            "display": "standalone",
        }
        if pwa_config:
            if pwa_config.name:
                vals.update({'name': pwa_config.name})
            if pwa_config.short_name:
                vals.update({'short_name': pwa_config.short_name})
            if pwa_config.theme_color:
                vals.update({'theme_color': pwa_config.theme_color})
            if pwa_config.background_color:
                vals.update({'background_color': pwa_config.background_color})
            if pwa_config.display:
                vals.update({'display': pwa_config.display})
            if pwa_config.orientation:
                vals.update({'orientation': pwa_config.orientation})

            default_icon_list = []
            if pwa_config.icon_small and pwa_config.icon_small_mimetype and pwa_config.icon_small_size:
                default_icon_list.append({
                    'src': '/sh_backmate_theme/pwa_icon_small/'+str(company),
                    'type': pwa_config.icon_small_mimetype,
                    'sizes': pwa_config.icon_small_size
                })
            if pwa_config.icon and pwa_config.icon_mimetype and pwa_config.icon_size:
                default_icon_list.append({
                    'src': '/sh_backmate_theme/pwa_icon/'+str(company),
                    'type': pwa_config.icon_mimetype,
                    'sizes': pwa_config.icon_size
                })

            if len(default_icon_list) == 0:
                default_icon_list = [
                    {
                        "src": "/sh_backmate_theme/static/icon/sh.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    }
                ]

            vals.update({'icons': default_icon_list})

        return vals

    @http.route('/manifest.json/<string:cid>', type='http', auth="public")
    def manifest_http(self, **post):
        company = post.get('cid')
        return json.dumps(self._get_manifest_json(company))

    @http.route('/sw.js', type='http', auth="public")
    def sw_http(self):
        js = """
        this.addEventListener('install', function(e) {
         e.waitUntil(
           caches.open('video-store').then(function(cache) {
             return cache.addAll([
                 '/sh_backmate_theme/static/index.js'
             ]);
           })
         );
        });
        
        this.addEventListener('fetch', function(e) {
          e.respondWith(
            caches.match(e.request).then(function(response) {
              return response || fetch(e.request);
            })
          );
        });
        """
        return http.request.make_response(js, [('Content-Type', 'text/javascript')])

    def get_icon(self, field_icon, company):
        pwa_config = http.request.env['sh.pwa.config'].sudo().search(
            [('company_id', '=', int(company))], limit=1)
        if pwa_config:
            icon = pwa_config.icon
            if field_icon == 'icon_small':
                icon = pwa_config.icon_small

#             icon = getattr(pwa_config, field_icon)
            icon_mimetype = getattr(pwa_config, field_icon + '_mimetype')
            if icon:
                icon = BytesIO(base64.b64decode(icon))
            return http.request.make_response(
                icon.read(), [('Content-Type', icon_mimetype)])

    @http.route('/sh_backmate_theme/pwa_icon/<string:cid>', type='http', auth="none")
    def icon_small(self, **post):
        company = post.get('cid')
        return self.get_icon('icon', company)

    @http.route('/sh_backmate_theme/pwa_icon_small/<string:cid>', type='http', auth="none")
    def icon(self, **post):
        company = post.get('cid')
        return self.get_icon('icon_small', company)


    @http.route('/iphone.json/<string:cid>', type='http', auth="public")
    def iphone_http(self,**post):
        company = post.get('cid')
        pwa_config = http.request.env['sh.pwa.config'].sudo().search([('company_id','=',int(company))] , limit=1)
        if pwa_config:
            icon = pwa_config.icon_iphone
            icon_mimetype = getattr(pwa_config, 'icon' + '_mimetype')
            if icon:
                icon = BytesIO(base64.b64decode(icon))
                return http.request.make_response(
                    icon.read(), [('Content-Type', icon_mimetype)])

