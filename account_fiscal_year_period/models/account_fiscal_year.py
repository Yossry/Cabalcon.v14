# -*- coding: utf-8 -*-

from odoo.exceptions import ValidationError
from odoo import api, fields, models, _


class AccountFiscalYear(models.Model):
    _name = 'account.fiscal.year'
    _description = 'Año Fiscal'

    name = fields.Char(string='Año Fiscal', required=True)
    date_from = fields.Date(string='Fecha inicial', required=True)
    date_to = fields.Date(string='Fecha final', required=True)
    company_id = fields.Many2one('res.company', string='Empresa', required=True, default=lambda self: self.env.company)

    @api.constrains('date_from', 'date_to', 'company_id')
    def _check_dates(self):
        for fy in self:
            # Starting date must be prior to the ending date
            date_from = fy.date_from
            date_to = fy.date_to
            if date_to < date_from:
                raise ValidationError(_('La Fecha final no debe ser menor a la Fecha inicial.'))
            domain = [
                ('id', '!=', fy.id),
                ('company_id', '=', fy.company_id.id),
                '|', '|',
                '&', ('date_from', '<=', fy.date_from), ('date_to', '>=', fy.date_from),
                '&', ('date_from', '<=', fy.date_to), ('date_to', '>=', fy.date_to),
                '&', ('date_from', '<=', fy.date_from), ('date_to', '>=', fy.date_to),
            ]
            if self.search_count(domain) > 0:
                raise ValidationError(_('No puede haber una superposición entre dos Años Fiscales. '
                                        'Ingrese correctamente la Fecha inicial y / o final de sus Años Fiscales.'))
