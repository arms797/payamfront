// src/pages/Schedule/Faaliat/FaaliatList.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';

export default function FaaliatList() {
    const { hasPermission } = useAuth();
    const [faaliatList, setFaaliatList] = useState([]);
    const [loading, setLoading] = useState(true);

    // ============================================================
    // Stateهای مودال
    // ============================================================
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'detail'
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // Stateهای فرم
    // ============================================================
    const [formData, setFormData] = useState({
        onvan: '',
        noeAnjam: '',
        minSaatDarEdari: '',
        maxSaatDarEdari: '',
        minSaatDarHafteh: '',
        maxSaatDarHafteh: '',
        minDayDarHafteh: '',
        maxDayDarHafteh: '',
        isMadove: false,
        color: '#4d6bfe',
        vazeeat: true
    });

    // ============================================================
    // گزینه‌های نوع انجام
    // ============================================================
    const noeAnjamOptions = [
        { value: 1, label: 'حضوری' },
        { value: 2, label: 'مجازی' },
        { value: 3, label: 'ترکیبی' }
    ];

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('Faaliat.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت لیست فعالیت‌ها
    // ============================================================
    const fetchFaaliat = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Faaliat/list');
            if (response.data?.success) {
                setFaaliatList(response.data.data || []);
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست فعالیت‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaaliat();
    }, []);

    // ============================================================
    // باز کردن مودال ایجاد
    // ============================================================
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedItem(null);
        setFormData({
            onvan: '',
            noeAnjam: '',
            minSaatDarEdari: '',
            maxSaatDarEdari: '',
            minSaatDarHafteh: '',
            maxSaatDarHafteh: '',
            minDayDarHafteh: '',
            maxDayDarHafteh: '',
            isMadove: false,
            color: '#4d6bfe',
            vazeeat: true
        });
        setShowModal(true);
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = (item) => {
        setModalMode('edit');
        setSelectedItem(item);
        setFormData({
            onvan: item.onvan || '',
            noeAnjam: item.noeAnjam || '',
            minSaatDarEdari: item.minSaatDarEdari || '',
            maxSaatDarEdari: item.maxSaatDarEdari || '',
            minSaatDarHafteh: item.minSaatDarHafteh || '',
            maxSaatDarHafteh: item.maxSaatDarHafteh || '',
            minDayDarHafteh: item.minDayDarHafteh || '',
            maxDayDarHafteh: item.maxDayDarHafteh || '',
            isMadove: item.isMadove || false,
            color: item.color || '#4d6bfe',
            vazeeat: item.vazeeat !== undefined ? item.vazeeat : true
        });
        setShowModal(true);
    };

    // ============================================================
    // باز کردن مودال جزئیات
    // ============================================================
    const openDetailModal = (item) => {
        setModalMode('detail');
        setSelectedItem(item);
        setShowModal(true);
    };

    // ============================================================
    // بستن مودال
    // ============================================================
    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    // ============================================================
    // تغییر فیلدهای فرم
    // ============================================================
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // ============================================================
    // ثبت/ویرایش فعالیت
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!formData.onvan.trim()) {
                toast.warning('عنوان فعالیت الزامی است');
                setSubmitting(false);
                return;
            }

            if (!formData.noeAnjam) {
                toast.warning('نحوه انجام الزامی است');
                setSubmitting(false);
                return;
            }

            const payload = {
                onvan: formData.onvan,
                noeAnjam: parseInt(formData.noeAnjam),
                minSaatDarEdari: formData.minSaatDarEdari ? parseInt(formData.minSaatDarEdari) : null,
                maxSaatDarEdari: formData.maxSaatDarEdari ? parseInt(formData.maxSaatDarEdari) : null,
                minSaatDarHafteh: formData.minSaatDarHafteh ? parseInt(formData.minSaatDarHafteh) : null,
                maxSaatDarHafteh: formData.maxSaatDarHafteh ? parseInt(formData.maxSaatDarHafteh) : null,
                minDayDarHafteh: formData.minDayDarHafteh ? parseInt(formData.minDayDarHafteh) : null,
                maxDayDarHafteh: formData.maxDayDarHafteh ? parseInt(formData.maxDayDarHafteh) : null,
                isMadove: formData.isMadove,
                color: formData.color,
                vazeeat: formData.vazeeat
            };

            let response;
            if (modalMode === 'create') {
                response = await api.post('/Faaliat/create', payload);
            } else {
                response = await api.put('/Faaliat/update', { ...payload, id: selectedItem.id });
            }

            if (response.data?.success) {
                toast.success(response.data.message);
                setShowModal(false);
                fetchFaaliat();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره فعالیت');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // حذف فعالیت
    // ============================================================
    const handleDelete = async (id, onvan) => {
        if (!window.confirm(`آیا از حذف فعالیت "${onvan}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Faaliat/delete/${id}`);
            if (response.data?.success) {
                toast.success('فعالیت با موفقیت حذف شد');
                fetchFaaliat();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف فعالیت');
        }
    };

    // ============================================================
    // دریافت متن نوع انجام
    // ============================================================
    const getNoeAnjamText = (noe) => {
        const found = noeAnjamOptions.find(o => o.value === noe);
        return found?.label || '-';
    };

    // ============================================================
    // دریافت کلاس رنگ
    // ============================================================
    const getStatusBadgeClass = (vazeeat) => {
        return vazeeat ? 'bg-success' : 'bg-danger';
    };

    const getStatusText = (vazeeat) => {
        return vazeeat ? 'فعال' : 'غیرفعال';
    };

    // ============================================================
    // دریافت نمایش نوع انجام
    // ============================================================
    const getNoeAnjamDisplay = (noe) => {
        const map = {
            1: 'حضوری',
            2: 'مجازی',
            3: 'ترکیبی'
        };
        return map[noe] || '-';
    };

    // ============================================================
    // رندر مودال جزئیات
    // ============================================================
    const renderDetailModal = () => {
        if (!selectedItem) return null;

        return (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">جزئیات فعالیت: {selectedItem.onvan}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <strong>اطلاعات پایه</strong>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">عنوان:</div>
                                                <div className="col-7">{selectedItem.onvan}</div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">نحوه انجام:</div>
                                                <div className="col-7">
                                                    <span className="badge bg-info">
                                                        {getNoeAnjamDisplay(selectedItem.noeAnjam)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">رنگ:</div>
                                                <div className="col-7">
                                                    {selectedItem.color ? (
                                                        <span
                                                            className="d-inline-block rounded-circle"
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                backgroundColor: selectedItem.color,
                                                                border: '1px solid #ddd'
                                                            }}
                                                        ></span>
                                                    ) : '-'}
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">وضعیت:</div>
                                                <div className="col-7">
                                                    <span className={`badge ${getStatusBadgeClass(selectedItem.vazeeat)}`}>
                                                        {getStatusText(selectedItem.vazeeat)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <strong>محدودیت‌های زمانی</strong>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداقل ساعت در تایم اداری:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.minSaatDarEdari || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداکثر ساعت در تایم اداری:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.maxSaatDarEdari || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداقل ساعت در هفته:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.minSaatDarHafteh || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداکثر ساعت در هفته:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.maxSaatDarHafteh || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداقل روز در هفته:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.minDayDarHafteh || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">حداکثر روز در هفته:</div>
                                                <div className="col-6">
                                                    <PersianNumber>{selectedItem.maxDayDarHafteh || '-'}</PersianNumber>
                                                </div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-6 fw-bold">مجاز برای مدعو:</div>
                                                <div className="col-6">
                                                    {selectedItem.isMadove ? (
                                                        <span className="badge bg-success">بله</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">خیر</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid">
            {/* هدر */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت فعالیت‌ها</h4>
                <PermissionWrapper permission="Faaliat.Create">
                    <button
                        className="btn btn-primary"
                        onClick={openCreateModal}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        فعالیت جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* جدول لیست فعالیت‌ها */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>عنوان</th>
                                <th>نحوه انجام</th>
                                <th>حداقل ساعت در هفته</th>
                                <th>حداکثر ساعت در هفته</th>
                                <th>مجاز برای مدرس مدعو</th>
                                <th>رنگ</th>
                                <th>وضعیت</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {faaliatList.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted">
                                        هیچ فعالیتی یافت نشد
                                    </td>
                                </tr>
                            ) : (
                                faaliatList.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => openDetailModal(item)}
                                    >
                                        <td><PersianNumber>{index + 1}</PersianNumber></td>
                                        <td><strong>{item.onvan}</strong></td>
                                        <td>
                                            <span className="badge bg-info">
                                                {item.noeAnjamDisplay || getNoeAnjamText(item.noeAnjam)}
                                            </span>
                                        </td>
                                        <td><PersianNumber>{item.minSaatDarHafteh || '-'}</PersianNumber></td>
                                        <td><PersianNumber>{item.maxSaatDarHafteh || '-'}</PersianNumber></td>
                                        <td>
                                            {item.isMadove ? (
                                                <span className="badge bg-warning">بله</span>
                                            ) : (
                                                <span className="badge bg-secondary">خیر</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.color ? (
                                                <span
                                                    className="d-inline-block rounded-circle"
                                                    style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        backgroundColor: item.color,
                                                        border: '1px solid #ddd'
                                                    }}
                                                ></span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(item.vazeeat)}`}>
                                                {getStatusText(item.vazeeat)}
                                            </span>
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="btn-group btn-group-sm">
                                                <PermissionWrapper permission="Faaliat.Update">
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => openEditModal(item)}
                                                        title="ویرایش"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </PermissionWrapper>
                                                <PermissionWrapper permission="Faaliat.Delete">
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDelete(item.id, item.onvan)}
                                                        title="حذف"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </PermissionWrapper>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* مودال ایجاد/ویرایش */}
            {showModal && modalMode !== 'detail' && (
                <>
                    <div
                        className="modal show d-block"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                    >
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {modalMode === 'create' ? 'ایجاد فعالیت جدید' : `ویرایش فعالیت: ${selectedItem?.onvan}`}
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={closeModal}
                                        ></button>
                                    </div>

                                    <div className="modal-body">
                                        {/* ردیف 1: عنوان + نوع انجام */}
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    عنوان فعالیت <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="onvan"
                                                    value={formData.onvan}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="مثلاً: تدریس در مراکز دیگر"
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">
                                                    نحوه انجام <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="noeAnjam"
                                                    value={formData.noeAnjam}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">انتخاب...</option>
                                                    {noeAnjamOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* ردیف 2: محدودیت‌های ساعتی در تایم اداری */}
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداقل ساعت در تایم اداری</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="minSaatDarEdari"
                                                    value={formData.minSaatDarEdari}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 8"
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداکثر ساعت در تایم اداری</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="maxSaatDarEdari"
                                                    value={formData.maxSaatDarEdari}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 16"
                                                />
                                            </div>
                                        </div>

                                        {/* ردیف 3: محدودیت‌های هفتگی */}
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداقل ساعت در هفته</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="minSaatDarHafteh"
                                                    value={formData.minSaatDarHafteh}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 4"
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداکثر ساعت در هفته</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="maxSaatDarHafteh"
                                                    value={formData.maxSaatDarHafteh}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 20"
                                                />
                                            </div>
                                        </div>

                                        {/* ردیف 4: محدودیت‌های روزانه */}
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداقل روز در هفته</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="minDayDarHafteh"
                                                    value={formData.minDayDarHafteh}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 1"
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">حداکثر روز در هفته</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="maxDayDarHafteh"
                                                    value={formData.maxDayDarHafteh}
                                                    onChange={handleChange}
                                                    placeholder="مثلاً: 5"
                                                />
                                            </div>
                                        </div>

                                        {/* ردیف 5: مدعو + انتخاب رنگ + وضعیت */}
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <div className="form-check mt-4">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        name="isMadove"
                                                        checked={formData.isMadove}
                                                        onChange={handleChange}
                                                        id="isMadove"
                                                    />
                                                    <label className="form-check-label" htmlFor="isMadove">
                                                        اعمال برای مدعو
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">انتخاب رنگ</label>
                                                <div className="d-flex align-items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="form-control form-control-color"
                                                        name="color"
                                                        value={formData.color}
                                                        onChange={handleChange}
                                                        style={{ width: '60px', height: '40px', padding: '4px' }}
                                                    />
                                                    <span className="text-muted small">
                                                        <PersianNumber>{formData.color}</PersianNumber>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="col-md-4 mb-3">
                                                <div className="form-check mt-4">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        name="vazeeat"
                                                        checked={formData.vazeeat}
                                                        onChange={handleChange}
                                                        id="vazeeat"
                                                    />
                                                    <label className="form-check-label" htmlFor="vazeeat">
                                                        فعال
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={closeModal}
                                        >
                                            انصراف
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    در حال ذخیره...
                                                </>
                                            ) : (
                                                modalMode === 'create' ? 'ایجاد' : 'ذخیره تغییرات'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div
                        className="modal-backdrop show"
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                        onClick={closeModal}
                    ></div>
                </>
            )}

            {/* مودال جزئیات */}
            {showModal && modalMode === 'detail' && renderDetailModal()}

            {showModal && modalMode === 'detail' && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeModal}
                ></div>
            )}
        </div>
    );
}