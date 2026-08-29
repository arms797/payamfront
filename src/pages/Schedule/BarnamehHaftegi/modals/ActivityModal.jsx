// src/pages/Schedule/BarnamehHaftegi/modals/ActivityModal.jsx

import React from 'react';
import PersianNumber from '../../../../components/common/PersianNumber';

const ActivityModal = ({
    show,
    onClose,
    onConfirm,
    dayCode,
    hourCode,
    dayTitle,
    mode,
    onModeChange,
    markazId,
    markazName,
    ostanId,
    onOstanChange,
    virtualOstans = [],
    virtualMarkazs,
    onVirtualMarkazChange,
    faaliatId,
    onFaaliatChange,
    allowedFaaliats,
    loading = false
}) => {
    if (!show) return null;

    const isVirtual = mode === 'majazi';

    return (
        <div
            className="modal show d-block"
            tabIndex="-1"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1050
            }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-dialog-centered modal-lg"
                style={{ maxWidth: '600px', maxHeight: '90vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content" style={{ maxHeight: '90vh', overflow: 'auto' }}>
                    <div className="modal-header">
                        <h5 className="modal-title">
                            انتخاب فعالیت - {dayTitle} - ساعت {hourCode}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* حالت حضوری/مجازی */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">نوع فعالیت</label>
                            <div className="d-flex gap-3">
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id="modeHozoory"
                                        checked={mode === 'hozoory'}
                                        onChange={() => onModeChange('hozoory')}
                                        disabled={loading}
                                    />
                                    <label className="form-check-label" htmlFor="modeHozoory">حضوری</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        id="modeMajazi"
                                        checked={mode === 'majazi'}
                                        onChange={() => onModeChange('majazi')}
                                        disabled={loading}
                                    />
                                    <label className="form-check-label" htmlFor="modeMajazi">مجازی</label>
                                </div>
                            </div>
                        </div>

                        {/* انتخاب مرکز (حضوری) */}
                        {mode === 'hozoory' && (
                            <div className="mb-3">
                                <label className="form-label">مرکز</label>
                                <p className="form-control-plaintext">
                                    {markazName || 'مرکز انتخاب نشده است'}
                                </p>
                                <small className="text-muted">
                                    مرکز اصلی روز باید در بخش "مرکز اصلی روز" انتخاب شود
                                </small>
                            </div>
                        )}

                        {/* انتخاب مرکز (مجازی) */}
                        {/* انتخاب استان (مجازی) */}
                        {mode === 'majazi' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">استان</label>
                                    <select
                                        className="form-select"
                                        value={ostanId || ''}   // ← اطمینان از اینکه مقدار دارد
                                        onChange={(e) => onOstanChange(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">انتخاب استان...</option>
                                        {virtualOstans.map(ostan => (
                                            <option key={ostan.code} value={ostan.code}>
                                                {ostan.name}
                                            </option>
                                        ))}
                                    </select>
                                    {virtualOstans.length === 0 && (
                                        <small className="text-warning">هیچ مرکز مجازی در هیچ استانی یافت نشد</small>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">مرکز مجازی</label>
                                    <select
                                        className="form-select"
                                        value={markazId || ''}
                                        onChange={(e) => onVirtualMarkazChange(e.target.value)}
                                        disabled={!ostanId || virtualMarkazs.length === 0 || loading}
                                    >
                                        <option value="">انتخاب مرکز...</option>
                                        {virtualMarkazs.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.naamMarkaz}
                                            </option>
                                        ))}
                                    </select>
                                    {ostanId && virtualMarkazs.length === 0 && (
                                        <small className="text-warning">هیچ مرکز مجازی در این استان یافت نشد</small>
                                    )}
                                </div>
                            </>
                        )}
                        {/* لیست فعالیت‌ها */}
                        <div className="mb-3">
                            <label className="form-label">فعالیت <span className="text-danger">*</span></label>
                            <div
                                className="d-flex flex-wrap gap-2 p-2 border rounded"
                                style={{ maxHeight: '200px', overflowY: 'auto' }}
                            >
                                {allowedFaaliats.length === 0 ? (
                                    <div className="text-muted text-center w-100 py-2">
                                        <i className="bi bi-info-circle me-1"></i>
                                        {mode === 'hozoory'
                                            ? 'هیچ فعالیت حضوری مجازی برای این مرکز یافت نشد'
                                            : 'لطفاً ابتدا مرکز را انتخاب کنید'
                                        }
                                    </div>
                                ) : (
                                    allowedFaaliats.map(f => {
                                        const isSelected = parseInt(faaliatId) === f.id;
                                        return (
                                            <button
                                                key={f.id}
                                                type="button"
                                                className="btn btn-sm"
                                                style={{
                                                    backgroundColor: isSelected ? (f.color || '#4d6bfe') : 'transparent',
                                                    border: isSelected ? `1px solid ${f.color || '#4d6bfe'}` : '1px solid #dee2e6',
                                                    color: isSelected ? '#ffffff' : '#212529',
                                                    transition: 'all 0.15s',
                                                    cursor: 'pointer',
                                                    padding: '4px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    // 🔥 اینجا با !important روی hover کنترل می‌کنیم
                                                    // (در جاوااسکریپت نمی‌تونیم !important بذاریم، پس از event handler استفاده می‌کنیم)
                                                }}
                                                onClick={() => onFaaliatChange(f.id)}
                                                onMouseEnter={(e) => {
                                                    if (isSelected) {
                                                        e.currentTarget.style.backgroundColor = f.color || '#4d6bfe';
                                                        e.currentTarget.style.color = '#ffffff';
                                                    } else {
                                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                        e.currentTarget.style.color = '#212529';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (isSelected) {
                                                        e.currentTarget.style.backgroundColor = f.color || '#4d6bfe';
                                                        e.currentTarget.style.color = '#ffffff';
                                                    } else {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#212529';
                                                    }
                                                }}
                                            >
                                                {f.onvan}
                                                {/* 
                                                {f.isMadove && (
                                                    <span className="badge bg-info ms-1" style={{ fontSize: '8px', color: '#fff' }}></span>
                                                )}
                                                {f.noeAnjam === 3 && (
                                                    <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '8px' }}></span>
                                                )}
                                                    */ }
                                                {isSelected && (
                                                    <i className="bi bi-check-circle-fill ms-1"></i>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onConfirm}
                            disabled={!faaliatId || (mode === 'majazi' && !markazId) || loading}
                        >
                            {loading ? 'در حال ذخیره...' : 'انتخاب'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;