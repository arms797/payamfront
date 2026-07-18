import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';

export default function Sidebar() {
    const { menus } = useMenu();
    const [openMenuId, setOpenMenuId] = useState(null); // فقط یک منو باز می‌شود

    if (!menus || menus.length === 0) {
        return (
            <div className="sidebar-empty">
                <div className="sidebar-header">
                    <h5 className="mb-0">منوی سیستم</h5>
                </div>
                <p className="text-muted text-center p-3">هیچ منویی برای نمایش وجود ندارد</p>
            </div>
        );
    }

    // ============================================================
    // 🔥 تغییر وضعیت منو: فقط یک منو در هر لحظه باز می‌شود
    // ============================================================
    const toggleMenu = (menuId) => {
        setOpenMenuId(prev => (prev === menuId ? null : menuId));
    };

    // ============================================================
    // 🔥 فیلتر کردن منوهایی که هم مسیر ندارند و هم زیرمنو ندارند
    // ============================================================
    const filterEmptyMenus = (menuList) => {
        return menuList.filter(menu => {
            if (menu.children && menu.children.length > 0) {
                menu.children = filterEmptyMenus(menu.children);
                return menu.children.length > 0;
            }
            return menu.path && menu.path.trim() !== '';
        });
    };

    const filteredMenus = filterEmptyMenus(menus);

    if (filteredMenus.length === 0) {
        return (
            <div className="sidebar-empty">
                <div className="sidebar-header">
                    <h5 className="mb-0">منوی سیستم</h5>
                </div>
                <p className="text-muted text-center p-3">هیچ منویی برای نمایش وجود ندارد</p>
            </div>
        );
    }

    const renderMenus = (menuList) => {
        return menuList.map((menu) => {
            if (menu.children && menu.children.length > 0) {
                const isOpen = openMenuId === menu.id;
                return (
                    <li key={menu.id} className="nav-item">
                        <div
                            className="nav-link dropdown-toggle"
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleMenu(menu.id)}
                        >
                            {menu.icon && <i className={`bi ${menu.icon} me-2`}></i>}
                            {menu.title}
                            <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-auto`}></i>
                        </div>
                        {isOpen && (
                            <ul className="nav flex-column ms-3">
                                {renderMenus(menu.children)}
                            </ul>
                        )}
                    </li>
                );
            }

            // ============================================================
            // 🔥 اصلاح مسیرها
            // ============================================================
            let path;
            if (menu.path === '/dashboard') {
                path = '/dashboard';
            } else if (menu.path?.startsWith('/')) {
                path = `/dashboard${menu.path}`;
            } else if (menu.path) {
                path = `/dashboard/${menu.path}`;
            } else {
                path = '#';
            }

            return (
                <li key={menu.id} className="nav-item">
                    <NavLink
                        to={path}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        {menu.icon && <i className={`bi ${menu.icon} me-2`}></i>}
                        {menu.title}
                    </NavLink>
                </li>
            );
        });
    };

    return (
        <>
            <div className="sidebar-header">
                <h5 className="mb-0">منوی سیستم</h5>
            </div>
            <ul className="nav flex-column">
                {renderMenus(filteredMenus)}
            </ul>
        </>
    );
}