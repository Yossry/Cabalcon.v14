
from odoo import api,fields,models,_
from odoo.exceptions import RedirectWarning, UserError, ValidationError, AccessError


class AccountMove(models.Model):
    _inherit = "account.move"

    l10n_pe_withhold = fields.Boolean(
        string="Sujeto a detraccion",
        states={'draft': [('readonly', False)]},
        readonly=True,)

    l10n_pe_withhold_code = fields.Selection(
        selection=[
            ('001', 'Azúcar'),
            ('003', 'Alcohol etílico'),
            ('004', 'Recursos hidrobiológicos'),
            ('005', 'Maíz amarillo duro'),
            ('006', 'Algodón'),
            ('007', 'Caña de azúcar'),
            ('008', 'Madera'),
            ('009', 'Arena y piedra'),
            ('010', 'Residuos, subproductos, desechos, recortes y desperdicios'),
            ('011', 'Bienes del inciso A) del Apéndice I de la Ley del IGV'),
            ('012', 'Intermediación laboral y tercerización'),
            ('013', 'Animales vivos'),
            ('014', 'Carnes y despojos comestibles'),
            ('015', 'Abonos, cueros y pieles de origen animal'),
            ('016', 'Aceite de pescado'),
            ('017', 'Harina, polvo y “pellets” de pescado, crustáceos, moluscos y demás invertebrados acuáticos'),
            ('018', 'Embarcaciones pesqueras'),
            ('019', 'Arrendamiento de bienes muebles'),
            ('020', 'Mantenimiento y reparación de bienes muebles'),
            ('021', 'Movimiento de carga'),
            ('022', 'Otros servicios empresariales'),
            ('023', 'Leche'),
            ('024', 'Comisión mercantil'),
            ('025', 'Fabricación de bienes por encargo'),
            ('026', 'Servicio de transporte de personas'),
            ('029', 'Algodón en rama sin desmontar'),
            ('030', 'Contratos de construcción'),
            ('031', 'Oro gravado con el IGV'),
            ('032', 'Páprika y otros frutos de los géneros capsicum o pimienta'),
            ('033', 'Espárragos'),
            ('034', 'Minerales metálicos no auríferos'),
            ('035', 'Bienes exonerados del IGV'),
            ('036', 'Oro y demás minerales metálicos exonerados del IGV'),
            ('037', 'Demás servicios gravados con el IGV'),
            ('039', 'Minerales no metálicos'),
            ('040', 'Bien inmueble gravado con IGV')
        ],
        string="Codigo detraccion",
        readonly=True,
        states={'draft': [('readonly', False)]},
        help="Catalog No. 54 SUNAT, Codigo detraccion")

    l10n_pe_withhold_percentage = fields.Float(
        string="Porcentaje detraccion",
        readonly=True,
        states={'draft': [('readonly', False)]},
        help="Porcentaje de detraccion segon resolucion 183-2004/SUNAT")

    detraction_payer = fields.Selection(
        selection=[('partner', 'Socio'),
                   ('company', 'Empresa')],
        string='Paga Detracción',
        default='partner',
        help='Indica el responsable que realizará el deposito de la Detracción del Comprobante.')

    @api.onchange('invoice_line_ids')
    def _onchange_invoice_line_ids2(self):
        if self.invoice_line_ids:
            obj_spot = False
            list_prodc = [line.product_id for line in self.invoice_line_ids if line.product_id.id]
            if list_prodc:
                obj_spot = self._l10n_pe_edi_get_spot()
            if obj_spot:
                self.l10n_pe_withhold = True
                self.l10n_pe_withhold_code = obj_spot.get('PaymentMeansID')
                self.l10n_pe_withhold_percentage = obj_spot.get('PaymentPercent')
            else:
                self.l10n_pe_withhold = False
                self.l10n_pe_withhold_code = False
                self.l10n_pe_withhold_percentage = False

