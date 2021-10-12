# -*- coding: utf-8 -*-

from odoo import models, fields, api

class AccountInvoice(models.Model):
    _inherit = "account.move"
    _description = "Amount paid in Invoice"

    paid_amount = fields.Monetary(string='Paid Amount', compute='_compute_paid_amount', store=True, help="Amount paid in invoice currency")
    paid_amount_company = fields.Monetary(string='Paid Amount company', compute='_compute_paid_amount', store=True, 
    	currency_field='company_currency_id', help="Amount paid in company currency")

    @api.depends('amount_residual')
    def _compute_paid_amount(self):
        for inv in self:
            inv.paid_amount = 0.0
            inv.paid_amount_company = 0.0
            if inv.state != 'draft':
                inv.paid_amount = abs(inv.amount_total) - abs(inv.amount_residual)
                inv.paid_amount_company = abs(inv.amount_total_signed) - abs(inv.amount_residual_signed)

