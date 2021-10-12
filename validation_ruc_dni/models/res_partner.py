# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import Warning
import requests
import json
#import logging
#_logger = logging.getLogger(__name__)
URL_RENIEC = 'https://dniruc.apisperu.com/api/v1/dni'
URL_SUNAT = 'https://dniruc.apisperu.com/api/v1/ruc'


class ResPartner(models.Model):
    _inherit = 'res.partner'

    commercial_name = fields.Char(string='Nombre Comercial', size=128, index=True)
    state = fields.Selection([('habido','Habido'),('nhabido','No Habido')], string='Estado')
    #tipo_doc_id = fields.Many2one('l10n_latam.identification.type','Tipo Documento', index=True)
    #vat = fields.Char(string='Nro Documento', size=15, index=True)
    
    _sql_constraints = [ ('001_name_vat', 'unique(l10n_latam_identification_type_id, vat)', 'El registro ya existe') ]


    @api.onchange('l10n_latam_identification_type_id','vat')    
    def onchange_vat(self):
        self._update_document()

    def valida_document(self):
        if self.vat and self.l10n_latam_identification_type_id.name in ('RUC','DNI'):
            self._update_document()

    def _update_document(self):
        if not self.vat:
            return False
        else:
            company_id = self.company_id or self.env['res.company'].browse(self.env.company.id) 
            if not company_id.search_api_peru:
                return False
            if not company_id.token_api_peru:
                raise Warning('Configure el token en la compañia')

            token = company_id.token_api_peru
            vat = self.vat
            document_type = self.l10n_latam_identification_type_id.name
            if vat and document_type == 'RUC':
                if len(vat) == 11:
                    factor = '5432765432'
                    sum = 0
                    dig_check = False
                    try:
                        int(vat)
                    except:
                        self.vat = False
                        raise Warning('El documento no debe tener letras')

                    for f in range(0, 10):
                        sum += int(factor[f]) * int(vat[f])

                    subtraction = 11 - (sum % 11)
                    if subtraction == 10:
                        dig_check = 0
                    elif subtraction == 11:
                        dig_check = 1
                    else:
                        dig_check = subtraction

                    if not int(vat[10]) == dig_check:
                        self.vat = False
                        raise Warning('El numero es incorrecto')
                    #Arma consulta SUNAT con el RUC y Token
                    url = ('%s/%s?token=%s' % (URL_SUNAT, self.vat, token))
                    ses = requests.session()
                    res = ses.get(url)
                    if res.status_code == 200:
                        dic_res = json.loads(res.text)

                        district = dic_res.get('distrito')
                        province = dic_res.get('provincia')
                        tdireccion = dic_res.get('direccion')
                        name = dic_res.get('razonSocial')
                        condicion = dic_res.get('condicion')
                        nombreComercial = dic_res.get('nombreComercial')

                        district_obj = self.env['l10n_pe.res.city.district']
                        dist_id = district_obj.search([('name', '=', district),
                                                       ('city_id.name', '=', province)], limit=1)
                        if dist_id.exists():
                            values = {
                                'l10n_pe_district': dist_id.id,
                                'city_id': dist_id.city_id.id,
                                'state_id': dist_id.city_id.state_id.id,
                                'country_id': dist_id.city_id.state_id.country_id.id,
                                'zip': dist_id.code[2:]
                            }
                            self.l10n_pe_district = dist_id.id
                            self.city_id = dist_id.city_id.id
                            self.state_id = dist_id.city_id.state_id.id
                            self.country_id = dist_id.city_id.state_id.country_id.id
                            self.zip = dist_id.code[2:]
                        self.name = name

                        self.street = tdireccion
                        if self.vat[0] != '1':
                            self.is_company = True
                            self.commercial_name = nombreComercial or name

                        if condicion =='HABIDO':
                            self.state = 'habido'
                        else:
                            self.state = 'nhabido'
                        #logging.getLogger('Server2').info('res:%s' % name)

            elif vat and document_type == 'DNI':
                if len(vat) == 8:
                    try:
                        int(vat)
                    except:
                        self.vat = False
                        raise Warning('Numero de documento incorrecto')
                    #Arma consulta RENIEC con el DNI y Token
                    url = ('%s/%s?token=%s' % (URL_RENIEC, self.vat, token))
                    ses = requests.session()
                    res = ses.get(url)
                    if res.status_code == 200:
                        dic_res = json.loads(res.text)
                        if dic_res:
                            nombres = dic_res.get('nombres')
                            apellidoPaterno = dic_res.get('apellidoPaterno')
                            apellidoMaterno = dic_res.get('apellidoMaterno')

                            self.name = nombres + " " + apellidoPaterno + " " + apellidoMaterno
                else:
                    self.vat = False
                    raise Warning('Numero de documento incorrecto')
        return True
