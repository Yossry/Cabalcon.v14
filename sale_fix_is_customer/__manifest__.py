# -*- coding: utf-8 -*-
{
    'name': "Ventas con Cliente",

    'summary': """
        Socios que son Clientes para Ventas""",

    'description': """
        Filtra los socios que son Clientes para Ventas.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Sales/Sales',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['sale_management','partner_is_customer_vendor'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
    ],
}
