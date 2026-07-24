import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';

/**
 * کامپوننت انتخاب مرکز با دو سطح (استان و مرکز)
 * @param {Object} props
 * @param {string} props.value - مقدار انتخاب شده (Id مرکز)
 * @param {function} props.onChange - تابع تغییر مقدار
 * @param {string} props.label - برچسب فیلد
 * @param {string} props.placeholder - placeholder
 * @param {boolean} props.required - اجباری بودن
 * @param {string} props.className - کلاس‌های اضافی
 */
export default function MarkazSelector({
    value,
    onChange,
    label = 'مرکز',
    placeholder = 'انتخاب مرکز...',
    required = false,
    className = ''
}) {
    const { user, currentRoleId } = useAuth();
    const { markazList, loading } = useMarkaz();

    // ============================================================
    // Stateهای داخلی
    // ============================================================
    const [selectedOstanCode, setSelectedOstanCode] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState(value || '');

    // ============================================================
    // 🔥 دریافت نقش فعال از لیست نقش‌ها بر اساس currentRoleId
    // ============================================================
    const activeRole = useMemo(() => {
        if (!user?.roles || !currentRoleId) return null;
        return user.roles.find(role => role.id === currentRoleId) || null;
    }, [user, currentRoleId]);

    // ============================================================
    // 🔥 استخراج CodeRole و IsAdmin از نقش فعال
    // ============================================================
    const codeRole = useMemo(() => {
        return activeRole?.codeRole || 4;
    }, [activeRole]);

    const isAdmin = useMemo(() => {
        return activeRole?.isAdmin || false;
    }, [activeRole]);

    // ============================================================
    // دریافت استان و مرکز کاربر فعلی (از JWT)
    // ============================================================
    const userOstanCode = useMemo(() => {
        return user?.markazOstan || null;
    }, [user]);

    const userMarkazId = useMemo(() => {
        return user?.markazId || null;
    }, [user]);

    // ============================================================
    // 🔥 تابع کمکی برای نمایش نام مرکز بر اساس Level
    // ============================================================
    const getDisplayName = (markaz) => {
        if (!markaz) return '';

        // سطح 2: سازمان مرکزی
        if (markaz.level === 2) {
            return 'سازمان مرکزی';
        }

        // سطح 3: ستاد استان
        if (markaz.level === 3) {
            return `ستاد استان ${markaz.naamOstan || ''}`;
        }

        // سطح 4: نام مرکز
        return markaz.naamMarkaz || '';
    };

    // ============================================================
    // لیست استان‌های قابل دسترس بر اساس CodeRole
    // ============================================================
    const accessibleOstans = useMemo(() => {
        if (!markazList || markazList.length === 0) return [];

        let filteredMarkaz = markazList.filter(m => m.vazeeyat !== false);

        // 1️⃣ ادمین سامانه (CodeRole=1) و ادمین سازمان (CodeRole=2) → همه استان‌ها
        if (codeRole === 1 || codeRole === 2) {
            // همه استان‌ها
        }
        // 2️⃣ ادمین استان (CodeRole=3) → فقط استان خودش
        else if (codeRole === 3) {
            if (!userOstanCode) return [];
            filteredMarkaz = filteredMarkaz.filter(m => m.codeOstan === userOstanCode);
        }
        // 3️⃣ ادمین مرکز (CodeRole=4) → فقط استان مرکز خودش
        else if (codeRole === 4) {
            if (!userOstanCode) return [];
            filteredMarkaz = filteredMarkaz.filter(m => m.codeOstan === userOstanCode);
        }

        // استخراج استان‌های یکتا
        const uniqueOstans = filteredMarkaz
            .filter(m => m.codeOstan)
            .reduce((acc, curr) => {
                if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                    acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                }
                return acc;
            }, []);

        return uniqueOstans;
    }, [markazList, codeRole, userOstanCode]);

    // ============================================================
    // لیست مراکز قابل دسترس بر اساس استان انتخاب‌شده و CodeRole
    // ============================================================
    const accessibleMarkazs = useMemo(() => {
        if (!markazList || !selectedOstanCode) return [];

        let filtered = markazList.filter(m =>
            m.codeOstan === selectedOstanCode &&
            m.vazeeyat !== false
        );

        // اگر CodeRole=4 باشد، فقط مرکز خودش را ببیند
        if (codeRole === 4 && userMarkazId) {
            filtered = filtered.filter(m => m.id === userMarkazId);
        }

        return filtered;
    }, [markazList, selectedOstanCode, codeRole, userMarkazId]);

    // ============================================================
    // تنظیم مقدار اولیه (اگر value داده شده باشد)
    // ============================================================
    useEffect(() => {
        if (value) {
            setSelectedMarkazId(value);
            const markaz = markazList?.find(m => m.id === parseInt(value));
            if (markaz?.codeOstan) {
                setSelectedOstanCode(markaz.codeOstan);
            }
        }
    }, [value, markazList]);

    // ============================================================
    // تغییر استان
    // ============================================================
    const handleOstanChange = (e) => {
        const ostanCode = e.target.value;
        setSelectedOstanCode(ostanCode);
        setSelectedMarkazId('');
        onChange('');
    };

    // ============================================================
    // تغییر مرکز
    // ============================================================
    const handleMarkazChange = (e) => {
        const markazId = e.target.value;
        setSelectedMarkazId(markazId);
        onChange(markazId);
    };

    // ============================================================
    // اگر در حال بارگذاری باشد
    // ============================================================
    if (loading) {
        return (
            <div className={className}>
                {label && <label className="form-label">{label}</label>}
                <div className="text-muted">در حال بارگذاری مراکز...</div>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && <label className="form-label">{label} {required && <span className="text-danger">*</span>}</label>}

            {/* ============================================================
                کومبوی استان
                ============================================================ */}
            <select
                className="form-select mb-2"
                value={selectedOstanCode}
                onChange={handleOstanChange}
                disabled={codeRole === 3 || codeRole === 4}
            >
                <option value="">انتخاب استان...</option>
                {accessibleOstans.map(ostan => (
                    <option key={ostan.codeOstan} value={ostan.codeOstan}>
                        {ostan.naamOstan}
                    </option>
                ))}
            </select>

            {/* ============================================================
                کومبوی مرکز با نام‌های اصلاح‌شده
                ============================================================ */}
            <select
                className="form-select"
                value={selectedMarkazId}
                onChange={handleMarkazChange}
                required={required}
                disabled={!selectedOstanCode || accessibleMarkazs.length === 0}
            >
                <option value="">{placeholder}</option>
                {accessibleMarkazs.map(markaz => {
                    const displayName = getDisplayName(markaz);
                    // اگر نام نمایشی خالی بود، از naamMarkaz استفاده کن
                    const finalName = displayName || markaz.naamMarkaz || `مرکز ${markaz.id}`;

                    return (
                        <option key={markaz.id} value={markaz.id}>
                            {finalName}
                            {/* نمایش Level به عنوان Badge کوچک (اختیاری) */}
                            {/*markaz.level && (
                                <span className="text-muted ms-1" style={{ fontSize: '10px' }}>
                                    (L{markaz.level})
                                </span>
                            )*/}
                        </option>
                    );
                })}
            </select>

            {/* ============================================================
                نمایش وضعیت دسترسی
                ============================================================ */}
            {codeRole === 3 && (
                <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    شما فقط می‌توانید برای استان خود کاربر تعریف کنید
                </small>
            )}
            {codeRole === 4 && (
                <small className="text-muted d-block mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    شما فقط می‌توانید برای مرکز خود کاربر تعریف کنید
                </small>
            )}
        </div>
    );
}