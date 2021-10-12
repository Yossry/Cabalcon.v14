# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import base64
import zipfile
import io
from requests.exceptions import ConnectionError, HTTPError, InvalidSchema, InvalidURL, ReadTimeout
from zeep.wsse.username import UsernameToken
from zeep import Client, Settings
from zeep.exceptions import Fault
from zeep.transports import Transport
from lxml import etree
from lxml.objectify import fromstring
from copy import deepcopy

from odoo import models, fields, api, _, _lt
from ..tools.facturaonline import facturaonline_jsonrpc
from ..tools.facturaonline import facturaonline_convert_data
from odoo.tools.pdf import OdooPdfFileReader, OdooPdfFileWriter


from odoo.exceptions import AccessError
from odoo.tools import html_escape


class AccountEdiFormat(models.Model):
    _inherit = 'account.edi.format'


    def _l10n_pe_edi_sign_invoices_facturaonline(self, invoice, edi_filename, edi_str):
        #_l10n_pe_edi_sign_invoices_iap
        credentials = self._l10n_pe_edi_get_sunat_facturaonline(invoice.company_id)
        url = self.get_url_facturaonline(invoice)
        edi_values = self._l10n_pe_edi_get_edi_values(invoice)
        data_values = facturaonline_convert_data(invoice,edi_values)
        result = facturaonline_jsonrpc(url, params=data_values, credentials=credentials, timeout=1500)

        #result = iap_jsonrpc(url, params=rpc_params, timeout=1500)
        #message = "Factura creada en facturaonline.pe " + "id de Factura " + result.get("idFactura")
        return result


    def _l10n_pe_edi_get_sunat_facturaonline(self, company):
        self.ensure_one()
        res = {}
        res.update({
            'enpoint': company.l10n_pe_edi_endpoint_facturaonline,
            'acces_key': company.l10n_pe_edi_acces_key,
            'secret_key': company.l10n_pe_edi_secret_key,
        })
        return res

    def get_url_facturaonline(self, invoice):
        url = invoice.company_id.l10n_pe_edi_endpoint_facturaonline
        if invoice.l10n_latam_document_type_id.code == '01':
            url = url + '/factura'
        if invoice.l10n_latam_document_type_id.code == '03':
            url = url + '/boleta'
        if invoice.l10n_latam_document_type_id.code == '07':
            url = url + '/notacredito'
        if invoice.l10n_latam_document_type_id.code == '08':
            url = url + '/notadebito'
        return url

    def _get_embedding_to_invoice_pdf_values(self, invoice):
        """ Get the values to embed to pdf.

        :returns:   A dictionary {'name': name, 'datas': datas} or False if there are no values to embed.
        * name:     The name of the file.
        * datas:    The bytes ot the file.
        """
        self.ensure_one()
        redn = self._is_embedding_to_invoice_pdf_needed()
        if not redn:
            return False
        if invoice.pdf_invoice:
            datas = base64.b64decode(invoice.pdf_invoice)
            return {'name': invoice.pdf_name_invoice, 'datas': datas}
        else:
            gen = invoice.generate_invoice_print()
            if gen:
                return gen
        attachment = invoice._get_edi_attachment(self)
        if not attachment or not self._is_embedding_to_invoice_pdf_needed():
            return False
        datas = base64.b64decode(attachment.with_context(bin_size=False).datas)
        return {'name': attachment.name, 'datas': datas}


    def _embed_edis_to_pdf(self, pdf_content, invoice):
        """ Create the EDI document of the invoice and embed it in the pdf_content.

        :param pdf_content: the bytes representing the pdf to add the EDIs to.
        :param invoice: the invoice to generate the EDI from.
        :returns: the same pdf_content with the EDI of the invoice embed in it.
        """
        attachments = []
        for edi_format in self.filtered(lambda edi_format: edi_format._is_embedding_to_invoice_pdf_needed()):
            attach = edi_format._get_embedding_to_invoice_pdf_values(invoice)
            if attach:
                attachments.append(attach)

        if attachments:
            # Add the attachments to the pdf file
            reader_buffer = io.BytesIO(attach['datas'])
            reader = OdooPdfFileReader(reader_buffer, strict=False)
            writer = OdooPdfFileWriter()
            writer.cloneReaderDocumentRoot(reader)
            # for vals in attachments:
            #     writer.addAttachment(vals['name'], vals['datas'])
            buffer = io.BytesIO()
            writer.write(buffer)
            pdf_content = buffer.getvalue()
            reader_buffer.close()
            buffer.close()
        return pdf_content