import React, { useRef } from 'react';
import Select from 'react-select';
import { useVirtualizer } from '@tanstack/react-virtual';

// ============================================================
// 🔥 MenuList سفارشی با virtualizer
// ============================================================
const MenuList = (props) => {
    const { options, children, maxHeight, getValue } = props;
    const parentRef = useRef(null);

    const childrenArray = React.Children.toArray(children);

    const [value] = getValue();
    const initialOffset = React.useMemo(() => {
        if (!options || !value) return 0;
        const index = options.indexOf(value);
        return index > 0 ? index * 35 : 0;
    }, [options, value]);

    const rowVirtualizer = useVirtualizer({
        count: childrenArray.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35,
        overscan: 5,
        initialOffset,
    });

    if (childrenArray.length === 0) {
        return (
            <div
                ref={parentRef}
                style={{
                    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                    overflow: 'auto',
                    padding: '8px 12px',
                    color: '#6c757d',
                    fontSize: '13px',
                    direction: 'rtl',
                    textAlign: 'center'
                }}
            >
                موردی یافت نشد
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            style={{
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                overflow: 'auto',
                direction: 'rtl'
            }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const child = childrenArray[virtualRow.index];
                    if (!child) return null;

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {child}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
// 🔥 کامپوننت اصلی — components رو merge میکنه
// ============================================================
export default function VirtualizedSelect({ options, value, onChange, components, ...props }) {
    return (
        <Select
            options={options}
            value={value}
            onChange={onChange}
            components={{
                ...components,          // 🔥 components ورودی
                MenuList,               // 🔥 MenuList سفارشی ما
            }}
            {...props}
        />
    );
}