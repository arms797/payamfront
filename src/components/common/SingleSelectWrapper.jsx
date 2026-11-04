import React from 'react';
import Select from 'react-select';

// ============================================================
// 🔥 Single-Select با جستجو (برای انتخاب یک آیتم)
// ============================================================
export default function SingleSelectWrapper({
    options = [],
    value,
    onChange,
    placeholder = 'انتخاب...',
    isDisabled = false,
    isClearable = true,
    hideIndicator = false,
    menuMaxHeight = 150,
    noOptionsMessage = 'موردی یافت نشد'
}) {
    // value هم می‌تونه string باشه هم object
    const selectedOption = options.find(o =>
        (typeof value === 'object' ? o.value === value?.value : o.value === value)
    ) || null;

    const styles = {
        control: (base, state) => ({
            ...base,
            minHeight: '38px',
            fontSize: '13px',
            direction: 'rtl',
            borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.15)' : 'none',
            '&:hover': { borderColor: '#86b7fe' }
        }),
        menu: (base) => ({
            ...base,
            fontSize: '13px',
            direction: 'rtl',
            zIndex: 9999
        }),
        menuList: (base) => ({
            ...base,
            maxHeight: menuMaxHeight,
            overflowY: 'auto'
        }),
        option: (base, state) => ({
            ...base,
            textAlign: 'right',
            direction: 'rtl',
            backgroundColor: state.isFocused ? '#e7f1ff' :
                state.isSelected ? '#0d6efd' : 'white',
            color: state.isSelected ? 'white' : '#000',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '8px 10px',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.5'
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
        }),
        singleValue: (base) => ({
            ...base,
            color: '#0d6efd',
            fontSize: '13px',
            fontWeight: '500'
        })
    };

    const components = {};
    if (hideIndicator) {
        components.DropdownIndicator = () => null;
        components.IndicatorSeparator = () => null;
    }

    return (
        <Select
            options={options}
            value={selectedOption}
            onChange={(selected) => onChange(selected?.value || null, selected)}
            isSearchable
            isClearable={isClearable}
            isDisabled={isDisabled}
            placeholder={placeholder}
            noOptionsMessage={() => noOptionsMessage}
            classNamePrefix="react-select"
            styles={styles}
            maxMenuHeight={menuMaxHeight}
            components={components}
            filterOption={(option, inputValue) => {
                if (!inputValue) return true;
                const search = inputValue.toLowerCase();
                return (
                    option.label?.toLowerCase().includes(search) ||
                    (option.data?.searchText?.toLowerCase().includes(search))
                );
            }}
        />
    );
}