# -*- coding: utf-8 -*-
{
    'name': "Solicitud de Compra",

    'summary': """
        Generar Solicitud de Compra para luego convertirse en Orden de Compra""",

    'description': """
        Generar Solicitud de Compra para luego convertirse en Orden de Compra mediante aprobación.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Purchases',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['purchase'],

    # always loaded
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/purchase_request_view.xml',
    ],
}
