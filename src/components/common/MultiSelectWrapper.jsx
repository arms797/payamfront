import React from 'react';
import Select from 'react-select';

// ============================================================
// 🔥 کامپوننت خالی برای حذف indicatorها
// ============================================================
const EmptyComponent = () => null;

export default function MultiSelectWrapper({
    options,
    value = [],
    onChange,
    placeholder = 'انتخاب...',
    isDisabled = false,
    hideIndicator = false,    // 🔥 حذف فلش
    hideClear = false,        // 🔥 حذف ضربدر
    maxHeight = 50            // 🔥 حداکثر ارتفاع (پیش‌فرض 50px)
}) {
    const selectedOptions = options.filter(o => value.includes(o.value));

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

    const styles = {
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
            fontSize: '11px'
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

    return (
        <Select
            isMulti
            options={options}
            value={selectedOptions}
            onChange={(selected) => onChange(selected.map(s => s.value))}
            isSearchable
            isClearable
            isDisabled={isDisabled}
            placeholder={placeholder}
            noOptionsMessage={() => 'موردی یافت نشد'}
            classNamePrefix="react-select"
            styles={styles}
            maxMenuHeight={300}
            components={components}
        />
    );
}