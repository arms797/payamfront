import React, { useEffect } from 'react';
import Select from 'react-select';
import VirtualizedSelect from './VirtualizedSelect';
import { useCascadingFilters } from '../../hooks/useCascadingFilters';

export default function CascadingFilter({
    grooheList,
    reshtehList,
    selectedMaghtas = [],
    selectedDaneshkades = [],
    selectedGroohes = [],
    selectedReshtehs = [],
    onMaghtaChange,
    onDaneshkadeChange,
    onGrooheChange,
    onReshtehChange,
    showMaghta = true,
    showDaneshkade = true,
    showGroohe = true,
    showReshteh = true
}) {
    // ============================================================
    // استفاده از هوک
    // ============================================================
    const { maghtaOptions, daneshkadeOptions, grooheOptions, reshtehOptions } =
        useCascadingFilters(
            grooheList,
            reshtehList,
            selectedMaghtas,
            selectedDaneshkades,
            selectedGroohes
        );

    // ============================================================
    // 🔥 پاک کردن انتخاب‌های نامعتبر (وقتی گزینه‌ها محدود میشن)
    // ============================================================
    useEffect(() => {
        // دانشکده‌های نامعتبر
        const validDaneshkades = selectedDaneshkades.filter(code =>
            daneshkadeOptions.some(o => o.value === code)
        );
        if (validDaneshkades.length !== selectedDaneshkades.length) {
            onDaneshkadeChange(validDaneshkades);
        }
    }, [daneshkadeOptions]);

    useEffect(() => {
        // گروه‌های نامعتبر
        const validGroohes = selectedGroohes.filter(id =>
            grooheOptions.some(o => o.value === parseInt(id))
        );
        if (validGroohes.length !== selectedGroohes.length) {
            onGrooheChange(validGroohes);
        }
    }, [grooheOptions]);

    useEffect(() => {
        // رشته‌های نامعتبر
        const validReshtehs = selectedReshtehs.filter(id =>
            reshtehOptions.some(o => o.value === parseInt(id))
        );
        if (validReshtehs.length !== selectedReshtehs.length) {
            onReshtehChange(validReshtehs);
        }
    }, [reshtehOptions]);

    // ============================================================
    // استایل‌های مشترک
    // ============================================================
    const selectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '38px',
            fontSize: '13px',
            direction: 'rtl'
        }),
        menu: (base) => ({
            ...base,
            fontSize: '13px',
            direction: 'rtl',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            textAlign: 'right',
            direction: 'rtl',
            backgroundColor: state.isFocused ? '#e7f1ff' : 'white',
            color: '#000',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '6px 10px'
        }),
        multiValue: (base) => ({
            ...base,
            direction: 'rtl',
            fontSize: '12px'
        }),
        multiValueLabel: (base) => ({
            ...base,
            direction: 'rtl'
        }),
        // 🔥 محدود کردن عرض فیلد
        valueContainer: (base) => ({
            ...base,
            flexWrap: 'nowrap',
            overflow: 'hidden',
            maxHeight: '38px'
        })
    };

    // ============================================================
    // تعداد فیلترهای فعال (برای محاسبه عرض)
    // ============================================================
    const visibleCount = [showMaghta, showDaneshkade, showGroohe, showReshteh].filter(Boolean).length;
    const colSize = visibleCount > 0 ? Math.floor(12 / visibleCount) : 12;

    // ============================================================
    // رندر
    // ============================================================
    return (
        <div className="row g-2">
            {/* مقطع */}
            {showMaghta && (
                <div className={`col-md-${colSize}`}>
                    <label className="form-label small mb-1">مقطع</label>
                    <Select
                        isMulti
                        options={maghtaOptions}
                        value={maghtaOptions.filter(o => selectedMaghtas.includes(o.value))}
                        onChange={(selected) => {
                            onMaghtaChange(selected.map(s => s.value));
                        }}
                        isSearchable
                        isClearable
                        placeholder="انتخاب مقطع..."
                        noOptionsMessage={() => 'موردی یافت نشد'}
                        classNamePrefix="react-select"
                        styles={selectStyles}
                    />
                </div>
            )}

            {/* دانشکده */}
            {showDaneshkade && (
                <div className={`col-md-${colSize}`}>
                    <label className="form-label small mb-1">دانشکده</label>
                    <Select
                        isMulti
                        options={daneshkadeOptions}
                        value={daneshkadeOptions.filter(o => selectedDaneshkades.includes(o.value))}
                        onChange={(selected) => {
                            onDaneshkadeChange(selected.map(s => s.value));
                        }}
                        isSearchable
                        isClearable
                        placeholder="انتخاب دانشکده..."
                        noOptionsMessage={() => 'موردی یافت نشد'}
                        classNamePrefix="react-select"
                        styles={selectStyles}
                    />
                </div>
            )}

            {/* گروه آموزشی */}
            {showGroohe && (
                <div className={`col-md-${colSize}`}>
                    <label className="form-label small mb-1">گروه آموزشی</label>
                    <Select
                        isMulti
                        options={grooheOptions}
                        value={grooheOptions.filter(o => selectedGroohes.includes(String(o.value)))}
                        onChange={(selected) => {
                            onGrooheChange(selected.map(s => String(s.value)));
                        }}
                        isSearchable
                        isClearable
                        placeholder="انتخاب گروه..."
                        noOptionsMessage={() => 'موردی یافت نشد'}
                        classNamePrefix="react-select"
                        styles={selectStyles}
                    />
                </div>
            )}

            {/* رشته */}
            {showReshteh && (
                <div className={`col-md-${colSize}`}>
                    <label className="form-label small mb-1">رشته</label>
                    <VirtualizedSelect
                        isMulti
                        options={reshtehOptions}
                        value={reshtehOptions.filter(o => selectedReshtehs.includes(String(o.value)))}
                        onChange={(selected) => {
                            onReshtehChange(selected.map(s => String(s.value)));
                        }}
                        isSearchable
                        isClearable
                        placeholder="جستجوی رشته..."
                        noOptionsMessage={() => 'موردی یافت نشد'}
                        classNamePrefix="react-select"
                        styles={selectStyles}
                    />
                </div>
            )}
        </div>
    );
}