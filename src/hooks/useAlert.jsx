// src/hooks/useAlert.js
import { useState, useCallback } from 'react';
import AlertModal from '../components/common/AlertModal';

export const useAlert = () => {
    const [show, setShow] = useState(false);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);

    const alert = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setConfig({
                ...options,
                onClose: () => {
                    setShow(false);
                    resolve(true);
                }
            });
            setShow(true);
        });
    }, []);

    const AlertModalComponent = useCallback(() => {
        return (
            <AlertModal
                show={show}
                onClose={config.onClose || (() => setShow(false))}
                title={config.title || 'توجه'}
                message={config.message || ''}
                buttonText={config.buttonText || 'باشه'}
                variant={config.variant || 'primary'}
                loading={loading}
            />
        );
    }, [show, config, loading]);

    return { alert, AlertModal: AlertModalComponent };
};