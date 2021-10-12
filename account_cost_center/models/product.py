# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class ProductCategory(models.Model):
    _inherit = "product.category"

    cost_center_income_categ_id = fields.Many2one('account.cost.center', string='Cost Center Income', 
        help='Cost Center Income by default in Product Category')
    cost_center_expense_categ_id = fields.Many2one('account.cost.center', string='Cost Center Expense', 
    	help='Cost Center Expense by default in Product Category')
        
class ProductTemplate(models.Model):
    _inherit = "product.template"

    cost_center_income_id = fields.Many2one('account.cost.center', string='Cost Center Income', 
    	help='Cost Center Income by default in Product')
    cost_center_expense_id = fields.Many2one('account.cost.center', string='Cost Center Expense', 
    	help='Cost Center Expense by default in Product')
