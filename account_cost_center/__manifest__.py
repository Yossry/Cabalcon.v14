# -*- coding: utf-8 -*-

{
    'name': 'Centro de Costo',
    'summary': 'Centro de Costo en Facturación y Contabilidad',
    'description': """
        Habilitar Centro de Costo en Facturación y Contabilidad.
    """,

    'author': 'Oswaldo Lopez S. / TH (Cabalcon S.A.C.)',
    'website': 'http://www.cabalcon.com',

    'category': 'Accounting',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['account'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'security/account_cost_center_security.xml',
        'views/product.xml',
        'views/account_cost_center.xml',
        'views/account_move.xml',
    ],

}
