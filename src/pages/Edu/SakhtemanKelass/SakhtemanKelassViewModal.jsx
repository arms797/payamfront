// src/pages/Edu/SakhtemanKelass/SakhtemanKelassViewModal.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PersianNumber from '../../../components/common/PersianNumber';

export default function SakhtemanKelassViewModal({ show, onClose, item }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose]);

    if (!show || !item) return null;

    const renderRow = (label, value) => (
        <tr>
            <td className="fw-bold text-muted" style={{ width: '35%' }}>{label}:</td>
            <td>{value}</td>
        </tr>
    );

    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-info text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-eye me-2"></i>
                                مشاهده جزئیات ساختمان/کلاس
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                            ></button>
                        </div>

                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <h6 className="text-primary mb-3">
                                        <i className="bi bi-geo-alt me-1"></i>
                                        اطلاعات مکانی
                                    </h6>
                                    <table className="table table-sm table-bordered">
                                        <tbody>
                                            {renderRow('مرکز', item.markazName || '-')}
                                            {renderRow('کد ساختمان', <PersianNumber>{item.codeSakhteman}</PersianNumber>)}
                                            {renderRow('نام ساختمان', <strong>{item.naamSakhteman || '-'}</strong>)}
                                            {renderRow('کد کلاس', <PersianNumber>{item.codeClass}</PersianNumber>)}
                                            {renderRow('نام کلاس', <strong>{item.naamClass || '-'}</strong>)}
                                            {renderRow('نوع کلاس', item.noeClass || '-')}
                                            {renderRow('طبقه', <PersianNumber>{item.tabagheh || '-'}</PersianNumber>)}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="col-md-6">
                                    <h6 className="text-primary mb-3">
                                        <i className="bi bi-gear me-1"></i>
                                        مشخصات فنی
                                    </h6>
                                    <table className="table table-sm table-bordered">
                                        <tbody>
                                            {renderRow('ظرفیت', <PersianNumber>{item.zarfiat || '-'}</PersianNumber>)}
                                            {renderRow('ظرفیت امتحانی', <PersianNumber>{item.zarfiatEmtahani || '-'}</PersianNumber>)}
                                            {renderRow('تعداد وایت‌برد', <PersianNumber>{item.tedadWhiteboard || 0}</PersianNumber>)}
                                            {renderRow('ویدئو پروژکتور', item.projector ? (
                                                <span className="badge bg-success">دارد</span>
                                            ) : (
                                                <span className="badge bg-secondary">ندارد</span>
                                            ))}
                                            {renderRow('نوع', item.amoozeshi === true ? (
                                                <span className="badge bg-primary">آموزشی</span>
                                            ) : item.amoozeshi === false ? (
                                                <span className="badge bg-secondary">اداری</span>
                                            ) : '-')}
                                            {renderRow('وضعیت', item.vazeeyat ? (
                                                <span className="badge bg-success">فعال</span>
                                            ) : (
                                                <span className="badge bg-danger">غیرفعال</span>
                                            ))}

                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {(item.emkanat || item.tozihat) && (
                                <div className="row mt-3">
                                    <div className="col-12">
                                        <h6 className="text-primary mb-2">
                                            <i className="bi bi-list-check me-1"></i>
                                            امکانات و توضیحات
                                        </h6>
                                        <table className="table table-sm table-bordered">
                                            <tbody>
                                                {item.emkanat && renderRow('امکانات', item.emkanat)}
                                                {item.tozihat && renderRow('توضیحات', item.tozihat)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                <i className="bi bi-x-lg me-1"></i>
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}