
from odoo import api,fields,models,_
from odoo.exceptions import RedirectWarning, UserError, ValidationError, AccessError


class AccountMove(models.Model):
    _inherit = "account.move"

    purchase_order = fields.Char(string='Orden de Compra', size=20)
    account_id = fields.Many2one('account.account', string='Cuenta')
    is_note_debit = fields.Boolean(string='Es Nota de Debito')

    # @api.depends('l10n_latam_available_document_type_ids', 'debit_origin_id','journal_id')
    # def _compute_l10n_latam_document_type(self):
    #     debit_note = self.debit_origin_id
    #     for rec in self.filtered(lambda x: x.state == 'draft'):
    #         document_types = rec.l10n_latam_available_document_type_ids._origin
    #         document_types = debit_note and document_types.filtered(
    #             lambda x: x.internal_type == 'debit_note') or document_types
    #         rec.l10n_latam_document_type_id = document_types and document_types[0].id


    @api.onchange('partner_id')
    def _onchange_partner_id2(self):


        existing_terms_lines = self.line_ids.filtered(lambda line: line.account_id.user_type_id.type in ('receivable', 'payable'))
        account = self._get_payment_terms_account(payment_terms_lines=existing_terms_lines)
        self.account_id = account

    def _get_payment_terms_account(self, payment_terms_lines=False):
        ''' Get the account from invoice that will be set as receivable / payable account.
        :param self:                    The current account.move record.
        :param payment_terms_lines:     The current payment terms lines.
        :return:                        An account.account record.
        '''
        if payment_terms_lines:
            # Retrieve account from previous payment terms lines in order to allow the user to set a custom one.
            return payment_terms_lines[0].account_id
        elif self.partner_id:
            # Retrieve account from partner.
            if self.is_sale_document(include_receipts=True):
                return self.partner_id.property_account_receivable_id
            else:
                return self.partner_id.property_account_payable_id
        else:
            # Search new account.
            domain = [
                ('company_id', '=', self.company_id.id),
                ('internal_type', '=', 'receivable' if self.move_type in ('out_invoice', 'out_refund', 'out_receipt') else 'payable'),
            ]
            return self.env['account.account'].search(domain, limit=1)


    def _recompute_payment_terms_lines(self):
        ''' Compute the dynamic payment term lines of the journal entry.'''
        self.ensure_one()
        self = self.with_company(self.company_id)
        in_draft_mode = self != self._origin
        today = fields.Date.context_today(self)
        self = self.with_company(self.journal_id.company_id)

        def _get_payment_terms_computation_date(self):
            ''' Get the date from invoice that will be used to compute the payment terms.
            :param self:    The current account.move record.
            :return:        A datetime.date object.
            '''
            if self.invoice_payment_term_id:
                return self.invoice_date or today
            else:
                return self.invoice_date_due or self.invoice_date or today

        def _get_payment_terms_account(self, payment_terms_lines):
            ''' Get the account from invoice that will be set as receivable / payable account.
            :param self:                    The current account.move record.
            :param payment_terms_lines:     The current payment terms lines.
            :return:                        An account.account record.
            '''
            if payment_terms_lines:
                # Retrieve account from previous payment terms lines in order to allow the user to set a custom one.
                return payment_terms_lines[0].account_id
            elif self.partner_id:
                # Retrieve account from partner.
                if self.is_sale_document(include_receipts=True):
                    return self.partner_id.property_account_receivable_id
                else:
                    return self.partner_id.property_account_payable_id
            else:
                # Search new account.
                domain = [
                    ('company_id', '=', self.company_id.id),
                    ('internal_type', '=', 'receivable' if self.move_type in ('out_invoice', 'out_refund', 'out_receipt') else 'payable'),
                ]
                return self.env['account.account'].search(domain, limit=1)

        def _compute_payment_terms(self, date, total_balance, total_amount_currency):
            ''' Compute the payment terms.
            :param self:                    The current account.move record.
            :param date:                    The date computed by '_get_payment_terms_computation_date'.
            :param total_balance:           The invoice's total in company's currency.
            :param total_amount_currency:   The invoice's total in invoice's currency.
            :return:                        A list <to_pay_company_currency, to_pay_invoice_currency, due_date>.
            '''
            if self.invoice_payment_term_id:
                to_compute = self.invoice_payment_term_id.compute(total_balance, date_ref=date, currency=self.company_id.currency_id)
                if self.currency_id == self.company_id.currency_id:
                    # Single-currency.
                    return [(b[0], b[1], b[1]) for b in to_compute]
                else:
                    # Multi-currencies.
                    to_compute_currency = self.invoice_payment_term_id.compute(total_amount_currency, date_ref=date, currency=self.currency_id)
                    return [(b[0], b[1], ac[1]) for b, ac in zip(to_compute, to_compute_currency)]
            else:
                return [(fields.Date.to_string(date), total_balance, total_amount_currency)]

        def _compute_diff_payment_terms_lines(self, existing_terms_lines, account, to_compute):
            ''' Process the result of the '_compute_payment_terms' method and creates/updates corresponding invoice lines.
            :param self:                    The current account.move record.
            :param existing_terms_lines:    The current payment terms lines.
            :param account:                 The account.account record returned by '_get_payment_terms_account'.
            :param to_compute:              The list returned by '_compute_payment_terms'.
            '''
            # As we try to update existing lines, sort them by due date.
            existing_terms_lines = existing_terms_lines.sorted(lambda line: line.date_maturity or today)
            existing_terms_lines_index = 0

            # Recompute amls: update existing line or create new one for each payment term.
            new_terms_lines = self.env['account.move.line']
            for date_maturity, balance, amount_currency in to_compute:
                currency = self.journal_id.company_id.currency_id
                if currency and currency.is_zero(balance) and len(to_compute) > 1:
                    continue

                if existing_terms_lines_index < len(existing_terms_lines):
                    # Update existing line.
                    candidate = existing_terms_lines[existing_terms_lines_index]
                    existing_terms_lines_index += 1
                    candidate.update({
                        'date_maturity': date_maturity,
                        'amount_currency': -amount_currency,
                        'debit': balance < 0.0 and -balance or 0.0,
                        'credit': balance > 0.0 and balance or 0.0,
                    })
                else:
                    # Create new line.
                    create_method = in_draft_mode and self.env['account.move.line'].new or self.env['account.move.line'].create
                    candidate = create_method({
                        'name': self.payment_reference or '',
                        'debit': balance < 0.0 and -balance or 0.0,
                        'credit': balance > 0.0 and balance or 0.0,
                        'quantity': 1.0,
                        'amount_currency': -amount_currency,
                        'date_maturity': date_maturity,
                        'move_id': self.id,
                        'currency_id': self.currency_id.id,
                        'account_id': account.id,
                        'partner_id': self.commercial_partner_id.id,
                        'exclude_from_invoice_tab': True,
                    })
                new_terms_lines += candidate
                if in_draft_mode:
                    candidate.update(candidate._get_fields_onchange_balance(force_computation=True))
            return new_terms_lines

        existing_terms_lines = self.line_ids.filtered(lambda line: line.account_id.user_type_id.type in ('receivable', 'payable'))
        others_lines = self.line_ids.filtered(lambda line: line.account_id.user_type_id.type not in ('receivable', 'payable'))
        company_currency_id = (self.company_id or self.env.company).currency_id
        total_balance = sum(others_lines.mapped(lambda l: company_currency_id.round(l.balance)))
        total_amount_currency = sum(others_lines.mapped('amount_currency'))

        if not others_lines:
            self.line_ids -= existing_terms_lines
            return

        computation_date = _get_payment_terms_computation_date(self)
        account = self.account_id or _get_payment_terms_account(self, existing_terms_lines)
        to_compute = _compute_payment_terms(self, computation_date, total_balance, total_amount_currency)
        new_terms_lines = _compute_diff_payment_terms_lines(self, existing_terms_lines, account, to_compute)

        # Remove old terms lines that are no longer needed.
        self.line_ids -= existing_terms_lines - new_terms_lines

        if new_terms_lines:
            self.payment_reference = new_terms_lines[-1].name or ''
            self.invoice_date_due = new_terms_lines[-1].date_maturity


    @api.depends('journal_id', 'partner_id', 'company_id', 'move_type')
    def _compute_l10n_latam_available_document_types(self):
        domain = []
        internal_type = self._get_l10n_latam_documents_domain()
        if internal_type:
            domain = internal_type
        self.l10n_latam_available_document_type_ids = self.env['l10n_latam.document.type'].search(domain)
        for rec in self.filtered(lambda x: x.journal_id and x.l10n_latam_use_documents and x.partner_id):
            rec.l10n_latam_available_document_type_ids = self.env['l10n_latam.document.type'].search(rec._get_l10n_latam_documents_domain())


    # def _get_l10n_latam_documents_domain(self):
    #     self.ensure_one()
    #     if self.move_type in ['out_refund', 'in_refund']:
    #         internal_types = ['credit_note']
    #     else:
    #         internal_types = ['invoice', 'debit_note']
    #     return [('internal_type', 'in', internal_types), ('country_id', '=', self.company_id.country_id.id)]

    def _get_starting_sequence(self):
        if self.l10n_pe_edi_is_required and self.l10n_latam_document_type_id:
            doc_mapping = {'01': 'FFI', '03': 'BOL', '07': 'CNE', '08': 'NDI'}
            middle_code = doc_mapping.get(self.l10n_latam_document_type_id.code, self.journal_id.code)
            # TODO: maybe there is a better method for finding decent 2nd journal default invoice names
            if self.journal_id.code != 'INV':
                middle_code = middle_code[:1] + self.journal_id.code[:2]
            if self.journal_id.serie:
                middle_code = self.journal_id.serie
            return "%s-00000000" % (middle_code)
        if not self.l10n_pe_edi_is_required:
            self.ensure_one()
            starting_sequence = "%s-%04d-%02d-0000" % (self.journal_id.code, self.date.year, self.date.month)
            if self.journal_id.refund_sequence and self.move_type in ('out_refund', 'in_refund'):
                starting_sequence = "R" + starting_sequence
            return starting_sequence
        return super()._get_starting_sequence()

    # @api.depends('company_id', 'invoice_filter_type_domain')
    # def _compute_suitable_journal_ids(self):
    #     super()._compute_suitable_journal_ids()
    #     type_doc_obj = self.env['l10n_latam.document.type']
    #     for m in self:
    #         journal_type = m.invoice_filter_type_domain or 'general'
    #         company_id = m.company_id.id or self.env.company.id
    #         domain = [('company_id', '=', company_id), ('type', '=', journal_type)]
    #         typ = m.move_type
    #         if m.move_type == 'in_invoice' or m.move_type == 'out_invoice':
    #             if m.is_note_debit:
    #                 type_doc = type_doc_obj.search([('code', 'in', ['08'])])
    #             else:
    #                 type_doc = type_doc_obj.search([('code','not in',['07','08'])])
    #             domain.append(('l10n_latam_document_type_id','in',type_doc.ids or [type_doc.id]))
    #         else:
    #             type_doc = type_doc_obj.search([('code', 'in', ['07'])])
    #             domain.append(('l10n_latam_document_type_id', 'in',type_doc.ids or [type_doc.id]))
    #
    #         m.suitable_journal_ids = self.env['account.journal'].search(domain)
    #
    #
    #
    # @api.model
    # def _search_default_journal(self, journal_types):
    #     type_doc_obj = self.env['l10n_latam.document.type']
    #     resp =  super()._search_default_journal(journal_types)
    #     company_id = self._context.get('default_company_id', self.env.company.id)
    #     domain = [('company_id', '=', company_id), ('type', 'in', journal_types)]
    #     if self._context.get('default_move_type'):
    #         move_type = self._context.get('default_move_type')
    #         if move_type == 'in_invoice' or move_type == 'out_invoice':
    #             if self._context.get('default_is_note_debit'):
    #                 type_doc = type_doc_obj.search([('code', 'in', ['08'])])
    #             else:
    #                 type_doc = type_doc_obj.search([('code','not in',['07','08'])])
    #             domain.append(('l10n_latam_document_type_id','in',type_doc.ids or [type_doc.id]))
    #         else:
    #             type_doc = type_doc_obj.search([('code', 'in', ['07'])])
    #             domain.append(('l10n_latam_document_type_id', 'in',type_doc.ids or [type_doc.id]))
    #
    #     journal = None
    #     if self._context.get('default_currency_id'):
    #         currency_domain = domain + [('currency_id', '=', self._context['default_currency_id'])]
    #         journal = self.env['account.journal'].search(currency_domain, limit=1)
    #
    #     if not journal:
    #         journal = self.env['account.journal'].search(domain, limit=1)
    #
    #     if not journal:
    #         company = self.env['res.company'].browse(company_id)
    #
    #         error_msg = _(
    #             "No journal could be found in company %(company_name)s for any of those types: %(journal_types)s",
    #             company_name=company.display_name,
    #             journal_types=', '.join(journal_types),
    #         )
    #         raise UserError(error_msg)
    #
    #     return journal

    def _is_manual_document_number(self, journal):
        #return True if journal.type == 'purchase' else False
        return False


    @api.onchange('l10n_latam_document_type_id', 'l10n_latam_document_number')
    def _inverse_l10n_latam_document_number(self):
        for rec in self.filtered(lambda x: x.l10n_latam_document_type_id):
            if not rec.l10n_latam_document_number:
                rec.name = '/'
            else:
                l10n_latam_document_number = rec.l10n_latam_document_type_id._format_document_number(rec.l10n_latam_document_number)
                if rec.l10n_latam_document_number != l10n_latam_document_number:
                    rec.l10n_latam_document_number = l10n_latam_document_number
                rec.name = "%s" % (l10n_latam_document_number)




