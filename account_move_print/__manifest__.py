# -*- coding: utf-8 -*-
{
    'name': "Imprimir Asiento Contable",

    'summary': """
        Imprimir el Asiento Contable con su detalle""",

    'description': """
        Imprimir el Asiento Contable con su detalle desde el Treeview y el Formulario.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Accounting',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['account'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'report/report_journal_entries.xml',
        'report/report_journal_entries_view.xml',
    ],
}
