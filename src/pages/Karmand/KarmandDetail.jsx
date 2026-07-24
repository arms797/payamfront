import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';

export default function KarmandDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = useAuth();
    const { markazList } = useMarkaz();

    const [karmand, setKarmand] = useState(null);
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
        naam: '',
        naameKhanevadeghi: '',
        markazId: '',
        markazAsliId: '',
        mobile: '',
        mobile2: '',
        telefonMostaghim: '',
        telefonGhayreMostaghim: '',
        telefonDakheli: '',
        email: '',
        emza: ''
    });

    // ============================================================
    // بررسی مجوز مشاهده
    // ============================================================
    if (!hasPermission('Karmand.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت اطلاعات کارمند
    // ============================================================
    const fetchKarmandDetail = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            // 1️⃣ دریافت اطلاعات کارمند
            const response = await api.get(`/Karmand/${id}`);
            if (response.data?.success) {
                setKarmand(response.data.data);
            } else {
                setError('کارمند یافت نشد');
            }

            // 2️⃣ دریافت اطلاعات کاربر مرتبط
            try {
                const userResponse = await api.get(`/User/by-karmand/${id}`);
                if (userResponse.data?.success) {
                    setUserInfo(userResponse.data.data);
                }
            } catch (userError) {
                console.log('کاربری برای این کارمند یافت نشد');
            }
        } catch (error) {
            console.error('خطا در دریافت اطلاعات کارمند:', error);
            setError('خطا در دریافت اطلاعات کارمند');
            toast.error('خطا در دریافت اطلاعات کارمند');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKarmandDetail();
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
        if (!karmand) return;
        setEditFormData({
            naam: karmand.naam || '',
            naameKhanevadeghi: karmand.naameKhanevadeghi || '',
            markazId: karmand.markazId || '',
            markazAsliId: karmand.markazAsliId || '',
            mobile: karmand.mobile || '',
            mobile2: karmand.mobile2 || '',
            telefonMostaghim: karmand.telefonMostaghim || '',
            telefonGhayreMostaghim: karmand.telefonGhayreMostaghim || '',
            telefonDakheli: karmand.telefonDakheli || '',
            email: karmand.email || '',
            emza: karmand.emza || ''
        });
        setShowEditModal(true);
    };

    // ============================================================
    // ویرایش کارمند
    // ============================================================
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);

        try {
            const response = await api.put(`/Karmand/update/${karmand.id}`, {
                ...editFormData,
                markazId: editFormData.markazId ? parseInt(editFormData.markazId) : null,
                markazAsliId: editFormData.markazAsliId ? parseInt(editFormData.markazAsliId) : null
            });

            if (response.data?.success) {
                toast.success('کارمند با موفقیت ویرایش شد');
                setShowEditModal(false);
                fetchKarmandDetail();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش کارمند');
        } finally {
            setEditLoading(false);
        }
    };

    // ============================================================
    // حذف کارمند
    // ============================================================
    const handleDelete = async () => {
        if (!karmand) return;
        if (!window.confirm(`آیا از حذف کارمند "${karmand.naam} ${karmand.naameKhanevadeghi}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Karmand/delete/${karmand.id}`);
            if (response.data?.success) {
                toast.success('کارمند با موفقیت حذف شد');
                navigate('/dashboard/personel', { state: { fromDetail: true } });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف کارمند');
        }
    };

    // ============================================================
    // 🔥 ریست رمز عبور
    // ============================================================
    const handleResetPassword = async () => {
        if (!userInfo) {
            toast.warning('کاربری برای این کارمند یافت نشد');
            return;
        }

        if (!window.confirm(`آیا از ریست رمز عبور کاربر "${userInfo.userName}" مطمئن هستید؟\nرمز جدید: ${karmand?.codeMelli}aA`)) return;

        setResettingPassword(true);
        try {
            const response = await api.post(`/User/reset-password/${userInfo.id}`, {
                newPassword: `${karmand?.codeMelli}aA`
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
            toast.warning('کاربری برای این کارمند یافت نشد');
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
                // به‌روزرسانی اطلاعات کاربر
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
            toast.warning('کاربری برای این کارمند یافت نشد');
            return;
        }

        const newStatus = !userInfo.vazeeyatMovaghat;
        const statusText = newStatus ? 'مسدود' : 'عادی';

        if (!window.confirm(`آیا از ${newStatus ? 'مسدود' : 'عادی'} کردن کاربر "${userInfo.userName}" مطمئن هستید؟`)) return;

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
    if (error || !karmand) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'کارمند یافت نشد'}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard/personel', { state: { fromDetail: true } })}
                >
                    <i className="bi bi-arrow-right me-1"></i>
                    بازگشت به لیست کارمندان
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
                        onClick={() => navigate('/dashboard/personel', { state: { fromDetail: true } })}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">مشخصات کارمند</h4>
                </div>
                <div className="d-flex gap-2">
                    <PermissionWrapper permission="Karmand.Update">
                        <button
                            className="btn btn-warning"
                            onClick={openEditModal}
                        >
                            <i className="bi bi-pencil me-1"></i>
                            ویرایش
                        </button>
                    </PermissionWrapper>
                    <button
                        className="btn btn-info"
                        onClick={() => navigate(`/dashboard/personel/${karmand.id}/roles`)}
                    >
                        <i className="bi bi-person-badge me-1"></i>
                        مدیریت نقش‌ها
                    </button>
                    <PermissionWrapper permission="Karmand.Delete">
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
                                <div className="col-4 fw-bold">کد ملی:</div>
                                <div className="col-8"><code>{karmand.codeMelli || '-'}</code></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نام:</div>
                                <div className="col-8">{karmand.naam || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">نام خانوادگی:</div>
                                <div className="col-8">{karmand.naameKhanevadeghi || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرکز خدمتی:</div>
                                <div className="col-8">{getMarkazName(karmand.markazId)}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرکز اصلی:</div>
                                <div className="col-8">{getMarkazName(karmand.markazAsliId)}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">امضا:</div>
                                <div className="col-8">{karmand.emza || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">اطلاعات تماس</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">تلفن همراه اصلی:</div>
                                <div className="col-8">{karmand.mobile || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">تلفن همراه جهت عمومی:</div>
                                <div className="col-8">{karmand.mobile2 || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">تلفن مستقیم:</div>
                                <div className="col-8">{karmand.telefonMostaghim || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">تلفن غیر مستقیم:</div>
                                <div className="col-8">{karmand.telefonGhayreMostaghim || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره داخلی:</div>
                                <div className="col-8">{karmand.telefonDakheli || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">ایمیل:</div>
                                <div className="col-8">{karmand.email || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================
    🔥 اطلاعات کاربری (AppUser)
    ============================================================ */}
                    {userInfo ? (
                        <div className="card mb-4">
                            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">اطلاعات کاربری</h5>
                                <div className="d-flex gap-1">
                                    {/* دکمه ریست رمز */}
                                    <PermissionWrapper permission="User.Update">
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={handleResetPassword}
                                            disabled={resettingPassword}
                                            title="ریست رمز عبور "
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
                                        <PermissionWrapper permission="User.Update">
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
                                        <PermissionWrapper permission="User.Update">
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
                                <p>کاربری برای این کارمند ثبت نشده است</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                مودال ویرایش
                ============================================================ */}
            {showEditModal && karmand && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        ویرایش کارمند: {karmand.naam} {karmand.naameKhanevadeghi}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                                </div>
                                <div className="modal-body">
                                    {/* اطلاعات شخصی */}
                                    <h6 className="text-primary">اطلاعات شخصی</h6>
                                    <hr />

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">نام *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naam}
                                                onChange={(e) => setEditFormData({ ...editFormData, naam: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">نام خانوادگی *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naameKhanevadeghi}
                                                onChange={(e) => setEditFormData({ ...editFormData, naameKhanevadeghi: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* اطلاعات شغلی */}
                                    <h6 className="text-primary mt-3">اطلاعات شغلی</h6>
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

                                    {/* اطلاعات تماس */}
                                    <h6 className="text-primary mt-3">اطلاعات تماس</h6>
                                    <hr />

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">شماره موبایل اصلی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">شماره جهت نمایش عمومی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile2}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile2: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">تلفن مستقیم</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.telefonMostaghim}
                                                onChange={(e) => setEditFormData({ ...editFormData, telefonMostaghim: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">تلفن غیر مستقیم</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.telefonGhayreMostaghim}
                                                onChange={(e) => setEditFormData({ ...editFormData, telefonGhayreMostaghim: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">شماره داخلی</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.telefonDakheli}
                                                onChange={(e) => setEditFormData({ ...editFormData, telefonDakheli: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">ایمیل</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* امضا - غیرفعال */}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">امضا</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.emza}
                                                disabled
                                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                                            />
                                            <small className="text-muted">
                                                <i className="bi bi-lock-fill me-1"></i>
                                                این فیلد قابل ویرایش نیست
                                            </small>
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