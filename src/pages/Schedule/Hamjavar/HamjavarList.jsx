// src/pages/Schedule/Hamjavar/HamjavarList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTerm } from '../../../context/TermContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';

// کامپوننت‌های مودال
import CreateModal from './modals/CreateModal';
import DetailModal from './modals/DetailModal';
import ReviewModal from './modals/ReviewModal';
import DeleteModal from './modals/DeleteModal';
import SignSendModal from './modals/SignSendModal';

// توابع کمکی
import { getStatusBadge, getStatusDisplay } from './HamjavarHelpers';

export default function HamjavarList() {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { termList, currentTermCode } = useTerm();
    const { markazList } = useMarkaz();
    const { confirm, ConfirmModal } = useConfirm();

    // ============================================================
    // تشخیص نقش کاربر
    // ============================================================
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isRaeis = useMemo(() => hasPermission('Hamjavar.ReviewRaeis'), [hasPermission]);
    const isKhadamat = useMemo(() => hasPermission('Hamjavar.ReviewKhadamat'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('Hamjavar.ReviewMoaven') || hasPermission('Hamjavar.CreateMoaven'), [hasPermission]);
    const isAdmin = useMemo(() => user?.currentRoleName === 'ادمین سامانه', [user]);

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
    const [filters, setFilters] = useState({
        termCode: currentTermCode || '',
        search: '',
        markazId: '',
        status: '',
        fromDate: '',
        toDate: ''
    });

    // ============================================================
    // Stateهای مودال
    // ============================================================
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSignSendModal, setShowSignSendModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // دریافت لیست درخواست‌ها
    // ============================================================
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                termCode: filters.termCode || undefined,
                search: filters.search || undefined,
                markazId: filters.markazId || undefined,
                status: filters.status || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined
            };

            const response = await api.get('/Hamjavar/list', { params });
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
    }, [pagination.page, pagination.pageSize, filters]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

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
    // ریست فیلترها
    // ============================================================
    const resetFilters = () => {
        setFilters({
            termCode: currentTermCode || '',
            search: '',
            markazId: '',
            status: '',
            fromDate: '',
            toDate: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // ============================================================
    // استخراج مراکز یکتا برای فیلتر
    // ============================================================
    const uniqueMarkaz = useMemo(() => {
        const map = new Map();
        markazList?.forEach(m => {
            if (m.id && m.naamMarkaz) {
                map.set(m.id, m.naamMarkaz);
            }
        });
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [markazList]);

    // ============================================================
    // گزینه‌های وضعیت برای فیلتر
    // ============================================================
    const statusOptions = [
        { value: '', label: 'همه' },
        { value: 'PishNevis', label: 'پیش‌نویس' },
        { value: 'TaeedSabt', label: 'تایید استاد' },
        { value: 'TaeedRaeis', label: 'تایید رئیس' },
        { value: 'RadRaeis', label: 'رد رئیس' },
        { value: 'TaeedKhadamat', label: 'تایید خدمات' },
        { value: 'RadKhadamat', label: 'رد خدمات' },
        { value: 'TaeedNahaei', label: 'تایید نهایی' },
        { value: 'RadNahaei', label: 'رد نهایی' }
    ];

    // ============================================================
    // باز کردن مودال‌ها
    // ============================================================
    const openCreateModal = () => setShowCreateModal(true);
    const openDetailModal = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };
    const openReviewModal = (item) => {
        setSelectedItem(item);
        setShowReviewModal(true);
    };
    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };
    const openSignSendModal = (item) => {
        setSelectedItem(item);
        setShowSignSendModal(true);
    };

    // ============================================================
    // عملیات: حذف
    // ============================================================
    const handleDelete = async () => {
        if (!selectedItem) return;
        setSubmitting(true);

        try {
            const response = await api.delete(`/Hamjavar/delete/${selectedItem.id}`);
            if (response.data?.success) {
                toast.success('درخواست با موفقیت حذف شد');
                setShowDeleteModal(false);
                setSelectedItem(null);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // عملیات: امضاء و ارسال (تایید نهایی توسط استاد)
    // ============================================================
    const handleSignSend = async (nazar) => {
        if (!selectedItem) return;
        setSubmitting(true);

        try {
            const response = await api.patch(`/Hamjavar/confirm-submit-by-ostad/${selectedItem.id}`, { nazar });
            if (response.data?.success) {
                toast.success('درخواست با موفقیت تایید و ارسال شد');
                setShowSignSendModal(false);
                setSelectedItem(null);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تایید درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // عملیات: ثبت نظر (بررسی توسط هر نقش)
    // ============================================================
    const handleReview = async (reviewData) => {
        if (!selectedItem) return;
        setSubmitting(true);

        try {
            const endpoint = isRaeis ? '/Hamjavar/review-raeis' :
                isKhadamat ? '/Hamjavar/review-khadamat' :
                    '/Hamjavar/review-moaven';

            const response = await api.patch(endpoint, {
                hamjavarId: selectedItem.id,
                tedadRoozList: reviewData.tedadRoozList,
                nazar: reviewData.nazar,
                upload: reviewData.upload
            });

            if (response.data?.success) {
                toast.success('نظر با موفقیت ثبت شد');
                setShowReviewModal(false);
                setSelectedItem(null);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ثبت نظر');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // رندر دکمه‌های عملیات بر اساس نقش و وضعیت
    // ============================================================
    const renderActions = (item) => {
        const actions = [];

        // ============================================================
        // استاد
        // ============================================================
        if (isOstad) {
            // اگر درخواست در حالت پیش‌نویس است
            if (item.akharinTaghaza === 'PishNevis') {
                actions.push(
                    <button
                        key="delete"
                        className="btn btn-sm btn-danger"
                        onClick={() => openDeleteModal(item)}
                        title="حذف"
                    >
                        <i className="bi bi-trash"></i>
                    </button>,
                    <button
                        key="edit"
                        className="btn btn-sm btn-warning"
                        onClick={() => navigate(`/dashboard/hamjavar/edit/${item.id}`)}
                        title="ویرایش"
                    >
                        <i className="bi bi-pencil"></i>
                    </button>,
                    <button
                        key="sign"
                        className="btn btn-sm btn-success"
                        onClick={() => openSignSendModal(item)}
                        title="امضاء و ارسال"
                    >
                        <i className="bi bi-check2-circle"></i>
                    </button>
                );
            } else {
                // در غیر این صورت فقط پیگیری
                actions.push(
                    <button
                        key="track"
                        className="btn btn-sm btn-info"
                        onClick={() => openDetailModal(item)}
                        title="پیگیری"
                    >
                        <i className="bi bi-eye"></i>
                    </button>
                );
            }
        }

        // ============================================================
        // رئیس مرکز
        // ============================================================
        if (isRaeis) {
            if (item.akharinTaghaza === 'TaeedSabt' || item.akharinTaghaza === 'DarEntezarRaeis') {
                actions.push(
                    <button
                        key="review"
                        className="btn btn-sm btn-primary"
                        onClick={() => openReviewModal(item)}
                        title="بررسی"
                    >
                        <i className="bi bi-pencil-square"></i>
                    </button>
                );
            }
            actions.push(
                <button
                    key="track"
                    className="btn btn-sm btn-info"
                    onClick={() => openDetailModal(item)}
                    title="پیگیری"
                >
                    <i className="bi bi-eye"></i>
                </button>
            );
        }

        // ============================================================
        // خدمات آموزشی استان
        // ============================================================
        if (isKhadamat) {
            if (item.akharinTaghaza === 'TaeedRaeis' || item.akharinTaghaza === 'DarEntezarKhadamat') {
                actions.push(
                    <button
                        key="review"
                        className="btn btn-sm btn-primary"
                        onClick={() => openReviewModal(item)}
                        title="بررسی"
                    >
                        <i className="bi bi-pencil-square"></i>
                    </button>
                );
            }
            actions.push(
                <button
                    key="track"
                    className="btn btn-sm btn-info"
                    onClick={() => openDetailModal(item)}
                    title="پیگیری"
                >
                    <i className="bi bi-eye"></i>
                </button>
            );
        }

        // ============================================================
        // معاونت آموزشی استان
        // ============================================================
        if (isMoaven) {
            if (item.akharinTaghaza === 'TaeedKhadamat' || item.akharinTaghaza === 'DarEntezarMoaven') {
                actions.push(
                    <button
                        key="review"
                        className="btn btn-sm btn-primary"
                        onClick={() => openReviewModal(item)}
                        title="بررسی"
                    >
                        <i className="bi bi-pencil-square"></i>
                    </button>
                );
            }
            actions.push(
                <button
                    key="track"
                    className="btn btn-sm btn-info"
                    onClick={() => openDetailModal(item)}
                    title="پیگیری"
                >
                    <i className="bi bi-eye"></i>
                </button>
            );
        }

        // ============================================================
        // ادمین سامانه
        // ============================================================
        if (isAdmin) {
            actions.push(
                <button
                    key="delete"
                    className="btn btn-sm btn-danger"
                    onClick={() => openDeleteModal(item)}
                    title="حذف"
                >
                    <i className="bi bi-trash"></i>
                </button>,
                <button
                    key="track"
                    className="btn btn-sm btn-info"
                    onClick={() => openDetailModal(item)}
                    title="مشاهده"
                >
                    <i className="bi bi-eye"></i>
                </button>
            );
        }

        return <div className="d-flex gap-1 flex-wrap">{actions}</div>;
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">لیست درخواست‌های هم‌جاوری</h4>
                    <small className="text-muted">
                        {isOstad && 'نمایش درخواست‌های شما'}
                        {isRaeis && 'نمایش درخواست‌های اساتید مرکز شما'}
                        {isKhadamat && 'نمایش درخواست‌های اساتید استان شما'}
                        {isMoaven && 'نمایش درخواست‌های اساتید استان شما'}
                        {isAdmin && 'نمایش همه درخواست‌ها'}
                    </small>
                </div>
                {(isOstad || isMoaven) && (
                    <PermissionWrapper permission={isMoaven ? 'Hamjavar.CreateMoaven' : 'Hamjavar.Create'}>
                        <button
                            className="btn btn-primary"
                            onClick={openCreateModal}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            تقاضای جدید
                        </button>
                    </PermissionWrapper>
                )}
            </div>

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        {/* ترم - برای همه */}
                        <div className="col-md-2">
                            <label className="form-label">ترم</label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.termCode}
                                onChange={(e) => setFilters(prev => ({ ...prev, termCode: e.target.value }))}
                            >
                                {termList.map(term => (
                                    <option key={term.codeTerm} value={term.codeTerm}>
                                        {term.onvanTerm}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* جستجو - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-3">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="نام، کد استادی..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* مرکز - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">مرکز</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.markazId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, markazId: e.target.value }))}
                                >
                                    <option value="">همه مراکز</option>
                                    {uniqueMarkaz.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* وضعیت - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* دکمه جستجو */}
                        <div className="col-md-2 d-flex gap-2">
                            <button
                                className="btn btn-primary btn-sm w-100"
                                onClick={() => { setPagination(prev => ({ ...prev, page: 1 })); fetchItems(); }}
                            >
                                <i className="bi bi-search me-1"></i>
                                جستجو
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={resetFilters}
                                title="ریست فیلترها"
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                جدول لیست
                ============================================================ */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted">
                            تعداد کل: <PersianNumber>{pagination.totalCount}</PersianNumber> درخواست
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
                                    <th>ترم</th>
                                    <th>سال تحصیلی</th>
                                    <th>نام استاد</th>
                                    <th>کد استادی</th>
                                    <th>مرکز فعلی</th>
                                    <th>واحد موظف</th>
                                    <th>آخرین مرحله</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center text-muted py-4">
                                            هیچ درخواستی یافت نشد
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td><PersianNumber>{(pagination.page - 1) * pagination.pageSize + index + 1}</PersianNumber></td>
                                            <td>{item.termCode}</td>
                                            <td>{item.termName || '-'}</td>
                                            <td><strong>{item.ostadName}</strong></td>
                                            <td><PersianNumber>{item.ostadCode}</PersianNumber></td>
                                            <td>{item.ostadMarkaz || '-'}</td>
                                            <td><PersianNumber>{item.vahedMovazaf}</PersianNumber></td>
                                            <td>{item.kharinBarrasi || '-'}</td>
                                            <td>{getStatusBadge(item.akharinTaghaza)}</td>
                                            <td>{renderActions(item)}</td>
                                        </tr>
                                    ))
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
                                                <PersianNumber>{pageNum}</PersianNumber>
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
                onSuccess={fetchItems}
            />

            <DetailModal
                show={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
            />

            <ReviewModal
                show={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                onSubmit={handleReview}
                submitting={submitting}
                role={isRaeis ? 'raeis' : isKhadamat ? 'khadamat' : 'moaven'}
            />

            <DeleteModal
                show={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                onConfirm={handleDelete}
                submitting={submitting}
            />

            <SignSendModal
                show={showSignSendModal}
                onClose={() => {
                    setShowSignSendModal(false);
                    setSelectedItem(null);
                }}
                item={selectedItem}
                onSubmit={handleSignSend}
                submitting={submitting}
            />

            <ConfirmModal />
        </div>
    );
}