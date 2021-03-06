# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api
from odoo.addons.account_edi_extended.models.account_edi_document import DEFAULT_BLOCKING_LEVEL
from psycopg2 import OperationalError
import logging

_logger = logging.getLogger(__name__)


class AccountEdiDocument(models.Model):
    _inherit = 'account.edi.document'

    id_factura_online = fields.Char(string='Id FacturaOnline')

    @api.model
    def _process_job(self, documents, doc_type):
        """Post or cancel move_id (invoice or payment) by calling the related methods on edi_format_id.
        Invoices are processed before payments.

        :param documents: The documents related to this job. If edi_format_id does not support batch, length is one
        :param doc_type:  Are the moves of this job invoice or payments ?
        """
        def _postprocess_post_edi_results(documents, edi_result):
            attachments_to_unlink = self.env['ir.attachment']
            for document in documents:
                move = document.move_id
                move_result = edi_result.get(move, {})
                if move_result.get('attachment') or move_result.get('idFactura'):
                    if move_result.get('attachment'):
                        old_attachment = document.attachment_id
                        values = {
                            'attachment_id': move_result['attachment'].id,
                            'error': move_result.get('error', False),
                            'blocking_level': move_result.get('blocking_level', DEFAULT_BLOCKING_LEVEL) if 'error' in move_result else False,
                        }
                        if not values.get('error'):
                            values.update({'state': 'sent'})
                        document.write(values)
                        if not old_attachment.res_model or not old_attachment.res_id:
                            attachments_to_unlink |= old_attachment
                    if move_result.get('idFactura'):
                        values = {
                            'attachment_id': False,
                            'error': move_result.get('error', False),
                            'blocking_level': False,
                            'id_factura_online': move_result.get('idFactura'),
                        }
                        if not values.get('error'):
                            values.update({'state': 'sent'})
                        document.write(values)
                else:
                    document.write({
                        'error': move_result.get('error', False),
                        'blocking_level': move_result.get('blocking_level', DEFAULT_BLOCKING_LEVEL) if 'error' in move_result else False,
                    })

            # Attachments that are not explicitly linked to a business model could be removed because they are not
            # supposed to have any traceability from the user.
            attachments_to_unlink.unlink()

        def _postprocess_cancel_edi_results(documents, edi_result):
            invoice_ids_to_cancel = set()  # Avoid duplicates
            attachments_to_unlink = self.env['ir.attachment']
            for document in documents:
                move = document.move_id
                move_result = edi_result.get(move, {})
                if move_result.get('success') is True:
                    old_attachment = document.attachment_id
                    document.write({
                        'state': 'cancelled',
                        'error': False,
                        'attachment_id': False,
                        'blocking_level': False,
                    })

                    if move.is_invoice(include_receipts=True) and move.state == 'posted':
                        # The user requested a cancellation of the EDI and it has been approved. Then, the invoice
                        # can be safely cancelled.
                        invoice_ids_to_cancel.add(move.id)

                    if not old_attachment.res_model or not old_attachment.res_id:
                        attachments_to_unlink |= old_attachment

                elif not move_result.get('success'):
                    document.write({
                        'error': move_result.get('error', False),
                        'blocking_level': move_result.get('blocking_level', DEFAULT_BLOCKING_LEVEL) if move_result.get('error') else False,
                    })

            if invoice_ids_to_cancel:
                invoices = self.env['account.move'].browse(list(invoice_ids_to_cancel))
                invoices.button_draft()
                invoices.button_cancel()

            # Attachments that are not explicitly linked to a business model could be removed because they are not
            # supposed to have any traceability from the user.
            attachments_to_unlink.unlink()

        test_mode = self._context.get('edi_test_mode', False)

        documents.edi_format_id.ensure_one()  # All account.edi.document of a job should have the same edi_format_id
        documents.move_id.company_id.ensure_one()  # All account.edi.document of a job should be from the same company
        if len(set(doc.state for doc in documents)) != 1:
            raise ValueError('All account.edi.document of a job should have the same state')

        edi_format = documents.edi_format_id
        state = documents[0].state
        if doc_type == 'invoice':
            if state == 'to_send':
                edi_result = edi_format._post_invoice_edi(documents.move_id, test_mode=test_mode)
                _postprocess_post_edi_results(documents, edi_result)
            elif state == 'to_cancel':
                edi_result = edi_format._cancel_invoice_edi(documents.move_id, test_mode=test_mode)
                _postprocess_cancel_edi_results(documents, edi_result)

        elif doc_type == 'payment':
            if state == 'to_send':
                edi_result = edi_format._post_payment_edi(documents.move_id, test_mode=test_mode)
                _postprocess_post_edi_results(documents, edi_result)
            elif state == 'to_cancel':
                edi_result = edi_format._cancel_payment_edi(documents.move_id, test_mode=test_mode)
                _postprocess_cancel_edi_results(documents, edi_result)