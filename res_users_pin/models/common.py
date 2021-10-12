# -*- coding: utf-8 -*-

import logging

import odoo.release
import odoo.tools
from odoo.exceptions import AccessDenied
from odoo.tools.translate import _

from odoo.service import common

_logger = logging.getLogger(__name__)

RPC_VERSION_1 = {
        'server_version': odoo.release.version,
        'server_version_info': odoo.release.version_info,
        'server_serie': odoo.release.serie,
        'protocol_version': 1,
}

def exp_authenticate(db, login, password, user_agent_env, pin):
    if not pin:
        return False
    if not user_agent_env:
        user_agent_env = {}
    res_users = odoo.registry(db)['res.users']
    try:
        return res_users.authenticate(db, login, password, {**user_agent_env, 'interactive': False,'pin':pin})
    except AccessDenied:
        return False

common.exp_authenticate = exp_authenticate