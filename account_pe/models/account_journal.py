# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models, fields

class AccountJournal(models.Model):
    _inherit = 'account.journal'

    serie = fields.Char(string='Serie', size=4)
    l10n_latam_document_type_id = fields.Many2one('l10n_latam.document.type', string='Tipo de documento')
    sale_ple = fields.Boolean(string='Activar PLE de ventas', help="Activar el diario para el reporte de PLE de ventas")
    purchase_ple = fields.Boolean(string='Activar PLE de compras', help="Activar el diario para el reporte de PLE de compras")