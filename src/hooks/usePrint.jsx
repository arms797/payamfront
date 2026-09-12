// src/hooks/usePrint.jsx
import { useCallback } from 'react';
import ReactDOM from 'react-dom/client';

export const usePrint = () => {
    const print = useCallback((Component, props, options = {}) => {
        const {
            title = 'چاپ',
            styles = '',
            fontUrl = '',
            delay = 500,
            orientation = 'portrait',
            paperSize = 'A4'
        } = options;

        const printWindow = window.open('', '_blank', 'width=900,height=700');

        if (!printWindow) {
            alert('لطفاً پاپ‌آپ را فعال کنید');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    ${fontUrl ? `
                        <style>
                            @font-face {
                                font-family: 'Vazirmatn';
                                src: url('${fontUrl}') format('woff2');
                            }
                        </style>
                    ` : ''}
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            font-family: 'Vazirmatn', Tahoma, sans-serif;
                            direction: rtl;
                            margin: 0;
                            padding: 20px;
                            background: white;
                            color: black;
                        }
                        ${styles}
                        
                        @media print {
                            body { padding: 0; }
                            @page {
                                size: ${paperSize} ${orientation};
                                margin: 12mm 10mm 10mm 10mm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-root"></div>
                </body>
            </html>
        `);
        printWindow.document.close();

        const root = ReactDOM.createRoot(
            printWindow.document.getElementById('print-root')
        );
        root.render(<Component {...props} />);

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = () => {
                printWindow.close();
            };
        }, delay);

    }, []);

    return { print };
};