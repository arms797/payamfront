// src/pages/Profile/SignatureManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';  // ← مستقیماً از api استفاده می‌کنیم
import SignaturePad from '../../components/common/SignaturePad';

export default function SignatureManager() {
    const { user } = useAuth();
    const signatureRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [signatureInfo, setSignatureInfo] = useState({
        signature: null,
        position: 'BC',
        canEditSignature: false,
        canEditPosition: false,
        hasSignature: false
    });
    const [saving, setSaving] = useState(false);

    // ============================================================
    // دریافت امضای کاربر
    // ============================================================
    useEffect(() => {
        const fetchSignature = async () => {
            try {
                const response = await api.get('/Signature/my-signature');
                if (response.data?.success && response.data?.data) {
                    const data = response.data.data;
                    setSignatureInfo({
                        signature: data.signature,
                        position: data.position || 'BC',
                        canEditSignature: data.canEditSignature || false,
                        canEditPosition: data.canEditPosition || false,
                        hasSignature: data.hasSignature || false
                    });
                }
            } catch (error) {
                console.error('خطا در دریافت امضا:', error);
                toast.error('خطا در دریافت امضا');
            } finally {
                setLoading(false);
            }
        };
        fetchSignature();
    }, []);

    // ============================================================
    // ذخیره امضا
    // ============================================================
    const handleSaveSignature = async (data) => {
        setSaving(true);
        try {
            const response = await api.post('/Signature/save', {
                signature: data.signatureData,
                position: data.position
            });

            if (response.data?.success) {
                toast.success('امضا با موفقیت ذخیره شد');
                setSignatureInfo(prev => ({
                    ...prev,
                    signature: data.signatureData,
                    position: data.position,
                    hasSignature: true,
                    canEditSignature: false,
                    canEditPosition: false
                }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره امضا');
            //console.log('error signature is :', error.response.data)
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // تغییر موقعیت (بدون تغییر امضا)
    // ============================================================
    const handleChangePosition = async (data) => {
        setSaving(true);
        try {
            const response = await api.patch('/Signature/change-position', {
                position: data.position
            });

            if (response.data?.success) {
                toast.success('موقعیت امضا با موفقیت تغییر کرد');
                setSignatureInfo(prev => ({
                    ...prev,
                    position: data.position,
                    canEditPosition: false
                }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تغییر موقعیت');
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // نام کامل و سمت کاربر
    // ============================================================
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const roleName = user?.currentRoleName || '';

    // موقعیت ذخیره‌شده از دیتابیس را parse کنید
    const parsePosition = (pos) => {
        if (!pos) return { mode: 'preset', value: 'BC' };
        // اگر به صورت "x:15,y:-20" بود
        const match = pos.match(/x:(-?\d+),y:(-?\d+)/);
        if (match) {
            return {
                mode: 'free',
                value: { x: parseInt(match[1]), y: parseInt(match[2]) }
            };
        }
        // در غیر این صورت، یکی از ۱۱ حالت است
        return { mode: 'preset', value: pos };
    };

    const positionData = parsePosition(signatureInfo.position);

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

    return (
        <div className="container-fluid py-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-pen me-2"></i>
                                مدیریت امضا
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* ============================================================
                                اطلاعات کاربر
                                ============================================================ */}
                            <div className="alert alert-info">
                                <div className="row">
                                    <div className="col-md-6">
                                        <strong>نام:</strong> {fullName || '-'}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>سمت:</strong> {roleName || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* ============================================================
                                وضعیت امضا
                                ============================================================ */}
                            <div className="mb-3">
                                <div className="d-flex gap-3 flex-wrap">
                                    <span className="badge bg-secondary">
                                        وضعیت ثبت امضا: {signatureInfo.hasSignature ? '✅ ثبت شده' : '❌ ثبت نشده'}
                                    </span>
                                    <span className={`badge ${signatureInfo.canEditSignature ? 'bg-success' : 'bg-danger'}`}>
                                        ویرایش امضا: {signatureInfo.canEditSignature ? '✅ فعال' : '❌ غیرفعال'}
                                    </span>
                                    <span className={`badge ${signatureInfo.canEditPosition ? 'bg-success' : 'bg-danger'}`}>
                                        ویرایش موقعیت متن روی امضا: {signatureInfo.canEditPosition ? '✅ فعال' : '❌ غیرفعال'}
                                    </span>
                                </div>
                            </div>

                            {/* ============================================================
                                کامپوننت امضا
                                ============================================================ */}
                            <SignaturePad
                                ref={signatureRef}
                                onSave={handleSaveSignature}
                                userFullName={fullName}
                                userRole={roleName}
                                defaultPosition={positionData.mode === 'preset' ? positionData.value : 'BC'}
                                defaultOffset={positionData.mode === 'free' ? positionData.value : null}
                                canEditSignature={signatureInfo.canEditSignature}
                                canEditPosition={signatureInfo.canEditPosition}
                                hasExistingSignature={signatureInfo.hasSignature}
                                existingSignatureData={signatureInfo.signature}
                                textFontSize={18}
                                textOpacity={0.5}
                                textColor="#1a1a1a"
                                showPreviewBox={false}
                                label="امضای من"
                                width={300}
                                height={300}
                            />

                            {/* ============================================================
                                راهنما
                                ============================================================ */}
                            <div className="mt-3 text-muted small">
                                <i className="bi bi-info-circle me-1"></i>
                                {!signatureInfo.hasSignature && (
                                    <>
                                        <span>هنوز امضایی ثبت نشده است.</span>
                                        <br />
                                        <span className="text-primary">
                                            روی کادر سفید کلیک کنید و با ماوس یا انگشت، امضای خود را رسم کنید سپس روی دکمه "ذخیره امضا" کلیک نمایید.
                                        </span>
                                    </>
                                )}
                                {signatureInfo.hasSignature && !signatureInfo.canEditSignature && !signatureInfo.canEditPosition &&
                                    'امضا و موقعیت آن قفل است. برای تغییر با ادمین تماس بگیرید.'
                                }
                                {signatureInfo.hasSignature && signatureInfo.canEditPosition && !signatureInfo.canEditSignature &&
                                    'می‌توانید موقعیت متن روی امضا را تغییر دهید.'
                                }
                                {signatureInfo.hasSignature && signatureInfo.canEditSignature &&
                                    'می‌توانید امضا یا موقعیت آن را ویرایش کنید.'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}