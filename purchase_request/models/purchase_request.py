# -*- coding: utf-8 -*-

from odoo import api, fields, models, api, _
from datetime import datetime
from odoo.exceptions import AccessError, UserError, ValidationError


class PurchaseRequest(models.Model):
    _name = "purchase.request"
    _inherit = ['mail.thread', 'mail.activity.mixin', 'portal.mixin']
    _description = 'Solicitud de Compra'
    _rec_name = 'name_seq'

    READONLY_STATES = {
        'confirm': [('readonly', True)],
        'accept': [('readonly', True)],
        'rejected': [('readonly', True)],
    }

    @api.model
    def _getUserGroupId(self):
        return [('groups_id', '=', self.env.ref('purchase.group_purchase_manager').id)]

    name_seq = fields.Char(string="Solicitud de Compra", required=True, copy=False, readonly=True, index=True, default=lambda self: _('Nuevo'))
    company_id = fields.Many2one('res.company', string='Compañía', required=True, index=True, 
        states=READONLY_STATES, readonly=False, default=lambda self: self.env.company.id)
    date_request = fields.Datetime(string='Fecha de Solicitud', required=True, index=True, copy=False,
        default=datetime.today(), readonly=False, states=READONLY_STATES, track_visibility='always')
    approver_id = fields.Many2one('res.users', string='Aprobador',  domain=_getUserGroupId, readonly=False, 
        states=READONLY_STATES, track_visibility='always')
    description = fields.Text(string="Descripción", required=True, readonly=False, states=READONLY_STATES, track_visibility='always')
    user_id = fields.Many2one('res.users', string='Solicitante', index=True, track_visibility='onchange', readonly=False,
        states=READONLY_STATES, default=lambda self: self.env.user)
    purchase_order_id = fields.One2many('purchase.order', 'purchase_request_id', string='Ref. Orden de Compra', copy=True, auto_join=True, 
        states=READONLY_STATES)
    state = fields.Selection([
        ('draft', 'Borrador'),
        ('confirm', 'Confirmado'),
        ('accept', 'Aceptado'),
        ('rejected', 'Rechazado')], string='Estado', default='draft', readonly=True, track_visibility='always')


    #Se genera la secuencia
    @api.model
    def create(self, vals):
        if vals.get('name_seq', 'Nuevo') == 'Nuevo':
            if 'company_id' in vals and vals['company_id']:
                vals['name_seq'] = self.env['ir.sequence'].with_context(force_company=vals['company_id']).next_by_code('purchase.request') or '/'
            else:
                vals['name_seq'] = self.env['ir.sequence'].next_by_code('purchase.request') or '/'
        return super(PurchaseRequest, self).create(vals)


    @api.depends()
    def action_toapprove(self):
        for rec in self:
            rec.state = 'confirm'

    def action_approve(self):
        for rec in self:
            rec.state = 'accept'

    def action_reject(self):
        for rec in self:
            rec.state = 'rejected'

    def action_purchase(self):
        for rec in self:
            rec.state = 'confirm'
        self.ensure_one()
        res_model_id = self.env['ir.model'].search([('name', '=', self._description)]).id
        self.env['mail.activity'].create([{'activity_type_id': 4,
                                           'date_deadline': datetime.today(),
                                           'summary': "Solicitud de Compra",
                                           'user_id': self.approver_id.id,
                                           'res_id': self.id,
                                           'res_model_id': res_model_id,
                                           'note': 'Requerimiento de Compra',
                                           }])

    def button_approve(self, context=None):
        for rec in self:
            rec.state = 'accept'
        return {
            "type": "ir.actions.act_window",
            "res_model": "purchase.order",
            "views": [[False, "form"]],
            'view_type': 'form',
            'view_mode': 'form',
            'context': {'default_purchase_inhrt_id': self.approver_id.id,
                        'default_new_id': self.name_seq,
                        'default_purchase_request_ids': self.id,
                        },
        }

    def button_convert(self):
        for rec in self:
            rec.state = 'confirm'

    def button_cancel(self):
        for rec in self:
            rec.state = 'rejected'

    def button_create(self):
        for rec in self:
            rec.write({'state': 'accept'})


class PurchaseOrderInherit(models.Model):
    _inherit = "purchase.order"

    purchase_inhrt_id = fields.Many2one('res.users', string='Aprobador')
    purchase_request_id = fields.Many2many('purchase.request', 'purchase_request_purchase_order_rel', 'purchase_order_id', 'purchase_request_id', 
        string="Ref. Solicitud de Compra", copy=False)
