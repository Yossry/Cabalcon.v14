# -*- coding: utf-8 -*-

from odoo import api, fields, models, tools, _
import operator


class IrUiMenu(models.Model):
    _inherit = "ir.ui.menu"
    
    category_id = fields.Many2one('ir.ui.menu.category', string="Category")
    
    @api.model
    @tools.ormcache_context('self._uid', 'debug', keys=('lang',))
    def load_menus(self, debug):
        """[summary]
        加载所有菜单项（所有应用程序及其子菜单）。
        odoo/addons/base/models/ir_ui_menu.py
        
        ：return：菜单根目录
        ：rtype:dict（'children'：菜单\节点）
        """
        
        fields = ['name', 'sequence', 'parent_id', 'action', 'web_icon', 'web_icon_data', 'category_id']  #增加category_id字段
        menu_roots = self.get_user_roots()
        menu_roots_data = menu_roots.read(fields) if menu_roots else []
        menu_root = {
            'id': False,
            'name': 'root',
            'parent_id': [-1, ''],
            'children': menu_roots_data,
            'all_menu_ids': menu_roots.ids,
        }

        if not menu_roots_data:
            return menu_root

        # 与常规树视图不同，菜单完全加载，因为项目数量有限（安装所有6.1插件时为752个）
        menus = self.search([('id', 'child_of', menu_roots.ids)])
        menu_items = menus.read(fields)

        # 在序列的末尾添加根，这样当放入id:item映射时，它们将覆盖从完整菜单读取的等效菜单项，从而在根上正确设置子菜单项。
        menu_items.extend(menu_roots_data)
        menu_root['all_menu_ids'] = menus.ids  # 包括菜单根！

        # 使用parent_id创建树
        menu_items_map = {menu_item["id"]: menu_item for menu_item in menu_items}
        for menu_item in menu_items:
            parent = menu_item['parent_id'] and menu_item['parent_id'][0]
            if parent in menu_items_map:
                menu_items_map[parent].setdefault(
                    'children', []).append(menu_item)

        #  使用parent_id按顺序对树进行排序
        for menu_item in menu_items:
            menu_item.setdefault('children', []).sort(key=operator.itemgetter('sequence'))

        (menu_roots + menus)._set_menuitems_xmlids(menu_root)

        return menu_root