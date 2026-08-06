import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';
import PersianNumber from '../../components/common/PersianNumber';

export default function OstadDetail() {
    const navigate = useNavigate();
    const location = useLocation();
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

    // دریافت مدارک استاد (جداگانه)
    // ============================================================
    const [madraks, setMadraks] = useState([]);
    const [loadingMadraks, setLoadingMadraks] = useState(false);

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
    // Stateهای مودال افزودن مدرک
    // ============================================================
    const [showAddMadrakModal, setShowAddMadrakModal] = useState(false);
    const [addingMadrak, setAddingMadrak] = useState(false);
    const [addMadrakForm, setAddMadrakForm] = useState({
        reshteh: '',
        grayesh: '',
        maghta: '',
        mahalAkhz: '',
        grooheAmoozeshiId: '',
        pishFarz: true,
        tasvirMadrak: ''
    });
    // ============================================================
    // Stateهای گروه آموزشی
    // ============================================================
    const [grooheList, setGrooheList] = useState([]);
    const [selectedDaneshkade, setSelectedDaneshkade] = useState('');
    const [filteredGroohes, setFilteredGroohes] = useState([]);

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
    // دریافت لیست گروه‌های آموزشی
    // ============================================================
    const fetchGrooheList = async () => {
        try {
            const response = await api.get('/GrooheAmoozeshi/list');
            if (response.data?.success) {
                setGrooheList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت گروه‌های آموزشی:', error);
        }
    };
    useEffect(() => {
        if (id) {
            fetchOstadDetail();
            fetchGrooheList();  // ← اضافه کنید
        }
    }, [id]);
    // ============================================================
    // استخراج دانشکده‌های یکتا
    // ============================================================
    const uniqueDaneshkade = useMemo(() => {
        const map = new Map();
        grooheList.forEach(g => {
            if (g.codeDaneshkade && g.naamDaneshkadeh) {
                map.set(g.codeDaneshkade, g.naamDaneshkadeh);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }));
    }, [grooheList]);

    // ============================================================
    // فیلتر گروه‌های آموزشی بر اساس دانشکده انتخاب‌شده
    // ============================================================
    useEffect(() => {
        if (selectedDaneshkade) {
            const filtered = grooheList.filter(g => g.codeDaneshkade === selectedDaneshkade);
            setFilteredGroohes(filtered);
            // ریست کردن مقدار انتخاب‌شده گروه
            setAddMadrakForm(prev => ({ ...prev, grooheAmoozeshiId: '' }));
        } else {
            setFilteredGroohes([]);
        }
    }, [selectedDaneshkade, grooheList]);
    // ============================================================
    // دریافت اطلاعات استاد
    // ============================================================
    const fetchOstadDetail = async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/Ostad/${id}`);
            if (response.data?.success) {
                setOstad(response.data.data);
            } else {
                setError('استاد یافت نشد');
            }

            try {
                const userResponse = await api.get(`/User/by-type`, {
                    params: { type: 'ostad', id: parseInt(id) }
                });
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
        fetchGrooheList();

    }, [id]);

    // ============================================================
    // دریافت مدارک استاد
    // ============================================================
    const fetchMadraks = useCallback(async () => {
        if (!id) return;

        setLoadingMadraks(true);
        try {
            const response = await api.get(`/OstadMadrak/by-ostad/${id}`);
            if (response.data?.success) {
                setMadraks(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت مدارک:', error);
        } finally {
            setLoadingMadraks(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchMadraks();  // ← دریافت مدارک جداگانه
        }
    }, [fetchMadraks]);
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
                handleBackToList();
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

        //if (!window.confirm(`آیا از ریست رمز عبور کاربر "${userInfo.userName}" مطمئن هستید؟\nرمز جدید: ${ostad?.shomareMelli}aA`)) return;

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
    // باز کردن مودال افزودن مدرک
    // ============================================================
    const openAddMadrakModal = () => {
        setAddMadrakForm({
            reshteh: '',
            grayesh: '',
            maghta: '',
            mahalAkhz: '',
            grooheAmoozeshiId: '',
            pishFarz: true,
            tasvirMadrak: ''
        });
        setShowAddMadrakModal(true);
    };



    // ============================================================
    // 🔥 بازگشت به لیست با حفظ موقعیت
    // ============================================================
    const handleBackToList = () => {
        navigate('/dashboard/ostad', {
            state: {
                fromDetail: true,
                page: location.state?.page || 1,
                pageSize: location.state?.pageSize || 50,
                search: location.state?.search || '',
                ostanId: location.state?.ostanId || '',
                markazId: location.state?.markazId || '',
                noeHamkari: location.state?.noeHamkari || '',
                vazeeat: location.state?.vazeeat || 'true',
                reshteh: location.state?.reshteh || ''
            }
        });
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
                    onClick={handleBackToList}
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

    // ============================================================
    // مقطع به فارسی
    // ============================================================
    const getMaghtaText = (maghta) => {
        const map = {
            5: 'کارشناسی',
            10: 'کارشناسی ارشد',
            15: 'دکتری'
        };
        return map[maghta] || maghta || '-';
    };

    // ============================================================
    // ثبت مدرک جدید
    // ============================================================
    const handleAddMadrakSubmit = async (e) => {
        e.preventDefault();
        setAddingMadrak(true);

        try {
            const payload = {
                ostadId: parseInt(id),
                reshteh: addMadrakForm.reshteh,
                grayesh: addMadrakForm.grayesh || null,
                maghta: addMadrakForm.maghta ? parseInt(addMadrakForm.maghta) : null,
                mahalAkhz: addMadrakForm.mahalAkhz || null,
                grooheAmoozeshiId: addMadrakForm.grooheAmoozeshiId ? parseInt(addMadrakForm.grooheAmoozeshiId) : null,
                pishFarz: addMadrakForm.pishFarz,
                tasvirMadrak: addMadrakForm.tasvirMadrak || null
            };

            const response = await api.post('/OstadMadrak/create', payload);
            if (response.data?.success) {
                toast.success('مدرک با موفقیت افزوده شد');
                setShowAddMadrakModal(false);
                fetchMadraks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در افزودن مدرک');
        } finally {
            setAddingMadrak(false);
        }
    };

    // ============================================================
    // بستن مودال افزودن مدرک
    // ============================================================
    const closeAddMadrakModal = () => {
        setShowAddMadrakModal(false);
        setAddMadrakForm({
            reshteh: '',
            grayesh: '',
            maghta: '',
            mahalAkhz: '',
            grooheAmoozeshiId: '',
            pishFarz: false,
            tasvirMadrak: ''
        });
        setSelectedDaneshkade('');  // ← ریست دانشکده
        setFilteredGroohes([]);      // ← ریست گروه‌ها
    };
    // ============================================================
    // توابع مدیریت تایید/لغو تایید
    // ============================================================
    const handleApprove = async (madrakId) => {
        if (!window.confirm('آیا از تایید این مدرک مطمئن هستید؟')) return;

        try {
            const response = await api.patch(`/OstadMadrak/approve/${madrakId}`);
            if (response.data?.success) {
                toast.success('مدرک با موفقیت تایید شد');
                fetchMadraks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تایید مدرک');
        }
    };

    const handleUnapprove = async (madrakId) => {
        if (!window.confirm('آیا از لغو تایید این مدرک مطمئن هستید؟')) return;

        try {
            const response = await api.patch(`/OstadMadrak/unapprove/${madrakId}`);
            if (response.data?.success) {
                toast.success('تایید مدرک با موفقیت لغو شد');
                fetchMadraks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در لغو تایید مدرک');
        }
    };

    // ============================================================
    // توابع مدیریت مدارک
    // ============================================================
    const handleDeleteMadrak = async (madrakId) => {
        if (!window.confirm('آیا از حذف این مدرک مطمئن هستید؟')) return;

        try {
            const response = await api.delete(`/OstadMadrak/delete/${madrakId}`);
            if (response.data?.success) {
                toast.success('مدرک با موفقیت حذف شد');
                fetchMadraks();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف مدرک');
        }
    };

    const openEditMadrakModal = (madrak) => {
        // فعلاً پیام بده
        toast.info('ویرایش مدرک در حال توسعه است...');
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
                        onClick={handleBackToList}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">مشخصات استاد</h4>
                </div>
                <div className="d-flex gap-2">
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

                                <i className="bi bi-key">  ریست رمز عبور</i>
                            )}
                        </button>
                    </PermissionWrapper>
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
                            onClick={() => navigate(`/dashboard/ostad/${ostad.id}/roles?type=ostad`)}
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
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">اطلاعات شخصی</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">کد استادی:</div>
                                <div className="col-8"><PersianNumber>{ostad.codeOstadi || '-'}</PersianNumber></div>
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
                                <div className="col-8"><PersianNumber>{ostad.tarikhTavalod || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره شناسنامه:</div>
                                <div className="col-8"><PersianNumber>{ostad.shomareShenasname || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره ملی:</div>
                                <div className="col-8"><PersianNumber>{ostad.shomareMelli || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">مرتبه علمی:</div>
                                <div className="col-8">{ostad.martabeElmi || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
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
                                <div className="col-8"><PersianNumber>{ostad.noeBimeh || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">شماره بیمه:</div>
                                <div className="col-8"><PersianNumber>{ostad.shomarehBimeh || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">سازمان مربوطه:</div>
                                <div className="col-8">{ostad.sazmanMarboote || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">محل اشتغال:</div>
                                <div className="col-8">{ostad.mahalEshteghal || '-'}</div>
                            </div>
                            <div className="row mb-2">{/* 
                                <div className="col-4 fw-bold">امضا:</div>
                                <div className="col-8">{ostad.emza || '-'}</div>
                                */}
                            </div>
                        </div>
                    </div>
                </div>
                {/* اطلاعات تماس */}
                <div className="col-md-4">
                    <div className="card mb-6">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">اطلاعات تماس و کاربری</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">ایمیل:</div>
                                <div className="col-8">{ostad.email || '-'}</div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">موبایل شخصی:</div>
                                <div className="col-8"><PersianNumber>{ostad.mobile || '-'}</PersianNumber></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-4 fw-bold">موبایل جهت ارتباط با دانشجو:</div>
                                <div className="col-8"><PersianNumber>{ostad.mobile2 || '-'}</PersianNumber></div>
                            </div>

                            {userInfo ? (
                                <div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold">نام کاربری:</div>
                                        <div className="col-8"><PersianNumber>{userInfo.userName || '-'}</PersianNumber></div>
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
                                            <span className={`badge ${userInfo.vazeeyatMovaghat ? 'bg-success' : 'bg-danger'}`}>
                                                {userInfo.vazeeyatMovaghat ? 'فعال' : 'غیرفعال'}
                                            </span>
                                            <PermissionWrapper permission="Ostad.Update">
                                                <button
                                                    className={`btn btn-sm ${userInfo.vazeeyatMovaghat ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={handleToggleTempStatus}
                                                    disabled={togglingTempStatus}
                                                    title={userInfo.vazeeyatMovaghat ? 'غیرفعال کردن' : 'فعال کردن'}
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
                                        <div className="col-8"><PersianNumber>{userInfo.id}</PersianNumber></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card-body text-center text-muted">
                                    <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                                    <p>کاربری برای این استاد ثبت نشده است</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* ============================================================
                🔥 مدارک تحصیلی
                ============================================================ */}
                <PermissionWrapper permission="Ostad.View">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="bi bi-book me-2"></i>
                                    مدارک تحصیلی
                                </h5>
                                <PermissionWrapper permissions={["Ostad.Update", "Ostad.Create", "OstadMadrak.Create", "OstadMadrak.Update"]} mode='any'>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={openAddMadrakModal}
                                    >
                                        <i className="bi bi-plus-circle me-1"></i>
                                        افزودن مدرک
                                    </button>
                                </PermissionWrapper>
                            </div>
                            <div className="card-body">
                                {madraks.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-striped">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>رشته</th>
                                                    <th>گرایش</th>
                                                    <th>مقطع</th>
                                                    <th>محل اخذ</th>
                                                    <th>گروه آموزشی</th>
                                                    <th>پیش‌فرض</th>
                                                    <th>ایجاد کننده</th>
                                                    <th>تایید کننده</th>
                                                    <th>وضعیت تایید</th>
                                                    <th>عملیات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {madraks.map((madrak, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{madrak.reshteh || '-'}</td>
                                                        <td>{madrak.grayesh || '-'}</td>
                                                        <td>{getMaghtaText(madrak.maghta)}</td>
                                                        <td>{madrak.mahalAkhz || '-'}</td>
                                                        <td>{madrak.grooheAmoozeshiName || '-'}</td>
                                                        <td>
                                                            {madrak.pishFarz ? (
                                                                <span className="badge bg-info">پیش‌فرض</span>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        {/* ============================================================
                            🔥 ستون ایجاد کننده: نام + نقش و مرکز + تاریخ
                            ============================================================ */}
                                                        <td>
                                                            {madrak.createdByUserInfo ? (
                                                                <div>
                                                                    <div className="fw-bold">{madrak.createdByUserInfo}</div>
                                                                    <div className="text-muted small">{madrak.createdByRoleInfo || '-'}</div>
                                                                    <div className="text-muted small">
                                                                        {madrak.createdAt ? new Date(madrak.createdAt).toLocaleDateString('fa-IR') : '-'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <div className="text-muted small">{madrak.createdByRoleInfo || '-'}</div>
                                                                    <div className="text-muted small">
                                                                        {madrak.createdAt ? new Date(madrak.createdAt).toLocaleDateString('fa-IR') : '-'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {/* ============================================================
                            🔥 ستون تایید کننده: نام + نقش و مرکز + تاریخ
                            ============================================================ */}
                                                        <td>
                                                            {madrak.isApproved ? (
                                                                <div>
                                                                    <div className="fw-bold">{madrak.approvedByUserInfo || 'تایید شده'}</div>
                                                                    <div className="text-muted small">{madrak.approvedByRoleInfo || '-'}</div>
                                                                    <div className="text-muted small">
                                                                        {madrak.approvedAt ? new Date(madrak.approvedAt).toLocaleDateString('fa-IR') : '-'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        {/* ============================================================
                            🔥 ستون وضعیت تایید
                            ============================================================ */}
                                                        <td>
                                                            {madrak.isApproved ? (
                                                                <span className="badge bg-success">
                                                                    <i className="bi bi-check-circle me-1"></i>
                                                                    تایید شده
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-warning text-dark">
                                                                    <i className="bi bi-clock me-1"></i>
                                                                    در انتظار تایید
                                                                </span>
                                                            )}
                                                        </td>
                                                        {/* ============================================================
                            🔥 ستون عملیات
                            ============================================================ */}
                                                        <td>
                                                            <div className="d-flex gap-1 flex-wrap">
                                                                <PermissionWrapper permissions={["OstadMadrak.Approve", "OstadMadrak.Unapprove"]} mode='any'>
                                                                    {madrak.isApproved ? (
                                                                        <button
                                                                            className="btn btn-warning btn-sm"
                                                                            onClick={() => handleUnapprove(madrak.id)}
                                                                            title="لغو تایید"
                                                                        >
                                                                            <i className="bi bi-x-circle"></i>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={() => handleApprove(madrak.id)}
                                                                            title="تایید"
                                                                        >
                                                                            <i className="bi bi-check-circle"></i>
                                                                        </button>
                                                                    )}
                                                                </PermissionWrapper>
                                                                <PermissionWrapper permissions={["Ostad.Update", "OstadMadrak.Update"]} mode='any'>
                                                                    <button
                                                                        className="btn btn-warning btn-sm"
                                                                        onClick={() => openEditMadrakModal(madrak)}
                                                                        title="ویرایش"
                                                                    >
                                                                        <i className="bi bi-pencil"></i>
                                                                    </button>
                                                                </PermissionWrapper>

                                                                <PermissionWrapper permissions={["Ostad.Update", "OstadMadrak.Delete"]} mode='any'>
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => handleDeleteMadrak(madrak.id)}
                                                                        title="حذف"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </PermissionWrapper>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-book fs-1 d-block mb-2"></i>
                                        <p>هیچ مدرک تحصیلی برای این استاد ثبت نشده است</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </PermissionWrapper>
            </div >

            {/* ============================================================
                مودال ویرایش
                ============================================================ */}
            {
                showEditModal && ostad && (
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
                )
            }

            {/* ============================================================
                پس‌زمینه مودال
                ============================================================ */}
            {
                showEditModal && (
                    <div
                        className="modal-backdrop show"
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                        onClick={closeEditModal}
                    ></div>
                )
            }
            {/* ============================================================
    مودال افزودن مدرک تحصیلی
    ============================================================ */}
            {showAddMadrakModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleAddMadrakSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">افزودن مدرک تحصیلی جدید</h5>
                                    <button type="button" className="btn-close" onClick={closeAddMadrakModal}></button>
                                </div>
                                <div className="modal-body">
                                    {/* رشته تحصیلی */}
                                    <div className="mb-3">
                                        <label className="form-label">رشته تحصیلی *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addMadrakForm.reshteh}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, reshteh: e.target.value })}
                                            required
                                            placeholder="مثال: مهندسی کامپیوتر"
                                        />
                                    </div>

                                    {/* گرایش */}
                                    <div className="mb-3">
                                        <label className="form-label">گرایش</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addMadrakForm.grayesh}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, grayesh: e.target.value })}
                                            placeholder="مثال: نرم‌افزار"
                                        />
                                    </div>

                                    {/* مقطع */}
                                    <div className="mb-3">
                                        <label className="form-label">مقطع *</label>
                                        <select
                                            className="form-select"
                                            value={addMadrakForm.maghta}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, maghta: e.target.value })}
                                            required
                                        >
                                            <option value="">انتخاب مقطع...</option>
                                            <option value="5">کارشناسی</option>
                                            <option value="10">کارشناسی ارشد</option>
                                            <option value="15">دکتری</option>
                                        </select>
                                    </div>

                                    {/* محل اخذ */}
                                    <div className="mb-3">
                                        <label className="form-label">محل اخذ</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addMadrakForm.mahalAkhz}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, mahalAkhz: e.target.value })}
                                            placeholder="مثال: دانشگاه تهران"
                                        />
                                    </div>

                                    {/* گروه آموزشی - دو کومبو */}
                                    <div className="mb-3">
                                        <label className="form-label">دانشکده</label>
                                        <select
                                            className="form-select"
                                            value={selectedDaneshkade}
                                            onChange={(e) => setSelectedDaneshkade(e.target.value)}
                                        >
                                            <option value="">انتخاب دانشکده...</option>
                                            {uniqueDaneshkade.map(item => (
                                                <option key={item.code} value={item.code}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">گروه آموزشی</label>
                                        <select
                                            className="form-select"
                                            value={addMadrakForm.grooheAmoozeshiId}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, grooheAmoozeshiId: e.target.value })}
                                            disabled={!selectedDaneshkade || filteredGroohes.length === 0}
                                        >
                                            <option value="">انتخاب گروه آموزشی...</option>
                                            {filteredGroohes.map(group => (
                                                <option key={group.id} value={group.id}>
                                                    {group.codeGrooheAmoozeshi} - {group.onvanGrooheAmoozeshi || group.naamDaneshkadeh}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedDaneshkade && filteredGroohes.length === 0 && (
                                            <small className="text-warning">هیچ گروه آموزشی برای این دانشکده یافت نشد</small>
                                        )}
                                    </div>


                                    {/* تصویر مدرک */}
                                    <div className="mb-3">
                                        <label className="form-label">تصویر مدرک (لینک)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={addMadrakForm.tasvirMadrak}
                                            onChange={(e) => setAddMadrakForm({ ...addMadrakForm, tasvirMadrak: e.target.value })}
                                            placeholder="لینک تصویر مدرک (اختیاری)"
                                        />
                                    </div>

                                    {/* پیش‌فرض */}
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={addMadrakForm.pishFarz}
                                                onChange={(e) => setAddMadrakForm({ ...addMadrakForm, pishFarz: e.target.checked })}
                                            />
                                            <label className="form-check-label">
                                                این مدرک به عنوان مدرک پیش‌فرض باشد
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeAddMadrakModal}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={addingMadrak}
                                    >
                                        {addingMadrak ? 'در حال ثبت...' : 'افزودن مدرک'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* پس‌زمینه مودال افزودن مدرک */}
            {showAddMadrakModal && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeAddMadrakModal}
                ></div>
            )}
        </div >
    );
}