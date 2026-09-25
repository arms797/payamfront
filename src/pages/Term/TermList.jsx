import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import PersianNumber from '../../components/common/PersianNumber';
import { useConfirm } from '../../hooks/useConfirm';
import TermFormModal from './TermFormModal';


const toPersianDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fa-IR');
    } catch {
        return dateStr;
    }
};

export default function TermList() {
    const { hasPermission } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();

    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterVazeeyat, setFilterVazeeyat] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);

    // ============================================================
    // دریافت لیست ترم‌ها
    // ============================================================
    const fetchTerms = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Term/list');
            if (response.data?.success) {
                setTerms(response.data.data || []);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست ترم‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    // ============================================================
    // فیلتر + مرتب‌سازی
    // ============================================================
    const filteredTerms = useMemo(() => {
        let filtered = [...terms];

        if (search.trim()) {
            const s = search.trim().toLowerCase();
            filtered = filtered.filter(t =>
                (t.codeTerm || '').toLowerCase().includes(s) ||
                (t.onvanTerm || '').toLowerCase().includes(s) ||
                (t.salTahsili || '').toLowerCase().includes(s) ||
                (t.nimsal || '').toLowerCase().includes(s)
            );
        }

        if (filterVazeeyat === 'active') {
            filtered = filtered.filter(t => t.vazeeyat === true);
        } else if (filterVazeeyat === 'inactive') {
            filtered = filtered.filter(t => t.vazeeyat !== true);
        }

        filtered.sort((a, b) => {
            if (a.vazeeyat && !b.vazeeyat) return -1;
            if (!a.vazeeyat && b.vazeeyat) return 1;
            const da = a.termJariShoroo ? new Date(a.termJariShoroo) : new Date(0);
            const db = b.termJariShoroo ? new Date(b.termJariShoroo) : new Date(0);
            return db - da;
        });

        return filtered;
    }, [terms, search, filterVazeeyat]);

    // ============================================================
    // صفحه‌بندی
    // ============================================================
    const paginatedTerms = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTerms.slice(start, start + pageSize);
    }, [filteredTerms, page, pageSize]);

    const totalPages = Math.ceil(filteredTerms.length / pageSize);

    // ============================================================
    // عملیات
    // ============================================================
    const openCreateModal = () => {
        setEditingTerm(null);
        setShowFormModal(true);
    };

    const openEditModal = (term) => {
        setEditingTerm(term);
        setShowFormModal(true);
    };

    const handleDelete = async (term) => {
        const confirmed = await confirm({
            title: 'حذف ترم',
            message: `آیا از حذف ترم "${term.onvanTerm || term.codeTerm}" مطمئن هستید؟`,
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await api.delete(`/Term/delete/${term.codeTerm}`);
            if (response.data?.success) {
                toast.success('ترم با موفقیت حذف شد');
                fetchTerms();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف ترم');
        }
    };

    // ============================================================
    // 🔥 بعد از ذخیره موفق - بستن مودال + رفرش
    // ============================================================
    const handleFormSuccess = () => {
        setShowFormModal(false);
        setEditingTerm(null);
        fetchTerms();
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        setEditingTerm(null);
    };

    // ============================================================
    // رندر
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

    return (
        <>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                        <i className="bi bi-calendar3 me-2"></i>
                        مدیریت ترم‌ها
                    </h4>
                    <PermissionWrapper permission="Term.Create">
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <i className="bi bi-plus-circle me-1"></i>
                            ترم جدید
                        </button>
                    </PermissionWrapper>
                </div>

                {/* فیلترها */}
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-4">
                                <label className="form-label small mb-1">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="کد ترم، عنوان، سال تحصیلی..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small mb-1">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterVazeeyat}
                                    onChange={(e) => { setFilterVazeeyat(e.target.value); setPage(1); }}
                                >
                                    <option value="all">همه</option>
                                    <option value="active">فعال</option>
                                    <option value="inactive">غیرفعال</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label small mb-1">تعداد در صفحه</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                                <span className="badge bg-primary">
                                    مجموع: <PersianNumber>{filteredTerms.length}</PersianNumber>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول */}
                <div className="card">
                    <div className="card-body p-0">
                        {paginatedTerms.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>کد ترم</th>
                                            <th>عنوان</th>
                                            
                                            <th>شروع ترم</th>
                                            <th>پایان ترم</th>
                                            <th>شروع کلاس</th>
                                            <th>پایان کلاس</th>
                                            <th className="text-center">برنامه هفتگی</th>
                                            <th className="text-center">وضعیت</th>
                                            <th className="text-center" style={{ width: '130px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedTerms.map((term, index) => (
                                            <tr key={term.codeTerm}>
                                                <td><PersianNumber>{(page - 1) * pageSize + index + 1}</PersianNumber></td>
                                                <td><strong><PersianNumber>{term.codeTerm}</PersianNumber></strong></td>
                                                <td><PersianNumber>{term.onvanTerm || '-'}</PersianNumber></td>
                                               
                                                <td>{toPersianDate(term.termJariShoroo)}</td>
                                                <td>{toPersianDate(term.termJariPayan)}</td>
                                                <td>{toPersianDate(term.tarikheShorooClass)}</td>
                                                <td>{toPersianDate(term.tarikhePayanClass)}</td>
                                                <td className="text-center">
                                                    {term.isHaftegiRequired ? (
                                                        <span className="badge bg-info">نیاز دارد</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">ندارد</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {term.vazeeyat ? (
                                                        <span className="badge bg-success">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            فعال
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-danger">
                                                            <i className="bi bi-x-circle me-1"></i>
                                                            غیرفعال
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <PermissionWrapper permission="Term.Update">
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => openEditModal(term)}
                                                                title="ویرایش"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </PermissionWrapper>
                                                        <PermissionWrapper permission="Term.Delete">
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDelete(term)}
                                                                disabled={term.vazeeyat}
                                                                title={term.vazeeyat ? 'ترم فعال قابل حذف نیست' : 'حذف'}
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
                                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                                <p>هیچ ترمی یافت نشد</p>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, filteredTerms.length)} از {filteredTerms.length}
                            </small>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(p)}>
                                                <PersianNumber>{p}</PersianNumber>
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔥 مودال - بدون key */}
            {showFormModal && (
                <TermFormModal
                    show={showFormModal}
                    onClose={() => {
                        setShowFormModal(false);
                        setEditingTerm(null);
                    }}
                    onSuccess={() => {
                        setShowFormModal(false);
                        setEditingTerm(null);
                        fetchTerms();
                    }}
                    term={editingTerm}
                />
            )}

            <ConfirmModal />
        </>
    );
}