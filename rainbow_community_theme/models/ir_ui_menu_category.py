# -*- coding: utf-8 -*-

from odoo import api, fields, models, tools, _


class IrUiMenuCategory(models.Model):
    _name = "ir.ui.menu.category"
    _description = "Menu Category"
    _order = "sequence"
    
    name = fields.Char(string='Name',translate=True, required=True)
    sequence = fields.Integer(string='Sequence',default=0)
    menu_id = fields.One2many('ir.ui.menu', 'category_id', string="Menu Items")
    
    
    @api.model
    def get_menu_category(self):
        categories = self.env['ir.ui.menu.category'].search_read([('menu_id', '!=', False)],order="sequence")
        return categories