import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';

export default function Sidebar({ closeSidebar }) {
    const { menus } = useMenu();

    // اگر منویی وجود ندارد
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
    // رندر بازگشتی منوها
    // ============================================================
    const renderMenus = (menuList) => {
        return menuList.map((menu) => {
            // اگر منو زیرمنو دارد
            if (menu.children && menu.children.length > 0) {
                return (
                    <li key={menu.id} className="nav-item dropdown">
                        <a
                            className="nav-link dropdown-toggle"
                            href="#"
                            role="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#submenu-${menu.id}`}
                            aria-expanded="false"
                            onClick={(e) => {
                                e.preventDefault();
                                const target = document.getElementById(`submenu-${menu.id}`);
                                if (target) {
                                    target.classList.toggle('show');
                                }
                            }}
                        >
                            {menu.icon && <i className={`bi ${menu.icon} me-2`}></i>}
                            {menu.title}
                            <i className="bi bi-chevron-down ms-auto dropdown-arrow"></i>
                        </a>
                        <div className="collapse" id={`submenu-${menu.id}`}>
                            <ul className="nav flex-column">
                                {renderMenus(menu.children)}
                            </ul>
                        </div>
                    </li>
                );
            }

            // منوی ساده
            return (
                <li key={menu.id} className="nav-item">
                    <NavLink
                        to={menu.path || '#'}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                        }
                        onClick={closeSidebar}
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
                {renderMenus(menus)}
            </ul>
        </>
    );
}