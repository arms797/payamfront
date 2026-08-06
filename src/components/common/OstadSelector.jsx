// src/components/common/OstadSelector.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import PersianNumber from '../../components/common/PersianNumber';

export default function OstadSelector({
    value,
    onChange,
    label = 'استاد',
    required = false,
    disabled = false,
    className = '',
    placeholder = 'جستجوی استاد...',
    onlyElmi = true  // فقط اساتید هیات علمی پیام نور (NoeHamkari = 1)
}) {
    const { user, currentRoleId } = useAuth();
    const { markazList } = useMarkaz();

    // ============================================================
    // Stateها
    // ============================================================
    const [searchTerm, setSearchTerm] = useState('');
    const [ostadList, setOstadList] = useState([]);
    const [selectedOstad, setSelectedOstad] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // ============================================================
    // گرفتن نقش فعال
    // ============================================================
    const activeRole = useMemo(() => {
        if (!user?.roles || !currentRoleId) return null;
        return user.roles.find(role => role.id === currentRoleId) || null;
    }, [user, currentRoleId]);

    const codeRole = useMemo(() => {
        return activeRole?.codeRole || 4;
    }, [activeRole]);

    const userMarkazId = useMemo(() => {
        return user?.markazId || null;
    }, [user]);

    const userOstanCode = useMemo(() => {
        return user?.markazOstan || null;
    }, [user]);

    // ============================================================
    // جستجوی اساتید
    // ============================================================
    const searchOstads = useCallback(async (search) => {
        if (!search || search.trim().length < 2) {
            setOstadList([]);
            return;
        }

        setLoading(true);
        try {
            const params = {
                search: search.trim(),
                pageSize: 20,
                page: 1,
                vazeeat: 1
            };

            // فقط نوع همکاری 1 (هیات علمی پیام نور)
            if (onlyElmi) {
                params.noeHamkari = 1;
            }

            const response = await api.get('/Ostad/list', { params });
            if (response.data?.success) {
                let filtered = response.data.data || [];

                // ============================================================
                // 🔥 فیلتر بر اساس نقش فعال
                // ============================================================
                if (codeRole === 4 && userMarkazId) {
                    filtered = filtered.filter(o => o.markazId === userMarkazId);
                }
                else if (codeRole === 3 && userOstanCode) {
                    const ostanMarkazIds = markazList
                        ?.filter(m => m.codeOstan === userOstanCode)
                        .map(m => m.id) || [];
                    filtered = filtered.filter(o => ostanMarkazIds.includes(o.markazId));
                }

                setOstadList(filtered);
                setShowDropdown(filtered.length > 0);
            }
        } catch (error) {
            console.error('خطا در جستجوی اساتید:', error);
            toast.error('خطا در جستجوی اساتید');
        } finally {
            setLoading(false);
        }
    }, [codeRole, userMarkazId, userOstanCode, markazList, onlyElmi]);

    // ============================================================
    // Debounce برای جستجو
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearch && debouncedSearch.trim().length >= 2) {
                searchOstads(debouncedSearch);
            } else {
                setOstadList([]);
                setShowDropdown(false);
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [debouncedSearch, searchOstads]);

    // ============================================================
    // تغییر جستجو
    // ============================================================
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setDebouncedSearch(value);
    };

    // ============================================================
    // انتخاب استاد از لیست
    // ============================================================
    const selectOstad = (ostad) => {
        setSelectedOstad(ostad);
        setSearchTerm(ostad.codeOstadi);
        setOstadList([]);
        setShowDropdown(false);
        onChange(ostad.userId);
    };

    // ============================================================
    // پاک کردن انتخاب
    // ============================================================
    const clearSelection = () => {
        setSelectedOstad(null);
        setSearchTerm('');
        setOstadList([]);
        setShowDropdown(false);
        onChange(null);
    };

    // ============================================================
    // بررسی اینکه استاد هیات علمی پیام نور است (فقط نوع 1)
    // ============================================================
    const isElmiOstad = (ostad) => {
        return ostad.noeHamkari === 1;
    };

    // ============================================================
    // دریافت نمایش نوع همکاری
    // ============================================================
    const getNoeHamkariText = (noe) => {
        const map = {
            1: 'هیات علمی پیام نور',
            2: 'هیات علمی غیر پیام نور',
            3: 'مدرس مدعو',
            4: 'هیات علمی پیام نور (سایر استان‌ها)'
        };
        return map[noe] || '-';
    };

    // ============================================================
    // مقداردهی اولیه (اگر value داده شده باشد)
    // ============================================================
    useEffect(() => {
        if (value && !selectedOstad) {
            const fetchOstad = async () => {
                try {
                    const response = await api.get(`/User/by-type?type=ostad&id=${value}`);
                    if (response.data?.success) {
                        const userData = response.data.data;
                        if (userData) {
                            setSelectedOstad({
                                id: userData.id,
                                userId: userData.id,
                                naam: userData.firstName || '',
                                naamKhanevadegi: userData.lastName || '',
                                codeOstadi: userData.userName || '',
                                markazName: '',
                                noeHamkari: 1
                            });
                            setSearchTerm(userData.userName || '');
                        }
                    }
                } catch (error) {
                    console.error('خطا در دریافت اطلاعات استاد:', error);
                }
            };
            fetchOstad();
        }
    }, [value]);

    // ============================================================
    // اگر مقدار value تغییر کرد و null شد، انتخاب را پاک کن
    // ============================================================
    useEffect(() => {
        if (value === null || value === undefined || value === '') {
            setSelectedOstad(null);
            setSearchTerm('');
        }
    }, [value]);

    return (
        <div className={className}>
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            {/* ============================================================
                فیلد جستجو / نمایش استاد انتخاب شده
                ============================================================ */}
            {selectedOstad ? (
                <div className="d-flex align-items-center justify-content-between border rounded p-2 bg-light">
                    <div className="d-flex flex-column">
                        <strong>
                            {selectedOstad.naam} {selectedOstad.naamKhanevadegi}
                        </strong>
                        <small className="text-muted">
                            <PersianNumber>{selectedOstad.codeOstadi}</PersianNumber>
                            {selectedOstad.markazName || 'بدون مرکز'}
                            {selectedOstad.noeHamkari === 1 && (
                                <span className="badge bg-success ms-2">
                                    هیات علمی پیام نور
                                </span>
                            )}
                        </small>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={clearSelection}
                            title="حذف انتخاب"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>
            ) : (
                <div className="position-relative">
                    <input
                        type="text"
                        className={`form-control ${loading ? 'bg-light' : ''}`}
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => {
                            if (ostadList.length > 0) {
                                setShowDropdown(true);
                            }
                        }}
                        onBlur={() => {
                            setTimeout(() => setShowDropdown(false), 200);
                        }}
                        disabled={disabled}
                        autoComplete="off"
                    />
                    {loading && (
                        <div className="position-absolute end-0 top-0 mt-2 me-3">
                            <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                        </div>
                    )}

                    {/* ============================================================
                        لیست نتایج جستجو
                        ============================================================ */}
                    {showDropdown && ostadList.length > 0 && (
                        <div
                            className="dropdown-menu show w-100"
                            style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                position: 'absolute',
                                zIndex: 1060,
                                top: '100%',
                                left: 0,
                                marginTop: '2px'
                            }}
                        >
                            {ostadList.map((ostad) => {
                                const isElmi = isElmiOstad(ostad);
                                return (
                                    <button
                                        key={ostad.id}
                                        type="button"
                                        className={`dropdown-item ${!isElmi ? 'text-muted' : ''}`}
                                        onClick={() => {
                                            if (isElmi) {
                                                selectOstad(ostad);
                                            } else {
                                                toast.warning('این استاد هیات علمی پیام نور نیست');
                                            }
                                        }}
                                        style={{ whiteSpace: 'normal' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center w-100">
                                            <div>
                                                <strong>{ostad.naam} {ostad.naamKhanevadegi}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    <code>{ostad.codeOstadi}</code>
                                                    {' - '}
                                                    {ostad.markazName || 'بدون مرکز'}
                                                </small>
                                            </div>
                                            <div className="text-end">
                                                {isElmi ? (
                                                    <span className="badge bg-success">
                                                        هیات علمی پیام نور
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary">
                                                        غیر مجاز
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {showDropdown && ostadList.length === 0 && debouncedSearch.trim().length >= 2 && (
                        <div
                            className="dropdown-menu show w-100"
                            style={{
                                position: 'absolute',
                                zIndex: 1060,
                                top: '100%',
                                left: 0,
                                marginTop: '2px'
                            }}
                        >
                            <div className="dropdown-item text-muted text-center">
                                <i className="bi bi-search me-1"></i>
                                استادی یافت نشد
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================
                راهنمای جستجو
                ============================================================ */}
            {!selectedOstad && !disabled && (
                <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    کد استادی، نام یا نام خانوادگی را وارد کنید
                    <span className="d-block text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        فقط اساتید هیات علمی پیام نور قابل انتخاب هستند
                    </span>
                </small>
            )}
        </div>
    );
}