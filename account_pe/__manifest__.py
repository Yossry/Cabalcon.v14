# -*- coding: utf-8 -*-
{
    'name': 'Account normalice peruvian',
    'description': """
	Arreglos en contabilidad para peru
    """,
    'author': "Oswaldo Lopez S. (Cabalcon S.A.C.)",
    'category': 'Accounting',
    'depends': ['account','l10n_pe_edi'],
    'data': [
        'views/account_move_view.xml',
        'views/account_journal.xml',
        'views/l10n_latan_document_type_view.xml',
    ],
    'application': False,
    'auto_install': False
}
