# -*- coding: utf-8 -*-

{
    'name': "Hide Action/Print Buttons",

    'summary': """
        This module give user restriction to Show/Hide Action/Print buttons per user""",

    'description': """
        This module help to give permission to user to show Action/Print buttons in all modules
    """,

    'author': "Codoo",
    'license': 'LGPL-3',
    # for the full list
    'category': 'Tools',
    'version': '14.0',

    # any module necessary for this one to work correctly
    'depends': ['base','web'],
    
    'qweb': [
        "static/src/xml/base.xml",
    ],
    # always loaded
    'data': [
        'views/templates.xml',
        'security/security.xml',
    ],
    "images": ['static/description/icon.png'],

}
