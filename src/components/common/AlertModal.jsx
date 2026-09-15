// src/components/common/AlertModal.jsx
import React from 'react';

export default function AlertModal({
    show,
    onClose,
    title = 'توجه',
    message = '',
    buttonText = 'باشه',
    variant = 'primary',
    loading = false
}) {
    if (!show) return null;

    return (
        <div
            className="modal show d-block"
            style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1060,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-dialog-centered"
                style={{ maxWidth: '450px', width: '95%' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className={`modal-header bg-${variant} text-white`}>
                        <h5 className="modal-title">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            {title}
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {message}
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className={`btn btn-${variant}`}
                            onClick={onClose}
                            disabled={loading}
                        >
                            {loading ? 'در حال...' : buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}