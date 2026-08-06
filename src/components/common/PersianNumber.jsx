// src/components/common/PersianNumber.jsx
import React from 'react';

const toPersianNumbers = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const str = String(num);
    return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export default function PersianNumber({ children, className = '', tag: Tag = 'span' }) {
    if (children === null || children === undefined || children === '') {
        return <Tag className={className}>-</Tag>;
    }
    return <Tag className={className}>{toPersianNumbers(children)}</Tag>;
}