# -*- coding: utf-8 -*-
{
    'name': "SuperTool Technologies",

    'summary': """
        SuperTool Technologies""",

    'description': """
        Para instalar SuperTool Technologies, se debe hacer lo siguiente:\n
        1) En Proyectos - Configuración: Activar Hoja de Tiempo (Se instalará en automático el Addon hr_timesheet y sale_timesheet).\n
        2) Desinstalar el Addon: sale_timesheet, para evitar conflictos si el Sale Order no lo usa para Facturar Horas Hombre.\n
        3) Proceder a instalar el Addon: SuperTool.""",

    'author': "TH",
    'website': "http://www.cabalcon.com.pe",

    'category': 'SuperTool Technologies',
    'version': '1.1',

    # any module necessary for this one to work correctly
    'depends': ['base','base_setup','mail','calendar','crm', 'project','board', 'hr_timesheet'],

    # always loaded
    'data': [
    	'wizard/supertool_wizard.xml',
    	'security/ir.model.access.csv',
    	'report/supertool_report.xml',
    	'views/board_supertool_view.xml',
    	'views/supertool_view.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
