# -*- coding: utf-8 -*-
{
    'name': "Compras con Proveedor",

    'summary': """
        Socios que son Proveedores para Compras""",

    'description': """
        Filtra los socios que son Proveedores para Compras.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Inventory/Purchase',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['purchase','partner_is_customer_vendor'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
    ],
}
