# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

#Tipos de Cuentas bancarias
T_ACCOUNT = [('A','Cuenta de Ahorros'),('C','Cuenta Corriente'),('M','Cuenta Maestra'),('B','Interbancaria (CCI)')]

class res_partner_bank(models.Model):
    _inherit = 'res.partner.bank'
    
    street = fields.Char('Dirección 1')
    street2 = fields.Char('Dirección 2')
    currency_id = fields.Many2one('res.currency', 'Moneda', required=True, default=lambda self: self.env.user.company_id.currency_id)
    acc_type_nbr = fields.Selection(T_ACCOUNT, string='Tipo de cuenta')
    acc_number_cci = fields.Char('Nro Cta Interbancaria', size=30)
    apply_detraction = fields.Boolean(string="Aplica Detracción", help='Activar el check solo si la cuenta es usada para la Detracción.')
    active = fields.Boolean(string="Activo", default=True)
    
    #Validar Cta CCI
    @api.constrains('acc_number_cci')
    def check_acc_number_cci_length(self):
        #Validamos si es cuenta CCI
        if self.acc_type_nbr == 'B':
            #Validamos que tenga digitos
            if not self.acc_number_cci:
                raise ValidationError(_("Ingrese Cta. Interbancaria de 20 digitos."))
            #Validamos que solo sea numerico y tenga la longitud deseada
            v_valida_cta = self._validate_number_cta(self.acc_number_cci, 20)
            if not v_valida_cta:
                raise ValidationError(_("La Cta. Interbancaria '%s' debe ser de 20 digitos!") % (str(self.acc_number_cci)))

    #Validar Cta Bancaria
    @api.constrains('acc_number')
    def check_acc_number_length(self):
        #Validamos si es cuenta corriente
        if self.acc_type_nbr == 'C':
            #Validamos Cuenta Corriente sea numerico y si es DETRACCION 09NOV2020
            if self.apply_detraction == True:
                v_valida_cta = self._validate_number_cta(self.acc_number, 11)
                if not v_valida_cta:
                    raise ValidationError(_("La Cta. Corriente de Detracción '%s' debe ser de 11 digitos!") % (str(self.acc_number)))
            else:
                #Validamos que solo sea numerico y tenga la longitud deseada
                v_valida_cta = self._validate_number_cta(self.acc_number, 13)
                if not v_valida_cta:
                    raise ValidationError(_("La Cta. Corriente '%s' debe ser de 13 digitos!") % (str(self.acc_number)))

        #Validamos si es cuenta maestra
        if self.acc_type_nbr == 'M':
            #Validamos que solo sea numerico y tenga la longitud deseada
            v_valida_cta = self._validate_number_cta(self.acc_number, 13)
            if not v_valida_cta:
                raise ValidationError(_("La Cta. Maestra '%s' debe ser de 13 digitos!") % (str(self.acc_number)))

        #Validamos si es cuenta Ahorros
        if self.acc_type_nbr == 'A':
            #Validamos que solo sea numerico y tenga la longitud deseada
            v_valida_cta = self._validate_number_cta(self.acc_number, 14)
            if not v_valida_cta:
                raise ValidationError(_("La Cta. Ahorros '%s' debe ser de 14 digitos!") % (str(self.acc_number)))


    #Funcionalidad que valida que la cadena de texto solo tenga numero y la longitud deseada
    def _validate_number_cta(self, in_str_text_number, in_largo):
        #Por defecto indica que es numerico
        out_valida_number = True
        if in_str_text_number:
            v_data_str = str(in_str_text_number)
            v_largo = int(in_largo)
            indice = 0
            while indice < len(v_data_str):
                #Validamos que el caracter sea numerico
                if not v_data_str[indice].isdigit():
                    out_valida_number = False
                indice += 1
            #valida si no tiene la cantidad de digitos
            if indice != v_largo:
                out_valida_number = False
        return out_valida_number

class res_partner(models.Model): 
    _inherit = 'res.partner' 
    
    bank_ids = fields.One2many('res.partner.bank', 'partner_id', string='Bancos', copy=False)
