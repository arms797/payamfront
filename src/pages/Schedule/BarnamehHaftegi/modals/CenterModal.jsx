// src/components/common/CenterModal.jsx
import React from 'react';
import PersianNumber from '../../../../components/common/PersianNumber';

const CenterModal = ({
    show,
    onClose,
    onConfirm,
    dayCode,
    dayTitle,
    availableCenters,
    selectedMarkazId,
    setSelectedMarkazId,
    ostadMarkazId,
    allowedMarkazIds,
    loading = false
}) => {
    if (!show) return null;

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
                className="modal-dialog modal-dialog-centered modal-md"
                style={{ maxWidth: '500px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            انتخاب مرکز اصلی برای روز {dayTitle}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label fw-bold">مرکز</label>
                            <select
                                className="form-select"
                                value={selectedMarkazId || ''}
                                onChange={(e) => setSelectedMarkazId(e.target.value ? parseInt(e.target.value) : null)}
                                disabled={loading}
                            >
                                <option value="">انتخاب مرکز...</option>
                                {availableCenters.map(m => {
                                    const isMain = m.id === ostadMarkazId;
                                    const isPermitted = allowedMarkazIds.includes(m.id);
                                    return (
                                        <option key={m.id} value={m.id}>
                                            {m.naamMarkaz}
                                            {/*isMain && ' (مرکز اصلی)'}
                                            {isPermitted && !isMain && ' (همجوار)'*/}
                                        </option>
                                    );
                                })}
                            </select>
                            {availableCenters.length === 0 && (
                                <small className="text-warning">
                                    هیچ مرکز قابل‌انتخابی برای این روز وجود ندارد
                                </small>
                            )}
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
                            disabled={!selectedMarkazId || loading}
                        >
                            {loading ? 'در حال ذخیره...' : 'تأیید'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CenterModal;