// src/pages/Schedule/Hamjavar/HamjavarDetail.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import { getStatusBadge } from './HamjavarHelpers';
import ReviewModal from './modals/ReviewModal';
import SignatureDisplay from '../../../components/common/SignatureDisplay';
import DownloadButton from '../../../components/common/DownloadButton';

export default function HamjavarDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList } = useTerm();
    const { confirm, ConfirmModal } = useConfirm();
    const printRef = useRef(null);

    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isRaeis = useMemo(() => hasPermission('Hamjavar.ReviewByRaeis'), [hasPermission]);
    const isKhadamat = useMemo(() => hasPermission('Hamjavar.ReviewByKhadamat'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('Hamjavar.ReviewByMoaven'), [hasPermission]);
    const isAdmin = useMemo(() => user?.currentRoleName === 'ادمین سامانه', [user]);

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRole, setReviewRole] = useState(null);

    const { getTermTitle } = useTerm();

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
    // تابع پرینت با react-to-print
    // ============================================================
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `درخواست فعالیت  ${item?.termCode || ''}`,
        onAfterPrint: () => {
            console.log('چاپ انجام شد');
        },
        onPrintError: (error) => {
            console.error('خطا در چاپ:', error);
            toast.error('خطا در چاپ');
        },
        removeAfterPrint: false,
    });

    const handlePrintClick = () => {
        if (!item) {
            toast.warning('اطلاعات درخواست هنوز کامل نشده است');
            return;
        }
        if (!printRef.current) {
            toast.warning('محتوای قابل چاپ یافت نشد');
            return;
        }
        handlePrint();
    };

    // ============================================================
    // عملیات‌ها (تایید، حذف، ثبت نظر)
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
            const response = await api.patch(`/Hamjavar/confirm-submit-by-ostad/${id}`, { nazar: 2 });
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

    const openReviewModal = (role) => {
        setReviewRole(role);
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setReviewRole(null);
    };

    const handleReviewSubmit = async (data) => {
        setSubmitting(true);
        try {
            const endpoint = reviewRole === 'raeis' ? '/Hamjavar/review-raeis' :
                reviewRole === 'khadamat' ? '/Hamjavar/review-khadamat' :
                    '/Hamjavar/review-moaven';
            const formData = new FormData();
            formData.append('hamjavarId', parseInt(id));
            formData.append('nazar', data.nazar);
            formData.append('tozihat', data.tozihat || '');
            if (data.tedadRoozList && data.tedadRoozList.length > 0) {
                data.tedadRoozList.forEach((item, index) => {
                    formData.append(`tedadRoozList[${index}].id`, item.id);
                    formData.append(`tedadRoozList[${index}].tedadRooz`, item.tedadRooz);
                });
            }
            if (data.upload) {
                formData.append('uploadFile', data.upload);
            }
            const response = await api.patch(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
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
    // منطق‌های محاسباتی
    // ============================================================
    const canReview = useMemo(() => {
        if (!item) return null;
        if (isMoaven) return 'moaven';
        if (isRaeis && item.nazarElmi === 2 &&
            (item.nazarRaeis === null || item.nazarRaeis < 2) &&
            (item.nazarKhadamat === null || item.nazarKhadamat < 2) &&
            (item.nazarMoaven === null || item.nazarMoaven < 2)) {
            return 'raeis';
        }
        if (isKhadamat && item.nazarElmi === 2 &&
            (item.nazarKhadamat === null || item.nazarKhadamat < 2) &&
            (item.nazarMoaven === null || item.nazarMoaven < 2)) {
            return 'khadamat';
        }
        return null;
    }, [item, isRaeis, isKhadamat, isMoaven]);

    const canSignSend = useMemo(() => {
        return isOstad && item?.akharinTaghaza === 'PishNevis' && (item.nazarElmi === null || item.nazarElmi === 1);
    }, [isOstad, item]);

    const canEdit = useMemo(() => {
        return isOstad && item?.akharinTaghaza === 'PishNevis';
    }, [isOstad, item]);

    const canDelete = useMemo(() => {
        return (isOstad && item?.akharinTaghaza === 'PishNevis') || isAdmin;
    }, [isOstad, item, isAdmin]);

    const getReviewStatus = (role) => {
        if (!item) return null;
        const value = { raeis: item.nazarRaeis, khadamat: item.nazarKhadamat, moaven: item.nazarMoaven }[role];
        if (value === 2) return { label: 'تایید ✅', className: 'bg-success' };
        if (value === 3) return { label: 'رد ❌', className: 'bg-danger' };
        if (value === 4) return { label: 'اصلاح ✏️', className: 'bg-warning text-dark' };
        return { label: 'در انتظار ⏳', className: 'bg-warning text-dark' };
    };

    const getRoleName = (role) => {
        const map = { raeis: 'رئیس مرکز', khadamat: 'خدمات آموزشی استان', moaven: 'معاونت آموزشی استان' };
        return map[role] || role;
    };


    // ============================================================
    // توابع کمکی برای تاریخ و نقش
    // ============================================================
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fa-IR');
    };

    const getMoavenTitle = (roleMarkaz) => {
        if (!roleMarkaz) return 'معاون آموزشی استان';
        if (roleMarkaz.includes('رییس')) return 'رئیس استان';
        if (roleMarkaz.includes('معاون')) return 'معاون آموزشی استان';
        return 'معاون آموزشی استان';
    };

    // ============================================================
    // 🔥 تابع اصلاح نقش و مرکز برای نمایش بهتر
    // ============================================================
    const formatRoleMarkaz = (raw) => {
        //console.log('item is :',item)
        if (!raw) return '';
        if (!raw.includes(' - ')) return raw;

        const parts = raw.split(' - ');
        if (parts.length !== 2) return raw;

        const [rolePart, markazPart] = parts;
        if (rolePart === markazPart) return rolePart;

        const roleWords = rolePart.split(' ');
        const markazWords = markazPart.split(' ');
        const lastRoleWord = roleWords[roleWords.length - 1];
        const firstMarkazWord = markazWords[0];

        // کلمات کلیدی مکان (می‌توانید بیشتر اضافه کنید)
        const placeKeywords = ['مرکز', 'واحد', 'دانشکده', 'مجتمع', 'پردیس', 'استان'];

        // اگر هر دو کلمه در مجموعه باشند (مترادف یا یکسان)
        if (placeKeywords.includes(lastRoleWord) && placeKeywords.includes(firstMarkazWord)) {
            // نقش بدون آخرین کلمه + کلمه‌ی اول مرکز + بقیه‌ی کلمات مرکز
            const roleWithoutLast = roleWords.slice(0, -1).join(' ');
            const restOfMarkaz = markazWords.slice(1).join(' ');
            return `${roleWithoutLast} ${firstMarkazWord} ${restOfMarkaz}`.trim();
        }

        // در غیر این صورت، با ویرگول جدا کن
        return `${rolePart} ${markazPart}`;
    };
    // ============================================================
    // 🔥 تابع نمایش عنوان مرکز
    // ============================================================
    const getMarkazDisplayName = (markaz) => {
        if (!markaz) return '-';
        if (markaz.level === 2) return 'سازمان مرکزی دانشگاه پیام نور';
        if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`.trim() || 'ستاد استان';
        return markaz.naamMarkaz || '-';
    };
    // ============================================================
    // نمایش لودینگ و خطا
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

    if (error || !item) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'درخواست یافت نشد'}
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard/tadris-hamjavar-list')}>
                    <i className="bi bi-arrow-right me-1"></i> بازگشت به لیست
                </button>
            </div>
        );
    }

    const reviewRoleType = canReview;

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر - چاپ نمی‌شود
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <div>
                    <button className="btn btn-outline-secondary me-3" onClick={() => navigate('/dashboard/tadris-hamjavar-list')}>
                        <i className="bi bi-arrow-right me-1"></i> بازگشت
                    </button>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-outline-secondary" onClick={handlePrintClick} title="پرینت" disabled={!item}>
                        <i className="bi bi-printer me-1"></i> پرینت
                    </button>
                    {canSignSend && (
                        <button className="btn btn-success" onClick={handleSignSend} disabled={submitting}>
                            <i className="bi bi-check2-circle me-1"></i> {submitting ? 'در حال ارسال...' : 'تایید نهایی'}
                        </button>
                    )}
                    {canEdit && (
                        <button className="btn btn-warning" onClick={() => navigate(`/dashboard/tadris-hamjavar-edit/${item.id}`)}>
                            <i className="bi bi-pencil me-1"></i> ویرایش
                        </button>
                    )}
                    {reviewRoleType && (
                        <button className="btn btn-primary" onClick={() => openReviewModal(reviewRoleType)}>
                            <i className="bi bi-pencil-square me-1"></i> ثبت نظر {getRoleName(reviewRoleType)}
                        </button>
                    )}
                    {canDelete && (
                        <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                            <i className="bi bi-trash me-1"></i> حذف
                        </button>
                    )}
                </div>
            </div>

            {/* ============================================================
                محتوای قابل چاپ
                ============================================================ */}
            <div ref={printRef} className="print-area">
                {/* عنوان */}
                <div className='row d-none d-print-block mt-4 p-3 border-top'>
                    <div className="col-12">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            alignItems: 'center'
                        }}>
                            <span className="text-start" style={{ visibility: 'hidden' }}>‌</span>
                            <span className="text-center fw-bolder fs-5">
                                دانشگاه پیام نور استان فارس
                            </span>
                            <span className="text-start">
                                <small>
                                    تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}
                                </small>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="text-center mb-2">
                        درخواست فعالیت در خارج از مرکز فعلی -  <PersianNumber>{getTermTitle(item.termCode)}</PersianNumber>
                    </h3>

                </div>

                {/* وضعیت و ایجاد کننده */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex flex-wrap gap-3 align-items-center p-3 bg-light rounded border">
                            <div className='col-md-4'>
                                <p className="text-center text-muted mb-0">
                                    ایجاد کننده: {item.ostadName} {item.ostadLastName}
                                    {item.roleMarkazSabtKonandeh && ` (${formatRoleMarkaz(item.roleMarkazSabtKonandeh)})`}
                                </p>
                            </div>
                            <div className='col-md-3'>
                                <span className="text-muted ms-2">
                                    تاریخ ثبت درخواست: {formatDate(item.tarikhErsalElmi)}
                                </span>
                            </div>
                            <div className='col-md-4'>
                                <span className="text-muted ms-2">
                                    آخرین مرحله بررسی : {item.aKharinBarrasi || '-'} {getStatusBadge(item.akharinTaghaza)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* اطلاعات استاد */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h6 className="mb-0"><i className="bi bi-person-badge me-2"></i> اطلاعات استاد</h6>
                    </div>
                    <div className="card-body">
                        <div className="row mb-2">
                            <div className="col-md-4"><span className="fw-bold text-muted">کد استادی:</span> <PersianNumber>{item.ostadCode || '-'}</PersianNumber></div>
                            <div className="col-md-4"><span className="fw-bold text-muted">نام:</span> {item.ostadName || '-'}</div>
                            <div className="col-md-4"><span className="fw-bold text-muted">نام خانوادگی:</span> {item.ostadLastName || '-'}</div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-4"><span className="fw-bold text-muted">مرکز فعلی:</span> {item.ostadMarkaz || '-'}</div>
                            <div className="col-md-4"><span className="fw-bold text-muted">مرتبه علمی:</span> {item.ostadMartabeElmi || '-'}</div>
                            <div className="col-md-4"><span className="fw-bold text-muted">رشته تحصیلی:</span> {item.ostadReshteh || '-'}</div>
                        </div>
                        <hr />
                        <div className="row mb-2">
                            <div className="col-md-4"><span className="fw-bold text-muted">آخرین وضعیت:</span> {item.akharinVazeeat || '-'}</div>
                            <div className="col-md-4"><span className="fw-bold text-muted">سمت اجرایی:</span> {item.isEjeari ? <span>دارد</span> : <span>ندارد</span>}</div>
                            {item.isEjeari && <div className="col-md-4"><span className="fw-bold text-muted">عنوان سمت:</span> {item.onvanEjraei || '-'}</div>}
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-4"><span className="fw-bold text-muted">نوع همکاری:</span> <span>{item.fullTime ? 'تمام وقت' : 'پاره وقت'}</span></div>
                            <div className="col-md-4"><span className="fw-bold text-muted">ساعت موظف هفتگی:</span> {item.fullTime ? <span><PersianNumber>۴۰</PersianNumber> ساعت</span> : <span><PersianNumber>{item.tedadSaatMovazafi || '۰'}</PersianNumber> ساعت</span>}</div>
                        </div>
                        <hr />
                        <div className="row mb-2">
                            <div className="col-md-6"><span className="fw-bold text-muted">
                                واحد موظف: <PersianNumber>{item.vahedMovazaf || 0}</PersianNumber> واحد معادل</span></div>
                            <div className="col-md-6"><span className="fw-bold text-muted">
                                تعداد واحد قابل تکمیل در مرکز محل خدمت: <PersianNumber>{item.tedadVahedMahalKhedmat || 0}</PersianNumber> واحد معادل</span></div>
                        </div>
                        <div className="row mb-2">
                            <div className="col-md-6"><span className="fw-bold text-muted">
                                پیش بینی فعالیت حضوری در مراکز دیگر: <PersianNumber>{item.tedadVahedHamjavar || 0}</PersianNumber> واحد معادل</span></div>
                            <div className="col-md-6"><span className="fw-bold text-muted">
                                پیش بینی مجازی در مراکز دیگر: <PersianNumber>{item.tedadVahedMajazi || 0}</PersianNumber> واحد معادل</span></div>
                        </div>
                        <hr />
                        <div className="row mb-2">
                            <div className="col-12"><span className="fw-bold text-muted" >
                                دلایل تقاضا:</span><div className="mb-1 text-muted small bg-light p-2 rounded"
                                    style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                                    {item.dalil || '-'}</div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12 d-flex align-items-center flex-wrap gap-5">
                                <div>
                                    <span className="fw-bold text-muted">شهر محل سکونت : </span>
                                    <span>{item.shahrZendegi || '-'}</span>
                                </div>


                                {/* ============================================================
                                    🔥 فایل مستندات استاد (فقط در صورت وجود)
                                    ============================================================ */}
                                {item.uploadElmi && (
                                    <>
                                        <div>
                                            <span className="text-muted small d-print-none"> دانلود مستندات استاد </span>
                                            <DownloadButton
                                                filePath={item.uploadElmi}
                                                fileName="مستندات-استاد"
                                            />
                                        </div>

                                        <span className="badge bg-info d-print-inline d-none">
                                            <i className="bi bi-paperclip me-1"></i> مستندات دارد
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* موارد تقاضا */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h6 className="mb-0"><i className="bi bi-list-check me-2"></i> لیست مراکز مورد تقاضای استاد : <span className="badge bg-light text-dark ms-5">{item.hamjavar1s?.length || 0} مورد</span></h6>
                    </div>
                    <div className="card-body p-0">
                        {item.hamjavar1s?.length === 0 ? (
                            <div className="text-center text-muted py-4">هیچ موردی ثبت نشده است</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0">
                                    <colgroup>
                                        <col style={{ width: '4%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '18%' }} />
                                        <col style={{ width: '27%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '11%' }} />
                                        <col style={{ width: '11%' }} />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th rowSpan="2" style={{ verticalAlign: 'middle' }}>#</th>
                                            <th rowSpan="2" style={{ verticalAlign: 'middle' }}>داخل/خارج استان</th>
                                            <th rowSpan="2" style={{ verticalAlign: 'middle' }}>مرکز</th>
                                            <th rowSpan="2" style={{ verticalAlign: 'middle' }}>فعالیت‌های درخواستی</th>
                                            <th rowSpan="2" style={{ verticalAlign: 'middle' }}>تعداد روز<br />درخواستی استاد</th>
                                            <th colSpan={3} className="text-center">تعداد روز مد نظر مسئولین</th>
                                        </tr>
                                        <tr>
                                            <th className="text-center">رئیس مرکز</th>
                                            <th className="text-center">مدیر خدمات آموزشی استان</th>
                                            <th className="text-center">{getMoavenTitle(item.roleMarkazApproved)}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.hamjavar1s?.map((detail, index) => {
                                            const markaz = markazList?.find(m => m.id === detail.markazId);
                                            const faaliatNames = detail.faaliatNames || [];
                                            return (
                                                <tr key={detail.id}>
                                                    <td><PersianNumber>{index + 1}</PersianNumber></td>
                                                    <td><span>{detail.inOstan ? 'داخل استان' : 'خارج استان'}</span></td>
                                                    <td>{getMarkazDisplayName(markaz)}</td>
                                                    <td>{faaliatNames.length > 0 ? faaliatNames.map((n, i) => <span key={i} className="badge bg-secondary me-1">{n}</span>) : <span className="text-muted">-</span>}</td>
                                                    <td className="text-center"><PersianNumber>{detail.tedadRoozElmi || 0}</PersianNumber></td>
                                                    <td className="text-center"><PersianNumber>{detail.tedadRoozRaeis ?? '-'}</PersianNumber></td>
                                                    <td className="text-center"><PersianNumber>{detail.tedadRoozKhadamat ?? '-'}</PersianNumber></td>
                                                    <td className="text-center"><PersianNumber>{detail.tedadRoozMoaven ?? '-'}</PersianNumber></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* نظرات */}
                <div className="row">
                    {/* رئیس */}
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between">
                                <h6 className="mb-0"><i className="bi bi-person-check me-2"></i> نظر رئیس مرکز</h6>
                                {getReviewStatus('raeis') && <span className={`badge ${getReviewStatus('raeis').className}`}>{getReviewStatus('raeis').label}</span>}
                            </div>
                            <div className="card-body">
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <span className="fw-bold text-muted" style={{ whiteSpace: 'nowrap' }}>نظر:</span>
                                    {item.nazarRaeis ? (
                                        <span className="text-muted small bg-light px-2 py-1 rounded">
                                            {item.nazarRaeis === 2 && '✅ تایید'}
                                            {item.nazarRaeis === 3 && '❌ رد'}
                                            {item.nazarRaeis === 4 && '✏️ اصلاح'}
                                            {item.nazarRaeis === 1 && '📝 پیش‌نویس'}
                                            {item.nazarRaeis === 0 && '⏳ در انتظار'}
                                        </span>
                                    ) : (
                                        <span className="text-muted small">نظری ثبت نشده است</span>
                                    )}
                                    {item.tarikhErsalRaeis && (
                                        <span className="text-muted small">تاریخ: {formatDate(item.tarikhErsalRaeis)}</span>
                                    )}
                                </div>
                                {item.tozihatRaeis ? (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{item.tozihatRaeis}</div></div>
                                ) : (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto' }}><span className="text-muted"></span></div></div>
                                )}
                                {/* ============================================================
                                    🔥 فایل مستندات (رئیس/خدمات/معاون)
                                    ============================================================ */}
                                {item.uploadRaeis && (
                                    <>
                                        <div className="d-print-none mt-2">
                                            <span className="text-muted small d-print-none"> دانلود مستندات رییس مرکز </span>
                                            <DownloadButton
                                                filePath={item.uploadRaeis}
                                                fileName="مستندات-رئیس"
                                            />
                                        </div>
                                        <div className="d-none d-print-block">
                                            <span className="badge bg-info">
                                                <i className="bi bi-paperclip me-1"></i> مستندات دارد
                                            </span>
                                        </div>
                                    </>
                                )}
                                {item.signatureRaeis && (
                                    <div className="text-center mt-2">
                                        <SignatureDisplay
                                            signatureData={item.signatureRaeis.data}
                                            textTop={item.raeisFullName || ''}
                                            textBottom={formatRoleMarkaz(item.roleMarkazRaeis)}
                                            position={item.signatureRaeis.position || 'BC'}
                                            width={250} height={180} textFontSize={14} textOpacity={0.9}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* خدمات */}
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between">
                                <h6 className="mb-0"><i className="bi bi-building me-2"></i> نظر خدمات آموزشی استان</h6>
                                {getReviewStatus('khadamat') && <span className={`badge ${getReviewStatus('khadamat').className}`}>{getReviewStatus('khadamat').label}</span>}
                            </div>
                            <div className="card-body">
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <span className="fw-bold text-muted" style={{ whiteSpace: 'nowrap' }}>نظر:</span>
                                    {item.nazarKhadamat ? (
                                        <span className="text-muted small bg-light px-2 py-1 rounded">
                                            {item.nazarKhadamat === 2 && '✅ تایید'}
                                            {item.nazarKhadamat === 3 && '❌ رد'}
                                            {item.nazarKhadamat === 4 && '✏️ اصلاح'}
                                            {item.nazarKhadamat === 1 && '📝 پیش‌نویس'}
                                            {item.nazarKhadamat === 0 && '⏳ در انتظار'}
                                        </span>
                                    ) : (
                                        <span className="text-muted small">نظری ثبت نشده است</span>
                                    )}
                                    {item.tarikhErsalKhadamat && (
                                        <span className="text-muted small">تاریخ: {formatDate(item.tarikhErsalKhadamat)}</span>
                                    )}
                                </div>
                                {item.tozihatKhadamat ? (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{item.tozihatKhadamat}</div></div>
                                ) : (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto' }}><span className="text-muted"></span></div></div>
                                )}
                                {/* ============================================================
                                    🔥 فایل مستندات خدمات
                                    ============================================================ */}
                                {item.uploadKhadamat && (
                                    <>
                                        <div className="d-print-none mt-2">
                                            <span className="text-muted small d-print-none"> دانلود مستندات خدمات آموزشی استان </span>
                                            <DownloadButton
                                                filePath={item.uploadKhadamat}
                                                fileName="مستندات-خدمات-آموزشی"
                                            />
                                        </div>
                                        <div className="d-none d-print-block">
                                            <span className="badge bg-info">
                                                <i className="bi bi-paperclip me-1"></i> مستندات دارد
                                            </span>
                                        </div>
                                    </>
                                )}
                                {item.signatureKhadamat && (
                                    <div className="text-center mt-2">
                                        <SignatureDisplay
                                            signatureData={item.signatureKhadamat.data}
                                            textTop={item.khadamatFullName || ''}
                                            textBottom={formatRoleMarkaz(item.roleMarkazKhadamatOstan)}
                                            position={item.signatureKhadamat.position || 'BC'}
                                            width={250} height={180} textFontSize={14} textOpacity={0.9}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* معاون */}
                    <div className="col-md-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between">
                                <h6 className="mb-0"><i className="bi bi-person-gear me-2"></i> {getMoavenTitle(item.roleMarkazApproved)}</h6>
                                {getReviewStatus('moaven') && <span className={`badge ${getReviewStatus('moaven').className}`}>{getReviewStatus('moaven').label}</span>}
                            </div>
                            <div className="card-body">
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <span className="fw-bold text-muted" style={{ whiteSpace: 'nowrap' }}>نظر:</span>
                                    {item.nazarMoaven ? (
                                        <span className="text-muted small bg-light px-2 py-1 rounded">
                                            {item.nazarMoaven === 2 && '✅ تایید'}
                                            {item.nazarMoaven === 3 && '❌ رد'}
                                            {item.nazarMoaven === 4 && '✏️ اصلاح'}
                                            {item.nazarMoaven === 1 && '📝 پیش‌نویس'}
                                            {item.nazarMoaven === 0 && '⏳ در انتظار'}
                                        </span>
                                    ) : (
                                        <span className="text-muted small">نظری ثبت نشده است</span>
                                    )}
                                    {item.tarikhErsalMoaven && (
                                        <span className="text-muted small">تاریخ: {formatDate(item.tarikhErsalMoaven)}</span>
                                    )}
                                </div>
                                {item.tozihatMoaven ? (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{item.tozihatMoaven}</div></div>
                                ) : (
                                    <div className="mb-2"><span className="fw-bold text-muted">توضیحات:</span> <div className="mb-1 text-muted small bg-light p-2 rounded" style={{ minHeight: '60px', maxHeight: '100px', overflowY: 'auto' }}><span className="text-muted"></span></div></div>
                                )}
                                {/* ============================================================
                                    🔥 فایل مستندات معاون
                                    ============================================================ */}
                                {item.uploadMoaven && (
                                    <>
                                        <div className="d-print-none mt-2">
                                            <span className="text-muted small d-print-none"> دانلود مستندات رییس/معاون استان </span>
                                            <DownloadButton
                                                filePath={item.uploadMoaven}
                                                fileName="مستندات-معاون-آموزشی"
                                            />
                                        </div>
                                        <div className="d-none d-print-block">
                                            <span className="badge bg-info">
                                                <i className="bi bi-paperclip me-1"></i> مستندات دارد
                                            </span>
                                        </div>
                                    </>
                                )}
                                {item.signatureMoaven && (
                                    <div className="text-center mt-2">
                                        <SignatureDisplay
                                            signatureData={item.signatureMoaven.data}
                                            textTop={item.moavenFullName || ''}
                                            textBottom={formatRoleMarkaz(item.roleMarkazApproved)}
                                            position={item.signatureMoaven.position || 'BC'}
                                            width={250} height={180} textFontSize={14} textOpacity={0.9}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                مودال‌ها (چاپ نمی‌شوند)
                ============================================================ */}
            <ReviewModal
                show={showReviewModal}
                onClose={closeReviewModal}
                item={item}
                onSubmit={handleReviewSubmit}
                submitting={submitting}
                role={reviewRoleType}
            />
            <ConfirmModal />
        </div>
    );
}