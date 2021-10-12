# -*- encoding: utf-8 -*-
from PIL import Image
import requests
#import pytesseract
#from bs4 import BeautifulSoup
#from lxml import etree
from datetime import datetime
from odoo import api, fields, models, _
from odoo.exceptions import except_orm, ValidationError
from collections import OrderedDict
import re
import logging
from io import StringIO
_logger = logging.getLogger(__name__)
import json


class Partner(models.Model):
    _inherit = 'res.partner'

    @api.model
    def _get_pe_doc_type(self):
        res = []
        res.append(('0', 'DOC.TRIB.NO.DOM.SIN.RUC'))
        res.append(('1', 'DOCUMENTO NACIONAL DE IDENTIDAD (DNI)'))
        res.append(('4', 'CARNET DE EXTRANJERIA'))
        res.append(('6', 'REGISTRO ÚNICO DE CONTRIBUYENTES'))
        res.append(('7', 'PASAPORTE'))
        res.append(('A', 'CÉDULA DIPLOMÁTICA DE IDENTIDAD'))
        res.append(('B', 'DOC.IDENT.PAIS.RESIDENCIA-NO.D'))
        res.append(('C', 'Tax Identifi cation Number - TIN – Doc Trib PP.NN'))
        res.append(('D', 'Identifi cation Number - IN – Doc Trib PP. JJ'))
        return res

    doc_type= fields.Selection(selection=_get_pe_doc_type, string="Document Type")
    doc_number= fields.Char("Document Number")
    commercial_name = fields.Char("Commercial Name", default="-", help='If you do not have a commercial name, put "-" without quotes')
    legal_name = fields.Char("Legal Name", default="-", help='If you do not have a legal name, put "-" without quotes')
    
    state = fields.Selection([('ACTIVO', 'ACTIVO'),
                            ('BAJA DE OFICIO', 'BAJA DE OFICIO'),
                            ('BAJA DEFINITIVA', 'BAJA DEFINITIVA'),
                            ('BAJA PROVISIONAL', 'BAJA PROVISIONAL'),
                            ('SUSPENSION TEMPORAL', 'BAJA PROVISIONAL'),
                            ('INHABILITADO-VENT.UN', 'INHABILITADO-VENT.UN'),
                            ('BAJA MULT.INSCR. Y O', 'BAJA MULT.INSCR. Y O'),
                            ('PENDIENTE DE INI. DE', 'PENDIENTE DE INI. DE'),
                            ('OTROS OBLIGADOS', 'OTROS OBLIGADOS'),
                            ('NUM. INTERNO IDENTIF', 'NUM. INTERNO IDENTIF'),
                            ('ANUL.PROVI.-ACTO ILI', 'ANUL.PROVI.-ACTO ILI'),
                            ('ANULACION - ACTO ILI', 'ANULACION - ACTO ILI'),
                            ('BAJA PROV. POR OFICI', 'BAJA PROV. POR OFICI'),
                            ('ANULACION - ERROR SU', 'ANULACION - ERROR SU')], "State", default="ACTIVO")
    condition = fields.Selection([('HABIDO', 'HABIDO'),
                                ('NO HABIDO', 'NO HABIDO'),
                                ('NO HALLADO', 'NO HALLADO'),
                                ('PENDIENTE', 'PENDIENTE'),
                                ('NO HALLADO SE MUDO D', 'NO HALLADO SE MUDO D'),
                                ('NO HALLADO NO EXISTE', 'NO HALLADO NO EXISTE'),
                                ('NO HALLADO FALLECIO', 'NO HALLADO FALLECIO'),
                                ('-', 'NO HABIDO'),
                                ('NO HALLADO OTROS MOT','NO HALLADO OTROS MOT'),
                                ('NO APLICABLE', 'NO APLICABLE'),
                                ('NO HALLADO NRO.PUERT', 'NO HALLADO NRO.PUERT'),
                                ('NO HALLADO CERRADO', 'NO HALLADO CERRADO'),
                                ('POR VERIFICAR', 'POR VERIFICAR'),
                                ('NO HALLADO DESTINATA', 'NO HALLADO DESTINATA'),
                                ('NO HALLADO RECHAZADO', 'NO HALLADO RECHAZADO')], 'Condition', default="HABIDO")
    
    activities_ids = fields.Many2many("pe.datas", string= "Economic Activities", domain=[('table_code', '=', 'PE.CIIU')])
    main_activity = fields.Many2one("pe.datas", string= "Main Economic Activity", domain=[('table_code', '=', 'PE.CIIU')])
    retention_agent = fields.Boolean("Is Agent")
    retention_agent_from = fields.Date("From")
    retention_agent_resolution = fields.Char("Resolution")
    is_validate= fields.Boolean("Is Validated")
    type_taxpayer = fields.Char("Type Taxpayer")
    emission_system = fields.Char("Emission System")
    accounting_system = fields.Char("Accounting System")
    last_update = fields.Datetime("Last Update")
    representative_ids = fields.One2many("res.partner.representative", "partner_id", "Representatives")
    
    @api.constrains("doc_number")
    def check_doc_number(self):
        for partner in self:
            if not partner.doc_type and not partner.doc_number:
                continue
            elif partner.doc_type=="0":
                continue
            elif not partner.doc_type and partner.doc_number:
                raise ValidationError(_("Select a document type"))
            elif partner.doc_type and not partner.doc_number:
                raise ValidationError(_("Enter the document number"))
            vat = partner.doc_number
            if partner.doc_type == '6':
                check = self.validate_ruc(vat)
                if not check:
                    _logger.info("The RUC Number [%s] is not valid !" % vat)
                    raise ValidationError(_('the RUC entered is incorrect'))
            if self.search_count([('company_id','=', partner.company_id.id),
                                  ('doc_type', '=', partner.doc_type), ('doc_number', '=', partner.doc_number)])>1:
                raise ValidationError(_('Document Number already exists and violates unique field constrain'))

    @api.onchange('company_type')
    def onchange_company_type(self):
        self.doc_type= self.company_type == 'company' and "6" or "1"
        super(Partner, self).onchange_company_type()
        
    @staticmethod
    def validate_ruc(vat):
        factor = '5432765432'
        sum = 0
        dig_check = False
        if len(vat) != 11:
            return False
        try:
            int(vat)
        except ValueError:
            return False 
        for f in range(0,10):
            sum += int(factor[f]) * int(vat[f])
        subtraction = 11 - (sum % 11)
        if subtraction == 10:
            dig_check = 0
        elif subtraction == 11:
            dig_check = 1
        else:
            dig_check = subtraction
        if not int(vat[10]) == dig_check:
            return False
        return True
    
    @api.onchange("doc_number", "doc_type")
    @api.depends("doc_type", "doc_number")
    def _doc_number_change(self):
        vat=self.doc_number
        if vat and self.doc_type:
            vat_type = self.doc_type
            if vat_type == '0':
                self.vat="%s%s"%("PEO", self.doc_number)
            elif vat_type == '1':
                if len(vat)!=8:
                    raise except_orm(
                            _('Error'),
                            _('the DNI entered is incorrect'))
                try:
                    response = requests.get("http://api.grupoyacck.com/dni/%s/" % vat.strip(), timeout = 300)
                except Exception:
                    reponse=False
                if response and response.status_code!=200:
                    vals= {'detail':"Not found."}
                else:
                    vals = response and response.json() or {'detail':"Not found."}
                if vals:
                    self.name= "%s %s, %s" %(vals.get('paternal_surname', ''), vals.get('maternal_surname', ''), vals.get('name', ''))
                    self.company_type="person"
                    self.is_validate = True
                self.vat= "%s%s"%("PED", vat)
                self.company_type="person"
                self.vat= "%s%s"%("PED", vat)
            elif vat_type == '4':
                self.vat="%s%s"%("PEE", self.doc_number)
            elif vat_type=="6":
                if not self.validate_ruc(vat):
                    raise except_orm(
                            _('Error'),
                            _('the RUC entered is incorrect'))
                try:
                    if self.env.context.get('force_update'):
                        response = requests.get("http://api.grupoyacck.com/ruc/%s/?force_update=1" % vat.strip())
                    else:
                        response = requests.get("http://api.grupoyacck.com/ruc/%s/" % vat.strip())
                except Exception:
                    reponse=False
                #if response and response.status_code!=200:
                #    vals= self._get_sunat_details(vat)
                #else:
                vals = response and response.json() or {'detail':"Not found."}
                #    if vals.get('detail', '') == "Not found.":
                #        vals= self._get_sunat_details(vat)
                print('vals: ', json.dumps(vals, indent=2, sort_keys=True))

                if vals:
                    self.commercial_name = vals.get('commercial_name')
                    self.legal_name = vals.get('legal_name')
                    self.name = vals.get('legal_name') or  vals.get('legal_name') 
                    self.street = vals.get('street', False)
                    self.company_type="company"
                    self.state = vals.get('state', False)
                    self.condition = vals.get('condition')
                    self.type_taxpayer = vals.get('type_taxpayer')
                    self.emission_system = vals.get('emission_system')
                    self.accounting_system = vals.get('accounting_system')
                #    self.last_update = vals.get('last_update') and fields.Datetime().from_string(fields.Datetime.context_timestamp(self, datetime.strptime(vals.get('last_update'), '%Y-%m-%dT%H:%M:%S.%fZ'))) or False
                    self.is_validate = True
                    if vals.get('activities'):
                        activities_ids = []
                        for activity in  vals.get('activities'):
                            ciiu = self.env['pe.datas'].search([('code', '=', activity.get('code')),('table_code', '=', 'PE.CIIU')], limit=1)
                            if ciiu:
                                activities_ids.append(ciiu.id)
                            else:
                                activity['table_code']='PE.CIIU'
                                ciiu = self.env['pe.datas'].sudo().create(activity)
                                activities_ids.append(ciiu.id)
                        if activities_ids:
                            self.main_activity = activities_ids[-1]
                            if self.activities_ids:
                                self.activities_ids = [(6, None, activities_ids)]
                            else:
                                act=[]
                                for activity_id in activities_ids:
                                    act.append((4,activity_id))
                                self.activities_ids = act
                    if vals.get('representatives'):
                        representatives=[]
                        for rep in vals.get('representatives'):
                            representatives.append((0, None,rep))
                            #if rep.get('position', '') in ["GERENTE GENERAL", "TITULAR-GERENTE", "GERENTE"]:
                            #    contact={}
                            #    contact['name']= rep.get('name')
                            #    if self.search_count([('name', '=', contact['name']), ('parent_id', '=', self.id)])==0:
                            #        contact['function']=rep.get('position')
                            #        contact['type']='contact'
                            #        contact['parent_id']=self.id
                            #        #child_id=self.create(contact)
                            #        self.child_ids=[(0, None, contact)]
                        if self.representative_ids:
                            self.representative_ids.unlink()
                        self.representative_ids = representatives
                    self.retention_agent = vals.get('retention_agent', False)
                    self.retention_agent_from = vals.get('retention_agent_from', False)
                    self.retention_agent_resolution = vals.get('retention_agent_resolution', False)
                    if vals.get('district') and vals.get('province'):
                        district = self.env['l10n_pe.res.city.district'].search([('name','ilike', vals.get('district')),
                                                                               ('city_id.name','ilike', vals.get('province'))])
                        if len(district)==1:
                            self.l10n_pe_district=district.id
                            self.city_id = district.city_id
                            self.state_id=district.city_id.state_id

                self.vat= vat
            elif vat_type == '7':
                prefix="CC"
                if self.country_id:
                    prefix=self.country_id.code
                self.vat="%s%s"%(prefix, self.doc_number)
            elif vat_type == 'A':
                self.vat="%s%s"%("PEA", self.doc_number)
            elif vat_type == 'B':
                self.vat="%s%s"%("PEB", self.doc_number)
            elif vat_type == 'C':
                self.vat="%s%s"%("PEC", self.doc_number)
            elif vat_type == 'D':
                self.vat="%s%s"%("PEI", self.doc_number)


        

    def check_vat_pe(self, vat):
        vat_type, doc = vat and len(vat) >= 2 and (vat[0], vat[1:]) or (False, False)
        if vat_type.upper() in ['A', 'O', 'E', 'B', 'C', 'D', 'I']:
            return True
        return super(Partner, self).check_vat_pe(vat)    

    def change_commercial_name(self):
        partner_ids=self.search([('commercial_name', '!=', '-'), ('doc_type', '=', '6')])
        for partner_id in partner_ids:
            partner_id.update_document()

    def update_document(self):
        self._doc_number_change()
      # self._vat_change()

    @api.model
    def update_partner_datas(self):
        partner_ids = self.search([('doc_type', '=', '6')])
        for partner in partner_ids:
            partner.name = partner.commercial_name

class PartnerRepresentative(models.Model):
    _name = "res.partner.representative"
    
    name = fields.Char("Name")
    doc_type = fields.Char("Document Type")
    doc_number = fields.Char("Document Number")
    position = fields.Char("Position")
    date_from = fields.Date("Date From")
    partner_id = fields.Many2one("res.partner", "Partner")
    
    