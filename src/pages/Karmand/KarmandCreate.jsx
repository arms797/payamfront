import React, { useState } from 'react';
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
        email: ''
    });

    // ============================================================
    // بررسی مجوز
    // ============================================================
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                userName: formData.userName,
                codeMelli: formData.codeMelli,
                naam: formData.naam,
                naameKhanevadeghi: formData.naameKhanevadeghi,
                markazId: parseInt(formData.markazId),
                markazAsliId: formData.markazAsliId ? parseInt(formData.markazAsliId) : null,
                mobile: formData.mobile || null,
                mobile2: formData.mobile2 || null,
                telefonMostaghim: formData.telefonMostaghim || null,
                telefonGhayreMostaghim: formData.telefonGhayreMostaghim || null,
                telefonDakheli: formData.telefonDakheli || null,
                email: formData.email || null
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
                        {/* ============================================================
                            اطلاعات کاربری
                            ============================================================ */}
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

                        {/* ============================================================
                            اطلاعات شغلی
                            ============================================================ */}
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

                        {/* ============================================================
                            اطلاعات تماس
                            ============================================================ */}
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

                        {/* ============================================================
                            ❌ نقش و امضا حذف شدند
                            ============================================================ */}

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