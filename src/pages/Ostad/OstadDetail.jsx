import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';

export default function OstadDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = useAuth();
    const { markazList } = useMarkaz();

    const [ostad, setOstad] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resettingPassword, setResettingPassword] = useState(false);

    // ============================================================
    // Stateهای تغییر وضعیت
    // ============================================================
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [togglingTempStatus, setTogglingTempStatus] = useState(false);

    // ============================================================
    // Stateهای مودال ویرایش
    // ============================================================
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        codeOstadi: '',
        naam: '',
        naamKhanevadegi: '',
        markazId: '',
        markazAsliId: '',
        jens: '',
        naamPedar: '',
        tarikhTavalod: '',
        shomareShenasname: '',
        shomareMelli: '',
        email: '',
        mobile: '',
        mobile2: '',
        martabeElmi: '',
        noeHamkari: '',
        noeBimeh: '',
        shomarehBimeh: ''
    });

    // ============================================================
    // بررسی مجوز مشاهده
    // ============================================================
    if (!hasPermission('Ostad.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت اطلاعات استاد
    // ============================================================
    const fetchOstadDetail = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            // 1️⃣ دریافت اطلاعات استاد
            const response = await api.get(`/Ostad/${id}`);
            if (response.data?.success) {
                setOstad(response.data.data);
            } else {
                setError('استاد یافت نشد');
            }

            // 2️⃣ دریافت اطلاعات کاربر مرتبط
            try {
                const userResponse = await api.get(`/User/by-ostad/${id}`);
                if (userResponse.data?.success) {
                    setUserInfo(userResponse.data.data);
                }
            } catch (userError) {
                console.log('کاربری برای این استاد یافت نشد');
            }
        } catch (error) {
            console.error('خطا در دریافت اطلاعات استاد:', error);
            setError('خطا در دریافت اطلاعات استاد');
            toast.error('خطا در دریافت اطلاعات استاد');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOstadDetail();
    }, [id]);

    // ============================================================
    // پیدا کردن نام مرکز
    // ============================================================
    const getMarkazName = (markazId) => {
        if (!markazId) return '-';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || '-';
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = () => {
        if (!ostad) return;
        setEditFormData({
            codeOstadi: ostad.codeOstadi || '',
            naam: ostad.naam || '',
            naamKhanevadegi: ostad.naamKhanevadegi || '',
            markazId: ostad.markazId || '',
            markazAsliId: ostad.markazAsliId || '',
            jens: ostad.jens || '',
            naamPedar: ostad.naamPedar || '',
            tarikhTavalod: ostad.tarikhTavalod || '',
            shomareShenasname: ostad.shomareShenasname || '',
            shomareMelli: ostad.shomareMelli || '',
            email: ostad.email || '',
            mobile: ostad.mobile || '',
            mobile2: ostad.mobile2 || '',
            martabeElmi: ostad.martabeElmi || '',
            noeHamkari: ostad.noeHamkari || '',
            noeBimeh: ostad.noeBimeh || '',
            shomarehBimeh: ostad.shomarehBimeh || ''
        });
        setShowEditModal(true);
    };

    // ============================================================
    // ویرایش استاد
    // ============================================================
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);

        try {
            const response = await api.put(`/Ostad/update/${ostad.id}`, {
                ...editFormData,
                markazId: editFormData.markazId ? parseInt(editFormData.markazId) : null,
                markazAsliId: editFormData.markazAsliId ? parseInt(editFormData.markazAsliId) : null,
                noeHamkari: editFormData.noeHamkari ? parseInt(editFormData.noeHamkari) : null
            });

            if (response.data?.success) {
                toast.success('استاد با موفقیت ویرایش شد');
                setShowEditModal(false);
                fetchOstadDetail();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش استاد');
        } finally {
            setEditLoading(false);
        }
    };

    // ============================================================
    // حذف استاد
    // ============================================================
    const handleDelete = async () => {
        if (!ostad) return;
        if (!window.confirm(`آیا از حذف استاد "${ostad.naam} ${ostad.naamKhanevadegi}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Ostad/delete/${ostad.id}`);
            if (response.data?.success) {
                toast.success('استاد با موفقیت حذف شد');
                navigate('/dashboard/ostad', { state: { fromDetail: true } });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف استاد');
        }
    };

    // ============================================================
    // 🔥 ریست رمز عبور
    // ============================================================
    const handleResetPassword = async () => {
        if (!userInfo) {
            toast.warning('کاربری برای این استاد یافت نشد');
            return;
        }

        if (!window.confirm(`آیا از ریست رمز عبور کاربر "${userInfo.userName}" مطمئن هستید؟\nرمز جدید: ${ostad?.shomareMelli}aA`)) return;

        setResettingPassword(true);
        try {
            const response = await api.post(`/User/reset-password/${userInfo.id}`, {
                newPassword: `${ostad?.shomareMelli}aA`
            });

            if (response.data?.success) {
                toast.success('رمز عبور با موفقیت ریست شد');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ریست رمز عبور');
        } finally {
            setResettingPassword(false);
        }
    };

    // ============================================================
    // 🔥 تغییر وضعیت فعال/غیرفعال
    // ============================================================
    const handleToggleStatus = async () => {
        if (!userInfo) {
            toast.warning('کاربری برای این استاد یافت نشد');
            return;
        }

        const newStatus = !userInfo.vazeeyat;
        const statusText = newStatus ? 'فعال' : 'غیرفعال';

        if (!window.confirm(`آیا از ${newStatus ? 'فعال' : 'غیرفعال'} کردن کاربر "${userInfo.userName}" مطمئن هستید؟`)) return;

        setTogglingStatus(true);
        try {
            const response = await api.patch(`/User/toggle-status/${userInfo.id}`, {
                vazeeyat: newStatus
            });

            if (response.data?.success) {
                toast.success(`وضعیت کاربر با موفقیت به "${statusText}" تغییر کرد`);
                setUserInfo(prev => ({ ...prev, vazeeyat: newStatus }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت کاربر');
        } finally {
            setTogglingStatus(false);
        }
    };

    // ============================================================
    // 🔥 تغییر وضعیت موقت (مسدود/عادی)
    // ============================================================
    const handleToggleTempStatus = async () => {
        if (!userInfo) {
            toast.warning('کاربری برای این استاد یافت نشد');
            return;
        }

        const newStatus = !userInfo.vazeeyatMovaghat;
        const statusText = newStatus ? 'مسدود موقت' : 'عادی';

        if (!window.confirm(`آیا از ${newStatus ? 'مسدود موقت' : 'عادی'} کردن کاربر "${userInfo.userName}" مطمئن هستید؟`)) return;

        setTogglingTempStatus(true);
        try {
            const response = await api.patch(`/User/toggle-status/${userInfo.id}`, {
                vazeeyatMovaghat: newStatus
            });

            if (response.data?.success) {
                toast.success(`وضعیت موقت کاربر با موفقیت به "${statusText}" تغییر کرد`);
                setUserInfo(prev => ({ ...prev, vazeeyatMovaghat: newStatus }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت موقت');
        } finally {
            setTogglingTempStatus(false);
        }
    };

    // ============================================================
    // تغییر فیلدهای مرکز
    // ============================================================
    const handleEditMarkazChange = (fieldName) => (value) => {
        setEditFormData({ ...editFormData, [fieldName]: value });
    };

    // ============================================================
    // بستن مودال
    // ============================================================
    const closeEditModal = () => {
        setShowEditModal(false);
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
    if (error || !ostad) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'استاد یافت نشد'}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard/ostad', { state: { fromDetail: true } })}
                >
                    <i className="bi bi-arrow-right me-1"></i>
                    بازگشت به لیست اساتید
                </button>
            </div>
        );
    }

    // ============================================================
    // نوع همکاری به فارسی
    // ============================================================
    const getNoeHamkariText = (noe) => {
        const map = {
            1: 'هیات علمی پیام نور',
            2: 'هیات علمی غیر پیام نور',
            3: 'مدرس مدعو',
            4: 'هیات علمی پیام نور (سایر استان‌ها)'
        };
        return map[noe] || '-';
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/ostad', { state: { fromDetail: true } })}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">مشخصات استاد</h4>
                </div>
                <div className="d-flex gap-2">
                    <PermissionWrapper permission="Ostad.Update">
                        <button
                            className="btn btn-warning"
                            onClick={openEditModal}
                        >
                            <i className="bi bi-pencil me-1"></i>
                            ویرایش
                        </button>
                    </PermissionWrapper>
                    <PermissionWrapper permission="RoleAssignment.View">
                        <button
                            className="btn btn-info"
                            onClick={() => navigate(`/dashboard/ostad/${ostad.id}/roles`)}
                        >
                            <i className="bi bi-person-badge me-1"></i>
                            نقش‌ها
                        </button>
                    </PermissionWrapper>
                    <PermissionWrapper permission="Ostad.Delete">
                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                        >
                            <i className="bi bi-trash me-1"></i>
                            حذف
                        </button>
                    </PermissionWrapper>
                </div>
            </div>

            {/* ============================================================
                کارت اطلاعات شخصی
                ============================================================ */}
            <div className="row">
                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">اطلاعات شخصی</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">کد استادی:</div>
                                <div className="col-8"><code>{ostad.codeOstadi || '-'}</code></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نام:</div>
                                <div className="col-8">{ostad.naam || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نام خانوادگی:</div>
                                <div className="col-8">{ostad.naamKhanevadegi || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">جنسیت:</div>
                                <div className="col-8">{ostad.jens || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نام پدر:</div>
                                <div className="col-8">{ostad.naamPedar || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">تاریخ تولد:</div>
                                <div className="col-8">{ostad.tarikhTavalod || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره شناسنامه:</div>
                                <div className="col-8">{ostad.shomareShenasname || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره ملی:</div>
                                <div className="col-8"><code>{ostad.shomareMelli || '-'}</code></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرتبه علمی:</div>
                                <div className="col-8">{ostad.martabeElmi || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    {/* اطلاعات شغلی */}
                    <div className="card mb-4">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">اطلاعات شغلی</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرکز خدمتی:</div>
                                <div className="col-8">{getMarkazName(ostad.markazId)}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرکز اصلی:</div>
                                <div className="col-8">{getMarkazName(ostad.markazAsliId)}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نوع همکاری:</div>
                                <div className="col-8">{getNoeHamkariText(ostad.noeHamkari)}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نوع بیمه:</div>
                                <div className="col-8">{ostad.noeBimeh || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره بیمه:</div>
                                <div className="col-8">{ostad.shomarehBimeh || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">سازمان مربوطه:</div>
                                <div className="col-8">{ostad.sazmanMarboote || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">محل اشتغال:</div>
                                <div className="col-8">{ostad.mahalEshteghal || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">امضا:</div>
                                <div className="col-8">{ostad.emza || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* اطلاعات تماس */}
                    <div className="card mb-4">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">اطلاعات تماس</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">ایمیل:</div>
                                <div className="col-8">{ostad.email || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">موبایل ۱:</div>
                                <div className="col-8">{ostad.mobile || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">موبایل ۲:</div>
                                <div className="col-8">{ostad.mobile2 || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================
                        🔥 اطلاعات کاربری (AppUser)
                        ============================================================ */}
                    {userInfo ? (
                        <div className="card mb-4">
                            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">اطلاعات کاربری</h5>
                                <div className="d-flex gap-1">
                                    <PermissionWrapper permission="Ostad.Update">
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={handleResetPassword}
                                            disabled={resettingPassword}
                                            title="ریست رمز عبور"
                                        >
                                            {resettingPassword ? (
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                            ) : (
                                                <i className="bi bi-key"></i>
                                            )}
                                        </button>
                                    </PermissionWrapper>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row mb-2">
                                    <div className="col-4 fw-bold">نام کاربری:</div>
                                    <div className="col-8">{userInfo.userName || '-'}</div>
                                </div>

                                <div className="row mb-2 align-items-center">
                                    <div className="col-4 fw-bold">وضعیت:</div>
                                    <div className="col-8 d-flex align-items-center gap-2">
                                        <span className={`badge ${userInfo.vazeeyat ? 'bg-success' : 'bg-danger'}`}>
                                            {userInfo.vazeeyat ? 'فعال' : 'غیرفعال'}
                                        </span>
                                        <PermissionWrapper permission="Ostad.Update">
                                            <button
                                                className={`btn btn-sm ${userInfo.vazeeyat ? 'btn-danger' : 'btn-success'}`}
                                                onClick={handleToggleStatus}
                                                disabled={togglingStatus}
                                                title={userInfo.vazeeyat ? 'غیرفعال کردن' : 'فعال کردن'}
                                            >
                                                {togglingStatus ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <i className={`bi ${userInfo.vazeeyat ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                                                )}
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </div>

                                <div className="row mb-2 align-items-center">
                                    <div className="col-4 fw-bold">وضعیت موقت:</div>
                                    <div className="col-8 d-flex align-items-center gap-2">
                                        <span className={`badge ${userInfo.vazeeyatMovaghat ? 'bg-warning' : 'bg-secondary'}`}>
                                            {userInfo.vazeeyatMovaghat ? 'مسدود' : 'عادی'}
                                        </span>
                                        <PermissionWrapper permission="Ostad.Update">
                                            <button
                                                className={`btn btn-sm ${userInfo.vazeeyatMovaghat ? 'btn-success' : 'btn-warning'}`}
                                                onClick={handleToggleTempStatus}
                                                disabled={togglingTempStatus}
                                                title={userInfo.vazeeyatMovaghat ? 'رفع مسدودیت' : 'مسدود کردن'}
                                            >
                                                {togglingTempStatus ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <i className={`bi ${userInfo.vazeeyatMovaghat ? 'bi-unlock' : 'bi-lock'}`}></i>
                                                )}
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </div>

                                <div className="row mb-2">
                                    <div className="col-4 fw-bold">شناسه کاربر:</div>
                                    <div className="col-8"><code>{userInfo.id}</code></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card mb-4">
                            <div className="card-header bg-secondary text-white">
                                <h5 className="mb-0">اطلاعات کاربری</h5>
                            </div>
                            <div className="card-body text-center text-muted">
                                <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                                <p>کاربری برای این استاد ثبت نشده است</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                🔥 مدارک تحصیلی (در پایین صفحه)
                ============================================================ */}
            <div className="row mt-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">مدارک تحصیلی</h5>
                        </div>
                        <div className="card-body">
                            {ostad.ostadMadraks && ostad.ostadMadraks.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover table-striped">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>رشته</th>
                                                <th>گرایش</th>
                                                <th>مقطع</th>
                                                <th>محل اخذ</th>
                                                <th>پیش‌فرض</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ostad.ostadMadraks.map((madrak, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{madrak.reshteh || '-'}</td>
                                                    <td>{madrak.grayesh || '-'}</td>
                                                    <td>{madrak.maghta || '-'}</td>
                                                    <td>{madrak.mahalAkhz || '-'}</td>
                                                    <td>
                                                        {madrak.pishFarz && (
                                                            <span className="badge bg-info">پیش‌فرض</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-muted text-center">هیچ مدرکی ثبت نشده است</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                مودال ویرایش
                ============================================================ */}
            {showEditModal && ostad && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        ویرایش استاد: {ostad.naam} {ostad.naamKhanevadegi}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                                </div>
                                <div className="modal-body">
                                    {/* اطلاعات شناسایی */}
                                    <h6 className="text-primary">اطلاعات شناسایی</h6>
                                    <hr />

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">کد استادی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.codeOstadi}
                                                disabled
                                                style={{ backgroundColor: '#e9ecef' }}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">نام *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naam}
                                                onChange={(e) => setEditFormData({ ...editFormData, naam: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">نام خانوادگی *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naamKhanevadegi}
                                                onChange={(e) => setEditFormData({ ...editFormData, naamKhanevadegi: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">شماره ملی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.shomareMelli}
                                                disabled
                                                style={{ backgroundColor: '#e9ecef' }}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">شماره شناسنامه</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.shomareShenasname}
                                                onChange={(e) => setEditFormData({ ...editFormData, shomareShenasname: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">جنسیت</label>
                                            <select
                                                className="form-select"
                                                value={editFormData.jens}
                                                onChange={(e) => setEditFormData({ ...editFormData, jens: e.target.value })}
                                            >
                                                <option value="">انتخاب...</option>
                                                <option value="مرد">مرد</option>
                                                <option value="زن">زن</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">نام پدر</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naamPedar}
                                                onChange={(e) => setEditFormData({ ...editFormData, naamPedar: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">تاریخ تولد</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.tarikhTavalod}
                                                onChange={(e) => setEditFormData({ ...editFormData, tarikhTavalod: e.target.value })}
                                                placeholder="مثال: 1365/01/01"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">مرتبه علمی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.martabeElmi}
                                                onChange={(e) => setEditFormData({ ...editFormData, martabeElmi: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* اطلاعات شغلی */}
                                    <h6 className="text-primary mt-4">اطلاعات شغلی</h6>
                                    <hr />

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <MarkazSelector
                                                label="مرکز خدمتی *"
                                                value={editFormData.markazId}
                                                onChange={handleEditMarkazChange('markazId')}
                                                required={true}
                                                placeholder="انتخاب مرکز خدمتی..."
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <MarkazSelector
                                                label="مرکز اصلی"
                                                value={editFormData.markazAsliId || ''}
                                                onChange={handleEditMarkazChange('markazAsliId')}
                                                required={false}
                                                placeholder="انتخاب مرکز اصلی..."
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">نوع همکاری</label>
                                            <select
                                                className="form-select"
                                                value={editFormData.noeHamkari}
                                                onChange={(e) => setEditFormData({ ...editFormData, noeHamkari: e.target.value })}
                                            >
                                                <option value="">انتخاب...</option>
                                                <option value="1">هیات علمی پیام نور</option>
                                                <option value="2">هیات علمی غیر پیام نور</option>
                                                <option value="3">مدرس مدعو</option>
                                                <option value="4">هیات علمی پیام نور (سایر استان‌ها)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">نوع بیمه</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.noeBimeh}
                                                onChange={(e) => setEditFormData({ ...editFormData, noeBimeh: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">شماره بیمه</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.shomarehBimeh}
                                                onChange={(e) => setEditFormData({ ...editFormData, shomarehBimeh: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* اطلاعات تماس */}
                                    <h6 className="text-primary mt-4">اطلاعات تماس</h6>
                                    <hr />

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">ایمیل</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">موبایل ۱</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">موبایل ۲</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile2}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile2: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeEditModal}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={editLoading}
                                    >
                                        {editLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                پس‌زمینه مودال
                ============================================================ */}
            {showEditModal && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeEditModal}
                ></div>
            )}
        </div>
    );
}