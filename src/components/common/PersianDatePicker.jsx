import React from 'react';
import { DatePicker } from 'react-persian-range-picker';

/**
 * DatePicker با تقویم شمسی که مقدار میلادی ISO (yyyy-MM-dd) برمی‌گرداند
 * 
 * @param {string} value - مقدار میلادی به فرمت "yyyy-MM-dd"
 * @param {function} onChange - (isoDate: string) => void
 * @param {boolean} disabled
 * @param {string} placeholder
 * @param {boolean} showTime - نمایش انتخاب ساعت (اختیاری)
 */
export default function PersianDatePicker({
    value,
    onChange,
    disabled = false,
    placeholder = '1404/07/15',
    showTime = false
}) {
    // تبدیل مقدار ISO به timestamp (چون پکیج timestamp می‌خواد)
    const pickerValue = value ? new Date(value).getTime() : null;

    const handleChange = (val) => {
        // اگه مقدار خالی/null بود
        if (val === null || val === undefined) {
            onChange('');
            return;
        }

        // val می‌تونه number (timestamp) یا string (ISO) باشه
        const date = typeof val === 'number' ? new Date(val) : new Date(val);

        // چک کن تاریخ معتبره
        if (isNaN(date.getTime())) {
            onChange('');
            return;
        }

        // تبدیل به فرمت yyyy-MM-dd (میلادی)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        onChange(`${year}-${month}-${day}`);
    };

    return (
        <DatePicker
            value={pickerValue}
            onChange={handleChange}
            calendarType="jalali"
            exportType="timeStamp"
            showMask
            showTime={showTime}
            allowClear
            disabled={disabled}
            placeholder={placeholder}
            primaryColor="#0d6efd"
            highlightColor="#e7f1ff"
        />
    );
}