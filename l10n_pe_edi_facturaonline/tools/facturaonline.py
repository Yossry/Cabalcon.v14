import contextlib
import logging
import json
import requests
import uuid
from unittest.mock import patch

from odoo import exceptions, _
from odoo.tests.common import BaseCase
from odoo.tools import pycompat
from odoo import models, fields
import hmac
import hashlib
import time
from datetime import datetime, timedelta



def facturaonline_jsonrpc(url, method='call', params=None, credentials=None, timeout=15):
    efact_secret_key_val = credentials.get('secret_key')
    efact_acces_key_val = credentials.get('acces_key')
    timestmap = str(int(time.time()))
    message = efact_acces_key_val + '|' + timestmap
    signature = hmac.new(str(efact_secret_key_val).encode('utf-8'), str(message).encode('utf-8'),
                         hashlib.sha256).hexdigest()
    headers = {'Authorization': 'Fo ' + efact_acces_key_val + ':' + signature + ':' + timestmap,
               'Content-Type': 'application/json', 'Accept': 'application/json'}

    try:
        req = requests.Request('POST', url, headers=headers, json=params)
        prepared = req.prepare()
        s = requests.Session()
        # Respuesta
        responsefactura = s.send(prepared)
        jresponsefactura = responsefactura.json()
        # Estos códigos solo están disponibles durante un error
        responsefactura_code = jresponsefactura.get("code")  # CÓDIGO DE ERROR
        responsefactura_status = jresponsefactura.get("status")  # STATUS CONEXION HTTP
        responsefactura_message = jresponsefactura.get("message")  # DESCRIPCION DEL ERROR
        responsefactura_description = jresponsefactura.get("description")  # ESPECIFICACION DEL ERROR
        if responsefactura_message or responsefactura_description:
            e_class = exceptions.UserError
            message_error = responsefactura_description or responsefactura_message
            e = e_class(message_error)
            e.data = responsefactura_description
            raise e
        mytime = datetime.strptime(jresponsefactura.get("fechaEmision"), "%Y-%m-%d %H:%M:%S")
        mytime += timedelta(hours=5)
        return jresponsefactura
    except (ValueError, requests.exceptions.ConnectionError, requests.exceptions.MissingSchema, requests.exceptions.Timeout, requests.exceptions.HTTPError) as e:
        raise exceptions.AccessError(
            _('The url that this service requested returned an error. Please contact the author of the app. The url it tried to contact was %s', url)
        )

    return

def facturaonline_convert_data(invoice,data_process):
    data = get_header_invoice(invoice,data_process)
    return data

def get_header_invoice(invoice,data_process):
    numero_doc = invoice.name.replace(' ', '')
    total_taxes = round(data_process['tax_details']['total_taxes'], 2)
    total_included = round(data_process['tax_details']['total_included'], 2)
    totalVentaGravada = 0
    totalVentaExonerada = 0
    totalVentaInafecta = 0
    sumatoriaIgv = 0
    tipo_documento = invoice.l10n_latam_document_type_id.code
    invoice_lines = get_detail_invoice(invoice,data_process)
    data = {}
    for element in data_process['tax_details']['grouped_taxes']:
        if element.get('l10n_pe_edi_tax_code') == '1000':
            totalVentaGravada += element.get('base')
            sumatoriaIgv += element.get('amount')
        if element.get('l10n_pe_edi_tax_code') == '9997':
            totalVentaExonerada += element.get('base')
        if element.get('l10n_pe_edi_tax_code') == '9998':
            totalVentaInafecta += element.get('base')

        date_due = fields.Date.from_string(invoice.invoice_date_due).strftime('%Y-%m-%d')
        data = {
            'tipoOperacion': invoice.l10n_pe_edi_operation_type,
            #'tipoOperacion': invoice.l10n_latam_document_type_id.code,
            'serie': numero_doc.split('-')[0],
            'numero': int(numero_doc.split('-')[1]),  # En caso de electrónica, se genera solo.
            'montoTotalImpuestos': total_taxes,
            'importeTotal': total_included,
            'totalVentaGravada': totalVentaGravada,
            ### Para revisar si deben de ir valores de Exoneradas e Inafectas acá
            'sumatoriaIgv': sumatoriaIgv,
            # IGV total de la factura, no debe contener el IGV que corresponde a las transferencias de bienes o servicios prestados a título gratuito que estuviesen gravados con el IGV.
            'totalVentaExonerada': totalVentaExonerada,
            'totalVentaInafecta': totalVentaInafecta,

            'adicional': {
                'fechaVencimiento': date_due,
                #'ordenCompra': invoice.purchase_order,

            },
            'tipoMoneda': invoice.currency_id.name,
            'items': invoice_lines,
            'receptor': {
                'tipo': invoice.partner_id.l10n_latam_identification_type_id.l10n_pe_vat_code,
                'nro': invoice.partner_id.vat,
            },
        }
        if tipo_documento == '07':
             data.pop('tipoOperacion')
             data['tipoNotaCredito'] = invoice.l10n_pe_edi_refund_reason
             data['descripcion'] = invoice.ref
             data['serieAfectado'] =invoice.reversed_entry_id.name.replace(' ', '').split('-')[0]
             data['numeroAfectado'] =int(invoice.reversed_entry_id.name.replace(' ', '').split('-')[1])
             data['tipoComprobanteAfectado'] = invoice.reversed_entry_id.l10n_latam_document_type_id.code

        if tipo_documento == '08':
            data.pop('tipoOperacion')
            data['tipoNotaDebito'] = invoice.l10n_pe_edi_charge_reason
            data['descripcion'] = invoice.ref
            data['serieAfectado'] = invoice.debit_origin_id.name.replace(' ', '').split('-')[0]
            data['numeroAfectado'] = int(invoice.debit_origin_id.name.replace(' ', '').split('-')[1])
            data['tipoComprobanteAfectado'] = invoice.reversed_entry_id.l10n_latam_document_type_id.code

    return data

def get_detail_invoice(invoice,data_process):
    invoice_lines = []
    if not invoice.invoice_line_ids2:
        for element in data_process.get('invoice_lines_vals'):
            line = element.get('line')
            line_tax_detail =  element.get('tax_details')
            tax = line.tax_ids
            valorUnitario = 0
            if tax.price_include:
                valorUnitario = line.price_subtotal / line.quantity
            else:
                valorUnitario = line.price_unit

            baseafectacionigv_val = line.price_subtotal
            montoafectacionigv_val = porcentajeimpuesto_val = 0
            if tax.l10n_pe_edi_tax_code == '1000':
                montoafectacionigv_val = baseafectacionigv_val * (tax.amount / 100)
                porcentajeimpuesto_val = tax.amount

            tipoafectacionigv_val = tax.l10n_pe_edi_affectation_reason
            codigotributo_val = tax.l10n_pe_edi_tax_code

            #line_vals['tax_details']['unit_total_included'])
            #uom_sunat =  line.product_uom_id.l10n_pe_edi_measure_unit_code
            invoice_line = {
                'unidadMedidaCantidad': line.product_uom_id.l10n_pe_edi_measure_unit_code,
                'cantidad': line.quantity,
                'descripcion': line.name,
                'valorUnitario': round(valorUnitario,2),  # Precio unitario sin impuestos
                'precioVentaUnitario': line_tax_detail.get('unit_total_included'),  # Precio unitario + impuestos
                'tipoPrecioVentaUnitario': '01',  # Precio unitario (incluye el IGV)
                'montoTotalImpuestosItem': round(line.price_total - line.price_subtotal,2),  # Total de Impuestos -- MEJORAR
                'baseAfectacionIgv': baseafectacionigv_val,  # Base imponible o Exonerado
                'montoAfectacionIgv': montoafectacionigv_val,  # Monto IGV
                'porcentajeImpuesto': porcentajeimpuesto_val,  # Porcentaje del IGV
                'tipoAfectacionIgv': tipoafectacionigv_val,
                'codigoTributo': codigotributo_val,
                'valorVenta': line.price_subtotal,  # Subtotal sin Impuestos
            }
            invoice_lines.append(invoice_line)
    else:
        for line2 in invoice.invoice_line_ids2:
            baseafectacionigv_val = line2.price_unit  # Base Imponible
            montoafectacionigv_val = porcentajeimpuesto_val = 0
            tax = line2.taxes_ids
            if tax.l10n_pe_edi_tax_code == '1000':
                montoafectacionigv_val = baseafectacionigv_val * (tax.amount / 100)  # Monto IGV
                porcentajeimpuesto_val = tax.amount  # Porcentaje del IGV

            tipoafectacionigv_val = tax.l10n_pe_edi_affectation_reason
            codigotributo_val = tax.l10n_pe_edi_tax_code
            invoice_line = {
                'unidadMedidaCantidad': 'ZZ',
                'cantidad': line2.quantity,  # Se agrega cantidad. Por default =1.00
                'descripcion': line2.name,
                'valorUnitario': line2.price_unit,  # Precio unitario sin impuestos
                'precioVentaUnitario': round(line2.price_unit + montoafectacionigv_val, 2),  # Precio unitario + impuestos
                'tipoPrecioVentaUnitario': '01',  # Precio unitario (default=01)
                'montoTotalImpuestosItem': round(montoafectacionigv_val, 2),  # Total de Impuestos
                'baseAfectacionIgv': line2.price_unit,  # Base imponible
                'montoAfectacionIgv': round(montoafectacionigv_val, 2),  # Monto Impuesto
                'porcentajeImpuesto': porcentajeimpuesto_val,  # Porcentaje del Impuesto
                'tipoAfectacionIgv': tipoafectacionigv_val,
                'codigoTributo': codigotributo_val,
                'valorVenta': line2.price_unit,  # Subtotal sin Impuestos

            }

    return invoice_lines



