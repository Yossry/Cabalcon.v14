# -*- coding: utf-8 -*-

from odoo import models, fields, api,_
from dateutil.relativedelta import relativedelta
from odoo.exceptions import UserError, ValidationError

class AccountFiscalyear(models.Model):
    _name = "account.fiscalyear.periods"
    _inherit = ['mail.thread']
    _description = "Año y Periodo Contable"
    _rec_name = 'fiscal_year_id'

    fiscal_year_id = fields.Many2one('account.fiscal.year', string='Año Fiscal', required=True, tracking=True)
    code = fields.Char(string='Código', required=True, tracking=True, readonly=True)
    company_id = fields.Many2one('res.company', related='fiscal_year_id.company_id', string='Empresa', store=True, tracking=True)
    date_start = fields.Date(string='Fecha inicial', related='fiscal_year_id.date_from', store=True, tracking=True)
    date_stop = fields.Date(string='Fecha final', related='fiscal_year_id.date_to', store=True, tracking=True)
    period_ids = fields.One2many('account.month.period', 'fiscalyear_id', string='Periodos', tracking=True)
    state = fields.Selection(
        [('draft', 'Borrador'),
         ('open', 'Abierto'),
         ('done', 'Cerrado')], string='Estado', readonly=True, default='draft', tracking=True)
    comments = fields.Text('Nota')

    @api.onchange('fiscal_year_id')
    def _onchange_fiscal_year_id(self):
        if self.fiscal_year_id:
            self.code = 'FY/'+str(self.fiscal_year_id.name)

    @api.model
    def create(self, vals):
        return super(AccountFiscalyear, self).create(vals)

    def open(self):
        for rec in self:
            rec.period_ids.write({'special':True})
            rec.write({'state':'open'})

    def set_to_draft(self):
        for rec in self:
            rec.write({'state':'draft'})

    def done(self):
        for rec in self:
            rec.period_ids.write({'special':False})
            rec.write({'state':'done'})        

    '''@api.multi
    @api.constrains('date_start','date_stop')
    def _check_period(self):
        for rec in self:
            if rec.date_start and rec.date_stop:
                if rec.date_start > rec.date_stop:
                    raise ValidationError(_('The start date must be before end date.'))
                fiscal_rec_start = self.search([('date_start','<=',rec.date_start),('date_stop','>=',rec.date_start),('id','!=',rec.id)])
                if fiscal_rec_start:
                    raise ValidationError(_('The start date is within other fiscal year period.'))
                fiscal_rec_end = self.search([('date_start','<=',rec.date_stop),('date_stop','>=',rec.date_stop),('id','!=',rec.id)])
                if fiscal_rec_end:
                    raise ValidationError(_('The end date is within other fiscal year period.'))'''
    _sql_constraints = [('fiscalyear_uniq', 'unique(fiscal_year_id)', 'El Año Fiscal debe ser único!')]            

    @api.constrains('date_start', 'date_stop', 'company_id')
    def _check_dates(self):
        for fy in self:
            # Starting date must be prior to the ending date
            date_from = fy.date_start
            date_to = fy.date_stop
            if date_to < date_from:
                raise ValidationError(_('La Fecha final no debe ser menor a la Fecha inicial.'))
            domain = [
                ('id', '!=', fy.id),
                ('company_id', '=', fy.company_id.id),
                '|', '|',
                '&', ('date_start', '<=', fy.date_start), ('date_stop', '>=', fy.date_start),
                '&', ('date_start', '<=', fy.date_stop), ('date_stop', '>=', fy.date_stop),
                '&', ('date_start', '<=', fy.date_start), ('date_stop', '>=', fy.date_stop),
            ]

            if self.search_count(domain) > 0:
                raise ValidationError(_('No puede haber una superposición entre dos Años Fiscales. '
                                        'Ingrese correctamente la Fecha inicial y / o final de sus Años Fiscales.'))
    def create_periods(self):
        period_obj = self.env['account.month.period']
        for rec in self:
            rec.period_ids.unlink()
            start_date = fields.Date.from_string(rec.date_start)
            end_date = fields.Date.from_string(rec.date_stop)
            index = 1
            while start_date < end_date:
                de = start_date + relativedelta(months=1, days=-1)

                if de > end_date:
                    de = end_date

                period_obj.create({
                    'sequence': index,
                    'code': '%02d/' % int(index) + start_date.strftime('%Y'),
                    'date_start': start_date.strftime('%Y-%m-%d'),
                    'date_stop': de.strftime('%Y-%m-%d'),
                    'fiscalyear_id': rec.id,
                })
                start_date = start_date + relativedelta(months=1)
                index += 1

class AccountMonthPeriod(models.Model):
    _name = "account.month.period"
    _description = "Periodo Contable"
    _inherit = ['mail.thread']
    _order = "date_start asc"

    sequence = fields.Integer(string='Secuencia', default=1)
    code = fields.Char(string='Código', size=14, tracking=True)
    special = fields.Boolean(string='Apertura/Cierre de Periodo', tracking=True, 
        help='Este campo indica si esta ABIERTO o CERRADO el Periodo:\n - Con Check: Periodo Abierto\n- Sin Check: Periodo Cerrado')
    date_start = fields.Date(string='Fecha inicial', required=True, tracking=True)
    date_stop = fields.Date(string='Fecha final', required=True, tracking=True)
    fiscalyear_id = fields.Many2one('account.fiscalyear.periods', string='Año Fiscal', select=True, tracking=True)
    company_id = fields.Many2one('res.company',string='Empresa',related='fiscalyear_id.company_id')

    def get_closest_open_date(self,dates):
        period = self.sudo().search([('date_start', '<=', dates), ('date_stop', '>=', dates),('special','=',True)])
        if period:
            return dates
        else:
            period = self.sudo().search([('date_start', '>=', dates),('special','=',True)],limit=1)
            if period:
                return period.date_start
            else:
                return dates

    def get_closest_open_by_period(self,dates):
        period = self.sudo().search([('date_start', '<=', dates), ('date_stop', '>=', dates),('special','=',True)])
        if period:
            return {'date_from':period['date_start'],'date_to':period['date_stop']}
        else:
            period = self.sudo().search([('special','=',True)],order='date_start desc',limit=1)
            if period:
                return {'date_from':period['date_start'],'date_to':period['date_stop']}    
            else:          
                return False          
                 
class AccountMove(models.Model):
    _inherit = 'account.move'

    def _check_fiscalyear_lock_date(self):
        res = super(AccountMove, self)._check_fiscalyear_lock_date()
        if res:
            for rec in self:
                fiscal_year_obj = self.env['account.fiscalyear.periods']
                period_obj = self.env['account.month.period']
                fiscal_rec = fiscal_year_obj.sudo().search([('date_start','<=',rec.date),('date_stop','>=',rec.date)])
                if not fiscal_rec:
                    raise ValidationError(_('La fecha debe estar dentro del Periodo del Año Fiscal'))
                elif fiscal_rec.state == 'open':
                    period_rec = period_obj.sudo().search([('date_start', '<=', rec.date), ('date_stop', '>=', rec.date)])
                    if not period_rec:
                        raise ValidationError(_('La fecha debe estar dentro del Periodo de duración.'))
                    elif not period_rec.special:
                        raise ValidationError(_('El Período del Año Fiscal está CERRADO'))
                    else:return True
                else:raise ValidationError(_('El Año Fiscal debe estar ABIERTO primero'))
        else: return res                         
