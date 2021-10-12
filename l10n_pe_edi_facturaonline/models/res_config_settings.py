# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    l10n_pe_edi_endpoint_facturaonline = fields.Char(
        string="EndPoint FacturaOnline",
        related="company_id.l10n_pe_edi_endpoint_facturaonline",
        readonly=False,
        help="EndPoint FacturaOnline")

    l10n_pe_edi_acces_key = fields.Char(
        string="Acces Key",
        related="company_id.l10n_pe_edi_acces_key",
        readonly=False)

    l10n_pe_edi_secret_key = fields.Char(
        string="Secret Key",
        related="company_id.l10n_pe_edi_secret_key",
        readonly=False)