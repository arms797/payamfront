import React from 'react';
import Select from 'react-select';

export default function MultiSelectWrapper({
    options,
    value = [],
    onChange,
    placeholder = 'انتخاب...',
    isDisabled = false
}) {
    const selectedOptions = options.filter(o => value.includes(o.value));

    const styles = {
        control: (base) => ({
            ...base,
            minHeight: '31px',
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
            fontSize: '13px'
        }),
        multiValue: (base) => ({
            ...base,
            direction: 'rtl',
            fontSize: '11px'
        }),
        valueContainer: (base) => ({
            ...base,
            flexWrap: 'nowrap',
            overflow: 'hidden'
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
        />
    );
}