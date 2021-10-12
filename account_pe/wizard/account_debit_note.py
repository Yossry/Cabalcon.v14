# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.tools.translate import _
from odoo.exceptions import UserError


class AccountDebitNote(models.TransientModel):
    _inherit = 'account.debit.note'

    def _prepare_default_values(self, move):
        res = super()._prepare_default_values(move)
        res['is_note_debit'] = True
        return res