# -*- coding: utf-8 -*-
{
    'name': "Cuentas Bancarias del Socio",

    'summary': """
        Se agrega una lengueta en Partner relacionado a
        sus cuentas Bancarias para Pagos.""",

    'description': """
    Modulo que agrega al Partner el registro de su(s) Cuenta(s) Bancaria(s).
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Accounting',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['contacts','account'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/res_partner_bank_view.xml',
        'views/res_partner_view.xml',
    ],
}