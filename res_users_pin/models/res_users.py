# -*- coding: utf-8 -*-

from odoo import api, fields, models, tools, SUPERUSER_ID, _
from odoo.exceptions import AccessDenied, AccessError, UserError, ValidationError
from odoo.http import request
import logging


_logger = logging.getLogger(__name__)


class ResUsers(models.Model):
    _inherit = 'res.users'

    pin = fields.Char(related='employee_id.pin', string="PIN", related_sudo=False, copy=False, store=True)

    @classmethod
    def _login(cls, db, login, password, user_agent_env):
        res = super(ResUsers, cls)._login(db, login, password, user_agent_env)
        ip = request.httprequest.environ['REMOTE_ADDR'] if request else 'n/a'
        if user_agent_env.get('pin'):
            pin = user_agent_env.get('pin')
            try:
                with cls.pool.cursor() as cr:
                    self = api.Environment(cr, SUPERUSER_ID, {})[cls._name]
                    with self._assert_can_auth():
                        user = self.search(self._get_login_domain(login), order=self._get_login_order(), limit=1)
                        pin_user = user.pin
                        if pin_user:
                            if pin_user != pin:
                                raise AccessDenied()
                        else:
                            asing_pi = user._update_pin_first_time(pin)
                            if not asing_pi:
                                raise AccessDenied()
            except AccessDenied:
                _logger.info("Login failed for db:%s login:%s from %s", db, login, ip)
                raise
        return res

    @api.model
    def _update_pin_first_time(self,pin):
        if pin:
            employee = self.env['hr.employee'].search([('user_id','=',self.id)])
            if employee:
                employee.write({'pin':pin})
                return True
        return False
