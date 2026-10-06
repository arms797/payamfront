import React, { useMemo } from 'react';
import Select from 'react-select';
import { FixedSizeList as List } from 'react-window';

// 🔥 رندر virtualized برای گزینه‌ها
const MenuList = (props) => {
    const { options, children, maxHeight, getValue } = props;
    const height = 35;
    const [value] = getValue();
    const initialOffset = options.indexOf(value) * height;

    return (
        <List
            width="100%"
            height={maxHeight}
            itemCount={children.length}
            itemSize={height}
            initialScrollOffset={initialOffset >= 0 ? initialOffset : 0}
        >
            {({ index, style }) => (
                <div style={style}>{children[index]}</div>
            )}
        </List>
    );
};

export default function VirtualizedSelect({ options, value, onChange, ...props }) {
    return (
        <Select
            options={options}
            value={value}
            onChange={onChange}
            components={{ MenuList }}
            {...props}
        />
    );
}