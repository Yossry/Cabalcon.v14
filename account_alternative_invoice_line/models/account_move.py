
from odoo import api,fields,models,_
from odoo.exceptions import RedirectWarning, UserError, ValidationError, AccessError


class AccountMove(models.Model):
    _inherit = "account.move"

    @api.depends('invoice_line_ids2', 'invoice_line_ids2.price_unit')
    def _compute_amount2(self):
        subtotal2_val = 0
        if self.invoice_line_ids2:
            for ail2 in self.invoice_line_ids2:
                subtotal2_val += ail2.price_unit
        self.subtotal2 = subtotal2_val

    invoice_line_ids2 = fields.One2many('account.move.line.alternative', 'move_id', string='Invoice lines',
                                       copy=False, readonly=True,
                                       states={'draft': [('readonly', False)]})

    subtotal2 = fields.Monetary(string='Subtotal Alterno', store=True, compute='_compute_amount2', copy=False)

    @api.model
    def create(self, vals):
        # OVERRIDE
        rslt = super(AccountMove, self).create(vals)
        if vals.get('invoice_line_ids2'):
            if vals.get('invoice_line_ids'):
                if rslt.amount_untaxed != rslt.subtotal2:
                    raise UserError(_('Error de Creación!\nNo puedes crear una Factura que tenga el Sub-Total de la Factura Alterna distinto al Sub-Total de las Lineas de Factura.'))
            else:
                raise UserError(_('Error de Creación!\nNo puedes crear una Factura que tenga Sub-Total de Factura Alterna y no tenga Lineas de Factura.'))
        return rslt

    def write(self, vals):
        res = super(AccountMove,self).write(vals)
        if res:
            if self.invoice_line_ids2:
                if self.amount_untaxed != self.subtotal2:
                    raise UserError(
                        _('Error de Creación!\nNo puedes crear una Factura que tenga el Sub-Total de la Factura Alterna distinto al Sub-Total de las Lineas de Factura.'))


class account_invoice_line2(models.Model):
    _name = "account.move.line.alternative"
    _description = "Alternative Invoice Line"
    _order = "sequence,id"

    sequence = fields.Integer('Secuencia')
    name = fields.Text('Descripción', required=True)
    move_id = fields.Many2one('account.move', string='Journal Entry',
                              index=True, required=True, readonly=True, auto_join=True, ondelete="cascade",
                              check_company=True, invisible="1",
                              help="The move of this entry line.")
    price_unit = fields.Float(string='Subtotal', required=True)
    quantity = fields.Float(string='Cantidad',
                            default=1.0, digits='Product Unit of Measure',
                            help="The optional quantity expressed by this line, eg: number of product sold. "
                                 "The quantity is not a legal requirement but is very useful for some reports.")
    tax_ids = fields.Many2many(comodel_name='account.tax',
                               string="Impuestos",
                               context={'active_test': False},
                               check_company=True,
                               help="Taxes that apply on the base amount")