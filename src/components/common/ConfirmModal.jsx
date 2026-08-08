// src/components/common/ConfirmModal.jsx
import React from 'react';

export default function ConfirmModal({
    show,
    onClose,
    onConfirm,
    title = 'تأیید عملیات',
    message = 'آیا از انجام این عملیات مطمئن هستید؟',
    confirmText = 'تأیید',
    cancelText = 'انصراف',
    confirmVariant = 'danger', // 'danger' | 'primary' | 'success' | 'warning'
    loading = false
}) {
    if (!show) return null;

    const variantClass = {
        danger: 'btn-danger',
        primary: 'btn-primary',
        success: 'btn-success',
        warning: 'btn-warning'
    }[confirmVariant] || 'btn-danger';

    return (
        <>
            <div
                className="modal show d-block"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                onClick={onClose}
            >
                <div className="modal-dialog modal-sm modal-dialog-centered">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-0">{message}</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                className={`btn ${variantClass}`}
                                onClick={onConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        در حال...
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className="modal-backdrop show"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1040
                }}
                onClick={onClose}
            ></div>
        </>
    );
}