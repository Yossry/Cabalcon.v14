# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models


class ResCompany(models.Model):
    _inherit = 'res.company'

    l10n_pe_edi_provider = fields.Selection(selection_add=[('facturaonline', 'FacturaOnline')])
    l10n_pe_edi_endpoint_facturaonline = fields.Char(
        string="EndPoint FacturaOnline",
        help="EndPoint FacturaOnline")
    l10n_pe_edi_acces_key = fields.Char(
        string="Acces Key")
    l10n_pe_edi_secret_key = fields.Char(
        string="Secret Key")



