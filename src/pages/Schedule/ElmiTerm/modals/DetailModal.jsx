// src/pages/Schedule/ElmiTerm/modals/DetailModal.jsx
import React from 'react';
import { getStatusBadge, downloadFile, formatDate, getTermTitle } from '../ElmiTermHelpers';
import api from '../../../../api/axiosConfig';
import PersianNumber from '../../../../components/common/PersianNumber';

export default function DetailModal({
    show,
    onClose,
    selectedItem,
    termList
}) {
    if (!show || !selectedItem) return null;

    const handleDownload = () => {
        downloadFile(selectedItem.id, selectedItem.file, api);
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            جزئیات درخواست - {selectedItem.ostadName}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        <div className="row">
                            {/* اطلاعات استاد */}
                            <div className="col-md-6">
                                <div className="card mb-3">
                                    <div className="card-header bg-light">
                                        <strong>اطلاعات استاد</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">نام استاد:</div>
                                            <div className="col-7">{selectedItem.ostadName}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">کد استادی:</div>
                                            <div className="col-7"><PersianNumber>{selectedItem.ostadCode}</PersianNumber></div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">مرکز خدمت:</div>
                                            <div className="col-7">{selectedItem.ostadMarkaz || '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">کد ترم:</div>
                                            <div className="col-7"><PersianNumber>{selectedItem.termCode}</PersianNumber></div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">عنوان ترم:</div>
                                            <div className="col-7"><PersianNumber>
                                                {getTermTitle(selectedItem.termCode, termList)}
                                            </PersianNumber>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* وضعیت و اطلاعات شغلی */}
                            <div className="col-md-6">
                                <div className="card mb-3">
                                    <div className="card-header bg-light">
                                        <strong>وضعیت و اطلاعات شغلی</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">وضعیت:</div>
                                            <div className="col-7">{selectedItem.akharinVazeeat || '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">سمت اجرایی:</div>
                                            <div className="col-7">
                                                {selectedItem.isEjeari ? (
                                                    <span className="badge bg-info">{selectedItem.onvanEjraei || 'دارد'}</span>
                                                ) : (
                                                    <span className="badge bg-secondary">ندارد</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">نحوه فعالیت:</div>
                                            <div className="col-7">
                                                {selectedItem.fullTime ? (
                                                    <span className="badge bg-success">تمام وقت</span>
                                                ) : (
                                                    <span className="badge bg-warning text-dark">پاره وقت</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-5 fw-bold">ساعت موظف هفتگی:</div>
                                            <div className="col-7">
                                                <PersianNumber>
                                                    {selectedItem.tedadSaatMovazafi || '-'}
                                                </PersianNumber>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* وضعیت تایید */}
                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header bg-light">
                                        <strong>وضعیت تایید</strong>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-3 fw-bold">وضعیت:</div>
                                            <div className="col-9">{getStatusBadge(selectedItem.approveStatus)}</div>
                                        </div>
                                        {selectedItem.approveStatus !== 0 && (
                                            <>
                                                <div className="row mb-2">
                                                    <div className="col-3 fw-bold">تاییدکننده:</div>
                                                    <div className="col-9">{selectedItem.approvedByUserName || '-'}</div>
                                                </div>
                                                <div className="row mb-2">
                                                    <div className="col-3 fw-bold">نقش تاییدکننده:</div>
                                                    <div className="col-9">{selectedItem.approvedByRoleMarkaz || '-'}</div>
                                                </div>
                                                <div className="row mb-2">
                                                    <div className="col-3 fw-bold">تاریخ تایید:</div>
                                                    <div className="col-9">
                                                        <PersianNumber>
                                                            {formatDate(selectedItem.approvedAt)}
                                                        </PersianNumber>
                                                    </div>
                                                </div>
                                                {selectedItem.approveTozihat && (
                                                    <div className="row mb-2">
                                                        <div className="col-3 fw-bold">توضیحات:</div>
                                                        <div className="col-9">{selectedItem.approveTozihat}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {selectedItem.filePath && (
                                            <div className="row mt-2">
                                                <div className="col-3 fw-bold">فایل مستندات:</div>
                                                <div className="col-9">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={handleDownload}
                                                    >
                                                        <i className="bi bi-download me-1"></i>
                                                        دانلود فایل
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            بستن
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}