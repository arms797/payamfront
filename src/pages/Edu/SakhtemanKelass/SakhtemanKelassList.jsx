// src/pages/Edu/SakhtemanKelass/SakhtemanKelassList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import SakhtemanKelassFormModal from './SakhtemanKelassFormModal';
import SakhtemanKelassViewModal from './SakhtemanKelassViewModal';
import SakhtemanKelassBulkUploadModal from './SakhtemanKelassBulkUploadModal';

// ============================================================
// تابع تولید لیست صفحات با سه‌نقطه
// ============================================================
const getPaginationRange = (currentPage, totalPages) => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
};
// ============================================================
// 🔥 تابع کمکی برای نمایش نام مرکز بر اساس Level
// ============================================================
const getMarkazDisplayName = (markaz) => {
    if (!markaz) return '';
    if (markaz.level === 2) return 'سازمان مرکزی';
    if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`.trim();
    return markaz.naamMarkaz || '';
};

export default function SakhtemanKelassList() {
    const { roles, currentRoleId, user } = useAuth();
    const { markazList } = useMarkaz();
    const { confirm, ConfirmModal } = useConfirm();

    // ============================================================
    // نقش فعال و CodeRole
    // ============================================================
    const activeRole = useMemo(() => {
        if (!roles || !currentRoleId) return null;
        return roles.find(r => r.id === currentRoleId) || null;
    }, [roles, currentRoleId]);

    const codeRole = useMemo(() => activeRole?.codeRole || 4, [activeRole]);
    const userMarkazId = useMemo(() => user?.markazId || null, [user]);
    // 🔥 استخراج کد استان از روی markazId کاربر (چون user.markazOstan توی توکن نیست)
    const userOstanCode = useMemo(() => {
        if (!user?.markazId || !markazList || markazList.length === 0) return null;
        const userMarkaz = markazList.find(m => m.id === user.markazId);
        return userMarkaz?.codeOstan || null;
    }, [user?.markazId, markazList]);
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
    const [searchNaamSakhteman, setSearchNaamSakhteman] = useState('');
    const [searchNaamClass, setSearchNaamClass] = useState('');
    const [selectedOstan, setSelectedOstan] = useState('');
    const [selectedMarkaz, setSelectedMarkaz] = useState('');
    const [filterAmoozeshi, setFilterAmoozeshi] = useState('');
    const [filterVazeeyat, setFilterVazeeyat] = useState('');
    const [filterProjector, setFilterProjector] = useState('');

    // ============================================================
    // Ref برای debounce
    // ============================================================
    const searchSakhtemanTimerRef = useRef(null);
    const searchClassTimerRef = useRef(null);

    // ============================================================
    // مودال‌ها
    // ============================================================
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingItem, setViewingItem] = useState(null);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

    // ============================================================
    // تنظیم مقادیر پیش‌فرض فیلتر بر اساس CodeRole
    // ============================================================
    useEffect(() => {
        if (!markazList || markazList.length === 0) return;
        if (!userOstanCode) return;

        // CodeRole 3 یا 4 → استان پیش‌فرض = استان کاربر
        if (codeRole === 3 || codeRole === 4) {
            setSelectedOstan(userOstanCode);
        }
        // CodeRole 1 یا 2 → هیچ استانی انتخاب نشده (همه)
        else {
            setSelectedOstan('');
        }

        // CodeRole 4 → مرکز پیش‌فرض = مرکز کاربر
        if (codeRole === 4 && userMarkazId) {
            setSelectedMarkaz(userMarkazId.toString());
        }
        // CodeRole 1, 2, 3 → مرکز پیش‌فرض خالی
        else {
            setSelectedMarkaz('');
        }
    }, [codeRole, userOstanCode, userMarkazId, markazList]);

    // ============================================================
    // لیست استان‌های یکتا (مرتب الفبایی)
    // ============================================================
    const uniqueOstans = useMemo(() => {
        if (!markazList) return [];
        const map = new Map();
        markazList.forEach(m => {
            if (m.codeOstan && m.naamOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fa'));
    }, [markazList]);

    // ============================================================
    // لیست مراکز بر اساس استان انتخابی
    // ============================================================
    const filteredMarkazes = useMemo(() => {
        if (!markazList) return [];
        let filtered = markazList;
        if (selectedOstan) {
            filtered = filtered.filter(m => m.codeOstan === selectedOstan);
        }
        return [...filtered].sort((a, b) =>
            getMarkazDisplayName(a).localeCompare(getMarkazDisplayName(b), 'fa')
        );
    }, [markazList, selectedOstan]);

    // ============================================================
    // دریافت لیست ساختمان/کلاس
    // ============================================================
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize
            };

            if (searchNaamSakhteman) params.searchNaamSakhteman = searchNaamSakhteman;
            if (searchNaamClass) params.searchNaamClass = searchNaamClass;
            if (selectedOstan) params.codeOstan = selectedOstan;
            if (selectedMarkaz) params.markazId = parseInt(selectedMarkaz);
            if (filterAmoozeshi !== '') params.amoozeshi = filterAmoozeshi === 'true';
            if (filterVazeeyat !== '') params.vazeeyat = filterVazeeyat === 'true';
            if (filterProjector !== '') params.projector = filterProjector === 'true';

            const response = await api.get('/SakhtemanKelass/list', { params });
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            console.error('خطا در دریافت ساختمان/کلاس:', error);
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست ساختمان‌ها');
        } finally {
            setLoading(false);
        }
    }, [
        pagination.page,
        pagination.pageSize,
        searchNaamSakhteman,
        searchNaamClass,
        selectedOstan,
        selectedMarkaz,
        filterAmoozeshi,
        filterVazeeyat,
        filterProjector
    ]);

    // ============================================================
    // Debounce برای جستجوی نام ساختمان
    // ============================================================
    useEffect(() => {
        if (searchSakhtemanTimerRef.current) clearTimeout(searchSakhtemanTimerRef.current);
        searchSakhtemanTimerRef.current = setTimeout(() => {
            setPagination(prev => prev.page !== 1 ? { ...prev, page: 1 } : prev);
        }, 700);
        return () => clearTimeout(searchSakhtemanTimerRef.current);
    }, [searchNaamSakhteman]);

    // ============================================================
    // Debounce برای جستجوی نام کلاس
    // ============================================================
    useEffect(() => {
        if (searchClassTimerRef.current) clearTimeout(searchClassTimerRef.current);
        searchClassTimerRef.current = setTimeout(() => {
            setPagination(prev => prev.page !== 1 ? { ...prev, page: 1 } : prev);
        }, 700);
        return () => clearTimeout(searchClassTimerRef.current);
    }, [searchNaamClass]);

    // ============================================================
    // Fetch نهایی
    // ============================================================
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    // ============================================================
    // تغییر وضعیت (Toggle)
    // ============================================================
    const handleToggle = async (item, e) => {
        e.stopPropagation();
        try {
            const response = await api.patch(`/SakhtemanKelass/toggle/${item.id}`);
            if (response.data?.success) {
                toast.success(response.data.message || 'وضعیت با موفقیت تغییر کرد');
                setItems(prev => prev.map(i =>
                    i.id === item.id ? { ...i, vazeeyat: response.data.data.vazeeyat } : i
                ));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تغییر وضعیت');
        }
    };

    // ============================================================
    // حذف
    // ============================================================
    const handleDelete = async (item, e) => {
        e.stopPropagation();
        const confirmed = await confirm({
            title: 'حذف ساختمان/کلاس',
            message: `آیا از حذف "${item.naamSakhteman} - ${item.naamClass}" مطمئن هستید؟`,
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await api.delete(`/SakhtemanKelass/delete/${item.id}`);
            if (response.data?.success) {
                toast.success('با موفقیت حذف شد');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف');
        }
    };

    // ============================================================
    // باز کردن مودال‌ها
    // ============================================================
    const openCreateModal = () => {
        setEditingItem(null);
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setShowFormModal(true);
    };

    const openViewModal = (item, e) => {
        e.stopPropagation();
        setViewingItem(item);
        setShowViewModal(true);
    };

    const handleFormSuccess = () => {
        setShowFormModal(false);
        setEditingItem(null);
        fetchItems();
    };

    const handleBulkUploadSuccess = () => {
        setShowBulkUploadModal(false);
        fetchItems();
    };

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div className="container-fluid">
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-0">
                            <i className="bi bi-building me-2"></i>
                            مدیریت ساختمان و کلاس
                        </h4>
                        <small className="text-muted">
                            لیست کلاس‌های آموزشی و اداری
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <PermissionWrapper permission="SakhtemanKelass.BulkUpload">
                            <button
                                className="btn btn-outline-success"
                                onClick={() => setShowBulkUploadModal(true)}
                            >
                                <i className="bi bi-file-earmark-excel me-1"></i>
                                آپلود اکسل
                            </button>
                        </PermissionWrapper>
                        <PermissionWrapper permission="SakhtemanKelass.Create">
                            <button
                                className="btn btn-primary"
                                onClick={openCreateModal}
                            >
                                <i className="bi bi-plus-circle me-1"></i>
                                ساختمان/کلاس جدید
                            </button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* فیلترها */}
                <div className="card mb-3">
                    <div className="card-body py-2">
                        <div className="row g-2 align-items-end">
                            <div className="col-md-2">
                                <label className="form-label small mb-1">نام ساختمان</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="جستجو..."
                                    value={searchNaamSakhteman}
                                    onChange={(e) => setSearchNaamSakhteman(e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">نام کلاس</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="جستجو..."
                                    value={searchNaamClass}
                                    onChange={(e) => setSearchNaamClass(e.target.value)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">استان</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedOstan}
                                    onChange={(e) => {
                                        setSelectedOstan(e.target.value);
                                        setSelectedMarkaz('');
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                >
                                    <option value="">همه استان‌ها</option>
                                    {uniqueOstans.map(o => (
                                        <option key={o.code} value={o.code}>{o.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">مرکز</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={selectedMarkaz}
                                    onChange={(e) => {
                                        setSelectedMarkaz(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    disabled={!selectedOstan}
                                    title={!selectedOstan ? 'ابتدا یک استان انتخاب کنید' : ''}
                                >
                                    <option value="">همه مراکز</option>
                                    {filteredMarkazes.map(m => (
                                        <option key={m.id} value={m.id}>{getMarkazDisplayName(m)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-1">
                                <label className="form-label small mb-1">نوع</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterAmoozeshi}
                                    onChange={(e) => {
                                        setFilterAmoozeshi(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                >
                                    <option value="">همه</option>
                                    <option value="true">آموزشی</option>
                                    <option value="false">اداری</option>
                                </select>
                            </div>

                            <div className="col-md-1">
                                <label className="form-label small mb-1">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterVazeeyat}
                                    onChange={(e) => {
                                        setFilterVazeeyat(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                >
                                    <option value="">همه</option>
                                    <option value="true">فعال</option>
                                    <option value="false">غیرفعال</option>
                                </select>
                            </div>

                            <div className="col-md-1">
                                <label className="form-label small mb-1">پروژکتور</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterProjector}
                                    onChange={(e) => {
                                        setFilterProjector(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                >
                                    <option value="">همه</option>
                                    <option value="true">دارد</option>
                                    <option value="false">ندارد</option>
                                </select>
                            </div>

                            <div className="col-md-1 text-end">
                                <span className="badge bg-primary">
                                    <PersianNumber>{pagination.totalCount}</PersianNumber>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول */}
                <div className="card">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">در حال بارگذاری...</span>
                                </div>
                            </div>
                        ) : items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>مرکز</th>
                                            <th>ساختمان</th>                                            
                                            <th>نام کلاس</th>
                                            <th className="text-center">نوع</th>
                                            <th className="text-center">پروژکتور</th>
                                            <th className="text-center">وایت‌برد</th>
                                            <th className="text-center">وضعیت</th>
                                            <th className="text-center" style={{ width: '140px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="text-center">
                                                    <PersianNumber>
                                                        {(pagination.page - 1) * pagination.pageSize + index + 1}
                                                    </PersianNumber>
                                                </td>
                                                <td>{item.markazName || '-'}</td>
                                                <td><strong>{item.naamSakhteman || '-'}</strong></td>
                                                
                                                <td>{item.naamClass || '-'}</td>
                                                <td className="text-center">
                                                    {item.amoozeshi === true && (
                                                        <span className="badge bg-primary">آموزشی</span>
                                                    )}
                                                    {item.amoozeshi === false && (
                                                        <span className="badge bg-secondary">اداری</span>
                                                    )}
                                                    {item.amoozeshi === null && '-'}
                                                </td>
                                                
                                                <td className="text-center">
                                                    {item.projector ? (
                                                        <i className="bi bi-check-circle-fill text-success"></i>
                                                    ) : (
                                                        <i className="bi bi-x-circle text-muted"></i>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.tedadWhiteboard || 0}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <div className="form-check form-switch d-flex justify-content-center">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={item.vazeeyat}
                                                            onChange={(e) => handleToggle(item, e)}
                                                            title={item.vazeeyat ? 'غیرفعال کردن' : 'فعال کردن'}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <PermissionWrapper permission="SakhtemanKelass.Update">
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => openEditModal(item)}
                                                                title="ویرایش"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </PermissionWrapper>
                                                        <button
                                                            className="btn btn-sm btn-info"
                                                            onClick={(e) => openViewModal(item, e)}
                                                            title="مشاهده"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </button>
                                                        <PermissionWrapper permission="SakhtemanKelass.Delete">
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={(e) => handleDelete(item, e)}
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
                            <div className="text-center text-muted py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p>هیچ ساختمان/کلاسی یافت نشد</p>
                            </div>
                        )}
                    </div>

                    {/* صفحه‌بندی */}
                    {pagination.totalPages > 1 && (
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                نمایش {((pagination.page - 1) * pagination.pageSize) + 1} تا{' '}
                                {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} از{' '}
                                {pagination.totalCount}
                            </small>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>

                                    {getPaginationRange(pagination.page, pagination.totalPages).map((pageNum, idx) => {
                                        if (pageNum === '...') {
                                            return (
                                                <li key={`dots-${idx}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li
                                                key={pageNum}
                                                className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    <PersianNumber>{pageNum}</PersianNumber>
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                            <div className="d-flex align-items-center gap-2">
                                <label className="text-muted small mb-0">تعداد:</label>
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
                    )}
                </div>
            </div>

            {/* مودال‌ها */}
            <SakhtemanKelassFormModal
                key={`sakhteman-modal-${editingItem?.id || 'new'}`}
                show={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingItem(null);
                }}
                onSuccess={handleFormSuccess}
                item={editingItem}
            />

            <SakhtemanKelassViewModal
                show={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setViewingItem(null);
                }}
                item={viewingItem}
            />

            <SakhtemanKelassBulkUploadModal
                show={showBulkUploadModal}
                onClose={() => setShowBulkUploadModal(false)}
                onSuccess={handleBulkUploadSuccess}
            />

            <ConfirmModal />
        </>
    );
}