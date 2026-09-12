import { usePrint } from '../../hooks/usePrint';
//import fontAddress from '../../assets/fonts/Vazir/Vazir-Regular.woff2';
import fontAddress from '../../../public/fonts/Vazir-Regular.woff2';

export default function PrintButton({
    Component,           // کامپوننت چاپی (اجباری)
    data,                // داده‌هایی که به کامپوننت پاس می‌شود
    title = 'چاپ',       // عنوان پنجره
    orientation = 'portrait',  // 'portrait' یا 'landscape'
    paperSize = 'A4',    // اندازه کاغذ
    className = 'btn btn-primary',
    children = '🖨️ چاپ'
}) {
    const { print } = usePrint();

    return (
        <button
            className={className}
            onClick={() => print(Component, data, {
                title,
                fontUrl: fontAddress,
                orientation,
                paperSize
            })}
        >
            {children}
        </button>
    );
}