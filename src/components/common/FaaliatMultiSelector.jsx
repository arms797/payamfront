// src/components/common/FaaliatMultiSelector.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';

export default function FaaliatMultiSelector({
    value,           // لیست Idهای انتخاب‌شده (مثلاً [1, 3, 5])
    onChange,        // تابع تغییر: (newIds) => void
    noeAnjam,        // 1=حضوری، 2=مجازی، 3=ترکیبی
    label = 'فعالیت‌ها',
    required = false,
    disabled = false,
    className = ''
}) {
    const [faaliatList, setFaaliatList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // ============================================================
    // دریافت لیست فعالیت‌ها بر اساس نوع انجام
    // ============================================================
    useEffect(() => {
        const fetchFaaliat = async () => {
            setLoading(true);
            try {
                const response = await api.get('/Faaliat/list');
                if (response.data?.success) {
                    let filtered = response.data.data.filter(f => f.vazeeat === true);

                    // فیلتر بر اساس نوع انجام
                    if (noeAnjam === 1) {
                        // حضوری: فقط NoeAnjam = 1 یا 3
                        filtered = filtered.filter(f => f.noeAnjam === 1 || f.noeAnjam === 3);
                    } else if (noeAnjam === 2) {
                        // مجازی: فقط NoeAnjam = 2 یا 3
                        filtered = filtered.filter(f => f.noeAnjam === 2 || f.noeAnjam === 3);
                    }
                    // اگر ترکیبی (3) باشد، همه را نشان بده

                    setFaaliatList(filtered);
                }
            } catch (error) {
                console.error('خطا در دریافت فعالیت‌ها:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFaaliat();
    }, [noeAnjam]);

    // ============================================================
    // فیلتر جستجو
    // ============================================================
    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return faaliatList;
        return faaliatList.filter(f =>
            f.onvan?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [faaliatList, searchTerm]);

    // ============================================================
    // مدیریت انتخاب/عدم انتخاب
    // ============================================================
    const handleToggle = (faaliatId) => {
        if (disabled) return;

        const current = value || [];
        const newValue = current.includes(faaliatId)
            ? current.filter(id => id !== faaliatId)
            : [...current, faaliatId];

        onChange(newValue);
    };

    // ============================================================
    // بررسی انتخاب بودن
    // ============================================================
    const isSelected = (faaliatId) => {
        return (value || []).includes(faaliatId);
    };

    // ============================================================
    // انتخاب همه / لغو همه
    // ============================================================
    const handleSelectAll = () => {
        if (disabled) return;
        const allIds = filteredList.map(f => f.id);
        onChange(allIds);
    };

    const handleDeselectAll = () => {
        if (disabled) return;
        onChange([]);
    };

    // ============================================================
    // دریافت کلاس رنگ بر اساس نوع انجام
    // ============================================================
    const getNoeAnjamClass = (noe) => {
        const map = {
            1: 'success',
            2: 'info',
            3: 'warning'
        };
        return map[noe] || 'secondary';
    };

    // ============================================================
    // آیکون بر اساس نوع انجام
    // ============================================================
    const getNoeAnjamIcon = (noe) => {
        const map = {
            1: 'bi-person',
            2: 'bi-laptop',
            3: 'bi-arrow-left-right'
        };
        return map[noe] || 'bi-question';
    };

    // ============================================================
    // دریافت متن نوع انجام
    // ============================================================
    const getNoeAnjamText = (noe) => {
        const map = {
            1: 'حضوری',
            2: 'مجازی',
            3: 'ترکیبی'
        };
        return map[noe] || '-';
    };

    // ============================================================
    // نمایش بارگذاری
    // ============================================================
    if (loading) {
        return (
            <div className={className}>
                {label && (
                    <label className="form-label">
                        {label} {required && <span className="text-danger">*</span>}
                    </label>
                )}
                <div className="d-flex align-items-center gap-2 text-muted">
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>در حال بارگذاری فعالیت‌ها...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && (
                <label className="form-label">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            {/* ============================================================
                نوار ابزار
                ============================================================ */}
            <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
                {/* جستجو */}
                <div className="flex-grow-1" style={{ minWidth: '150px' }}>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="جستجوی فعالیت..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={disabled || faaliatList.length === 0}
                    />
                </div>

                {/* دکمه‌های انتخاب همه / لغو همه */}
                {faaliatList.length > 0 && (
                    <div className="d-flex gap-1">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={handleSelectAll}
                            disabled={disabled}
                            title="انتخاب همه"
                        >
                            <i className="bi bi-check-all"></i>
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={handleDeselectAll}
                            disabled={disabled}
                            title="لغو همه"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                )}

                {/* تعداد انتخاب‌شده */}
                <span className="badge bg-primary">
                    {(value || []).length} انتخاب‌شده
                </span>
            </div>

            {/* ============================================================
                لیست فعالیت‌ها
                ============================================================ */}
            {filteredList.length === 0 ? (
                <div className="text-muted small py-2">
                    {searchTerm ? (
                        <>
                            <i className="bi bi-search me-1"></i>
                            فعالیتی با "{searchTerm}" یافت نشد
                        </>
                    ) : (
                        <>
                            <i className="bi bi-info-circle me-1"></i>
                            {noeAnjam ? (
                                'هیچ فعالیتی برای این نوع یافت نشد'
                            ) : (
                                'لطفاً ابتدا نوع فعالیت را انتخاب کنید'
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div
                    className="d-flex flex-wrap gap-2 p-2 border rounded bg-light"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                    {filteredList.map(f => (
                        <button
                            key={f.id}
                            type="button"
                            className={`btn btn-sm ${isSelected(f.id) ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => handleToggle(f.id)}
                            disabled={disabled}
                            style={{
                                borderColor: isSelected(f.id) ? (f.color || '#0d6efd') : undefined,
                                backgroundColor: isSelected(f.id) ? (f.color || '#0d6efd') : undefined,
                                color: isSelected(f.id) ? '#fff' : undefined
                            }}
                            title={f.onvan}
                        >
                            {/* نشانگر نوع انجام */}
                            <span className={`badge bg-${getNoeAnjamClass(f.noeAnjam)} me-1`}>
                                <i className={`bi ${getNoeAnjamIcon(f.noeAnjam)}`}></i>
                            </span>

                            {f.onvan}

                            {isSelected(f.id) && (
                                <i className="bi bi-check-circle-fill ms-1"></i>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ============================================================
                راهنما
                ============================================================ */}
            {noeAnjam && (
                <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    {noeAnjam === 1 && 'فقط فعالیت‌های حضوری و ترکیبی قابل انتخاب هستند'}
                    {noeAnjam === 2 && 'فقط فعالیت‌های مجازی و ترکیبی قابل انتخاب هستند'}
                    {noeAnjam === 3 && 'همه فعالیت‌ها قابل انتخاب هستند'}

                    {required && (
                        <span className="text-danger ms-2">
                            <i className="bi bi-asterisk"></i> حداقل یک فعالیت انتخاب کنید
                        </span>
                    )}
                </small>
            )}

            {/* ============================================================
                نمایش خلاصه انتخاب‌ها
                ============================================================ */}
            {(value || []).length > 0 && (
                <div className="mt-1 d-flex flex-wrap gap-1">
                    {(value || []).map(id => {
                        const f = faaliatList.find(item => item.id === id);
                        if (!f) return null;
                        return (
                            <span key={id} className="badge bg-light text-dark border">
                                {f.onvan}
                                <button
                                    type="button"
                                    className="btn-close btn-close-sm ms-1"
                                    style={{ fontSize: '8px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(id);
                                    }}
                                    disabled={disabled}
                                ></button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}