// src/pages/Schedule/Hamjavar/HamjavarDetail.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import { getStatusBadge } from './HamjavarHelpers';

export default function HamjavarDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList } = useTerm();
    const { confirm, ConfirmModal } = useConfirm();
    const printRef = useRef();

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
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // State مودال ثبت نظر
    // ============================================================
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRole, setReviewRole] = useState(null);
    const [reviewNazar, setReviewNazar] = useState('');
    const [reviewTedadRooz, setReviewTedadRooz] = useState([]);

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
    // تابع پرینت
    // ============================================================
    const handlePrint = () => {
        window.print();
    };

    // ============================================================
    // عملیات: تایید نهایی توسط استاد
    // ============================================================
    const handleSignSend = async () => {
        const confirmed = await confirm({
            title: 'تایید نهایی',
            message: `آیا از تایید نهایی درخواست "${item?.ostadName}" برای ترم ${item?.termCode} مطمئن هستید؟`,
            confirmText: 'تایید',
            confirmVariant: 'success'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/Hamjavar/confirm-submit-by-ostad/${id}`, {
                nazar: 2  // تایید
            });
            if (response.data?.success) {
                toast.success('درخواست با موفقیت تایید شد');
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
                navigate('/dashboard/tadris-hamjavar-list');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // باز کردن مودال ثبت نظر
    // ============================================================
    const openReviewModal = (role) => {
        setReviewRole(role);

        const tedadList = item?.hamjavar1s?.map(detail => {
            if (role === 'raeis') return detail.tedadRoozRaeis || '';
            if (role === 'khadamat') return detail.tedadRoozKhadamat || '';
            if (role === 'moaven') return detail.tedadRoozMoaven || '';
            return '';
        }) || [];

        setReviewTedadRooz(tedadList);
        setReviewNazar('');
        setShowReviewModal(true);
    };

    // ============================================================
    // بستن مودال ثبت نظر
    // ============================================================
    const closeReviewModal = () => {
        setShowReviewModal(false);
        setReviewRole(null);
        setReviewNazar('');
        setReviewTedadRooz([]);
    };

    // ============================================================
    // تغییر تعداد روز در مودال
    // ============================================================
    const handleTedadChange = (index, value) => {
        const newList = [...reviewTedadRooz];
        newList[index] = value;
        setReviewTedadRooz(newList);
    };

    // ============================================================
    // ثبت نظر
    // ============================================================
    const handleReviewSubmit = async () => {
        const confirmed = await confirm({
            title: 'ثبت نظر',
            message: 'آیا از ثبت نظر مطمئن هستید؟',
            confirmText: 'ثبت',
            confirmVariant: 'primary'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const endpoint = reviewRole === 'raeis' ? '/Hamjavar/review-raeis' :
                reviewRole === 'khadamat' ? '/Hamjavar/review-khadamat' :
                    '/Hamjavar/review-moaven';

            const tedadRoozList = reviewTedadRooz.map(v => v ? parseInt(v) : null);

            const response = await api.patch(endpoint, {
                hamjavarId: parseInt(id),
                tedadRoozList: tedadRoozList,
                nazar: parseInt(reviewNazar),
                tozihat: reviewNazar ? `نظر: ${reviewNazar}` : ''  // اگر توضیحات نیاز بود
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
    // بررسی امکان ثبت نظر برای نقش فعلی (بر اساس وضعیت‌های جدید)
    // ============================================================
    const canReview = useMemo(() => {
        if (!item) return null;

        // رئیس: فقط زمانی که وضعیت "تایید" باشد و نظر رئیس ثبت نشده باشد
        if (isRaeis && item.akharinTaghaza === 'Taeed' && (item.nazarRaeis === null || item.nazarRaeis === 0)) {
            return 'raeis';
        }

        // خدمات: فقط زمانی که نظر رئیس ثبت شده باشد و نظر خدمات ثبت نشده باشد
        if (isKhadamat && item.akharinTaghaza === 'Taeed' && item.nazarRaeis >= 2 && (item.nazarKhadamat === null || item.nazarKhadamat === 0)) {
            return 'khadamat';
        }

        // معاون: فقط زمانی که نظر خدمات ثبت شده باشد (معاون می‌تواند بازنویسی کند)
        if (isMoaven && item.akharinTaghaza === 'Taeed' && item.nazarKhadamat >= 2) {
            return 'moaven';
        }

        return null;
    }, [item, isRaeis, isKhadamat, isMoaven]);

    // ============================================================
    // بررسی امکان امضاء و ارسال (برای استاد) - بر اساس وضعیت جدید
    // ============================================================
    const canSignSend = useMemo(() => {
        return isOstad && item?.akharinTaghaza === 'PishNevis' && (item.nazarElmi === null || item.nazarElmi === 1);
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
    // دریافت وضعیت بررسی هر نقش (بر اساس فیلدهای عددی)
    // ============================================================
    const getReviewStatus = (role) => {
        if (!item) return null;

        const statusMap = {
            raeis: item.nazarRaeis,
            khadamat: item.nazarKhadamat,
            moaven: item.nazarMoaven
        };
        const value = statusMap[role];

        if (value === 2) return { label: 'تایید ✅', className: 'bg-success' };
        if (value === 3) return { label: 'رد ❌', className: 'bg-danger' };
        if (value === 4) return { label: 'اصلاح ✏️', className: 'bg-warning text-dark' };
        return { label: 'در انتظار ⏳', className: 'bg-warning text-dark' };
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
    // دریافت عنوان ترم
    // ============================================================
    const getTermTitle = (codeTerm) => {
        const term = termList?.find(t => t.codeTerm === codeTerm);
        return term?.onvanTerm || codeTerm;
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
                    onClick={() => navigate('/dashboard/tadris-hamjavar-list')}
                >
                    <i className="bi bi-arrow-right me-1"></i>
                    بازگشت به لیست
                </button>
            </div>
        );
    }

    const reviewRoleType = canReview;

    // ============================================================
    // دانلود فایل
    // ============================================================
    const downloadFile = async (filePath, fileName) => {
        if (!filePath) {
            toast.warning('فایلی برای دانلود وجود ندارد');
            return;
        }

        try {
            // اگر filePath یک مسیر کامل است، از آن استفاده کن
            const url = filePath.startsWith('/uploads/')
                ? filePath
                : `/uploads/hamjavar/${filePath}`;

            // دانلود فایل با لینک مستقیم
            window.open(url, '_blank');
        } catch (error) {
            console.error('خطا در دانلود فایل:', error);
            toast.error('خطا در دانلود فایل');
        }
    };

    return (
        <div className="container-fluid" ref={printRef}>
            {/* ============================================================
                هدر با دکمه‌های عملیات
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/tadris-hamjavar-list')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={handlePrint}
                        title="پرینت"
                    >
                        <i className="bi bi-printer me-1"></i>
                        پرینت
                    </button>

                    {canSignSend && (
                        <button
                            className="btn btn-success"
                            onClick={handleSignSend}
                            disabled={submitting}
                        >
                            <i className="bi bi-check2-circle me-1"></i>
                            {submitting ? 'در حال ارسال...' : 'تایید نهایی'}
                        </button>
                    )}

                    {canEdit && (
                        <button
                            className="btn btn-warning"
                            onClick={() => navigate(`/dashboard/tadris-hamjavar-edit/${item.id}`)}
                        >
                            <i className="bi bi-pencil me-1"></i>
                            ویرایش
                        </button>
                    )}

                    {reviewRoleType && (
                        <button
                            className="btn btn-primary"
                            onClick={() => openReviewModal(reviewRoleType)}
                        >
                            <i className="bi bi-pencil-square me-1"></i>
                            ثبت نظر {getRoleName(reviewRoleType)}
                        </button>
                    )}

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
                عنوان و اطلاعات ایجاد کننده
                ============================================================ */}
            <div className="mb-4">
                <h3 className="text-center mb-2">
                    درخواست تدریس در سایر مراکز - نیمسال <PersianNumber>{item.termCode}</PersianNumber>
                </h3>
                <p className="text-center text-muted mb-0">
                    ایجاد کننده: {item.ostadName} {item.ostadLastName}
                    {item.roleMarkazSabtKonandeh && ` (${item.roleMarkazSabtKonandeh})`}
                </p>
            </div>

            {/* ============================================================
                وضعیت درخواست
                ============================================================ */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex flex-wrap gap-3 align-items-center p-3 bg-light rounded border">
                        <span className="fw-bold">وضعیت فعلی:</span>
                        {getStatusBadge(item.akharinTaghaza)}
                        <span className="text-muted ms-2">
                            آخرین مرحله: {item.aKharinBarrasi || '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ============================================================
                اطلاعات استاد
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">
                        <i className="bi bi-person-badge me-2"></i>
                        اطلاعات استاد
                    </h6>
                </div>
                <div className="card-body">
                    {/* خط اول: کد استادی، نام، نام خانوادگی */}
                    <div className="row mb-2">
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">کد استادی:</span>
                            <span className="me-3"><PersianNumber>{item.ostadCode || '-'}</PersianNumber></span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">نام:</span>
                            <span className="me-3">{item.ostadName || '-'}</span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">نام خانوادگی:</span>
                            <span>{item.ostadLastName || '-'}</span>
                        </div>
                    </div>

                    {/* خط دوم: مرکز فعلی، مرتبه علمی، رشته تحصیلی */}
                    <div className="row mb-2">
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">مرکز فعلی:</span>
                            <span className="me-3">{item.ostadMarkaz || '-'}</span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">مرتبه علمی:</span>
                            <span className="me-3">{item.ostadMartabeElmi || '-'}</span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">رشته تحصیلی:</span>
                            <span>{item.ostadReshteh || '-'}</span>
                        </div>
                    </div>

                    <hr className="my-2" />

                    {/* خط سوم: آخرین وضعیت، سمت اجرایی */}
                    <div className="row mb-2">
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">آخرین وضعیت:</span>
                            <span className="me-3">{item.akharinVazeeat || '-'}</span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">سمت اجرایی:</span>
                            <span className="me-3">
                                {item.isEjeari ? (
                                    <span className="badge bg-success">دارد</span>
                                ) : (
                                    <span className="badge bg-secondary">ندارد</span>
                                )}
                            </span>
                        </div>
                        <div className="col-md-4">
                            {item.isEjeari && (
                                <>
                                    <span className="fw-bold text-muted">عنوان سمت:</span>
                                    <span>{item.onvanEjraei || '-'}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* خط چهارم: نوع همکاری، ساعت موظف هفتگی */}
                    <div className="row mb-2">
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">نوع همکاری:</span>
                            <span className="me-3">
                                <span className={`badge ${item.fullTime ? 'bg-success' : 'bg-warning'}`}>
                                    {item.fullTime ? 'تمام وقت' : 'پاره وقت'}
                                </span>
                            </span>
                        </div>
                        <div className="col-md-4">
                            <span className="fw-bold text-muted">ساعت موظف هفتگی:</span>
                            <span>
                                {item.fullTime ? (
                                    <span className="badge bg-primary"><PersianNumber>۴۰</PersianNumber> ساعت</span>
                                ) : (
                                    <span className="badge bg-info"><PersianNumber>{item.tedadSaatMovazafi || '۰'}</PersianNumber> ساعت</span>
                                )}
                            </span>
                        </div>
                    </div>

                    <hr className="my-2" />

                    {/* خط پنجم: واحدها */}
                    <div className="row mb-2">
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">واحد موظف:</span>
                            <span className="me-3"><PersianNumber>{item.vahedMovazaf || 0}</PersianNumber></span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">تکمیل در محل خدمت:</span>
                            <span className="me-3"><PersianNumber>{item.tedadVahedMahalKhedmat || 0}</PersianNumber></span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">حضوری در مراکز دیگر:</span>
                            <span className="me-3"><PersianNumber>{item.tedadVahedHamjavar || 0}</PersianNumber></span>
                        </div>
                        <div className="col-md-3">
                            <span className="fw-bold text-muted">مجازی در مراکز دیگر:</span>
                            <span><PersianNumber>{item.tedadVahedMajazi || 0}</PersianNumber></span>
                        </div>
                    </div>

                    {/* خط ششم: دلایل تقاضا */}
                    <div className="row mb-2">
                        <div className="col-12">
                            <span className="fw-bold text-muted">دلایل تقاضا:</span>
                            <span className="me-3">{item.dalil || '-'}</span>
                        </div>
                    </div>

                    {/* خط هفتم: شهر محل سکونت */}
                    <div className="row">
                        <div className="col-12">
                            <span className="fw-bold text-muted">شهر محل سکونت:</span>
                            <span>{item.shahrZendegi || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                موارد تقاضا (Hamjavar1)
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-header bg-info text-white">
                    <h6 className="mb-0">
                        <i className="bi bi-list-check me-2"></i>
                        موارد تقاضا
                        <span className="badge bg-light text-dark ms-2">
                            {item.hamjavar1s?.length || 0} مورد
                        </span>
                    </h6>
                </div>
                <div className="card-body p-0">
                    {item.hamjavar1s?.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-info-circle me-1"></i>
                            هیچ موردی ثبت نشده است
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>داخل/خارج استان</th>
                                        <th>مرکز</th>
                                        <th>فعالیت‌ها</th>
                                        <th>تعداد روز (استاد)</th>
                                        {item.nazarRaeis !== null && item.nazarRaeis !== undefined && <th>تعداد روز (رئیس)</th>}
                                        {item.nazarKhadamat !== null && item.nazarKhadamat !== undefined && <th>تعداد روز (خدمات)</th>}
                                        {item.nazarMoaven !== null && item.nazarMoaven !== undefined && <th>تعداد روز (معاون)</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.hamjavar1s?.map((detail, index) => {
                                        const markaz = markazList?.find(m => m.id === detail.markazId);
                                        const faaliatNames = detail.faaliatNames || [];

                                        return (
                                            <tr key={detail.id}>
                                                <td><PersianNumber>{index + 1}</PersianNumber></td>
                                                <td>
                                                    <span className={`badge ${detail.inOstan ? 'bg-success' : 'bg-warning'}`}>
                                                        {detail.inOstan ? 'داخل استان' : 'خارج استان'}
                                                    </span>
                                                </td>
                                                <td>{markaz?.naamMarkaz || '-'}</td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {faaliatNames.map((name, i) => (
                                                            <span key={i} className="badge bg-secondary">{name}</span>
                                                        ))}
                                                        {faaliatNames.length === 0 && <span className="text-muted">-</span>}
                                                    </div>
                                                </td>
                                                <td><PersianNumber>{detail.tedadRoozElmi || 0}</PersianNumber></td>
                                                {item.nazarRaeis !== null && item.nazarRaeis !== undefined && (
                                                    <td><PersianNumber>{detail.tedadRoozRaeis || '-'}</PersianNumber></td>
                                                )}
                                                {item.nazarKhadamat !== null && item.nazarKhadamat !== undefined && (
                                                    <td><PersianNumber>{detail.tedadRoozKhadamat || '-'}</PersianNumber></td>
                                                )}
                                                {item.nazarMoaven !== null && item.nazarMoaven !== undefined && (
                                                    <td><PersianNumber>{detail.tedadRoozMoaven || '-'}</PersianNumber></td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                نظرات مراحل
                ============================================================ */}

            <div className="row">
                {/* ============================================================
                    نظر رئیس مرکز
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card h-100">
                        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                                <i className="bi bi-person-check me-2"></i>
                                نظر رئیس مرکز
                            </h6>
                            {getReviewStatus('raeis') && (
                                <span className={`badge ${getReviewStatus('raeis').className}`}>
                                    {getReviewStatus('raeis').label}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            {/* وضعیت */}
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold">وضعیت:</span>
                                {getReviewStatus('raeis') && (
                                    <span className={`badge ${getReviewStatus('raeis').className}`}>
                                        {getReviewStatus('raeis').label}
                                    </span>
                                )}
                            </div>

                            {/* 🔥 نظر عددی به صورت متن */}
                            {item.nazarRaeis ? (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">نظر:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.nazarRaeis === 2 && '✅ تایید'}
                                        {item.nazarRaeis === 3 && '❌ رد'}
                                        {item.nazarRaeis === 4 && '✏️ اصلاح'}
                                        {item.nazarRaeis === 1 && '📝 پیش‌نویس'}
                                        {item.nazarRaeis === 0 && '⏳ در انتظار'}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-2 text-muted small">نظری ثبت نشده است</div>
                            )}

                            {/* 🔥 توضیحات */}
                            {item.tozihatRaeis && (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">توضیحات:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.tozihatRaeis}
                                    </p>
                                </div>
                            )}

                            {/* 🔥 فایل */}
                            {item.uploadRaeis && (
                                <div className="mt-2">
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => downloadFile(item.uploadRaeis, 'مستندات_رئیس')}
                                    >
                                        <i className="bi bi-download me-1"></i>
                                        دانلود مستندات
                                    </button>
                                </div>
                            )}

                            {/* نقش/مرکز */}
                            {item.roleMarkazRaeis && (
                                <small className="text-muted d-block mt-2">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {item.roleMarkazRaeis}
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    نظر خدمات آموزشی استان
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card h-100">
                        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                                <i className="bi bi-building me-2"></i>
                                نظر خدمات آموزشی استان
                            </h6>
                            {getReviewStatus('khadamat') && (
                                <span className={`badge ${getReviewStatus('khadamat').className}`}>
                                    {getReviewStatus('khadamat').label}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold">وضعیت:</span>
                                {getReviewStatus('khadamat') && (
                                    <span className={`badge ${getReviewStatus('khadamat').className}`}>
                                        {getReviewStatus('khadamat').label}
                                    </span>
                                )}
                            </div>

                            {item.nazarKhadamat ? (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">نظر:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.nazarKhadamat === 2 && '✅ تایید'}
                                        {item.nazarKhadamat === 3 && '❌ رد'}
                                        {item.nazarKhadamat === 4 && '✏️ اصلاح'}
                                        {item.nazarKhadamat === 1 && '📝 پیش‌نویس'}
                                        {item.nazarKhadamat === 0 && '⏳ در انتظار'}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-2 text-muted small">نظری ثبت نشده است</div>
                            )}

                            {item.tozihatKhadamat && (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">توضیحات:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.tozihatKhadamat}
                                    </p>
                                </div>
                            )}

                            {item.uploadKhadamat && (
                                <div className="mt-2">
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => downloadFile(item.uploadKhadamat, 'مستندات_خدمات')}
                                    >
                                        <i className="bi bi-download me-1"></i>
                                        دانلود مستندات
                                    </button>
                                </div>
                            )}

                            {item.roleMarkazKhadamatOstan && (
                                <small className="text-muted d-block mt-2">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {item.roleMarkazKhadamatOstan}
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    نظر معاونت آموزشی استان
                    ============================================================ */}
                <div className="col-md-4">
                    <div className="card h-100">
                        <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                                <i className="bi bi-person-gear me-2"></i>
                                نظر معاونت آموزشی استان
                            </h6>
                            {getReviewStatus('moaven') && (
                                <span className={`badge ${getReviewStatus('moaven').className}`}>
                                    {getReviewStatus('moaven').label}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold">وضعیت:</span>
                                {getReviewStatus('moaven') && (
                                    <span className={`badge ${getReviewStatus('moaven').className}`}>
                                        {getReviewStatus('moaven').label}
                                    </span>
                                )}
                            </div>

                            {item.nazarMoaven ? (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">نظر:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.nazarMoaven === 2 && '✅ تایید'}
                                        {item.nazarMoaven === 3 && '❌ رد'}
                                        {item.nazarMoaven === 4 && '✏️ اصلاح'}
                                        {item.nazarMoaven === 1 && '📝 پیش‌نویس'}
                                        {item.nazarMoaven === 0 && '⏳ در انتظار'}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-2 text-muted small">نظری ثبت نشده است</div>
                            )}

                            {item.tozihatMoaven && (
                                <div className="mb-2">
                                    <span className="fw-bold text-muted">توضیحات:</span>
                                    <p className="mb-1 text-muted small bg-light p-2 rounded">
                                        {item.tozihatMoaven}
                                    </p>
                                </div>
                            )}

                            {item.uploadMoaven && (
                                <div className="mt-2">
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => downloadFile(item.uploadMoaven, 'مستندات_معاون')}
                                    >
                                        <i className="bi bi-download me-1"></i>
                                        دانلود مستندات
                                    </button>
                                </div>
                            )}

                            {item.roleMarkazApproved && (
                                <small className="text-muted d-block mt-2">
                                    <i className="bi bi-person-badge me-1"></i>
                                    {item.roleMarkazApproved}
                                </small>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                مودال ثبت نظر
                ============================================================ */}
            {showReviewModal && reviewRole && (
                <div
                    className="modal show d-block"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={closeReviewModal}
                >
                    <div
                        className="modal-dialog modal-lg"
                        style={{
                            margin: 0,
                            width: '100%',
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content" style={{ maxHeight: '90vh', overflow: 'auto' }}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    ثبت نظر - {getRoleName(reviewRole)}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeReviewModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <strong>استاد:</strong> {item.ostadName}
                                        </div>
                                        <div className="col-md-6">
                                            <strong>ترم:</strong> {item.termCode}
                                            {item.termCode && ` - ${getTermTitle(item.termCode)}`}
                                        </div>
                                    </div>
                                </div>

                                <h6 className="text-primary">تعداد روز پیشنهادی</h6>
                                <hr />

                                {item.hamjavar1s?.map((detail, index) => {
                                    const markaz = markazList?.find(m => m.id === detail.markazId);
                                    const faaliatNames = detail.faaliatNames || [];

                                    return (
                                        <div key={detail.id} className="mb-3 p-2 border rounded bg-light">
                                            <div className="row align-items-center">
                                                <div className="col-md-5">
                                                    <strong>مرکز:</strong> {markaz?.naamMarkaz || '-'}
                                                    <br />
                                                    <small className="text-muted">
                                                        فعالیت‌ها: {faaliatNames.join('، ') || '-'}
                                                    </small>
                                                    <br />
                                                    <small className="text-muted">
                                                        تعداد روز علمی: <PersianNumber>{detail.tedadRoozElmi || 0}</PersianNumber>
                                                    </small>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        تعداد روز پیشنهادی
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={reviewTedadRooz[index] || ''}
                                                        onChange={(e) => handleTedadChange(index, e.target.value)}
                                                        min="0"
                                                        max="6"
                                                        placeholder="۰ تا ۶"
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <small className="text-muted">
                                                        {reviewTedadRooz[index] !== '' && reviewTedadRooz[index] !== undefined &&
                                                            `پیشنهادی: ${reviewTedadRooz[index]} روز`
                                                        }
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="mb-3">
                                    <label className="form-label">نظر (عددی)</label>
                                    <select
                                        className="form-select"
                                        value={reviewNazar}
                                        onChange={(e) => setReviewNazar(e.target.value)}
                                    >
                                        <option value="">انتخاب...</option>
                                        <option value="2">✅ تایید</option>
                                        <option value="3">❌ رد</option>
                                        <option value="4">✏️ اصلاح</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeReviewModal}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleReviewSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* پس‌زمینه مودال */}
            {showReviewModal && (
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
                    onClick={closeReviewModal}
                ></div>
            )}

            <ConfirmModal />
        </div>
    );
}