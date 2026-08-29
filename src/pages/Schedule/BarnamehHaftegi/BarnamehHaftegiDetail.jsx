// src/pages/Schedule/BarnamehHaftegi/BarnamehHaftegiDetail.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { useLookup } from '../../../context/LookupContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';

export default function BarnamehHaftegiDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList } = useTerm();
    const { faaliats, getFaaliatName, getDayTitle } = useLookup();
    const { confirm, ConfirmModal } = useConfirm();

    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // ============================================================
    // تشخیص نقش کاربر
    // ============================================================
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isModirGrooh = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByModir'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByMoaven'), [hasPermission]);
    const isAdmin = useMemo(() => user?.codeRole === 1, [user]);

    // ============================================================
    // دریافت اطلاعات برنامه
    // ============================================================
    const fetchProgram = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/BarnamehHaftegi/${id}`);
            if (response.data?.success) {
                setProgram(response.data.data);
            } else {
                setError('برنامه یافت نشد');
            }
           // console.log()
        } catch (error) {
            console.error('خطا در دریافت برنامه:', error);
            //toast.error('خطا در دریافت اطلاعات برنامه');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchProgram();
    }, [id, fetchProgram]);

    // ============================================================
    // برگشت به لیست با حفظ موقعیت
    // ============================================================
    const handleBackToList = () => {
        navigate('/dashboard/barnameh-haftegi-list', {
            state: {
                fromDetail: true,
                page: location.state?.page || 1,
                pageSize: location.state?.pageSize || 20,
                filters: location.state?.filters || {},
                termCode: location.state?.termCode || ''
            }
        });
    };

    // ============================================================
    // عملیات‌های تأیید
    // ============================================================
    const handleConfirmByOstad = async () => {
        const confirmed = await confirm({
            title: 'تأیید برنامه',
            message: 'آیا از تأیید نهایی این برنامه مطمئن هستید؟',
            confirmText: 'بله، تأیید می‌شود',
            confirmVariant: 'success'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/ostad/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت تأیید شد');
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تأیید برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByModir = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        const confirmed = await confirm({
            title: `${actionText} برنامه`,
            message: `آیا از ${actionText} این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} می‌شود`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/modir/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByMoaven = async (approveStatus) => {
        const hasModirOpinion = program?.nazarModirGrooh !== 0;

        if (!hasModirOpinion) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه هنوز نظری در مورد این برنامه ثبت نکرده است. آیا از ادامه مطمئن هستید؟',
                confirmText: 'بله، ادامه می‌دهم',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        } else if (program?.nazarModirGrooh === 2) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه این برنامه را رد کرده است. آیا می‌خواهید نظر مدیر گروه را نادیده بگیرید؟',
                confirmText: 'بله، نادیده می‌گیرم',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        }

        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        const confirmed = await confirm({
            title: `${actionText} نهایی برنامه`,
            message: `آیا از ${actionText} نهایی این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} نهایی`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/moaven/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} نهایی شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} نهایی برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'ریست برنامه',
            message: 'آیا از بازگشت این برنامه به حالت پیش‌نویس مطمئن هستید؟',
            confirmText: 'بله، ریست می‌شود',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/reset/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت به حالت پیش‌نویس بازگشت');
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ریست برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleLock = async () => {
        toast.info('قفل/باز کردن قفل در حال توسعه است...');
    };

    // ============================================================
    // تشخیص دکمه‌های قابل نمایش
    // ============================================================
    const renderActionButtons = () => {
        if (!program) return null;

        const status = program.approveStatus;
        const isLocked = program.isLocked;

        if (isOstad) {
            if (status === 'pishnevis' && !isLocked) {
                return (
                    <button
                        className="btn btn-success"
                        onClick={handleConfirmByOstad}
                        disabled={submitting || !program.isComplete}
                    >
                        {submitting ? 'در حال...' : 'تأیید برنامه'}
                    </button>
                );
            }
            if (status === 'pishnevis' && !program.isComplete) {
                return (
                    <button
                        className="btn btn-secondary"
                        disabled
                        title="برنامه کامل نیست. حداقل ساعات موظفی و ۵ روز در مراکز مجاز باید پر شود."
                    >
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        تکمیل نشده
                    </button>
                );
            }
            return (
                <span className="text-muted">
                    {isLocked ? 'برنامه قفل شده است' : 'برنامه قبلاً تأیید شده است'}
                </span>
            );
        }

        if (isModirGrooh && status === 'tayeed_ostad') {
            return (
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-success"
                        onClick={() => handleConfirmByModir(1)}
                        disabled={submitting}
                    >
                        {submitting ? 'در حال...' : 'تأیید'}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => handleConfirmByModir(2)}
                        disabled={submitting}
                    >
                        {submitting ? 'در حال...' : 'رد'}
                    </button>
                </div>
            );
        }

        if (isMoaven && status !== 'tayeed_moaven') {
            return (
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-success"
                        onClick={() => handleConfirmByMoaven(1)}
                        disabled={submitting}
                    >
                        {submitting ? 'در حال...' : 'تأیید نهایی'}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => handleConfirmByMoaven(2)}
                        disabled={submitting}
                    >
                        {submitting ? 'در حال...' : 'رد نهایی'}
                    </button>
                </div>
            );
        }

        if ((isMoaven || isAdmin) && status !== 'pishnevis' && isLocked) {
            return (
                <button
                    className="btn btn-warning"
                    onClick={handleReset}
                    disabled={submitting}
                >
                    {submitting ? 'در حال...' : 'ریست به پیش‌نویس'}
                </button>
            );
        }

        if (isAdmin && program) {
            return (
                <button
                    className={`btn ${isLocked ? 'btn-success' : 'btn-danger'}`}
                    onClick={handleToggleLock}
                    disabled={submitting}
                >
                    {isLocked ? 'باز کردن قفل' : 'قفل کردن'}
                </button>
            );
        }

        return (
            <span className="text-muted">
                {status === 'tayeed_moaven' && '✅ برنامه تأیید نهایی شده است'}
                {status === 'tayeed_modir' && '⏳ در انتظار تأیید معاون'}
                {status === 'tayeed_ostad' && '⏳ در انتظار تأیید مدیر گروه'}
            </span>
        );
    };

    // ============================================================
    // وضعیت برنامه
    // ============================================================
    const getStatusBadge = (status) => {
        const map = {
            'pishnevis': { label: 'پیش‌نویس', className: 'bg-secondary' },
            'tayeed_ostad': { label: 'تایید استاد', className: 'bg-info' },
            'tayeed_modir': { label: 'تایید مدیر گروه', className: 'bg-primary' },
            'tayeed_moaven': { label: 'تایید معاون', className: 'bg-success' },
        };
        const info = map[status] || map['pishnevis'];
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    // ============================================================
    // دریافت نام مرکز
    // ============================================================
    const getMarkazName = (markazId) => {
        if (!markazId) return '-';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || `مرکز ${markazId}`;
    };

    // ============================================================
    // رندر جدول برنامه هفتگی
    // ============================================================
    const renderWeekTable = () => {
        if (!program?.details) return null;

        const hours = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        const grouped = {};
        program.details.forEach(item => {
            const day = item.roozeHafteh;
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(item);
        });

        const sortedDays = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

        return (
            <div className="table-responsive">
                <table className="table table-bordered table-sm text-center">
                    <thead className="table-light">
                        <tr>
                            <th style={{ minWidth: '80px' }}>روز / ساعت</th>
                            {hours.map(h => (
                                <th key={h} style={{ minWidth: '60px' }}>{h}</th>
                            ))}
                            <th style={{ minWidth: '120px' }}>مرکز اصلی روز</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDays.map(day => {
                            const items = grouped[day] || [];
                            const firstItem = items[0];

                            return (
                                <tr key={day}>
                                    <td className="fw-bold">{getDayTitle(day)}</td>
                                    {hours.map(hour => {
                                        const detail = items.find(d => d[hour.toLowerCase()]);
                                        const activityId = detail?.[hour.toLowerCase()];
                                        const markazId = detail?.[`markazId${hour}`];
                                        const isPermitted = detail?.isPermittedDay;

                                        return (
                                            <td
                                                key={hour}
                                                className={activityId ? 'bg-light' : ''}
                                                style={{
                                                    backgroundColor: activityId ? (isPermitted ? '#e8f5e9' : '#fff3e0') : '',
                                                    cursor: 'pointer'
                                                }}
                                                title={activityId ? `${getFaaliatName(activityId)} - ${getMarkazName(markazId)}` : 'خالی'}
                                            >
                                                {activityId ? (
                                                    <div>
                                                        <div style={{ fontSize: '11px' }}>
                                                            {getFaaliatName(activityId)}
                                                        </div>
                                                        <div style={{ fontSize: '9px', color: '#666' }}>
                                                            {getMarkazName(markazId)}
                                                        </div>
                                                        {!isPermitted && (
                                                            <span className="badge bg-warning text-dark" style={{ fontSize: '8px' }}>
                                                                ⚠️
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: '12px' }}>-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td>
                                        {firstItem?.markazId ? (
                                            <div>
                                                <div>{getMarkazName(firstItem.markazId)}</div>
                                                {!firstItem.isPermittedDay && (
                                                    <span className="badge bg-warning text-dark" style={{ fontSize: '8px' }}>
                                                        ⚠️ غیرمجاز
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // ============================================================
    // رندر وضعیت تأیید
    // ============================================================
    const renderApprovalStatus = () => {
        if (!program) return null;

        return (
            <div className="card mb-4">
                <div className="card-header">
                    <h6 className="mb-0">وضعیت تأیید</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold">استاد:</span>
                                {program.nazarElmi === 1 ? (
                                    <span className="text-success">✅ تأیید شده</span>
                                ) : program.nazarElmi === 2 ? (
                                    <span className="text-danger">❌ رد شده</span>
                                ) : (
                                    <span className="text-muted">⏳ در انتظار</span>
                                )}
                                {program.tarikhElmi && (
                                    <span className="text-muted small">
                                        ({new Date(program.tarikhElmi).toLocaleDateString('fa-IR')})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold">مدیر گروه:</span>
                                {program.nazarModirGrooh === 1 ? (
                                    <span className="text-success">✅ تأیید شده</span>
                                ) : program.nazarModirGrooh === 2 ? (
                                    <span className="text-danger">❌ رد شده</span>
                                ) : (
                                    <span className="text-muted">⏳ در انتظار</span>
                                )}
                                {program.tarikhModirGrooh && (
                                    <span className="text-muted small">
                                        ({new Date(program.tarikhModirGrooh).toLocaleDateString('fa-IR')})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold">معاون:</span>
                                {program.nazarMoaven === 1 ? (
                                    <span className="text-success">✅ تأیید شده</span>
                                ) : program.nazarMoaven === 2 ? (
                                    <span className="text-danger">❌ رد شده</span>
                                ) : (
                                    <span className="text-muted">⏳ در انتظار</span>
                                )}
                                {program.tarikhMoaven && (
                                    <span className="text-muted small">
                                        ({new Date(program.tarikhMoaven).toLocaleDateString('fa-IR')})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {program.isLocked && (
                        <div className="mt-2">
                            <span className="badge bg-danger">🔒 قفل شده</span>
                            <span className="text-muted small ms-2">(غیرقابل ویرایش)</span>
                        </div>
                    )}

                    <div className="mt-2">
                        <span className="fw-bold">وضعیت کلی:</span>
                        {getStatusBadge(program.approveStatus)}
                        <span className="text-muted small ms-2">
                            ({program.totalSessions || 0} جلسه از {program.requiredSessions || 0} جلسه مورد نیاز)
                        </span>
                        {program.isComplete ? (
                            <span className="badge bg-success ms-2">✅ کامل</span>
                        ) : (
                            <span className="badge bg-warning text-dark ms-2">⚠️ ناقص</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // رندر اصلی
    // ============================================================
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (error || !program) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'برنامه یافت نشد'}
                </div>
                <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="bi bi-arrow-right me-1"></i> بازگشت به لیست
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={handleBackToList}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">
                        برنامه هفتگی - {program.ostadName}
                    </h4>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {renderActionButtons()}
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header">
                    <h6 className="mb-0">اطلاعات استاد</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">نام:</span>
                            <span className="ms-2">{program.ostadName}</span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">کد استادی:</span>
                            <span className="ms-2"><PersianNumber>{program.ostadCode}</PersianNumber></span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">مرکز:</span>
                            <span className="ms-2">{program.ostadMarkaz}</span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">ترم:</span>
                            <span className="ms-2">{program.termTitle} ({program.codeTerm})</span>
                        </div>
                    </div>
                </div>
            </div>

            {renderApprovalStatus()}

            <div className="card mb-4">
                <div className="card-header">
                    <h6 className="mb-0">برنامه هفتگی</h6>
                </div>
                <div className="card-body p-0">
                    {renderWeekTable()}
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">خلاصه</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">تعداد جلسات پر شده:</span>
                                <span className="fw-bold">{program.totalSessions || 0}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                                <span className="text-muted">جلسات مورد نیاز:</span>
                                <span className="fw-bold">{program.requiredSessions || 0}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                                <span className="text-muted">وضعیت:</span>
                                <span>{program.isComplete ? '✅ کامل' : '⚠️ ناقص'}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-2">
                                <span className="text-muted">ساعت موظفی:</span>
                                <span className="fw-bold">{program.requiredHours || 40} ساعت</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">راهنما</h6>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-success">●</span>
                                <span className="text-muted">مرکز مجاز</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-warning">●</span>
                                <span className="text-muted">مرکز غیرمجاز (نیاز به مجوز هم‌جاوری)</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-light text-dark border">-</span>
                                <span className="text-muted">خالی</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal />
        </div>
    );
}