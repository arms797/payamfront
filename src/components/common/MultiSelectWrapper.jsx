import React from 'react';
import Select from 'react-select';

// ============================================================
// 🔥 کامپوننت خالی برای حذف indicatorها
// ============================================================
const EmptyComponent = () => null;

// ============================================================
// 🔥 Chip با Tooltip — فقط برای MultiValueLabel
// ============================================================
const MultiValueLabelWithTooltip = (props) => {
    const title = typeof props.data?.label === 'string' ? props.data.label : undefined;
    return (
        <div title={title} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {props.children}
        </div>
    );
};

export default function MultiSelectWrapper({
    options,
    value = [],
    onChange,
    placeholder = 'انتخاب...',
    isDisabled = false,
    hideIndicator = false,
    hideClear = false,
    maxHeight = 50
}) {
    const selectedOptions = options.filter(o => value.includes(o.value));

    // ============================================================
    // 🔥 components — فقط Chip Tooltip
    // ============================================================
    const components = {
        MultiValueLabel: MultiValueLabelWithTooltip
    };
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
            margin: '1px',
            maxWidth: '100%'
        }),
        multiValueLabel: (base) => ({
            ...base,
            direction: 'rtl',
            color: '#0d6efd',
            padding: '2px 6px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
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
            maxHeight: `${maxHeight}px`,
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