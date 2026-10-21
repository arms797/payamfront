import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';

// ============================================================
// مودال مشاهده جزئیات درس + منابع
// ============================================================
export default function DarsDetailModal({ show, onClose, darsId }) {
    const [loading, setLoading] = useState(false);
    const [dars, setDars] = useState(null);

    useEffect(() => {
        if (show && darsId) {
            fetchDetail(darsId);
        }
    }, [show, darsId]);

    const fetchDetail = async (id) => {
        setLoading(true);
        setDars(null);
        try {
            const response = await api.get(`/Dars/${id}`);
            if (response.data?.success) {
                setDars(response.data.data);
            } else {
                toast.error(response.data?.message || 'خطا در دریافت جزئیات');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت جزئیات درس');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={onClose}
            >
                <div
                    className="modal-dialog modal-xl modal-dialog-scrollable"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-content">
                        {/* Header */}
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="bi bi-eye me-2"></i>
                                مشاهده جزئیات درس
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            ></button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <div className="mt-2 text-muted">در حال بارگذاری...</div>
                                </div>
                            ) : !dars ? (
                                <div className="text-center text-muted py-5">
                                    داده‌ای یافت نشد
                                </div>
                            ) : (
                                <>
                                    {/* اطلاعات درس */}
                                    <h6 className="border-bottom pb-2 mb-3">
                                        <i className="bi bi-book me-2"></i>
                                        اطلاعات درس
                                    </h6>

                                    <div className="row g-3 mb-4">
                                        <div className="col-md-3">
                                            <label className="text-muted small d-block">کد درس</label>
                                            <strong><PersianNumber>{dars.codeDars || '-'}</PersianNumber></strong>
                                        </div>
                                        <div className="col-md-5">
                                            <label className="text-muted small d-block">نام درس</label>
                                            <strong>{dars.naamDars || '-'}</strong>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="text-muted small d-block">واحد تئوری</label>
                                            <strong><PersianNumber>{dars.vahedTeori || 0}</PersianNumber></strong>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="text-muted small d-block">واحد عملی</label>
                                            <strong><PersianNumber>{dars.vahedAmali || 0}</PersianNumber></strong>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="text-muted small d-block">ساعت تئوری</label>
                                            <strong>
                                                <PersianNumber>{dars.saatTeori || 0}</PersianNumber>
                                                <span className="text-muted ms-1">
                                                    (اصلی: <PersianNumber>{dars.saatTeoriOrginal || 0}</PersianNumber>)
                                                </span>
                                            </strong>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="text-muted small d-block">ساعت عملی</label>
                                            <strong>
                                                <PersianNumber>{dars.saatAmali || 0}</PersianNumber>
                                                <span className="text-muted ms-1">
                                                    (اصلی: <PersianNumber>{dars.saatAmaliOrginal || 0}</PersianNumber>)
                                                </span>
                                            </strong>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="text-muted small d-block">ترم اخذ</label>
                                            <strong>
                                                {dars.termAkhz !== null && dars.termAkhz !== undefined
                                                    ? <PersianNumber>{dars.termAkhz}</PersianNumber>
                                                    : '-'}
                                            </strong>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="text-muted small d-block">ظرفیت</label>
                                            <strong><PersianNumber>{dars.zarfiat || 0}</PersianNumber></strong>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="text-muted small d-block">نوع درس</label>
                                            <strong>{dars.noeDars || '-'}</strong>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="text-muted small d-block">نوع آزمون</label>
                                            <strong>{dars.noeAzmoon || '-'}</strong>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="text-muted small d-block">رشته</label>
                                            <strong>{dars.reshtehName || '-'}</strong>
                                        </div>
                                        <div className="col-md-5">
                                            <label className="text-muted small d-block">گروه آموزشی</label>
                                            <strong>{dars.grooheName || '-'}</strong>
                                        </div>
                                    </div>

                                    {/* منابع */}
                                    <h6 className="border-bottom pb-2 mb-3">
                                        <i className="bi bi-journal-text me-2"></i>
                                        منابع درس
                                        <span className="badge bg-secondary ms-2">
                                            <PersianNumber>{(dars.manbaList || []).length}</PersianNumber>
                                        </span>
                                    </h6>

                                    {dars.manbaList && dars.manbaList.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-center" style={{ width: '50px' }}>#</th>
                                                        <th>شماره منبع</th>
                                                        <th>عنوان</th>
                                                        <th>نوع منبع</th>
                                                        <th>نویسنده</th>
                                                        <th>مترجم</th>
                                                        <th>ناشر</th>
                                                        <th className="text-center">سال انتشار</th>
                                                        <th className="text-center">نوبت چاپ</th>
                                                        <th>کد پیوست</th>
                                                        <th>شرح پیوست</th>
                                                        <th>وضعیت</th>
                                                        <th className="text-center">ترم آپدیت</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dars.manbaList.map((m, idx) => (
                                                        <tr key={m.id}>
                                                            <td className="text-center">
                                                                <PersianNumber>{idx + 1}</PersianNumber>
                                                            </td>
                                                            <td><PersianNumber>{m.shomareManba || '-'}</PersianNumber></td>
                                                            <td>{m.onvan || '-'}</td>
                                                            <td>{m.noeManba || '-'}</td>
                                                            <td>{m.nevisandeh || '-'}</td>
                                                            <td>{m.motarjem || '-'}</td>
                                                            <td>{m.nasher || '-'}</td>
                                                            <td className="text-center">
                                                                {m.salEnteshar
                                                                    ? <PersianNumber>{m.salEnteshar}</PersianNumber>
                                                                    : '-'}
                                                            </td>
                                                            <td className="text-center">
                                                                {m.nobateChap
                                                                    ? <PersianNumber>{m.nobateChap}</PersianNumber>
                                                                    : '-'}
                                                            </td>
                                                            <td>{m.codePeyvast || '-'}</td>
                                                            <td>{m.sharhPeyvast || '-'}</td>
                                                            <td>{m.vazeeyat || '-'}</td>
                                                            <td className="text-center">
                                                                {m.termUpdate || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-4">
                                            <i className="bi bi-journal-x fs-3 d-block mb-2"></i>
                                            منبعی ثبت نشده است
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}