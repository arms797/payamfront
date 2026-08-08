// src/hooks/useConfirm.js
import { useState, useCallback } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

export const useConfirm = () => {
    const [show, setShow] = useState(false);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);

    // ============================================================
    // تابع اصلی: یک Promise برمی‌گرداند که با true/false resolve می‌شود
    // ============================================================
    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setConfig({
                ...options,
                onConfirm: () => {
                    if (options.onConfirm) {
                        // اگر تابع onConfirm داده شده بود، آن را اجرا کن
                        setLoading(true);
                        Promise.resolve(options.onConfirm())
                            .then(() => {
                                setLoading(false);
                                setShow(false);
                                resolve(true);
                            })
                            .catch(() => {
                                setLoading(false);
                                // در صورت خطا، مودال باز بماند
                            });
                    } else {
                        setShow(false);
                        resolve(true);
                    }
                },
                onCancel: () => {
                    setShow(false);
                    resolve(false);
                }
            });
            setShow(true);
        });
    }, []);

    // ============================================================
    // کامپوننت مودال که در صفحه رندر می‌شود
    // ============================================================
    const ConfirmModalComponent = useCallback(() => {
        return (
            <ConfirmModal
                show={show}
                onClose={config.onCancel || (() => setShow(false))}
                onConfirm={config.onConfirm || (() => setShow(false))}
                title={config.title || 'تأیید ؟'}
                message={config.message || 'آیا از انجام این کار مطمئن هستید؟'}
                confirmText={config.confirmText || 'بله'}
                cancelText={config.cancelText || 'خیر'}
                confirmVariant={config.confirmVariant || 'warning'}
                loading={loading}
            />
        );
    }, [show, config, loading]);

    return { confirm, ConfirmModal: ConfirmModalComponent };
};