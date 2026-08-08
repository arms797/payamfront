// src/pages/Schedule/ElmiTerm/ElmiTermList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTerm } from '../../../context/TermContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import { useMarkaz } from '../../../context/MarkazContext';
import PersianNumber from '../../../components/common/PersianNumber'
import { useConfirm } from '../../../hooks/useConfirm';

// import کامپوننت‌های مودال
import CreateModal from './modals/CreateModal';
import EditModal from './modals/EditModal';
import DetailModal from './modals/DetailModal';

// import توابع کمکی
import {
    approveStatusOptions,
    getStatusBadge,
    downloadFile
} from './ElmiTermHelpers';

export default function ElmiTermList() {
    // کانتکست ها
    const { hasPermission, user } = useAuth();
    const { markazList } = useMarkaz();
    const {
        termList,
        currentTerm,
        currentTermCode,
        pastTerms,
        loading: termLoading
    } = useTerm();
    // ============================================================
    // Stateهای اصلی
    // ============================================================
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0
    });
    // ============================================================
    // Stateهای فیلتر
    // ============================================================
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [termCode, setTermCode] = useState('');
    const [approveStatus, setApproveStatus] = useState('');
    const [selectedOstanId, setSelectedOstanId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    // ============================================================
    // Stateهای مودال
    // ============================================================
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // ============================================================
    // Stateهای فرم
    // ============================================================
    const [formData, setFormData] = useState({
        id: '',
        userId: '',
        termCode: '',
        akharinVazeeat: '',
        isEjeari: false,
        onvanEjraei: '',
        fullTime: false,
        tedadSaatMovazafi: '',
        file: null,
        copyFromId: ''
    });
    // ============================================================
    // هوک مودال تایید
    // ============================================================
    const { confirm, ConfirmModal } = useConfirm();

    // ============================================================
    // بررسی آیا کاربر استاد است
    // ============================================================
    const isOstad = useMemo(() => {
        const result = user?.currentRoleName === 'استاد';
        //console.log('🔍 isOstad:', result, 'currentRoleName:', user?.currentRoleName);
        return result;
    }, [user]);

    // ============================================================
    // بررسی آیا کاربر مدیر است (غیر استاد)
    // ============================================================
    const isManager = useMemo(() => {
        return !isOstad;
    }, [isOstad]);

    // ============================================================
    // بررسی آیا تاریخ فعلی در محدوده ترم جاری است
    // ============================================================
    const isWithinCurrentTerm = useMemo(() => {
        if (!currentTerm) return false;

        const today = new Date();
        const startDate = currentTerm.tarikheShorooMojavezMarakez ? new Date(currentTerm.tarikheShorooMojavezMarakez) : null;
        const endDate = currentTerm.tarikhePayanMojavezMarakez ? new Date(currentTerm.tarikhePayanMojavezMarakez) : null;

        if (!startDate || !endDate) return false;

        return today >= startDate && today <= endDate;
    }, [currentTerm]);

    // ============================================================
    // بررسی مجوز برای ایجاد
    // ============================================================
    const canCreate = useMemo(() => {
        if (isOstad) {
            return isWithinCurrentTerm && hasPermission('ElmiTerm.Create');
        }
        return currentTermCode !== null && hasPermission('ElmiTerm.Create');
    }, [isOstad, isWithinCurrentTerm, currentTermCode, hasPermission]);

    // ============================================================
    // بررسی مجوز برای ویرایش
    // ============================================================
    const canEdit = (item) => {
        if (!hasPermission('ElmiTerm.Update')) return false;

        if (isOstad) {
            return item.userId === user?.id &&
                isWithinCurrentTerm &&
                item.approveStatus === 0;
        }

        return currentTermCode !== null;
    };

    // ============================================================
    // بررسی مجوز برای حذف
    // ============================================================
    const canDelete = (item) => {
        if (!hasPermission('ElmiTerm.Delete')) return false;

        if (isOstad) {
            return item.userId === user?.id &&
                isWithinCurrentTerm &&
                item.approveStatus === 0;
        }

        return currentTermCode !== null;
    };

    // ============================================================
    // بررسی مجوز برای تایید/رد
    // ============================================================
    const canApprove = (item) => {
        if (!hasPermission('ElmiTerm.Approve')) return false;
        if (!isManager) return false;
        return currentTermCode !== null;
    };

    // ============================================================
    // استخراج استان‌های یکتا
    // ============================================================
    const uniqueOstans = useMemo(() => {
        return markazList
            ?.filter(m => m.codeOstan)
            .reduce((acc, curr) => {
                if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                    acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                }
                return acc;
            }, []) || [];
    }, [markazList]);

    const filteredMarkaz = useMemo(() => {
        return markazList?.filter(m => m.codeOstan === selectedOstanId) || [];
    }, [markazList, selectedOstanId]);

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('ElmiTerm.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت لیست
    // ============================================================
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                termCode: termCode || undefined,
                search: debouncedSearch || undefined,
                approveStatus: approveStatus || undefined,
                ostanId: selectedOstanId || undefined,
                markazId: selectedMarkazId || undefined
            };

            const response = await api.get('/ElmiTerm/list', { params });
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست درخواست‌ها');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.pageSize, termCode, debouncedSearch, approveStatus, selectedOstanId, selectedMarkazId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // ============================================================
    // تنظیم ترم پیش‌فرض به ترم جاری
    // ============================================================
    useEffect(() => {
        if (currentTermCode && !termCode) {
            setTermCode(currentTermCode);
        }
    }, [currentTermCode]);

    useEffect(() => {
        if (termCode) {
            fetchItems();
        }
    }, [fetchItems, termCode]);

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    // ============================================================
    // باز کردن مودال ایجاد
    // ============================================================
    const openCreateModal = () => {
        const defaultUserId = isOstad ? user?.id : '';
        setFormData({
            id: '',
            userId: defaultUserId || '',
            termCode: currentTermCode || '',
            akharinVazeeat: '',
            isEjeari: false,
            onvanEjraei: '',
            fullTime: false,
            tedadSaatMovazafi: '',
            file: null,
            copyFromId: ''
        });
        setShowCreateModal(true);
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = async (item) => {
        if (!canEdit(item)) {
            toast.warning('امکان ویرایش این درخواست وجود ندارد');
            return;
        }

        // ✅ اگر قبلاً بررسی شده و مدیر است، هشدار بده
        if (item.approveStatus !== 0 && isManager) {
            const confirmed = await confirm({
                title: "هشدار",
                message: `این درخواست قبلاً ${statusText} شده است. آیا از ویرایش آن مطمئن هستید؟`,
                confirmText: 'بله',
                confirmVariant: 'warning'
            });
            //const statusText = item.approveStatus === 1 ? 'تایید' : 'رد';
            if (!confirmed) {
                return;
            }
        }

        openEditModalDirect(item);
    };

    // ============================================================
    // باز کردن مستقیم مودال ویرایش
    // ============================================================
    const openEditModalDirect = (item) => {
        setSelectedItem(item);
        setFormData({
            id: item.id,
            userId: item.userId || '',
            termCode: item.termCode || '',
            akharinVazeeat: item.akharinVazeeat || '',
            isEjeari: item.isEjeari || false,
            onvanEjraei: item.onvanEjraei || '',
            fullTime: item.fullTime || false,
            tedadSaatMovazafi: item.tedadSaatMovazafi || '',
            file: null,
            copyFromId: ''
        });
        setShowEditModal(true);
    };

    // ============================================================
    // باز کردن مودال جزئیات
    // ============================================================
    const openDetailModal = async (id) => {
        try {
            const response = await api.get(`/ElmiTerm/${id}`);
            if (response.data?.success) {
                setSelectedItem(response.data.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            toast.error('خطا در دریافت اطلاعات درخواست');
        }
    };

    // ============================================================
    // تایید/رد درخواست
    // ============================================================
    const handleApprove = async (item, status) => {
        if (!canApprove(item)) {
            toast.warning('امکان تایید/رد این درخواست وجود ندارد');
            return;
        }

        // ✅ اگر قبلاً بررسی شده، هشدار بده
        if (item.approveStatus !== 0) {
            const currentStatus = item.approveStatus === 1 ? 'تایید' : 'رد';
            const newStatus = status === 1 ? 'تایید' : 'رد';
            const confirmed = await confirm({
                title: "هشدار",
                message: `این درخواست قبلاً ${currentStatus} شده است. آیا از تغییر آن به ${newStatus} مطمئن هستید؟`,
                confirmText: 'بله',
                confirmVariant: 'warning'
            });

            if (!confirmed) {
                return;
            }
        }

        const actionText = status === 1 ? 'تایید' : 'رد';
        const confirmed = await confirm({
            title: "هشدار",
            message: `آیا از ${actionText} این درخواست مطمئن هستید؟`,
            confirmText: 'بله',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;

        executeApprove(item.id, status);
    };

    // ============================================================
    // اجرای تایید/رد
    // ============================================================
    const executeApprove = async (id, status) => {
        try {
            const response = await api.patch('/ElmiTerm/approve', {
                id,
                approveStatus: status
            });
            if (response.data?.success) {
                toast.success(response.data.message);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تایید/رد درخواست');
        }
    };

    // ============================================================
    // حذف درخواست
    // ============================================================
    const handleDelete = async (item) => {
        if (!canDelete(item)) {
            toast.warning('امکان حذف این درخواست وجود ندارد');
            return;
        }

        // ✅ اگر قبلاً بررسی شده و مدیر است، هشدار بده
        if (item.approveStatus !== 0 && isManager) {
            const statusText = item.approveStatus === 1 ? 'تایید' : 'رد';
            const confirmed = await confirm({
                title: "هشدار",
                message: `این درخواست قبلاً ${statusText} شده است. آیا از حذف آن مطمئن هستید؟`,
                confirmText: 'بله',
                confirmVariant: 'warning'
            });
            if (!confirmed) {
                return;
            }
        }
        const confirmed = await confirm({
            title: "هشدار",
            message: 'آیا از حذف این درخواست مطمئن هستید؟',
            confirmText: 'بله',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;

        executeDelete(item);
    };

    // ============================================================
    // اجرای حذف
    // ============================================================
    const executeDelete = async (item) => {
        try {
            const response = await api.delete(`/ElmiTerm/delete/${item.id}`);
            if (response.data?.success) {
                toast.success('درخواست با موفقیت حذف شد');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف درخواست');
        }
    };

    // ============================================================
    // دریافت وضعیت نمایشی
    // ============================================================
    const getStatusBadge = (status) => {
        switch (status) {
            case 0:
                return <span className="badge bg-warning text-dark">در انتظار بررسی</span>;
            case 1:
                return <span className="badge bg-success">تایید شده ✅</span>;
            case 2:
                return <span className="badge bg-danger">رد شده ❌</span>;
            default:
                return <span className="badge bg-secondary">نامشخص</span>;
        }
    };

    const downloadFile = async (id, fileName) => {
        if (!id) {
            toast.error('شناسه فایل وجود ندارد');
            return;
        }

        try {
            const response = await api.get(`/ElmiTerm/download/${id}`, {
                responseType: 'blob'
            });

            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'خطا در دانلود فایل');
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'فایل';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('دانلود فایل با موفقیت انجام شد');
        } catch (error) {
            console.error('❌ خطا در دانلود فایل:', error);
            toast.error(error.message || 'خطا در دانلود فایل');
        }
    };

    // ============================================================
    // ریست فیلترها
    // ============================================================
    const resetFilters = () => {
        setSearch('');
        setTermCode(currentTermCode || '');
        setApproveStatus('');
        setSelectedOstanId('');
        setSelectedMarkazId('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // ============================================================
    // ثبت درخواست جدید
    // ============================================================
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 🔥 تعیین userId نهایی
            const targetUserId = isOstad ? (user?.id || user?.username) : formData.userId;

            // 🔥 فقط یک بار چک کن
            if (!targetUserId) {
                toast.warning('انتخاب استاد الزامی است');
                setSubmitting(false);
                return;
            }

            if (!formData.termCode.trim()) {
                toast.warning('کد ترم الزامی است');
                setSubmitting(false);
                return;
            }

            // بررسی تکراری نبودن
            const existing = items.find(item =>
                item.userId === parseInt(targetUserId) &&  // ← از targetUserId استفاده کن
                item.termCode === formData.termCode
            );
            if (existing) {
                toast.warning('این استاد قبلاً برای این ترم درخواست ثبت کرده است');
                setSubmitting(false);
                return;
            }

            if (isOstad && parseInt(targetUserId) !== user?.id) {
                toast.warning('شما فقط می‌توانید درخواست خود را ثبت کنید');
                setSubmitting(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('userId', targetUserId);  // ← از targetUserId استفاده کن
            formDataToSend.append('termCode', formData.termCode);
            formDataToSend.append('akharinVazeeat', formData.akharinVazeeat || '');
            formDataToSend.append('isEjeari', formData.isEjeari);
            formDataToSend.append('onvanEjraei', formData.onvanEjraei || '');
            formDataToSend.append('fullTime', formData.fullTime);
            formDataToSend.append('tedadSaatMovazafi', formData.tedadSaatMovazafi || '');

            if (formData.file) {
                formDataToSend.append('file', formData.file);
            }

            if (formData.copyFromId) {
                formDataToSend.append('copyFromId', formData.copyFromId);
            }

            const response = await api.post('/ElmiTerm/create', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                toast.success(response.data.message);
                setShowCreateModal(false);
                setFormData({
                    id: '',
                    userId: '',
                    termCode: currentTermCode || '',
                    akharinVazeeat: '',
                    isEjeari: false,
                    onvanEjraei: '',
                    fullTime: false,
                    tedadSaatMovazafi: '',
                    file: null,
                    copyFromId: ''
                });
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ثبت درخواست');
        } finally {
            setSubmitting(false);
        }
    };
    // ============================================================
    // ویرایش درخواست
    // ============================================================
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!formData.termCode.trim()) {
                toast.warning('کد ترم الزامی است');
                setSubmitting(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('id', formData.id);
            formDataToSend.append('termCode', formData.termCode);
            formDataToSend.append('akharinVazeeat', formData.akharinVazeeat || '');
            formDataToSend.append('isEjeari', formData.isEjeari);
            formDataToSend.append('onvanEjraei', formData.onvanEjraei || '');
            formDataToSend.append('fullTime', formData.fullTime);
            formDataToSend.append('tedadSaatMovazafi', formData.tedadSaatMovazafi || '');

            if (formData.file) {
                formDataToSend.append('file', formData.file);
            }

            const response = await api.put('/ElmiTerm/update', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                toast.success(response.data.message);
                setShowEditModal(false);
                setSelectedItem(null);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPending = async (id) => {
        console.log('test 1')
        const confirmed = await confirm({
            title: "هشدار",
            message: 'آیا از بازگشت این درخواست به حالت "در انتظار بررسی" مطمئن هستید؟',
            confirmText: 'بله',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;

        try {
            const response = await api.patch(`/ElmiTerm/reset-pending/${id}`);
            if (response.data?.success) {
                toast.success(response.data.message);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در بازگشت به حالت در انتظار');
        }
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4>مدیریت درخواست‌های وضعیت ترمی اساتید</h4>
                    {currentTerm && (
                        <span className="badge bg-primary mt-1">
                            ترم جاری: <PersianNumber>{currentTerm.onvanTerm} {currentTerm.codeTerm}</PersianNumber>
                        </span>
                    )}
                    {isOstad && !isWithinCurrentTerm && (
                        <span className="badge bg-danger mt-1 ms-2">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            خارج از محدوده ثبت درخواست
                        </span>
                    )}
                    {/*isManager && (
                        <span className="badge bg-info mt-1 ms-2">
                            <i className="bi bi-shield-check me-1"></i>
                            حالت مدیریتی
                        </span>
                    )*/}
                </div>
                <PermissionWrapper permission="ElmiTerm.Create">
                    <button
                        className="btn btn-primary"
                        onClick={openCreateModal}
                        disabled={!canCreate}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        درخواست جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        {/* فیلتر جستجو - فقط برای مدیران */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="نام، کد استادی..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        )}

                        {/* کد ترم */}
                        <div className={`${isOstad ? 'col-md-3' : 'col-md-2'}`}>
                            <label className="form-label">کد ترم *</label>
                            <select
                                className="form-select form-select-sm"
                                value={termCode}
                                onChange={(e) => setTermCode(e.target.value)}
                            >
                                {termList.map(term => (
                                    <option key={term.codeTerm} value={term.codeTerm}>
                                        <PersianNumber>{term.onvanTerm} {term.codeTerm}</PersianNumber>
                                        {term.vazeeyat && ' ✅'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* وضعیت تایید */}
                        <div className={`${isOstad ? 'col-md-3' : 'col-md-2'}`}>
                            <label className="form-label">وضعیت تایید</label>
                            <select
                                className="form-select form-select-sm"
                                value={approveStatus}
                                onChange={(e) => setApproveStatus(e.target.value)}
                            >
                                {approveStatusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* فیلتر استان - فقط برای مدیران */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">استان</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedOstanId}
                                    onChange={(e) => {
                                        setSelectedOstanId(e.target.value);
                                        setSelectedMarkazId('');
                                    }}
                                >
                                    <option value="">همه استان‌ها</option>
                                    {uniqueOstans.map(ostan => (
                                        <option key={ostan.codeOstan} value={ostan.codeOstan}>
                                            {ostan.naamOstan}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* فیلتر مرکز - فقط برای مدیران */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">مرکز</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedMarkazId}
                                    onChange={(e) => setSelectedMarkazId(e.target.value)}
                                    disabled={!selectedOstanId}
                                >
                                    <option value="">همه مراکز</option>
                                    {filteredMarkaz.map(m => (
                                        <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* دکمه ریست - فقط برای مدیران */}
                        {!isOstad && (
                            <div className="col-md-2 d-flex gap-2">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={resetFilters}
                                >
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                            </div>
                        )}

                        {/* برای استاد: پیام راهنما */}
                        {isOstad && (
                            <div className="col-md-3">
                                <div className="alert alert-info mb-0 py-1 px-2 small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    شما فقط درخواست‌های خود را مشاهده می‌کنید
                                </div>
                            </div>
                        )}
                    </div>

                    {!termCode && (
                        <div className="mt-2 text-warning small">
                            <i className="bi bi-info-circle me-1"></i>
                            برای مشاهده لیست، کد ترم را وارد کنید
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                جدول لیست
                ============================================================ */}
            {loading || termLoading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted">
                            تعداد کل: {pagination.totalCount} درخواست
                        </span>
                        <div className="d-flex align-items-center gap-2">
                            <label className="text-muted small">تعداد در صفحه:</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: 'auto' }}
                                value={pagination.pageSize}
                                onChange={handlePageSizeChange}
                            >
                                <option value="10">۱۰</option>
                                <option value="20">۲۰</option>
                                <option value="50">۵۰</option>
                                <option value="100">۱۰۰</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>استاد</th>
                                    <th>کد استادی</th>
                                    <th>مرکز</th>
                                    <th>وضعیت</th>
                                    <th>سمت اجرایی</th>
                                    <th>ساعت موظف هفتگی</th>
                                    <th>تایید</th>
                                    <th>فایل</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center text-muted py-4">
                                            {termCode ? 'هیچ درخواستی یافت نشد' : 'لطفاً کد ترم را وارد کنید'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => {
                                        const isEditable = canEdit(item);
                                        const isDeletable = canDelete(item);
                                        const isApprovable = canApprove(item);
                                        const showWarning = item.approveStatus !== 0 && isManager;

                                        return (
                                            <tr key={item.id}>
                                                <td><PersianNumber>
                                                    {(pagination.page - 1) * pagination.pageSize + index + 1}
                                                </PersianNumber></td>
                                                <td>
                                                    <strong>{item.ostadName}</strong>
                                                </td>
                                                <td><PersianNumber>{item.ostadCode}</PersianNumber></td>
                                                <td>{item.ostadMarkaz || '-'}</td>
                                                <td>{item.akharinVazeeat || '-'}</td>
                                                <td>
                                                    {item.isEjeari ? (
                                                        <span className="badge bg-info">{item.onvanEjraei || 'دارد'}</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">ندارد</span>
                                                    )}
                                                </td>
                                                <td><PersianNumber>{item.tedadSaatMovazafi || '-'}</PersianNumber></td>
                                                <td>{getStatusBadge(item.approveStatus)}</td>
                                                <td>
                                                    {item.hasFile ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => downloadFile(item.id, item.fileName)}
                                                            title="دانلود فایل"
                                                        >
                                                            <i className="bi bi-download"></i>
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        {/* دکمه مشاهده جزئیات */}
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => openDetailModal(item.id)}
                                                            title="مشاهده جزئیات"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>

                                                        {/* ============================================================
                                                            دکمه‌های عملیات - فقط برای ترم جاری
                                                            ============================================================ */}
                                                        {item.termCode === currentTermCode && (
                                                            <div className="d-flex flex-wrap gap-1 align-items-center">

                                                                {/* حالت 1: در انتظار بررسی (0) */}
                                                                {item.approveStatus === 0 ? (
                                                                    <>
                                                                        {/* دکمه‌های تایید و رد */}
                                                                        {isApprovable && (
                                                                            <PermissionWrapper permission="ElmiTerm.Approve">
                                                                                <div className="d-flex gap-1">
                                                                                    <button
                                                                                        className="btn btn-success"
                                                                                        onClick={() => handleApprove(item, 1)}
                                                                                        title="تایید"
                                                                                    >
                                                                                        <i className="bi bi-check-lg"></i>
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-danger"
                                                                                        onClick={() => handleApprove(item, 2)}
                                                                                        title="رد"
                                                                                    >
                                                                                        <i className="bi bi-x-lg"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </PermissionWrapper>
                                                                        )}

                                                                        {/* دکمه ویرایش */}
                                                                        {isEditable && (
                                                                            <PermissionWrapper permission="ElmiTerm.Update">
                                                                                <button
                                                                                    className="btn btn-warning"
                                                                                    onClick={() => openEditModal(item)}
                                                                                    title="ویرایش"
                                                                                >
                                                                                    <i className="bi bi-pencil"></i>
                                                                                </button>
                                                                            </PermissionWrapper>
                                                                        )}

                                                                        {/* دکمه حذف */}
                                                                        {isDeletable && (
                                                                            <PermissionWrapper permission="ElmiTerm.Delete">
                                                                                <button
                                                                                    className="btn btn-danger"
                                                                                    onClick={() => handleDelete(item)}
                                                                                    title="حذف"
                                                                                >
                                                                                    <i className="bi bi-trash"></i>
                                                                                </button>
                                                                            </PermissionWrapper>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    /* حالت 2: تایید/رد شده (1 یا 2) - دکمه ریست */
                                                                    <button
                                                                        className="btn btn-warning"
                                                                        onClick={() => handleResetPending(item.id)}
                                                                        title="بازگشت به حالت در انتظار بررسی"
                                                                    >
                                                                        <i className="bi bi-arrow-counterclockwise"></i>
                                                                        <span className="ms-1" style={{ fontSize: '10px' }}>ریست تایید</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* اگر ترم جاری نیست */}
                                                        {item.termCode !== currentTermCode && (
                                                            <span className="text-muted small ms-2">
                                                                <i className="bi bi-clock-history me-1"></i>
                                                                ترم گذشته
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* صفحه‌بندی */}
                    {pagination.totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>
                                        قبلی
                                    </button>
                                </li>
                                {[...Array(Math.min(pagination.totalPages, 10)).keys()].map(num => {
                                    const pageNum = num + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                {pagination.totalPages > 10 && (
                                    <li className="page-item disabled">
                                        <span className="page-link">...</span>
                                    </li>
                                )}
                                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>
                                        بعدی
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* ============================================================
                مودال‌ها
                ============================================================ */}
            <CreateModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateSubmit}
                formData={formData}
                setFormData={setFormData}
                termList={termList}
                pastTerms={pastTerms}
                isOstad={isOstad}
                canCreate={canCreate}
                submitting={submitting}
            />

            <EditModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleEditSubmit}
                formData={formData}
                setFormData={setFormData}
                selectedItem={selectedItem}
                isManager={isManager}
                submitting={submitting}
            />

            <DetailModal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                selectedItem={selectedItem}
                termList={termList}
            />

            {/* ============================================================
                پس‌زمینه مودال‌ها
                ============================================================ */}
            {(showCreateModal || showEditModal || showDetailModal) && (
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
                    onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setShowDetailModal(false);
                    }}
                ></div>
            )}
            <ConfirmModal />
        </div>
    );
}