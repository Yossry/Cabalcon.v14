# -*- coding: utf-8 -*-
{
    'name' : "Tipo de cambio Peru",
    'summary': "Registro de Tipo de Cambio en formato peruano.",
    'description' : """
        Registro de tipo de cambio en moneda\n
        ====================================\n\n
        Registra el tipo de cambio en formato peruano:\n
        ANTES:\n
        - S/. 1 = S/. 1\n
        - $ 1 = S/. 0.30769\n
        AHORA:\n
        - S/. 1 = S/. 1\n
        - $ 1 = S/. 3.25\n
        """,
    'author' : "Jose Balbuena A. / TH (Cabalcon S.A.C.)",
    'website': "http://www.cabalcon.com",

    'category' : 'Accounting',
    'version' : '1.1',

    # any module necessary for this one to work correctly
    'depends' : ['account'],
    
    # always loaded
    'data': [
    	'data/account_data.xml',
        'views/res_currency_view.xml',
    ],

}
