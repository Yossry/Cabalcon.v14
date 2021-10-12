# -*- coding: utf-8 -*-
{
    'name': "Habilitar PIN en Usuarios",

    'summary': """
        Habilitar PIN en usuarios""",

    'description': """
        Habilitar PIN en usuarios el cual se encuentra registrado en el Modulo de Empleados.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Extra Tools',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['base','hr'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/res_users_view.xml',
    ],
}
