# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Account alternative invoice line',
    'depends': ['account'],
    'description': """
Linea alternativa para envio a Sunat en detalle de facturas
    """,
    'author': "Oswaldo Lopez S. (Cabalcon S.A.C.)",
    'website': "http://www.cabalcon.com.pe",
    'category': 'Accounting/Accounting',
    'data': [
        'security/ir.model.access.csv',
        'views/account_move_view.xml',
    ],
    'application': False,
    'auto_install': False
}
