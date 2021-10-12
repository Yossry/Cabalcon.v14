# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Account view detraction invoice',
    'depends': ['l10n_pe_edi'],
    'description': """
Detraccion en facturas
    """,
    'category': 'Accounting/Accounting',
    'data': [
        'views/account_move_view.xml',
    ],
    'application': False,
    'auto_install': False
}
