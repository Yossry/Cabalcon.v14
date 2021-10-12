# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Invoice electronic for FacturaOnline',
    'depends': ['account','l10n_pe_edi','account_alternative_invoice_line'],
    'description': """
Envio de facturacion electonica con FacturaOnline
    """,
    'author': "Oswaldo Lopez S. (Cabalcon S.A.C.)",
    'website': "http://www.cabalcon.com.pe",
    'category': 'Accounting',
    'data': [
        #'security/ir.model.access.csv',
        'views/res_config_settings_views.xml',
    ],
    'application': False,
    'auto_install': False
}
