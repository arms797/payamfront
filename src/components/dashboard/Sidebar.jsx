import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';

export default function Sidebar({ onClose }) {
    const { menus } = useMenu();
    const [openMenuId, setOpenMenuId] = useState(null);

    const filterEmptyMenus = (menuList) => {
        if (!Array.isArray(menuList)) return [];

        return menuList
            .map((menu) => {
                if (menu.children && menu.children.length > 0) {
                    return {
                        ...menu,
                        children: filterEmptyMenus(menu.children),
                    };
                }
                return { ...menu };
            })
            .filter((menu) => {
                if (menu.children && menu.children.length > 0) return true;
                return Boolean(menu.path && String(menu.path).trim());
            });
    };

    const filteredMenus = useMemo(
        () => filterEmptyMenus(menus || []),
        [menus]
    );

    const toggleMenu = (menuId) => {
        setOpenMenuId((prev) => (prev === menuId ? null : menuId));
    };

    const resolvePath = (menuPath) => {
        if (!menuPath) return '#';
        if (menuPath === '/dashboard') return '/dashboard';
        if (menuPath.startsWith('/')) return `/dashboard${menuPath}`;
        return `/dashboard/${menuPath}`;
    };

    const renderMenus = (menuList) =>
        menuList.map((menu) => {
            const isParentMenu = menu.parentId === null;

            if (menu.children && menu.children.length > 0) {
                const isOpen = openMenuId === menu.id;

                return (
                    <li key={menu.id} className="nav-item">
                        <div
                            className={`nav-link dropdown-toggle ${isParentMenu ? 'fw-bold' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleMenu(menu.id)}
                        >
                            {menu.icon && <i className={`bi ${menu.icon} me-2`}></i>}
                            <span>{menu.title}</span>
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

            return (
                <li key={menu.id} className="nav-item">
                    <NavLink
                        to={resolvePath(menu.path)}
                        className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''} ${isParentMenu ? 'fw-bold' : ''}`
                        }
                        onClick={() => {
                            // فقط در موبایل/تبلت بعد از انتخاب منو بسته شود
                            if (typeof onClose === 'function' && window.innerWidth < 992) {
                                onClose();
                            }
                        }}
                    >
                        {menu.icon && <i className={`bi ${menu.icon} me-2`}></i>}
                        <span>{menu.title}</span>
                    </NavLink>
                </li>
            );
        });

    return (
        <>
            <div className="sidebar-header d-flex align-items-center justify-content-between px-3 pb-3 mb-2 border-bottom">
                <h5 className="mb-0">منوی سیستم</h5>

                {typeof onClose === 'function' && (
                    <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={onClose}
                        aria-label="بستن منو"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                )}
            </div>

            {filteredMenus.length === 0 ? (
                <p className="text-muted text-center p-3 mb-0">
                    هیچ منویی برای نمایش وجود ندارد
                </p>
            ) : (
                <ul className="nav flex-column">{renderMenus(filteredMenus)}</ul>
            )}
        </>
    );
}