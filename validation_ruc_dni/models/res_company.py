# -*- coding: utf-8 -*-

from odoo import models, fields

class ResCompany(models.Model):
    _inherit = 'res.company'

    search_api_peru = fields.Boolean(string="Consultar Socios en APIsPERU",
        help="Activar para consultar datos de RUC y DNI en la Base de Datos de APIsPERU")
    token_api_peru = fields.Char(string="Token APIsPERU",
        help="Ingresar el Token proveído por APIsPERU al registrarse en su Web")
