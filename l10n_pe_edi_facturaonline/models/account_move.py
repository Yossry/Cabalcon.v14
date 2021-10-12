
from odoo import api,fields,models,_
from odoo.exceptions import RedirectWarning, UserError, ValidationError, AccessError
from odoo.tools.pdf import OdooPdfFileReader, OdooPdfFileWriter
import time
import hmac
import hashlib
import requests
import base64
import io
import logging
import pathlib

class AccountMove(models.Model):
    _inherit = "account.move"

    pdf_invoice = fields.Binary(string='PDF facturaOnline')
    pdf_name_invoice = fields.Char(string='PDF facturaOnline', readonly=True)



    def generate_invoice_print(self):
        if not self.pdf_invoice:
            edi_document_ids = self.edi_document_ids
            for doc in edi_document_ids:
                if doc.id_factura_online:
                    if doc.id_factura_online != 'ERR':
                        name, pdf = self.get_facturaonline_pdf(doc.id_factura_online)
                        if pdf:
                            self.write({'pdf_name_invoice': name,
                                        'pdf_invoice': pdf})
                        datas = base64.b64decode(pdf)
                        return {'name': name, 'datas': datas}
        return False



    def get_facturaonline_pdf(self,id_factura_online):
        efact_acces_key_val = self.company_id.l10n_pe_edi_acces_key
        efact_secret_key_val = self.company_id.l10n_pe_edi_secret_key
        efact_url_bol_val = self.get_url_facturaonline()
        if not efact_acces_key_val or not efact_secret_key_val or not efact_url_bol_val:
            raise UserError(_('Error de Conexión!\nNo es posible obtener la llave de acceso, la contraseña o el URL'))

        timestmap = str(int(time.time()))
        message = efact_acces_key_val + '|' + timestmap
        signature = hmac.new(str(efact_secret_key_val).encode('utf-8'), str(message).encode('utf-8'),
                              hashlib.sha256).hexdigest()
        headers = {'Authorization': 'Fo ' + efact_acces_key_val + ':' + signature + ':' + timestmap}
        PARAMS = {'tipo': 'pdf'}
        url = efact_url_bol_val + '/' + str(id_factura_online) + '/exportar'
        req = requests.get(url=url, params=PARAMS, headers=headers)
        if req.status_code == 200:
            pdf = req.content
            base = base64.b64encode(pdf)
            # self.write({'pdf_name_invoice': self.number + '.pdf',
            #             'pdf_invoice': base})
            name = self.name.replace(' ', '') + '.pdf'
            return name, base
        else:
            raise UserError(_("Error en comunicacion"))

        return False,False

        # return {
        #     'type': 'ir.actions.act_url',
        #     'url': 'web/content/?model=account.invoice&field=pdf_invoice&id=%s&filename=%s&download=true' % (
        #         self.id, name),
        #     'target': 'new',
        #     'tag': 'reload',
        # }


    def get_url_facturaonline(self):
        url = self.company_id.l10n_pe_edi_endpoint_facturaonline
        if self.l10n_latam_document_type_id.code == '01':
            url = url + '/factura'
        if self.l10n_latam_document_type_id.code == '03':
            url = url + '/boleta'
        if self.l10n_latam_document_type_id.code == '07':
            url = url + '/notacredito'
        if self.l10n_latam_document_type_id.code == '08':
            url = url + '/notadebito'
        return url
