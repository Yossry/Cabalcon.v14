# -*- coding: utf-8 -*-

import json
import logging
import math
import re
import time

from odoo import api, fields, models, tools, _
from odoo.addons import decimal_precision as dp
from odoo.exceptions import UserError

TYPES = [('purchase','Compra'),('sale','Venta')]
ENTIDAD = [('sunat','SUNAT'),('sbs','SBS'),('bancario','BANCARIO'),('otros','OTROS')]

class Currency(models.Model):
    _inherit = "res.currency"
    _description = "Currency"
    
    rate_pe = fields.Float(compute='_compute_current_rate_pe', string='Cambio del dia', digits=dp.get_precision('Tipo Cambio'),
                        help='Tipo de cambio del dia en formato peruano.')
    type = fields.Selection(TYPES, string='Tipo', default='sale')
    entidad = fields.Selection(ENTIDAD, string='Entidad')
    show_name = fields.Char(string='Nombre a mostrar', size=3)
    
    #Se obtiene el TC por empresa / fecha ::TH
    def _get_rates_pe(self, company_id, date):
        #Query para obtener el tipo de cambio
        query = """SELECT c.id,
                          COALESCE((SELECT r.rate_pe FROM res_currency_rate r
                                  WHERE r.currency_id = c.id AND r.name <= %s
                                    AND (r.company_id IS NULL OR r.company_id = %s)
                               ORDER BY r.company_id, r.name DESC
                                  LIMIT 1), 1.0) AS rate_pe
                   FROM res_currency c
                   WHERE c.id IN %s"""
        self._cr.execute(query, (date, company_id, tuple(self.ids)))
        currency_rates = dict(self._cr.fetchall())
        return currency_rates


    # Tipo de cambio PERU actual
    #@api.multi
    @api.depends('rate_ids.rate') #activamos la dependencia res.currency.rate :: TH
    def _compute_current_rate_pe(self):
        date = self._context.get('date') or fields.Date.today()
        company_id = self._context.get('company_id') #or self.env['res.users']._get_company().id
        currency_rates = self._get_rates_pe(company_id, date) #Se separa en otra funcion ::TH
        # the subquery selects the last rate before 'date' for the given currency/company
        #query = """SELECT c.id, (SELECT r.rate_pe FROM res_currency_rate r
        #                          WHERE r.currency_id = c.id AND r.name <= %s
        #                            AND (r.company_id IS NULL OR r.company_id = %s)
        #                       ORDER BY r.company_id, r.name DESC
        #                          LIMIT 1) AS rate_pe
        #           FROM res_currency c
        #           WHERE c.id IN %s"""
        #self._cr.execute(query, (date, company_id, tuple(self.ids)))
        #currency_rates = dict(self._cr.fetchall())
        for currency in self:
            currency.rate_pe = currency_rates.get(currency.id) or 1.0
    
    # Agrega tipo de moneda en nombre
    #@api.multi
    def name_get(self):
        #return [(currency.id, tools.ustr(currency.name + ' - ' + dict(TYPES)[currency.type])) for currency in self]
        result = []
        for curr in self:
            #c_name = curr.name and curr.name or ''
            c_name = curr.show_name and curr.show_name or ''
            c_name += curr.entidad and ' ' + dict(curr._fields['entidad'].selection).get(curr.entidad) or ''
            c_name += curr.type and ' - ' + dict(curr._fields['type'].selection).get(curr.type) or ''
            result.append((curr.id, c_name ))
        return result
       
    
    _sql_constraints = [
        ('unique_name', 'unique (name,entidad,type)', 'Solo puede existir una moneda con el mismo tipo de cambio!'),
        ('rounding_gt_zero', 'CHECK (rounding>0)', 'El factor de redondeo debe ser mayor que 0!')
    ]

class CurrencyRate(models.Model):
    _inherit = "res.currency.rate"
    _description = "Currency Rate"

    rate_pe = fields.Float(string='Cambio', digits=dp.get_precision('Tipo Cambio'), 
        help='Tipo de cambio en formato peruano. Ejm: 3.25 si $1 = S/. 3.25')
    type = fields.Selection(related="currency_id.type", store=True)
    entidad = fields.Selection(related="currency_id.entidad", store=True)
    
    @api.onchange('rate_pe')
    def onchange_rate_pe(self):
        if self.rate_pe > 0:
            self.rate = 1 / self.rate_pe
