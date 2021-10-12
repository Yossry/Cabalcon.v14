# -*- coding: utf-8 -*-
{
    'name': "Activar Cliente / Proveedor en Socio",

    'summary': """
        Activar si es Cliente / Proveedor en Socio""",

    'description': """
        Activar si es Cliente / Proveedor en el módulo de Partner.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Tools',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['contacts'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/res_partner_views.xml',
    ],
}
