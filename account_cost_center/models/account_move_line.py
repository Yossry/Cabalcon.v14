# -*- coding: utf-8 -*-

from odoo import models, fields, api

class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    cost_center_id = fields.Many2one('account.cost.center', index=True, string='Cost Center')

    #Trae el Centro de Costo configurado por defecto en el producto
    @api.onchange('product_id')
    def _onchange_product_id(self):
        cost_center_val = None
        res = super(AccountMoveLine, self)._onchange_product_id()
        if self.product_id and self.move_id.move_type in ('out_invoice', 'out_refund','out_receipt'): #Ingreso
            cost_center_val = self.product_id.cost_center_income_id or self.product_id.categ_id.cost_center_income_categ_id or None

        elif self.product_id and self.move_id.move_type in ('in_invoice', 'in_refund', 'in_receipt'): #Gasto
            cost_center_val = self.product_id.cost_center_expense_id or self.product_id.categ_id.cost_center_expense_categ_id or None

        if cost_center_val:
            self.cost_center_id = cost_center_val.id
        else:
            self.cost_center_id = None
        return res