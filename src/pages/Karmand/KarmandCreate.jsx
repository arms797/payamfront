import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

export default function KarmandCreate() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { markazList } = useMarkaz();

    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]); // ← لیست نقش‌ها
    const [formData, setFormData] = useState({
        userName: '',
        codeMelli: '',
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
        emza: '',
        roleIds: [] // ← لیست شناسه نقش‌های انتخاب‌شده
    });

    // ============================================================
    // دریافت لیست نقش‌ها
    // ============================================================
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await api.get('/Role/list');
                if (response.data?.data) {
                    setRoles(response.data.data);
                }
            } catch (error) {
                toast.error('خطا در دریافت لیست نقش‌ها');
            }
        };
        fetchRoles();
    }, []);

    if (!hasPermission('Karmand.Create')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                شما مجوز ایجاد کارمند را ندارید
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // ============================================================
    // مدیریت انتخاب نقش‌ها (چندگانه)
    // ============================================================
    const handleRoleChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData({ ...formData, roleIds: selectedOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                markazId: parseInt(formData.markazId),
                markazAsliId: formData.markazAsliId ? parseInt(formData.markazAsliId) : null,
                roleIds: formData.roleIds // ← ارسال لیست نقش‌ها
            };

            const response = await api.post('/Karmand/create', payload);

            if (response.data?.success) {
                toast.success('کارمند با موفقیت ایجاد شد');
                navigate('/dashboard/personel');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ایجاد کارمند');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <h4 className="mb-4">ایجاد کارمند جدید</h4>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        {/* اطلاعات کاربری */}
                        <h6 className="text-primary">اطلاعات کاربری</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">نام کاربری *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">کد ملی *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="codeMelli"
                                    value={formData.codeMelli}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">نام *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="naam"
                                    value={formData.naam}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">نام خانوادگی *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="naameKhanevadeghi"
                                    value={formData.naameKhanevadeghi}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* اطلاعات شغلی */}
                        <h6 className="text-primary mt-4">اطلاعات شغلی</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">مرکز خدمتی *</label>
                                <select
                                    className="form-select"
                                    name="markazId"
                                    value={formData.markazId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">انتخاب مرکز...</option>
                                    {markazList?.map(m => (
                                        <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">مرکز اصلی</label>
                                <select
                                    className="form-select"
                                    name="markazAsliId"
                                    value={formData.markazAsliId}
                                    onChange={handleChange}
                                >
                                    <option value="">انتخاب مرکز...</option>
                                    {markazList?.map(m => (
                                        <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* اطلاعات تماس */}
                        <h6 className="text-primary mt-4">اطلاعات تماس</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">تلفن همراه ۱</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">تلفن همراه ۲</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="mobile2"
                                    value={formData.mobile2}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">تلفن مستقیم</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="telefonMostaghim"
                                    value={formData.telefonMostaghim}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">تلفن غیر مستقیم</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="telefonGhayreMostaghim"
                                    value={formData.telefonGhayreMostaghim}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">شماره داخلی</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="telefonDakheli"
                                    value={formData.telefonDakheli}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">ایمیل</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">امضا</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="emza"
                                    value={formData.emza}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* ============================================================
                            انتخاب نقش‌ها (چندگانه و پویا)
                            ============================================================ */}
                        <h6 className="text-primary mt-4">نقش‌ها</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-12">
                                <label className="form-label">انتخاب نقش‌ها (چندگانه)</label>
                                <select
                                    className="form-select"
                                    multiple
                                    style={{ minHeight: '150px' }}
                                    value={formData.roleIds}
                                    onChange={handleRoleChange}
                                >
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    برای انتخاب چند نقش، کلید Ctrl را نگه دارید و کلیک کنید
                                </small>
                                <div className="mt-2">
                                    <span className="badge bg-secondary">
                                        تعداد نقش‌های انتخاب‌شده: {formData.roleIds.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'در حال ثبت...' : 'ایجاد کارمند'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/dashboard/personel')}
                            >
                                انصراف
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}