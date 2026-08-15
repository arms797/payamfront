// src/pages/Signature/SignatureManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import SignaturePad from '../../components/common/SignaturePad';
import { PermissionWrapper } from '../../components/PermissionWrapper';

export default function SignatureManagement() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(''); // ← State جدید برای جستجوی دبونس شده
    const [selectedUser, setSelectedUser] = useState(null);
    const [signatureInfo, setSignatureInfo] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0
    });

    // ref برای ذخیره تایمر دبونس
    const searchTimerRef = useRef(null);

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('Signature.ManageSignatureForReset')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مدیریت امضاها را ندارید
            </div>
        );
    }

    // ============================================================
    // 🔥 دبونس برای جستجو (۷۰۰ میلی‌ثانیه)
    // ============================================================
    useEffect(() => {
        // تایمر قبلی را پاک کن
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        // تایمر جدید تنظیم کن
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 700);

        // cleanup
        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [search]);

    // ============================================================
    // دریافت لیست کاربران دارای امضا (با استفاده از debouncedSearch)
    // ============================================================
    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get('/Signature/users', {
                params: {
                    page: page,
                    pageSize: pagination.pageSize,
                    search: debouncedSearch || undefined
                }
            });
            if (response.data?.success) {
                setUsers(response.data.data || []);
                setPagination({
                    page: response.data.pagination?.page || 1,
                    pageSize: response.data.pagination?.pageSize || 20,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                });
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست کاربران');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, pagination.pageSize]);

    // ============================================================
    // هر بار که debouncedSearch تغییر کرد، صفحه اول را fetch کن
    // ============================================================
    useEffect(() => {
        // اگر صفحه فعلی 1 نیست، به صفحه 1 برو
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            fetchUsers(1);
        }
    }, [debouncedSearch]);

    // ============================================================
    // دریافت اولیه و تغییر صفحه
    // ============================================================
    useEffect(() => {
        fetchUsers(pagination.page);
    }, [pagination.page]);

    // ============================================================
    // دریافت امضای کاربر انتخاب‌شده (فقط برای نمایش)
    // ============================================================
    const fetchUserSignature = async (userId) => {
        try {
            const response = await api.get(`/Signature/user/${userId}`);
            if (response.data?.success) {
                setSignatureInfo(response.data.data);
            } else {
                setSignatureInfo(null);
            }
        } catch (error) {
            console.error('خطا در دریافت امضا:', error);
            setSignatureInfo(null);
        }
    };

    // ============================================================
    // مشاهده جزئیات امضا
    // ============================================================
    const handleViewSignature = async (user) => {
        setSelectedUser(user);
        await fetchUserSignature(user.id);
        setShowDetailModal(true);
    };

    // ============================================================
    // باز کردن قفل امضا/موقعیت
    // ============================================================
    const handleUnlock = async (userId, unlockType) => {
        const typeText = {
            position: 'موقعیت',
            signature: 'امضا',
            both: 'موقعیت و امضا'
        }[unlockType] || 'امضا';

        if (!window.confirm(`آیا از باز کردن قفل ${typeText} برای این کاربر مطمئن هستید؟`)) return;

        setUnlocking(true);
        try {
            const response = await api.patch('/Signature/unlock', {
                userId,
                unlockType
            });
            if (response.data?.success) {
                toast.success(response.data.message);
                if (selectedUser?.id === userId) {
                    await fetchUserSignature(userId);
                }
                fetchUsers(pagination.page);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در باز کردن قفل');
        } finally {
            setUnlocking(false);
        }
    };

    // ============================================================
    // حذف امضا
    // ============================================================
    const handleDeleteSignature = async (userId, userName) => {
        if (!window.confirm(`آیا از حذف امضای کاربر "${userName}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Signature/delete/${userId}`);
            if (response.data?.success) {
                toast.success('امضا با موفقیت حذف شد');
                if (selectedUser?.id === userId) {
                    setShowDetailModal(false);
                }
                fetchUsers(pagination.page);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف امضا');
        }
    };

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // ============================================================
    // رندر لیست کاربران
    // ============================================================
    const renderUserList = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            );
        }

        if (users.length === 0) {
            return (
                <div className="text-center text-muted py-5">
                    <i className="bi bi-people fs-1 d-block mb-2"></i>
                    <p>هیچ کاربری امضا ثبت نکرده است</p>
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table table-hover table-striped">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>نام کاربری</th>
                            <th>نام و نام خانوادگی</th>
                            <th>مرکز</th>
                            <th>وضعیت</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user.id}>
                                <td>{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                <td>{user.userName}</td>
                                <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</td>
                                <td>{user.markazName || '-'}</td>
                                <td>
                                    <span className="badge bg-success">ثبت شده</span>
                                </td>
                                <td>
                                    <div className="d-flex flex-wrap gap-2">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleViewSignature(user)}
                                            title="مشاهده امضا"
                                        >
                                            <i className="bi bi-eye me-1"></i> مشاهده
                                        </button>
                                        <PermissionWrapper permission='Signature.UnlockSignature'>
                                            <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => handleUnlock(user.id, 'signature')}
                                                title="باز کردن قفل امضا"
                                                disabled={unlocking}
                                            >
                                                <i className="bi bi-unlock me-1"></i> قفل امضا
                                            </button>
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => handleUnlock(user.id, 'position')}
                                                title="باز کردن قفل موقعیت"
                                                disabled={unlocking}
                                            >
                                                <i className="bi bi-arrows-move me-1"></i> قفل موقعیت
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleUnlock(user.id, 'both')}
                                                title="باز کردن هر دو قفل"
                                                disabled={unlocking}
                                            >
                                                <i className="bi bi-unlock-fill me-1"></i> هر دو قفل
                                            </button>
                                        </PermissionWrapper>
                                        <PermissionWrapper permission='Signature.Delete'>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteSignature(user.id, user.userName)}
                                                title="حذف امضا"
                                            >
                                                <i className="bi bi-trash me-1"></i> حذف
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >
        );
    };

    // ============================================================
    // صفحه‌بندی
    // ============================================================
    const renderPagination = () => {
        const { page, totalPages } = pagination;
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return (
            <nav className="mt-3">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page - 1)}>قبلی</button>
                    </li>
                    {pages.map(num => (
                        <li key={num} className={`page-item ${page === num ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(num)}>{num}</button>
                        </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page + 1)}>بعدی</button>
                    </li>
                </ul>
            </nav>
        );
    };

    // ============================================================
    // مودال مشاهده امضا
    // ============================================================
    const renderDetailModal = () => {
        if (!showDetailModal || !selectedUser) return null;

        return (
            <>
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
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        className="modal-dialog modal-lg"
                        style={{
                            margin: 0,
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '90vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content" style={{ maxHeight: '90vh', overflow: 'auto' }}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    امضای {selectedUser.firstName || ''} {selectedUser.lastName || ''}
                                    <span className="text-muted ms-2" style={{ fontSize: '14px' }}>
                                        ({selectedUser.userName})
                                    </span>
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDetailModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* اطلاعات کاربر */}
                                <div className="alert alert-info">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <strong>نام کاربری:</strong> {selectedUser.userName}
                                        </div>
                                        <div className="col-md-6">
                                            <strong>مرکز:</strong> {selectedUser.markazName || '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* وضعیت قفل‌ها */}
                                {signatureInfo && (
                                    <div className="mb-3">
                                        <div className="d-flex gap-3 flex-wrap">
                                            <span className={`badge ${signatureInfo.canEditSignature ? 'bg-success' : 'bg-danger'}`}>
                                                ویرایش امضا: {signatureInfo.canEditSignature ? '✅ فعال' : '❌ غیرفعال'}
                                            </span>
                                            <span className={`badge ${signatureInfo.canEditPosition ? 'bg-success' : 'bg-danger'}`}>
                                                ویرایش موقعیت: {signatureInfo.canEditPosition ? '✅ فعال' : '❌ غیرفعال'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* نمایش امضا */}
                                {signatureInfo?.hasSignature ? (
                                    <div className="text-center border rounded p-3 bg-light">
                                        <img
                                            src={signatureInfo.signature}
                                            alt="امضا"
                                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                                        />
                                        <div className="mt-2">
                                            <small className="text-muted">
                                                موقعیت: {signatureInfo?.position || 'BC'}
                                            </small>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-file-earmark-x fs-1 d-block mb-2"></i>
                                        <p>امضایی برای این کاربر ثبت نشده است</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* پس‌زمینه مودال */}
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
                    onClick={() => setShowDetailModal(false)}
                ></div>
            </>
        );
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>
                    <i className="bi bi-person-gear me-2"></i>
                    مدیریت امضای کاربران
                </h4>
                <span className="badge bg-warning text-dark">
                    <i className="bi bi-unlock me-1"></i>
                    مجوز: Signature.UnlockSignature
                </span>
            </div>

            {/* ============================================================
                جستجو
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="جستجوی کاربر..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            // در صورت فشار Enter، بلافاصله جستجو کن
                                            setDebouncedSearch(search);
                                        }
                                    }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setDebouncedSearch(search);
                                    }}
                                >
                                    جستجو
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setSearch('');
                                        setDebouncedSearch('');
                                    }}
                                >
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                </button>
                            </div>
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                جستجو با تاخیر ۷۰۰ میلی‌ثانیه انجام می‌شود
                            </small>
                        </div>
                        <div className="col-md-6 text-end">
                            <span className="text-muted">
                                تعداد کل: {pagination.totalCount} کاربر
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                لیست کاربران
                ============================================================ */}
            {renderUserList()}
            {renderPagination()}

            {/* ============================================================
                مودال مشاهده امضا
                ============================================================ */}
            {renderDetailModal()}
        </div>
    );
}