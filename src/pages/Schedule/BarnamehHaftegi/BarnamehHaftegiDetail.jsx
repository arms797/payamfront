// src/pages/Schedule/BarnamehHaftegi/BarnamehHaftegiDetail.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { useLookup } from '../../../context/LookupContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import SignatureDisplay from '../../../components/common/SignatureDisplay';

export default function BarnamehHaftegiDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList } = useTerm();
    const { faaliats, getFaaliatName, getDayTitle, getFaaliatColor, hoursList } = useLookup();
    const { confirm, ConfirmModal } = useConfirm();
    const printRef = useRef(null);

    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // تشخیص نقش
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isModirGrooh = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByModir'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByMoaven'), [hasPermission]);
    const isAdmin = useMemo(() => user?.codeRole === 1, [user]);

    // دریافت برنامه
    const fetchProgram = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/BarnamehHaftegi/${id}`);
            if (response.data?.success) {
                setProgram(response.data.data);
            } else {
                setError('برنامه یافت نشد');
            }
        } catch (error) {
            console.error('خطا در دریافت برنامه:', error);
            toast.error('خطا در دریافت اطلاعات برنامه');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchProgram();
    }, [id, fetchProgram]);

    // پرینت
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `برنامه-هفتگی-${program?.ostadCode || ''}`,
        pageStyle: `
        @page {
            size: A4 portrait;
            margin: 4mm 5mm 4mm 5mm;
        }
        @media print {
            /* ============================================================
               تنظیمات پایه
               ============================================================ */
            * {
                box-sizing: border-box !important;
            }
            body {
                font-size: 8px !important;
                line-height: 1.15 !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
                direction: rtl !important;
            }
            .no-print {
                display: none !important;
            }

            /* ============================================================
               کارت‌ها
               ============================================================ */
            .card {
                border: 1px solid #999 !important;
                margin-bottom: 3px !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .card-header {
                background: #f0f0f0 !important;
                padding: 2px 6px !important;
                font-size: 8px !important;
                font-weight: bold !important;
                border-bottom: 1px solid #999 !important;
            }
            .card-body {
                padding: 4px 6px !important;
            }

            /* ============================================================
               کارت اطلاعات استاد - سه ستون
               ============================================================ */
            .card-body .row {
                display: flex !important;
                flex-wrap: nowrap !important;
                margin: 0 !important;
                gap: 0 !important;
            }
            .card-body .col-md-4 {
                flex: 0 0 33.333% !important;
                max-width: 33.333% !important;
                padding: 1px 3px !important;
                font-size: 8px !important;
                display: flex !important;
                align-items: baseline !important;
                gap: 2px !important;
            }
            .card-body .col-md-4 .text-muted {
                font-size: 7px !important;
                color: #555 !important;
                white-space: nowrap !important;
            }
            .card-body .col-md-4 span {
                font-size: 9px !important;
            }

            /* ============================================================
               جدول برنامه - خط‌کشی کامل و یکدست
               ============================================================ */
            .table-responsive {
                overflow: visible !important;
            }
            .table {
                font-size: 6.5px !important;
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 0 !important;
                table-layout: fixed !important;
                border: 1px solid #666 !important;
            }
            .table th,
            .table td {
                border: 1px solid #666 !important;  /* ← یکسان برای همه */
                padding: 1px 2px !important;
                text-align: center !important;
                vertical-align: middle !important;
                background-color: white !important;
                color: black !important;
            }
            /* 🔥 همه ستون‌ها حاشیه یکدست داشته باشند */
            .table th:first-child,
            .table td:first-child {
                border-right: 1px solid #666 !important;
            }
            .table th:last-child,
            .table td:last-child {
                border-left: 1px solid #666 !important;
            }
            /* حذف شادوهای استیکی */
            .table td[style*="box-shadow"] {
                box-shadow: none !important;
                border-right: 1px solid #666 !important;
            }
            .table thead th {
                background-color: #e8e8e8 !important;
                font-weight: bold !important;
                font-size: 6.5px !important;
                padding: 1px 2px !important;
            }
            .table thead th div:first-child {
                font-size: 7px !important;
            }
            .table thead th div:last-child {
                font-size: 5.5px !important;
                color: #555 !important;
            }
            .table tbody td {
                font-size: 6.5px !important;
                padding: 1px 2px !important;
            }
            .table tbody td div:first-child {
                font-size: 6.5px !important;
                font-weight: bold !important;
            }
            .table tbody td div:last-child {
                font-size: 5.5px !important;
                color: #333 !important;
            }
            .table tbody td[style*="background-color"] {
                background-color: white !important;
            }

            /* ============================================================
               خلاصه وضعیت (فقط صفحه، نه پرینت)
               ============================================================ */
            .card.mt-3.no-print {
                display: none !important;
            }

            /* ============================================================
               کارت‌های امضا - بدون border و background
               ============================================================ */
            .row.mt-3 .card {
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
            }
            .row.mt-3 .card-header {
                background: transparent !important;
                border: none !important;
                padding: 2px 4px !important;
                text-align: center !important;
                font-size: 7px !important;
                color: black !important;
            }
            .row.mt-3 .card-body {
                border: none !important;
                background: transparent !important;
                min-height: 30px !important;
                padding: 2px 3px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .row.mt-3 .card-body canvas {
                max-height: 28px !important;
                max-width: 100% !important;
            }
            .row.mt-3 .card-body .text-muted {
                font-size: 5px !important;
            }

            /* ============================================================
               عنوان چاپ و تاریخ - بدون خط اضافه
               ============================================================ */
            .print-header {
                display: flex !important;
                justify-content: center !important;  /* ← وسط‌چین */
                align-items: center !important;
                margin-bottom: 4px !important;
                border-bottom: none !important;
                border-bottom: 1px solid #ccc !important;
            }
                .print-header > div {
                text-align: center !important;
            }
            .print-header h5 {
                font-size: 10px !important;
                margin: 0 !important;
            }
            .print-header p {
                font-size: 7px !important;
                margin: 0 !important;
                color: #666 !important;
            }
            .print-title {
                font-size: 11px !important;
                font-weight: bold !important;
                text-align: center !important;
                margin: 0 !important;
            }
            .print-date {
                font-size: 7px !important;
                color: #666 !important;
                position: absolute !important;
                left: 0 !important;
                margin: 0 !important;
            }

            /* ============================================================
               جلوگیری از شکستن صفحات
               ============================================================ */
            .print-area {
                page-break-inside: avoid !important;
                width: 100% !important;
                overflow: hidden !important;
            }
            .card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
        }
    `,
        onAfterPrint: () => console.log('چاپ انجام شد'),
        onPrintError: (error) => {
            console.error('خطا در چاپ:', error);
            toast.error('خطا در چاپ');
        },
    });

    // برگشت به لیست
    const handleBackToList = () => {
        navigate('/dashboard/barnameh-haftegi-list', {
            state: {
                fromDetail: true,
                page: location.state?.page || 1,
                pageSize: location.state?.pageSize || 20,
                filters: location.state?.filters || {},
                termCode: location.state?.termCode || ''
            }
        });
    };

    // عملیات‌های تأیید
    const handleConfirmByOstad = async () => {
        const confirmed = await confirm({
            title: 'تأیید برنامه',
            message: 'آیا از تأیید نهایی این برنامه مطمئن هستید؟',
            confirmText: 'بله، تأیید می‌شود',
            confirmVariant: 'success'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/ostad/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت تأیید شد');
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تأیید برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByModir = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        const confirmed = await confirm({
            title: `${actionText} برنامه`,
            message: `آیا از ${actionText} این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} می‌شود`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/modir/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByMoaven = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        if (program?.nazarModirGrooh === 0) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه هنوز نظری ثبت نکرده است. ادامه می‌دهید؟',
                confirmText: 'بله، ادامه',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        }
        if (program?.nazarModirGrooh === 2) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه این برنامه را رد کرده است. نادیده می‌گیرید؟',
                confirmText: 'بله، نادیده می‌گیرم',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        }
        const confirmed = await confirm({
            title: `${actionText} نهایی برنامه`,
            message: `آیا از ${actionText} نهایی این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} نهایی`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/moaven/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} نهایی شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} نهایی برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'ریست برنامه',
            message: 'آیا از بازگشت این برنامه به حالت پیش‌نویس مطمئن هستید؟',
            confirmText: 'بله، ریست می‌شود',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/reset/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت به حالت پیش‌نویس بازگشت');
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ریست برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    // نمایش دکمه‌های عملیاتی
    const renderActionButtons = () => {
        if (!program) return null;
        const status = program.approveStatus;
        const isLocked = program.isLocked;

        return (
            <div className="d-flex gap-2 flex-wrap no-print">
                {isOstad && status === 'pishnevis' && !isLocked && (
                    <>
                        <button className="btn btn-warning btn-sm" onClick={() => navigate(`/dashboard/barnameh-haftegi-edit/${id}`)}>
                            <i className="bi bi-pencil me-1"></i> ویرایش
                        </button>
                        <button className="btn btn-success btn-sm" onClick={handleConfirmByOstad} disabled={submitting || !program.isComplete}>
                            {submitting ? 'در حال...' : 'تأیید'}
                        </button>
                    </>
                )}
                {isModirGrooh && status === 'tayeed_ostad' && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmByModir(1)} disabled={submitting}>تأیید</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleConfirmByModir(2)} disabled={submitting}>رد</button>
                    </>
                )}
                {isMoaven && status !== 'tayeed_moaven' && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmByMoaven(1)} disabled={submitting}>تأیید نهایی</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleConfirmByMoaven(2)} disabled={submitting}>رد نهایی</button>
                    </>
                )}
                {(isMoaven || isAdmin) && status !== 'pishnevis' && isLocked && (
                    <button className="btn btn-warning btn-sm" onClick={handleReset} disabled={submitting}>ریست</button>
                )}
                <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>
                    <i className="bi bi-printer me-1"></i> پرینت
                </button>
            </div>
        );
    };

    // وضعیت برنامه (Badge)
    const getStatusBadge = (status) => {
        const map = {
            'pishnevis': { label: 'پیش‌نویس', className: 'bg-secondary' },
            'tayeed_ostad': { label: 'تایید استاد', className: 'bg-info' },
            'tayeed_modir': { label: 'تایید مدیر گروه', className: 'bg-primary' },
            'tayeed_moaven': { label: 'تایید معاون', className: 'bg-success' },
        };
        const info = map[status] || map['pishnevis'];
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    const getMarkazName = (markazId) => {
        if (!markazId) return ' ';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || `مرکز ${markazId}`;
    };

    const getNoeHamkariText = (noe) => {
        const map = { 1: 'هیات علمی پیام نور', 2: 'هیات علمی غیر پیام نور', 3: 'مدرس مدعو', 4: 'هیات علمی پیام نور (سایر استان‌ها)' };
        return map[noe] || '-';
    };

    const getMaghtaText = (maghta) => {
        const map = { 5: 'کارشناسی', 10: 'کارشناسی ارشد', 15: 'دکتری' };
        return map[maghta] || maghta || '-';
    };

    // ============================================================
    // جدول جدید: مینیمال و شفاف
    // ============================================================
    const renderWeekTable = () => {
        if (!program?.details) return null;

        const activeHours = hoursList.filter(h => h.hozoori || h.majazi);
        const grouped = {};
        program.details.forEach(item => {
            const day = item.roozeHafteh;
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(item);
        });
        const sortedDays = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

        return (
            <div className="card-body p-0">
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table
                        className="table table-bordered table-sm text-center"
                        style={{
                            borderCollapse: 'collapse',
                            minWidth: '700px',
                            marginBottom: 0
                        }}
                    >
                        <thead className="table-light">
                            <tr>
                                <th style={{ position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10, minWidth: '80px', boxShadow: 'inset -2px 0 0 #dee2e6' }}>روز</th>
                                <th style={{ minWidth: '80px', maxWidth: '100px' }}>مرکز اصلی روز</th>
                                {activeHours.map(hour => (
                                    <th key={hour.codeSaat} style={{ minWidth: '100px', padding: '4px 2px' }}>
                                        <div>{hour.codeSaat}</div>
                                        <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#666' }}>
                                            <PersianNumber>{hour.saatShoroo}</PersianNumber>-
                                            <PersianNumber>{hour.saatPayan}</PersianNumber>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDays.map(dayCode => {
                                const items = grouped[dayCode];
                                const firstItem = items[0];
                                const dayMarkazName = getMarkazName(firstItem?.markazId); // ✅ حرف کوچک

                                const hourMap = {};
                                items.forEach(item => {
                                    activeHours.forEach(hour => {
                                        const h = hour.codeSaat;
                                        const activityId = item[h.toLowerCase()];
                                        const markazId = item[`markazId${h}`]; // ✅ حرف کوچک
                                        if (activityId) {
                                            hourMap[h] = {
                                                activityId: parseInt(activityId, 10),
                                                markazId: markazId ? parseInt(markazId, 10) : null
                                            };
                                        }
                                    });
                                });

                                return (
                                    <tr key={dayCode} style={{ height: '70px' }}>
                                        <td style={{ position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5, fontWeight: 'bold', verticalAlign: 'middle', height: '60px', boxShadow: 'inset -2px 0 0 #dee2e6' }}>
                                            {getDayTitle(dayCode)}
                                        </td>
                                        <td className="align-middle" style={{ height: '60px' }}>
                                            {dayMarkazName || '-'}
                                        </td>
                                        {activeHours.map(hour => {
                                            const cell = hourMap[hour.codeSaat];
                                            const activityId = cell?.activityId || null;
                                            const hasActivity = !!activityId;
                                            const markazName = getMarkazName(cell?.markazId); // ✅ حرف کوچک
                                            const color = getFaaliatColor(activityId);

                                            return (
                                                <td key={hour.codeSaat} style={{ minWidth: '100px', height: '60px', backgroundColor: hasActivity ? (color || '#e8f5e9') : '', verticalAlign: 'middle', position: 'relative' }}>
                                                    {hasActivity ? (
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{getFaaliatName(activityId)}</div>
                                                            <div style={{ fontSize: '11px', color: '#000000' }}>{markazName || '-'}</div>
                                                        </div>
                                                    ) : (
                                                        <span>&nbsp;</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    // ============================================================
    // خلاصه وضعیت (فقط صفحه، نه پرینت)
    // ============================================================
    const renderApprovalSummary = () => {
        if (!program) return null;
        return (
            <div className="card mt-3 no-print">
                <div className="card-body d-flex flex-wrap gap-3 align-items-center" style={{ padding: '8px 16px' }}>
                    <span className="fw-bold">وضعیت:</span>
                    {getStatusBadge(program.approveStatus)}
                    <span className="text-muted">{program.totalSessions || 0} جلسه از {program.requiredSessions || 0}</span>
                    {program.isComplete ? <span className="badge bg-success">✅ کامل</span> : <span className="badge bg-warning text-dark">⚠️ ناقص</span>}
                    {program.isLocked && <span className="badge bg-danger">🔒 قفل</span>}
                    <span className="text-muted small">استاد: {program.nazarElmi === 1 ? '✅' : program.nazarElmi === 2 ? '❌' : '⏳'}</span>
                    <span className="text-muted small">مدیرگروه: {program.nazarModirGrooh === 1 ? '✅' : program.nazarModirGrooh === 2 ? '❌' : '⏳'}</span>
                    <span className="text-muted small">معاون: {program.nazarMoaven === 1 ? '✅' : program.nazarMoaven === 2 ? '❌' : '⏳'}</span>
                </div>
            </div>
        );
    };

    // ============================================================
    // کارت‌های امضا (چاپی و نمایشی)
    // ============================================================
    const renderSignatures = () => {
        if (!program) return null;
        const hasOstad = program.nazarElmi === 1;
        const hasModir = program.nazarModirGrooh === 1;
        const hasMoaven = program.nazarMoaven === 1;

        const sigStyle = {
            minHeight: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        };

        return (
            <div className="row mt-3">
                <div className="col-4">
                    <div className="card h-100 border-0">  {/* ← حذف border */}
                        <div className="card-header py-1 bg-light text-center">  {/* ← وسط‌چین */}
                            <small className="fw-bold">امضا استاد</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasOstad ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={null}
                                        textTop={program.ostadName}
                                        textBottom={`کد: ${program.ostadCode || ''}`}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {new Date(program.tarikhElmi).toLocaleDateString('fa-IR')}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>ثبت نشده</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-4">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا مدیر گروه</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasModir ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={null}
                                        textTop="مدیر گروه"
                                        textBottom={program.roleMarkazModirGrooh || ''}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {new Date(program.tarikhModirGrooh).toLocaleDateString('fa-IR')}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>ثبت نشده</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-4">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا معاون آموزشی</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasMoaven ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={null}
                                        textTop="معاون آموزشی"
                                        textBottom={program.roleMarkazMoaven || ''}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {new Date(program.tarikhMoaven).toLocaleDateString('fa-IR')}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>ثبت نشده</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // رندر اصلی
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

    if (error || !program) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'برنامه یافت نشد'}
                </div>
                <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="bi bi-arrow-right me-1"></i> بازگشت به لیست
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* هدر + دکمه‌ها */}
            <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                <div>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={handleBackToList}>
                        <i className="bi bi-arrow-right me-1"></i> بازگشت
                    </button>
                    <h5 className="d-inline-block mb-0 mx-4">برنامه حضور هفتگی استاد  {program.ostadName} {program.ostadLastName}</h5>
                </div>
                {renderActionButtons()}
            </div>

            {/* محتوای قابل چاپ */}
            <div ref={printRef} className="print-area">

                {/* ============================================================
                    عنوان چاپ و تاریخ - وسط‌چین، بدون خط جداکننده
                    ============================================================ */}
                <div className="d-none d-print-block print-header">
                    <div className="print-date">
                        تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}
                    </div>
                    <div className="print-title">
                        برنامه حضور هفتگی اساتید
                    </div>
                </div>

                {/* ============================================================
                    کارت اطلاعات استاد - سه ردیف، سه ستون
                    ============================================================ */}
                <div className="card mb-3">
                    <div className="card-body" style={{ padding: '12px 20px' }}>
                        {/* ردیف اول: نام، نام خانوادگی، کد استادی */}
                        <div className="row g-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نام:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadName || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نام خانوادگی:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadLastName || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>کد استادی:</small>
                                <span style={{ fontSize: '15px' }}><PersianNumber>{program.ostadCode}</PersianNumber></span>
                            </div>
                        </div>

                        {/* ردیف دوم: رشته، مرتبه علمی/مقطع، نوع همکاری */}
                        <div className="row g-2 mt-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>رشته تحصیلی:</small>
                                <span style={{ fontSize: '15px' }}>{program.reshteh || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {program.noeHamkari === 1 || program.noeHamkari === 2 || program.noeHamkari === 4
                                        ? 'مرتبه علمی:' : 'مقطع تحصیلی:'}
                                </small>
                                <span style={{ fontSize: '15px' }}>
                                    {program.noeHamkari === 1 || program.noeHamkari === 2 || program.noeHamkari === 4
                                        ? (program.martabehElmi || '-')
                                        : (program.maghta ? getMaghtaText(program.maghta) : '-')}
                                </span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نوع همکاری:</small>
                                <span style={{ fontSize: '15px' }}>{getNoeHamkariText(program.noeHamkari)}</span>
                            </div>
                        </div>

                        {/* ردیف سوم: مرکز، سمت اجرایی، شماره تماس */}
                        <div className="row g-2 mt-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>مرکز:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadMarkaz || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>سمت اجرایی:</small>
                                <span style={{ fontSize: '15px' }}>{program.postEjraei || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>شماره تماس:</small>
                                <span style={{ fontSize: '15px' }}>
                                    {user ? <PersianNumber>{program.mobile || '-'}</PersianNumber> : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول برنامه - مینیمال */}
                {/* 
                    <div className="card mb-2">
                        <div className="card-body p-0">
                            {renderWeekTable()}
                        </div>
                    </div>
                */}
                {renderWeekTable()}

                {/* خلاصه وضعیت (فقط صفحه) */}
                {renderApprovalSummary()}

                {/* کارت‌های امضا */}
                {renderSignatures()}


            </div>

            <ConfirmModal />
        </div>
    );
}