# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_customer = fields.Boolean(string='Cliente', help="Clic en esta casilla si el Socio es un Cliente.")
    is_supplier = fields.Boolean(string='Proveedor', help="Clic en esta casilla si el Socio es un Proveedor.")
