# -*- coding: utf-8 -*-
{
    'name': "Validación de RUC y DNI en Partner",

    'summary': """
        Valida RUC y DNI para Perú""",

    'description': """
        Valida RUC con la SUNAT en el modulo de Partner.\n
        Valida DNI con la RENIEC en el modulo de Partner.\n
        Configurar:\n
        - Ajustes / Empresa / Activar el token de APIsPERU.\n
        - Contactos / Configuración / Tipos de Identificación.
    """,

    'author': "TH",
    'website': "http://www.cabalcon.com",

    'category': 'Partners',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['account', 'l10n_pe', 'partner_is_customer_vendor', 'l10n_latam_base'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/res_partner_view.xml',
        'views/res_company_view.xml',
    ],
}
