// src/pages/Schedule/Hamjavar/HamjavarDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import ReviewModal from './modals/ReviewModal';
import { getStatusBadge, getStatusDisplay } from './HamjavarHelpers';

export default function HamjavarDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { confirm, ConfirmModal } = useConfirm();

    // ============================================================
    // تشخیص نقش کاربر
    // ============================================================
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isRaeis = useMemo(() => hasPermission('Hamjavar.ReviewRaeis'), [hasPermission]);
    const isKhadamat = useMemo(() => hasPermission('Hamjavar.ReviewKhadamat'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('Hamjavar.ReviewMoaven'), [hasPermission]);
    const isAdmin = useMemo(() => user?.currentRoleName === 'ادمین سامانه', [user]);

    // ============================================================
    // Stateها
    // ============================================================
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================================
    // State مودال ثبت نظر
    // ============================================================
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // دریافت جزئیات درخواست
    // ============================================================
    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/Hamjavar/${id}`);
            if (response.data?.success) {
                setItem(response.data.data);
            } else {
                setError('درخواست یافت نشد');
            }
        } catch (error) {
            console.error('خطا در دریافت جزئیات:', error);
            setError('خطا در دریافت اطلاعات درخواست');
            toast.error('خطا در دریافت اطلاعات درخواست');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    // ============================================================
    // عملیات: امضاء و ارسال (توسط استاد)
    // ============================================================
    const handleSignSend = async () => {
        const confirmed = await confirm({
            title: 'امضاء و ارسال',
            message: `آیا از ارسال درخواست "${item?.ostadName}" برای ترم ${item?.termCode} مطمئن هستید؟`,
            confirmText: 'امضاء و ارسال',
            confirmVariant: 'success'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/Hamjavar/confirm-submit-by-ostad/${id}`, {
                nazar: 'درخواست تایید و ارسال شد'
            });
            if (response.data?.success) {
                toast.success('درخواست با موفقیت تایید و ارسال شد');
                fetchDetail();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تایید درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // عملیات: حذف درخواست
    // ============================================================
    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'حذف درخواست',
            message: `آیا از حذف درخواست "${item?.ostadName}" مطمئن هستید؟`,
            confirmText: 'حذف',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.delete(`/Hamjavar/delete/${id}`);
            if (response.data?.success) {
                toast.success('درخواست با موفقیت حذف شد');
                navigate('/dashboard/hamjavar');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // عملیات: ثبت نظر (از مودال)
    // ============================================================
    const handleReview = async (reviewData) => {
        setSubmitting(true);
        try {
            const endpoint = isRaeis ? '/Hamjavar/review-raeis' :
                isKhadamat ? '/Hamjavar/review-khadamat' :
                    '/Hamjavar/review-moaven';

            const response = await api.patch(endpoint, {
                hamjavarId: parseInt(id),
                tedadRoozList: reviewData.tedadRoozList,
                nazar: reviewData.nazar,
                upload: reviewData.upload
            });

            if (response.data?.success) {
                toast.success('نظر با موفقیت ثبت شد');
                setShowReviewModal(false);
                fetchDetail();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ثبت نظر');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // بررسی امکان ثبت نظر برای نقش فعلی
    // ============================================================
    const canReview = useMemo(() => {
        if (!item) return false;

        // رئیس: فقط درخواست‌های تایید شده توسط استاد
        if (isRaeis && item.akharinTaghaza === 'TaeedSabt') return true;

        // خدمات: فقط درخواست‌های تایید شده توسط رئیس
        if (isKhadamat && item.akharinTaghaza === 'TaeedRaeis') return true;

        // معاون: فقط درخواست‌های تایید شده توسط خدمات
        if (isMoaven && item.akharinTaghaza === 'TaeedKhadamat') return true;

        return false;
    }, [item, isRaeis, isKhadamat, isMoaven]);

    // ============================================================
    // بررسی امکان امضاء و ارسال (برای استاد)
    // ============================================================
    const canSignSend = useMemo(() => {
        return isOstad && item?.akharinTaghaza === 'PishNevis';
    }, [isOstad, item]);

    // ============================================================
    // بررسی امکان ویرایش (برای استاد در پیش‌نویس)
    // ============================================================
    const canEdit = useMemo(() => {
        return isOstad && item?.akharinTaghaza === 'PishNevis';
    }, [isOstad, item]);

    // ============================================================
    // بررسی امکان حذف (برای استاد در پیش‌نویس یا ادمین)
    // ============================================================
    const canDelete = useMemo(() => {
        return (isOstad && item?.akharinTaghaza === 'PishNevis') || isAdmin;
    }, [isOstad, item, isAdmin]);

    // ============================================================
    // دریافت نقش بررسی‌کننده فعلی
    // ============================================================
    const getReviewRole = () => {
        if (isRaeis) return 'raeis';
        if (isKhadamat) return 'khadamat';
        if (isMoaven) return 'moaven';
        return null;
    };

    // ============================================================
    // دریافت وضعیت بررسی هر نقش
    // ============================================================
    const getReviewStatus = (role) => {
        if (!item) return null;
        const statusMap = {
            raeis: item.amaliatRaeis,
            khadamat: item.amaliatKhadamat,
            moaven: item.amaliatMoaven
        };
        const value = statusMap[role];
        if (value === 1) return { label: 'تایید', className: 'bg-success' };
        if (value === 0) return { label: 'رد', className: 'bg-danger' };
        return { label: 'در انتظار', className: 'bg-warning text-dark' };
    };

    // ============================================================
    // دریافت تاریخ دریافت هر نقش
    // ============================================================
    const getDaryaftDate = (role) => {
        if (!item) return null;
        const map = {
            raeis: item.tarikhDaryaftRaeis,
            khadamat: item.tarikhDaryaftKhadamat,
            moaven: item.tarikhDaryaftMoaven
        };
        return map[role];
    };

    // ============================================================
    // دریافت نام نقش
    // ============================================================
    const getRoleName = (role) => {
        const map = {
            raeis: 'رئیس مرکز',
            khadamat: 'خدمات آموزشی استان',
            moaven: 'معاونت آموزشی استان'
        };
        return map[role] || role;
    };

    // ============================================================
    // نمایش لودینگ
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

    // ============================================================
    // نمایش خطا
    // ============================================================
    if (error || !item) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'درخواست یافت نشد'}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard/hamjavar')}
                >
                    <i className="bi bi-arrow-right me-1"></i>
                    بازگشت به لیست
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/hamjavar')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">جزئیات درخواست هم‌جاوری</h4>
                </div>
                <div className="d-flex gap-2">
                    {/* دکمه امضاء و ارسال - فقط برای استاد در پیش‌نویس */}
                    {canSignSend && (
                        <button
                            className="btn btn-success"
                            onClick={handleSignSend}
                            disabled={submitting}
                        >
                            <i className="bi bi-check2-circle me-1"></i>
                            {submitting ? 'در حال ارسال...' : 'امضاء و ارسال'}
                        </button>
                    )}

                    {/* دکمه ویرایش - فقط برای استاد در پیش‌نویس */}
                    {canEdit && (
                        <button
                            className="btn btn-warning"
                            onClick={() => navigate(`/dashboard/hamjavar/edit/${item.id}`)}
                        >
                            <i className="bi bi-pencil me-1"></i>
                            ویرایش
                        </button>
                    )}

                    {/* دکمه بررسی - برای رئیس/خدمات/معاون */}
                    {canReview && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowReviewModal(true)}
                        >
                            <i className="bi bi-pencil-square me-1"></i>
                            ثبت نظر
                        </button>
                    )}

                    {/* دکمه حذف - برای استاد در پیش‌نویس یا ادمین */}
                    {canDelete && (
                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                            disabled={submitting}
                        >
                            <i className="bi bi-trash me-1"></i>
                            حذف
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================================
                وضعیت درخواست
                ============================================================ */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="d-flex flex-wrap gap-3 align-items-center p-3 bg-light rounded">
                        <span className="fw-bold">وضعیت فعلی:</span>
                        {getStatusBadge(item.akharinTaghaza)}
                        <span className="text-muted ms-2">
                            آخرین مرحله: {item.kharinBarrasi || '-'}
                        </span>
                        <span className="text-muted ms-2">
                            ترم: {item.termCode} - {item.termName || ''}
                        </span>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* ============================================================
                    ستون راست: اطلاعات استاد
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">اطلاعات استاد</h6>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-5 fw-bold">نام:</div>
                                <div className="col-7">{item.ostadName}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-5 fw-bold">کد استادی:</div>
                                <div className="col-7"><PersianNumber>{item.ostadCode}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-5 fw-bold">مرکز:</div>
                                <div className="col-7">{item.ostadMarkaz || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-5 fw-bold">ترم:</div>
                                <div className="col-7">{item.termCode}</div>
                            </div>
                        </div>
                    </div>

                    {/* اطلاعات تدریس */}
                    <div className="card mb-4">
                        <div className="card-header bg-success text-white">
                            <h6 className="mb-0">اطلاعات تدریس</h6>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-6 fw-bold">واحد موظف:</div>
                                <div className="col-6"><PersianNumber>{item.vahedMovazaf || 0}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-6 fw-bold">محل خدمت:</div>
                                <div className="col-6"><PersianNumber>{item.tedadVahedMahalKhedmat || 0}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-6 fw-bold">حضوری در مراکز دیگر:</div>
                                <div className="col-6"><PersianNumber>{item.tedadVahedHamjavar || 0}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-6 fw-bold">مجازی در مراکز دیگر:</div>
                                <div className="col-6"><PersianNumber>{item.tedadVahedMajazi || 0}</PersianNumber></div>
                            </div>
                            {item.dalil && (
                                <div className="row mb-2">
                                    <div className="col-12">
                                        <span className="fw-bold">دلایل تقاضا:</span>
                                        <p className="mb-0 mt-1">{item.dalil}</p>
                                    </div>
                                </div>
                            )}
                            {item.shahrZendegi && (
                                <div className="row">
                                    <div className="col-12">
                                        <span className="fw-bold">شهر سکونت:</span>
                                        <span className="ms-2">{item.shahrZendegi}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    ستون وسط: موارد تقاضا (Hamjavar1)
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header bg-info text-white">
                            <h6 className="mb-0">موارد تقاضا</h6>
                            <small className="text-white-50">({item.hamjavar1s?.length || 0} مورد)</small>
                        </div>
                        <div className="card-body p-0">
                            {item.hamjavar1s?.length === 0 ? (
                                <div className="text-center text-muted py-3">
                                    <i className="bi bi-info-circle me-1"></i>
                                    هیچ موردی ثبت نشده است
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {item.hamjavar1s?.map((detail, index) => {
                                        const markaz = markazList?.find(m => m.id === detail.markazId);
                                        return (
                                            <div key={detail.id} className="list-group-item">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <span className="badge bg-secondary me-2">{index + 1}</span>
                                                    <div className="flex-grow-1">
                                                        <div>
                                                            <span className="fw-bold">مرکز:</span>
                                                            <span className="ms-1">{markaz?.naamMarkaz || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="fw-bold">استان:</span>
                                                            <span className={`badge ${detail.inOstan ? 'bg-success' : 'bg-warning'} ms-1`}>
                                                                {detail.inOstan ? 'داخل استان' : 'خارج استان'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="fw-bold">فعالیت‌ها:</span>
                                                            <div className="d-flex flex-wrap gap-1 mt-1">
                                                                {detail.faaliatNames?.map((name, i) => (
                                                                    <span key={i} className="badge bg-light text-dark border">
                                                                        {name}
                                                                    </span>
                                                                )) || <span className="text-muted">-</span>}
                                                            </div>
                                                        </div>
                                                        <div className="mt-1">
                                                            <span className="fw-bold">تعداد روز:</span>
                                                            <PersianNumber className="ms-1">{detail.tedadRoozElmi || 0}</PersianNumber>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    ستون چپ: نظرات مراحل
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header bg-secondary text-white">
                            <h6 className="mb-0">نظرات مراحل</h6>
                        </div>
                        <div className="card-body">
                            {/* نظر رئیس */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">رئیس مرکز</span>
                                    {getReviewStatus('raeis') && (
                                        <span className={`badge ${getReviewStatus('raeis').className}`}>
                                            {getReviewStatus('raeis').label}
                                        </span>
                                    )}
                                </div>
                                {item.nazarRaeis && (
                                    <p className="mb-1 text-muted small">{item.nazarRaeis}</p>
                                )}
                                {getDaryaftDate('raeis') && (
                                    <small className="text-muted">
                                        تاریخ دریافت: {new Date(getDaryaftDate('raeis')).toLocaleDateString('fa-IR')}
                                    </small>
                                )}
                                {item.roleMarkazRaeis && (
                                    <small className="text-muted d-block">
                                        نقش/مرکز: {item.roleMarkazRaeis}
                                    </small>
                                )}
                            </div>

                            <hr />

                            {/* نظر خدمات */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">خدمات آموزشی استان</span>
                                    {getReviewStatus('khadamat') && (
                                        <span className={`badge ${getReviewStatus('khadamat').className}`}>
                                            {getReviewStatus('khadamat').label}
                                        </span>
                                    )}
                                </div>
                                {item.nazarKhadamat && (
                                    <p className="mb-1 text-muted small">{item.nazarKhadamat}</p>
                                )}
                                {getDaryaftDate('khadamat') && (
                                    <small className="text-muted">
                                        تاریخ دریافت: {new Date(getDaryaftDate('khadamat')).toLocaleDateString('fa-IR')}
                                    </small>
                                )}
                                {item.roleMarkazKhadamatOstan && (
                                    <small className="text-muted d-block">
                                        نقش/مرکز: {item.roleMarkazKhadamatOstan}
                                    </small>
                                )}
                            </div>

                            <hr />

                            {/* نظر معاون */}
                            <div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">معاونت آموزشی استان</span>
                                    {getReviewStatus('moaven') && (
                                        <span className={`badge ${getReviewStatus('moaven').className}`}>
                                            {getReviewStatus('moaven').label}
                                        </span>
                                    )}
                                </div>
                                {item.nazarMoaven && (
                                    <p className="mb-1 text-muted small">{item.nazarMoaven}</p>
                                )}
                                {getDaryaftDate('moaven') && (
                                    <small className="text-muted">
                                        تاریخ دریافت: {new Date(getDaryaftDate('moaven')).toLocaleDateString('fa-IR')}
                                    </small>
                                )}
                                {item.roleMarkazApproved && (
                                    <small className="text-muted d-block">
                                        نقش/مرکز: {item.roleMarkazApproved}
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* مستندات */}
                    {item.uploadElmi && (
                        <div className="card">
                            <div className="card-header bg-light">
                                <h6 className="mb-0">مستندات پیوست</h6>
                            </div>
                            <div className="card-body">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {/* دانلود فایل */ }}
                                >
                                    <i className="bi bi-download me-1"></i>
                                    دانلود فایل
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                مودال ثبت نظر
                ============================================================ */}
            <ReviewModal
                show={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                item={item}
                onSubmit={handleReview}
                submitting={submitting}
                role={getReviewRole()}
            />

            <ConfirmModal />
        </div>
    );
}