# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import defaultdict
import datetime
import uuid

from odoo import api, fields, models, tools, _
from odoo.exceptions import AccessError
from odoo.tools import pycompat
from odoo.tools import misc



class SupertoolGroup(models.Model):
    _name = 'supertool.group'
    _description = 'Grupos'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True, string='Grupo')
    sequence = fields.Integer(default=10)
    tipo = fields.Selection([('tipo1','Tipo 1'),('tipo2','Tipo 2'),('tipo3','Tipo 3')], String="Tipo", index=True, default='tipo1')

    _sql_constraints = [
        ('name_uniq', 'unique (name)', "Group name already exists !"),
    ]

class SupertoolPillar(models.Model):
    _name = 'supertool.pillar'
    _description = 'Pilares'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True, string='Pilar')
    sequence = fields.Integer(default=10)

    _sql_constraints = [
        ('name_uniq', 'unique (name)', "Pillar name already exists !"),
    ]

class SupertoolConcept(models.Model):
    _name = 'supertool.concept'
    _description = 'Conceptos'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True)
    pillar_id = fields.Many2one('supertool.pillar', required=True, index=True, copy=False)
    sequence = fields.Integer(default=10)

    _sql_constraints = [
        ('name_uniq', 'unique (name)', "Concept name already exists !"),
    ]

class SupertoolProcess(models.Model):
    _name = 'supertool.process'
    _description = 'Procesos'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True)
    parent_id = fields.Many2one('supertool.process', string='Parent Process', index=True)
    child_ids = fields.One2many('supertool.process', 'parent_id', string='Child Process')
    sequence = fields.Integer(default=10)

    _sql_constraints = [
        ('name_uniq', 'unique (name)', "Process name already exists !"),
    ]

class SupertoolOrganization(models.Model):
    _name = 'supertool.organization'
    _description = 'Organización'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True)
    parent_id = fields.Many2one('supertool.organization', string='Parent Organization', index=True)
    child_ids = fields.One2many('supertool.organization', 'parent_id', string='Child Organization')
    sequence = fields.Integer(default=10)

    _sql_constraints = [
        ('name_uniq', 'unique (name)', "Organization name already exists !"),
    ]



class ProjectEntregables(models.Model):
    _name = 'project.entregables'
    _description = 'Entregables del Proyecto'
    _order = 'sequence'

    name = fields.Char(required=True, translate=True)
    sequence = fields.Integer(default=10)
    project_id = fields.Many2one('project.project', required=True, string='Proyecto', index=True)
    image = fields.Binary(string="Imagen")

    task_ids = fields.One2many('project.task', 'entregable_id', string='Tareas')

    task_stage_id = fields.Many2one('project.task.type',related='task_ids.stage_id',
        readonly=True, store=True,
        groups="base.group_user")

    task_plan_ini_date = fields.Date(related='task_ids.plan_ini_date',
        readonly=True, store=True,
        groups="base.group_user")

class ProjectProject(models.Model):
    _inherit = ['project.project']


    objetivo = fields.Text(string='Objetivo')
    alcance = fields.Text(string='Alcance')

    group_id = fields.Many2one('supertool.group', string="Grupo")
    concept_id = fields.Many2one('supertool.concept', string="Concepto")
    pillar_id = fields.Many2one("supertool.pillar", related='concept_id.pillar_id', string="Pilar", readonly=True, store=True)
    process_id = fields.Many2one('supertool.process', string="Proceso")
    organization_id = fields.Many2one('supertool.organization', string="Organización")

    capex = fields.Float('CAPEX')
    opex = fields.Float('OPEX')

    entregable_ids = fields.One2many('project.entregables', 'project_id', string='Entregables')




class ProjectTask(models.Model):
    _inherit = ['project.task']

    plan_ini_date = fields.Date(string='Inicio Plan')
    plan_fin_date = fields.Date(string='Fin Plan')
    real_ini_date = fields.Date(string='Inicio Real')
    real_fin_date = fields.Date(string='Fin Real')

    entregable_id = fields.Many2one('project.entregables', string='Entregables por Tarea', index=True)

    project_group_id = fields.Many2one("supertool.group", related='project_id.group_id', string="Grupo", readonly=True, store=True)
    project_process_id = fields.Many2one("supertool.process", related='project_id.process_id', string="Proceso", readonly=True, store=True)
    project_organization_id = fields.Many2one("supertool.organization", related='project_id.organization_id', string="Organización", readonly=True, store=True)
    project_user_id = fields.Many2one("res.users", related='project_id.user_id', string="Responsable de proyecto", readonly=True, store=True)


class MailActivity(models.Model):
    _inherit = ['mail.activity']


    date_deadline_now = fields.Date(string='Fecha')
    calendar_start_date = fields.Date(related='calendar_event_id.start_date', string="Agenda", readonly=True, store=True)
    res_project_id = fields.Many2one("project.project", compute='_compute_res_project_id', string="Proyecto", readonly=True, store=True)

    usuario_actual = fields.Many2one("res.users", compute='_get_current_user')
    es_usuario_actual = fields.Boolean(string="Es usuario actual?", compute='_get_es_usuario_actual')
    usuario_actual_id = fields.Many2one("res.users", default=lambda self: self.env.user)
    
    @api.depends('res_model_id','res_id')
    def _compute_res_project_id(self):
        for activity in self:
            try:
                activity.res_project_id = self.env[activity.res_model].browse(activity.res_id).project_id
            except Exception as e:
                no_project = True

    def _get_current_user(self):
        for rec in self:
            rec.update({'usuario_actual' : self.env.user.id})

    def _get_es_usuario_actual(self):
        for rec in self:
            if self.env.user.id == rec.user_id.id:
                rec.update({'es_usuario_actual' : True})
            else:
                rec.update({'es_usuario_actual' : False})

    def on_test_server_action(self):
        return{
            'name'          :   ('Tablero de Gestión'),
            'type'          :   'ir.actions.act_window',
            'view_type'     :   'form',
            'view_mode'     :   'form',
            'res_model'     :   'board.board'
            }


class Message(models.Model):

    _inherit = "mail.message"

    date_final = fields.Date(string='Fecha Final')
            		

