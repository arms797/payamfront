import React, { useEffect } from 'react';
import Select from 'react-select';
import VirtualizedSelect from './VirtualizedSelect';
import { useCascadingFilters } from '../../hooks/useCascadingFilters';

// ============================================================
// 🔥 کامپوننت خالی برای حذف indicatorها
// ============================================================
const EmptyComponent = () => null;

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
    showReshteh = true,
    // 🔥 پارامترهای جدید
    hideIndicator = false,
    hideClear = false,
    maxHeight = 50
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
    // پاک کردن انتخاب‌های نامعتبر
    // ============================================================
    useEffect(() => {
        const validDaneshkades = selectedDaneshkades.filter(code =>
            daneshkadeOptions.some(o => o.value === code)
        );
        if (validDaneshkades.length !== selectedDaneshkades.length) {
            onDaneshkadeChange(validDaneshkades);
        }
    }, [daneshkadeOptions]);

    useEffect(() => {
        const validGroohes = selectedGroohes.filter(id =>
            grooheOptions.some(o => o.value === parseInt(id))
        );
        if (validGroohes.length !== selectedGroohes.length) {
            onGrooheChange(validGroohes);
        }
    }, [grooheOptions]);

    useEffect(() => {
        const validReshtehs = selectedReshtehs.filter(id =>
            reshtehOptions.some(o => o.value === parseInt(id))
        );
        if (validReshtehs.length !== selectedReshtehs.length) {
            onReshtehChange(validReshtehs);
        }
    }, [reshtehOptions]);

    // ============================================================
    // 🔥 ساخت components بر اساس پارامترها
    // ============================================================
    const components = {};
    if (hideIndicator) {
        components.DropdownIndicator = EmptyComponent;
        components.IndicatorSeparator = EmptyComponent;
    }
    if (hideClear) {
        components.ClearIndicator = EmptyComponent;
    }

    // ============================================================
    // 🔥 استایل‌های مشترک
    // ============================================================
    const selectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: '38px',
            fontSize: '13px',
            direction: 'rtl',
            borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.15)' : 'none',
            height: 'auto',
            '&:hover': {
                borderColor: '#86b7fe'
            }
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
            fontSize: '11px',
            backgroundColor: '#e7f1ff',
            borderRadius: '4px',
            margin: '1px'
        }),
        multiValueLabel: (base) => ({
            ...base,
            direction: 'rtl',
            color: '#0d6efd',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: '500'
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#0d6efd',
            '&:hover': {
                backgroundColor: '#0d6efd',
                color: 'white'
            }
        }),
        valueContainer: (base) => ({
            ...base,
            flexWrap: 'wrap',
            gap: '2px',
            padding: '4px 8px',
            maxHeight: `${maxHeight}px`,   // 🔥 از پارامتر
            overflowY: 'auto'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#6c757d',
            fontSize: '13px'
        }),
        input: (base) => ({
            ...base,
            fontSize: '13px',
            margin: 0,
            padding: 0
        })
    };

    // ============================================================
    // تعداد فیلترهای فعال
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
                        components={components}
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
                        components={components}
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
                        components={components}
                    />
                </div>
            )}

            {/* رشته — با VirtualizedSelect */}
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
                        components={components}
                    />
                </div>
            )}
        </div>
    );
}