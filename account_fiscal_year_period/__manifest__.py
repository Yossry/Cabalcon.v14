# -*- coding: utf-8 -*-
{
    'name': "Año Fiscal y Periodo Contable",

    'summary': """
        Permitir crear Año fiscal y Periodo Contable, con capacidad para abrir/ cerrar cada mes.
    """,

    'description': 
    """
        Permitir crear Año fiscal y Periodo Contable, con capacidad para abrir/ cerrar cada mes.
    """
    ,

    'author': "TH",
    'website': "https://www.cabalcon.com",

    'category': 'Accounting',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['account'],

    # always loaded
    'data': [
        'security/groups.xml',
        'security/ir.model.access.csv',
        'views/fiscal_year.xml',
        'views/views.xml',
        'data/account_fiscal_sequence.xml'
    ],
    # only loaded in demonstration mode
    "images":  ['static/description/icon.png'],
    'installable': True,
    'application': True,
    'license': "AGPL-3",
}
