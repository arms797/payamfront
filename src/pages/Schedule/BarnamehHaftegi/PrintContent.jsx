import React from 'react';
//import logo from '../../../assets/logo.png';
import logo from '../../../../public/logo.png';
import SignatureDisplay from '../../../components/common/SignatureDisplay';


const PrintContent = ({
    program,
    days,
    hours,
    getDayTitle,
    getFaaliatName,
    getMarkazDisplayName,
    markazList,
    getTermTitle
}) => {
    if (!program) return null;


    // ============================================================
    // توابع کمکی
    // ============================================================

    const toPersian = (num) => {
        if (num === undefined || num === null || num === '') return '-';
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('fa-IR');
        } catch {
            return '-';
        }
    };

    const getMarkazName = (markazId) => {
        if (!markazId) return '-';
        const markaz = markazList?.find(m => m.id === markazId);
        if (!markaz) return '-';

        if (markaz.level === 2) return 'سازمان مرکزی';
        if (markaz.level === 3) {
            return `ستاد استان ${markaz.naamOstan || ''}`.trim() || 'ستاد استان';
        }
        return markaz.naamMarkaz || `مرکز ${markaz.id}`;
    };

    // ============================================================
    // پردازش جدول
    // ============================================================
    const activeHours = hours?.filter(h => h.hozoori || h.majazi) || [];

    const grouped = {};
    program.details?.forEach(item => {
        const day = item.roozeHafteh;
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(item);
    });

    const sortedDays = Object.keys(grouped).sort(
        (a, b) => parseInt(a) - parseInt(b)
    );

    // ============================================================
    // استایل‌ها
    // ============================================================
    const styles = {
        container: {
            padding: '5px 10px',
            direction: 'rtl',
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        header: {
            textAlign: 'center',
            marginBottom: '15px',
            //borderBottom: '2px solid #333',
            paddingBottom: '10px'
        },
        headerLogo: {
            width: '70px',
            height: 'auto',
            marginBottom: '8px'
        },
        headerTitle: {
            fontSize: '15px',
            fontWeight: 'bold',
            margin: '0 0 5px 0',
            color: '#000'
        },
        headerSubtitle: {
            fontSize: '12px',
            color: '#555',
            margin: 0
        },
        infoSection: {
            marginBottom: '12px',
            padding: '8px 10px',
            backgroundColor: '#f9f9f9',
            //border: '0px solid #ddd',
            borderRadius: '4px'
        },
        infoRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            fontSize: '11px',
            flexWrap: 'wrap'
        },
        infoItem: {
            flex: '1 1 25%',
            minWidth: '150px',
            padding: '2px 5px'
        },
        infoLabel: {
            fontWeight: 'bold',
            color: '#333',
            marginLeft: '4px'
        },
        infoValue: {
            color: '#000'
        },
        table: {
            width: '100%',//'clac(100% - 4px)'
            borderCollapse: 'collapse',
            fontSize: '10px',
            marginTop: '10px',
            tableLayout: 'fixed'
        },
        th: {
            border: '1px solid #333',
            padding: '5px 3px',
            textAlign: 'center',
            backgroundColor: '#e8e8e8',
            fontWeight: 'bold',
            fontSize: '10px',
            verticalAlign: 'middle'
        },
        td: {
            border: '1px solid #333',
            padding: '4px 3px',
            textAlign: 'center',
            verticalAlign: 'middle',
            fontSize: '10px',
            height: '35px'
        },
        tdDay: {
            fontWeight: 'bold',
            backgroundColor: '#f5f5f5',
            width: '8%'
        },
        tdMarkaz: {
            backgroundColor: '#fafafa',
            width: '10%',
            fontSize: '9px'
        },
        tdActivity: {
            width: '12%',
            fontSize: '9px',
            lineHeight: '1.3'
        },
        tdActivityName: {
            fontWeight: 'bold',
            marginBottom: '2px',
            fontSize: '9px'
        },
        tdActivityMarkaz: {
            color: '#555',
            fontSize: '8px'
        },
        signaturesSection: {
            marginTop: '25px',
            paddingTop: '15px',
            //borderTop: '1px dashed #999',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px'
        },
        signatureBox: {
            flex: '1',
            textAlign: 'center',
            padding: '0 10px'
        },
        signatureTitle: {
            fontWeight: 'bold',
            marginBottom: '5px',
            fontSize: '11px'
        },
        signatureName: {
            fontSize: '10px',
            color: '#333',
            marginBottom: '3px'
        },
        signatureDate: {
            fontSize: '9px',
            color: '#666',
            marginTop: '3px'
        },
        signatureLine: {
            marginTop: '25px',
            //borderTop: '1px solid #333',
            width: '80%',
            margin: '25px auto 0'
        },
        footer: {
            marginTop: '15px',
            textAlign: 'center',
            fontSize: '9px',
            color: '#666',
            //borderTop: '1px solid #ccc',
            paddingTop: '8px'
        }
    };

    // ============================================================
    // رندر
    // ============================================================
    return (
        <div style={styles.container}>
            {/* هدر */}
            <div style={styles.header}>

                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    fontSize: '9px',
                    color: '#666'
                }}>
                    <div style={styles.header}>
                        تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}
                    </div>

                </div>
                <img src={logo} alt="آرم دانشگاه" style={styles.headerLogo} />
                <h2 style={styles.headerTitle}>
                    برنامه حضور هفتگی اساتید محترم دانشگاه پیام نور استان {program.ostadMarkaz?.naamOstan}
                </h2>
                <p style={styles.headerSubtitle}>
                    {toPersian(getTermTitle(program.codeTerm))}
                </p>
            </div>

            {/* اطلاعات استاد */}
            <div style={styles.infoSection}>
                <div style={styles.infoRow}>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>کد استادی:</span>
                        <span style={styles.infoValue}>{toPersian(program.ostadCode)}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>نام و نام خانوادگی:</span>
                        <span style={styles.infoValue}>
                            {program.ostadName} {program.ostadLastName}
                        </span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>شماره تماس:</span>
                        <span style={styles.infoValue}>{toPersian(program.mobile || '-')}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>محل خدمت:</span>
                        <span style={styles.infoValue}>
                            {program.ostadMarkaz?.naamMarkaz || '-'}
                        </span>
                    </div>
                </div>

                <div style={styles.infoRow}>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>رشته تحصیلی:</span>
                        <span style={styles.infoValue}>{program.reshteh || '-'}</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>نوع همکاری:</span>
                        <span style={styles.infoValue}>
                            {program.noeHamkari === 1 ? 'هیات علمی پیام نور' :
                                program.noeHamkari === 2 ? 'مدعو(هیات علمی سایر دانشگاههای دولتی)' :
                                    program.noeHamkari === 3 ? 'مدرس مدعو' :
                                        program.noeHamkari === 4 ? 'هیات علمی پیام نور (سایر استان‌ها)' : '-'}
                        </span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>
                            {program.noeHamkari === 3 ? 'مقطع:' : 'مرتبه علمی:'}
                        </span>
                        <span style={styles.infoValue}>
                            {program.martabehElmi || ' '}
                        </span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoLabel}>پست اجرایی:</span>
                        <span style={styles.infoValue}>{program.postEjraei || '-'}</span>
                    </div>
                </div>
            </div>

            {/* جدول برنامه هفتگی */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{ ...styles.th, ...styles.tdDay }}>روز / ساعت</th>
                        <th style={{ ...styles.th, ...styles.tdMarkaz }}>مرکز</th>
                        {activeHours.map(hour => (
                            <th key={hour.codeSaat} style={styles.th}>
                                <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                                    {hour.codeSaat}
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: 'normal', color: '#555' }}>
                                    {toPersian(hour.saatShoroo)}-{toPersian(hour.saatPayan)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedDays.map(dayCode => {
                        const items = grouped[dayCode];
                        const firstItem = items[0];
                        const dayMarkazName = getMarkazName(firstItem?.markazId);

                        const hourMap = {};
                        items.forEach(item => {
                            activeHours.forEach(hour => {
                                const h = hour.codeSaat;
                                const activityId = item[h.toLowerCase()];
                                const markazId = item[`markazId${h}`];
                                if (activityId) {
                                    hourMap[h] = {
                                        activityId: parseInt(activityId, 10),
                                        markazId: markazId ? parseInt(markazId, 10) : null
                                    };
                                }
                            });
                        });

                        return (
                            <tr key={dayCode}>
                                <td style={{ ...styles.td, ...styles.tdDay }}>
                                    {getDayTitle(dayCode)}
                                </td>
                                <td style={{ ...styles.td, ...styles.tdMarkaz }}>
                                    {dayMarkazName}
                                </td>
                                {activeHours.map(hour => {
                                    const cell = hourMap[hour.codeSaat];
                                    const hasActivity = !!cell?.activityId;
                                    const faaliatName = hasActivity
                                        ? getFaaliatName(cell.activityId)
                                        : '';
                                    const markazName = cell?.markazId
                                        ? getMarkazName(cell.markazId)
                                        : '';

                                    return (
                                        <td
                                            key={hour.codeSaat}
                                            style={{ ...styles.td, ...styles.tdActivity }}
                                        >
                                            {hasActivity ? (
                                                <div>
                                                    <div style={styles.tdActivityName}>
                                                        {faaliatName}
                                                    </div>
                                                    {markazName && (
                                                        <div style={styles.tdActivityMarkaz}>
                                                            {markazName}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#ccc' }}> </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* ============================================================
    امضاها با استفاده از کامپوننت SignatureDisplay
    ============================================================ */}
            <div style={styles.signaturesSection}>
                {/* ۱. امضا استاد */}
                <div style={styles.signatureBox}>
                    <div style={styles.signatureTitle}>امضا استاد</div>
                    {program.nazarElmi === 1 && signatures[program.ostadUserId]?.signature ? (
                        <SignatureDisplay
                            signatureData={signatures[program.ostadUserId]?.signature}
                            textTop={program.ostadName}
                            textBottom={`کد: ${toPersian(program.ostadCode)}`}
                            position={signatures[program.ostadUserId]?.position || 'BC'}
                            width={160}
                            height={55}
                            textFontSize={9}
                        />
                    ) : (
                        <div style={{
                            minHeight: '55px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '9px',
                            fontStyle: 'italic'
                        }}>
                            {program.nazarElmi === 1 || ' '}
                        </div>
                    )}
                    {program.tarikhElmi && (
                        <div style={styles.signatureDate}>
                            تاریخ: {formatDate(program.tarikhElmi)}
                        </div>
                    )}
                </div>

                {/* ۲. امضا مدیر گروه */}
                <div style={styles.signatureBox}>
                    <div style={styles.signatureTitle}>امضا مدیر گروه</div>
                    {program.nazarModirGrooh === 1 && signatures[program.userIdModirGrooh]?.signature ? (
                        <SignatureDisplay
                            signatureData={signatures[program.userIdModirGrooh]?.signature}
                            textTop="مدیر گروه"
                            textBottom={program.roleMarkazModirGrooh || ''}
                            position={signatures[program.userIdModirGrooh]?.position || 'BC'}
                            width={160}
                            height={55}
                            textFontSize={9}
                        />
                    ) : (
                        <div style={{
                            minHeight: '55px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '9px',
                            fontStyle: 'italic'
                        }}>
                            {program.nazarModirGrooh === 1 || ' '}
                        </div>
                    )}
                    {program.tarikhModirGrooh && (
                        <div style={styles.signatureDate}>
                            تاریخ: {formatDate(program.tarikhModirGrooh)}
                        </div>
                    )}
                </div>

                {/* ۳. امضا رئیس مرکز */}
                <div style={styles.signatureBox}>
                    <div style={styles.signatureTitle}>امضا رئیس مرکز</div>
                    {program.nazarRaeisMarkaz === 1 && signatures[program.userIdRaeisMarkaz]?.signature ? (
                        <SignatureDisplay
                            signatureData={signatures[program.userIdRaeisMarkaz]?.signature}
                            textTop="رئیس مرکز"
                            textBottom={program.roleMarkazRaeisMarkaz || ''}
                            position={signatures[program.userIdRaeisMarkaz]?.position || 'BC'}
                            width={160}
                            height={55}
                            textFontSize={9}
                        />
                    ) : (
                        <div style={{
                            minHeight: '55px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '9px',
                            fontStyle: 'italic'
                        }}>
                            {program.nazarRaeisMarkaz === 1 || ' '}
                        </div>
                    )}
                    {program.tarikhRaeisMarkaz && (
                        <div style={styles.signatureDate}>
                            تاریخ: {formatDate(program.tarikhRaeisMarkaz)}
                        </div>
                    )}
                </div>

                {/* ۴. امضا معاون آموزشی */}
                <div style={styles.signatureBox}>
                    <div style={styles.signatureTitle}>امضا معاون آموزشی</div>
                    {program.nazarMoaven === 1 && signatures[program.userIdMoaven]?.signature ? (
                        <SignatureDisplay
                            signatureData={signatures[program.userIdMoaven]?.signature}
                            textTop="معاون آموزشی"
                            textBottom={program.roleMarkazMoaven || ''}
                            position={signatures[program.userIdMoaven]?.position || 'BC'}
                            width={160}
                            height={55}
                            textFontSize={9}
                        />
                    ) : (
                        <div style={{
                            minHeight: '55px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '9px',
                            fontStyle: 'italic'
                        }}>
                            {program.nazarMoaven === 1 || ' '}
                        </div>
                    )}
                    {program.tarikhMoaven && (
                        <div style={styles.signatureDate}>
                            تاریخ: {formatDate(program.tarikhMoaven)}
                        </div>
                    )}
                </div>
            </div>

            {/* فوتر */}

        </div>
    );
};

export default PrintContent;