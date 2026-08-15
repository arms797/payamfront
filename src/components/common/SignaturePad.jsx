// src/components/common/SignaturePad.jsx
import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { SIGNATURE_POSITIONS, POSITION_OPTIONS } from '../../constants/signaturePositions';
import ConfirmModal from './ConfirmModal';

const SignaturePad = forwardRef(({
    onSave,
    onCancel,
    width = 300,
    height = 300,
    backgroundColor = '#ffffff',
    penColor = '#000000',
    userFullName = '',
    userRole = '',
    defaultPosition = 'BC',
    defaultOffset = null,
    canEditSignature = false,
    canEditPosition = false,
    hasExistingSignature = false,
    existingSignatureData = null,
    showControls = true,
    showLabel = true,
    label = 'امضا',
    textFontSize = 18,
    textOpacity = 0.5,
    textColor = '#1a1a1a',
    showPreviewBox = false,
    onPositionChange = null,
}, ref) => {
    const sigCanvas = useRef(null);
    const previewCanvasRef = useRef(null);
    const moveLayerRef = useRef(null);

    // ============================================================
    // حالت‌ها
    // ============================================================
    const [positionMode, setPositionMode] = useState(() => {
        return defaultOffset ? 'free' : 'preset';
    });
    const [presetPosition, setPresetPosition] = useState(defaultPosition);
    const [textOffset, setTextOffset] = useState(() => {
        if (defaultOffset) return { x: defaultOffset.x || 0, y: defaultOffset.y || 0 };
        return { x: 0, y: 0 };
    });

    const [interactionMode, setInteractionMode] = useState('draw');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

    const [positionInfo, setPositionInfo] = useState(SIGNATURE_POSITIONS[defaultPosition]);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(!existingSignatureData);
    const [signatureData, setSignatureData] = useState(existingSignatureData);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const displayText = `${userFullName}   ${userRole}`.trim();

    // ============================================================
    // تابع شکستن متن به دو خط (برای پیش‌نمایش)
    // ============================================================
    const getWrappedText = useCallback((text) => {
        if (!text) return { lines: [''], lineHeight: textFontSize };

        const parts = text.split(' - ');
        if (parts.length === 2) {
            return {
                lines: [parts[0].trim(), parts[1].trim()],
                lineHeight: textFontSize * 0.85
            };
        }

        const words = text.split(' ');
        if (words.length > 1) {
            const mid = Math.floor(words.length / 2);
            const firstLine = words.slice(0, mid).join(' ');
            const secondLine = words.slice(mid).join(' ');
            return {
                lines: [firstLine, secondLine],
                lineHeight: textFontSize * 0.85
            };
        }

        return { lines: [text], lineHeight: textFontSize };
    }, [textFontSize]);

    // ============================================================
    // به‌روزرسانی اطلاعات موقعیت
    // ============================================================
    useEffect(() => {
        if (positionMode === 'preset') {
            const info = SIGNATURE_POSITIONS[presetPosition] || SIGNATURE_POSITIONS['BC'];
            setPositionInfo(info);
        } else {
            setPositionInfo({
                label: 'دستی',
                description: `موقعیت دلخواه (${Math.round(textOffset.x)}, ${Math.round(textOffset.y)})`,
                inside: true
            });
        }
    }, [positionMode, presetPosition, textOffset]);

    // ============================================================
    // متدهای قابل دسترس از خارج
    // ============================================================
    useImperativeHandle(ref, () => ({
        clear: () => {
            sigCanvas.current.clear();
            setIsSignatureEmpty(true);
            setSignatureData(null);
        },
        isEmpty: () => sigCanvas.current.isEmpty(),
        getTrimmedCanvas: () => sigCanvas.current.getTrimmedCanvas(),
        toDataURL: () => sigCanvas.current.toDataURL(),
        getSignatureOnly: () => getSignatureOnly(),  // ← فقط امضا (خام)
        getPosition: () => {
            if (positionMode === 'preset') return presetPosition;
            return { x: textOffset.x, y: textOffset.y };
        },
        getPositionMode: () => positionMode,
        getInteractionMode: () => interactionMode,
        setPosition: (pos) => {
            if (typeof pos === 'string') {
                setPositionMode('preset');
                setPresetPosition(pos);
            } else if (pos && typeof pos === 'object') {
                setPositionMode('free');
                setTextOffset({ x: pos.x || 0, y: pos.y || 0 });
            }
        },
        setInteractionMode: (mode) => setInteractionMode(mode),
        setSignatureData: (data) => setSignatureData(data),
    }));

    // ============================================================
    // محاسبه موقعیت نهایی (فقط برای پیش‌نمایش)
    // ============================================================
    const getFinalPosition = useCallback((canvasWidth, canvasHeight, textWidth, textHeight, lineCount = 1) => {
        if (positionMode === 'free') {
            let x = canvasWidth / 2 + textOffset.x;
            const totalTextHeight = textHeight * lineCount + (lineCount - 1) * 4;
            let y = canvasHeight / 2 + textOffset.y;
            const margin = 10;
            x = Math.max(margin + textWidth / 2, Math.min(canvasWidth - margin - textWidth / 2, x));
            y = Math.max(margin + totalTextHeight / 2, Math.min(canvasHeight - margin - totalTextHeight / 2, y));
            return { x, y, outside: false };
        }

        const pos = SIGNATURE_POSITIONS[presetPosition] || SIGNATURE_POSITIONS['BC'];
        const margin = Math.max(textFontSize * 0.5, 12);

        if (!pos.inside) {
            if (pos.position === 'above') {
                return { x: canvasWidth / 2, y: -textHeight / 2 - margin * 0.3, outside: true };
            }
            if (pos.position === 'below') {
                return { x: canvasWidth / 2, y: canvasHeight + textHeight / 2 + margin * 0.3, outside: true };
            }
        }

        let x, y;
        const totalTextHeight = textHeight * lineCount + (lineCount - 1) * 4;
        switch (pos.h) {
            case 'left': x = margin + textWidth / 2; break;
            case 'right': x = canvasWidth - margin - textWidth / 2; break;
            default: x = canvasWidth / 2;
        }
        switch (pos.v) {
            case 'top': y = margin + totalTextHeight / 2; break;
            case 'bottom': y = canvasHeight - margin - totalTextHeight / 2; break;
            default: y = canvasHeight / 2;
        }
        return { x, y, outside: false };
    }, [positionMode, presetPosition, textOffset, textFontSize]);

    // ============================================================
    // دریافت رشته موقعیت
    // ============================================================
    const getPositionString = useCallback(() => {
        if (positionMode === 'free') {
            return `x:${Math.round(textOffset.x)},y:${Math.round(textOffset.y)}`;
        }
        return presetPosition;
    }, [positionMode, textOffset, presetPosition]);

    // ============================================================
    // 🔥 دریافت فقط امضای خام (بدون متن) - برای ذخیره در دیتابیس
    // ============================================================
    const getSignatureOnly = useCallback(() => {
        if (sigCanvas.current.isEmpty()) {
            return null;
        }
        return sigCanvas.current.toDataURL();
    }, []);

    // ============================================================
    // ⚠️ دیگر نیازی به ترکیب متن با امضا نیست (حذف شد)
    // ============================================================

    // ============================================================
    // رندر پیش‌نمایش (متن روی امضا برای نمایش در حین کار)
    // ============================================================
    const renderPreview = useCallback((ctx, canvasWidth, canvasHeight) => {
        if (!displayText) return;

        const wrapped = getWrappedText(displayText);
        const lineCount = wrapped.lines.length;
        const lineHeight = wrapped.lineHeight || textFontSize;

        ctx.save();
        ctx.font = `bold ${textFontSize}px Vazir, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let maxLineWidth = 0;
        wrapped.lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
        });

        const totalTextHeight = lineHeight * lineCount + (lineCount - 1) * 4;
        const pos = getFinalPosition(canvasWidth, canvasHeight, maxLineWidth, lineHeight, lineCount);

        if (pos.outside) {
            ctx.restore();
            return;
        }

        ctx.globalAlpha = textOpacity;
        ctx.fillStyle = textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.03)';
        ctx.shadowBlur = 1;

        if (lineCount === 2) {
            const y1 = pos.y - lineHeight / 2 - 2;
            ctx.fillText(wrapped.lines[0], pos.x, y1);
            const y2 = pos.y + lineHeight / 2 + 2;
            ctx.fillText(wrapped.lines[1], pos.x, y2);
        } else {
            ctx.fillText(wrapped.lines[0], pos.x, pos.y);
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        if (showPreviewBox) {
            ctx.strokeStyle = 'rgba(44, 62, 80, 0.08)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            const boxWidth = maxLineWidth + 20;
            const boxHeight = totalTextHeight + 12;
            ctx.strokeRect(
                pos.x - boxWidth / 2,
                pos.y - boxHeight / 2,
                boxWidth,
                boxHeight
            );
            ctx.setLineDash([]);
        }

        ctx.restore();
    }, [displayText, textFontSize, textOpacity, textColor, getFinalPosition, showPreviewBox, getWrappedText]);

    // ============================================================
    // به‌روزرسانی پیش‌نمایش
    // ============================================================
    useEffect(() => {
        if (!previewCanvasRef.current) return;
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        renderPreview(ctx, width, height);
    }, [positionMode, presetPosition, textOffset, displayText, width, height, renderPreview]);

    // ============================================================
    // Event Handlerهای درگ
    // ============================================================
    const handleMoveMouseDown = (e) => {
        if (interactionMode !== 'move' || positionMode !== 'free') return;
        if (!canEditPosition && hasExistingSignature) {
            setToastMessage('شما اجازه جابجایی متن را ندارید. با ادمین تماس بگیرید.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        const rect = moveLayerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        if (clientX == null) return;

        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        const wrapped = getWrappedText(displayText);
        const lineCount = wrapped.lines.length;
        const lineHeight = wrapped.lineHeight || textFontSize;
        const totalTextHeight = lineHeight * lineCount + (lineCount - 1) * 4;

        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `bold ${textFontSize}px Vazir, sans-serif`;
        let maxLineWidth = 0;
        wrapped.lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
        });

        const pos = getFinalPosition(width, height, maxLineWidth, lineHeight, lineCount);

        if (Math.abs(canvasX - pos.x) < maxLineWidth / 2 + 15 &&
            Math.abs(canvasY - pos.y) < totalTextHeight / 2 + 15) {
            setIsDragging(true);
            setDragStart({ x: canvasX, y: canvasY });
            setInitialOffset({ x: textOffset.x, y: textOffset.y });
        }
    };

    const handleMoveMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const rect = moveLayerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        if (clientX == null) return;

        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        const deltaX = canvasX - dragStart.x;
        const deltaY = canvasY - dragStart.y;

        const newOffset = {
            x: initialOffset.x + deltaX,
            y: initialOffset.y + deltaY
        };

        setTextOffset(newOffset);

        if (onPositionChange) {
            onPositionChange({ mode: 'free', offset: newOffset });
        }
    };

    const handleMoveMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            if (onPositionChange) {
                onPositionChange({ mode: 'free', offset: textOffset, final: true });
            }
        }
    };

    // ============================================================
    // 🔥 ذخیره فقط امضای خام + موقعیت (بدون متن)
    // ============================================================
    const handleSave = () => {
        if (!canEditSignature && existingSignatureData) {
            // اگر فقط موقعیت تغییر کرده
            onSave({
                signatureData: existingSignatureData,  // امضای قبلی
                position: getPositionString(),
                isPositionOnly: true
            });
            return;
        }

        if (sigCanvas.current.isEmpty()) {
            alert('لطفاً امضای خود را وارد کنید');
            return;
        }

        // 🔥 فقط امضای خام را بگیر و همراه با موقعیت ذخیره کن
        const rawSignature = getSignatureOnly();
        if (!rawSignature) return;

        setPendingSaveData({
            signatureData: rawSignature,
            position: getPositionString(),
            isPositionOnly: false
        });
        setShowConfirmModal(true);
    };

    const confirmSave = async () => {
        if (pendingSaveData && onSave) {
            setIsSaving(true);
            await onSave(pendingSaveData);
            setIsSaving(false);
        }
        setShowConfirmModal(false);
        setPendingSaveData(null);
    };

    const cancelSave = () => {
        setShowConfirmModal(false);
        setPendingSaveData(null);
    };

    // ============================================================
    // رندر بخش‌های مختلف
    // ============================================================
    const renderLockStatus = () => {
        if (!hasExistingSignature) return null;
        const messages = [];
        if (!canEditSignature) messages.push('امضا قفل است');
        if (!canEditPosition) messages.push('موقعیت قفل است');
        if (messages.length === 0) return null;
        return (
            <div className="alert alert-secondary py-1 px-2 mt-2" style={{ fontSize: '12px' }}>
                <i className="bi bi-lock me-1"></i>
                {messages.join(' | ')}
                <br />
                <small className="text-muted">برای تغییر با ادمین تماس بگیرید</small>
            </div>
        );
    };

    const renderInteractionModeSelector = () => {
        if (positionMode !== 'free') return null;

        return (
            <div className="d-flex gap-2 align-items-center mt-2 mb-1">
                <span className="text-muted small">حالت:</span>
                <div className="btn-group btn-group-sm" role="group">
                    <button
                        type="button"
                        className={`btn ${interactionMode === 'draw' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setInteractionMode('draw')}
                        style={{ fontSize: '12px' }}
                        disabled={!canEditSignature && hasExistingSignature}
                    >
                        <i className="bi bi-pencil me-1"></i>
                        امضا
                    </button>
                    <button
                        type="button"
                        className={`btn ${interactionMode === 'move' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => {
                            if (!canEditPosition && hasExistingSignature) {
                                setToastMessage('شما اجازه جابجایی متن را ندارید. با ادمین تماس بگیرید.');
                                setTimeout(() => setToastMessage(''), 3000);
                                return;
                            }
                            setInteractionMode('move');
                        }}
                        style={{ fontSize: '12px' }}
                    >
                        <i className="bi bi-arrows-move me-1"></i>
                        جابجایی متن
                    </button>
                </div>
                <span className="text-muted small">
                    {interactionMode === 'draw' ? '✏️ کشیدن امضا' : '↕️ جابجایی متن با کشیدن'}
                </span>
                {toastMessage && (
                    <span className="text-danger small" style={{ fontSize: '11px' }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        {toastMessage}
                    </span>
                )}
            </div>
        );
    };

    const renderPositionSelector = () => {
        if (!canEditPosition && hasExistingSignature) {
            return (
                <div className="mt-2">
                    <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        موقعیت فعلی: {positionInfo?.label || 'نامشخص'}
                        {!canEditPosition && <span className="text-danger ms-1">(قفل شده)</span>}
                    </small>
                </div>
            );
        }

        const insidePositions = POSITION_OPTIONS.filter(p => p.inside);
        const outsidePositions = POSITION_OPTIONS.filter(p => !p.inside);

        return (
            <div className="position-selector mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small mb-0">
                        موقعیت متن
                        {canEditPosition && <span className="text-warning ms-1"><i className="bi bi-pencil"></i> (قابل ویرایش)</span>}
                    </label>
                    <div className="d-flex gap-1">
                        <button
                            type="button"
                            className={`btn btn-sm ${positionMode === 'preset' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => {
                                setPositionMode('preset');
                                setInteractionMode('draw');
                                if (onPositionChange) {
                                    onPositionChange({ mode: 'preset', position: presetPosition });
                                }
                            }}
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                            <i className="bi bi-grid-3x3-gap me-1"></i>
                            حالت‌ها
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${positionMode === 'free' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => {
                                setPositionMode('free');
                                if (onPositionChange) {
                                    onPositionChange({ mode: 'free', offset: textOffset });
                                }
                            }}
                            style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                            <i className="bi bi-arrows-move me-1"></i>
                            کشیدن
                        </button>
                    </div>
                </div>

                {positionMode === 'preset' ? (
                    <>
                        <div className="d-flex flex-wrap gap-1 mb-1">
                            {insidePositions.map(pos => (
                                <button
                                    key={pos.key}
                                    type="button"
                                    className={`btn btn-sm ${presetPosition === pos.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        setPresetPosition(pos.key);
                                        if (onPositionChange) {
                                            onPositionChange({ mode: 'preset', position: pos.key });
                                        }
                                    }}
                                    title={pos.description}
                                    style={{ minWidth: '32px', padding: '2px 4px', fontSize: '10px' }}
                                >
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                        <div className="d-flex gap-1">
                            {outsidePositions.map(pos => (
                                <button
                                    key={pos.key}
                                    type="button"
                                    className={`btn btn-sm ${presetPosition === pos.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        setPresetPosition(pos.key);
                                        if (onPositionChange) {
                                            onPositionChange({ mode: 'preset', position: pos.key });
                                        }
                                    }}
                                    title={pos.description}
                                    style={{ minWidth: '32px', padding: '2px 4px', fontSize: '10px' }}
                                >
                                    {pos.label}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="alert alert-info py-1 px-2 mb-0" style={{ fontSize: '12px' }}>
                        <i className="bi bi-hand-index-thumb me-1"></i>
                        برای جابجایی متن، روی دکمه <strong>"جابجایی متن"</strong> کلیک کنید و سپس متن را بکشید.
                        {!canEditPosition && hasExistingSignature && (
                            <span className="text-danger d-block mt-1">
                                <i className="bi bi-lock me-1"></i>
                                شما اجازه جابجایی متن را ندارید. با ادمین تماس بگیرید.
                            </span>
                        )}
                        <br />
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                            موقعیت فعلی: ({Math.round(textOffset.x)}, {Math.round(textOffset.y)})
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const renderExistingSignature = () => {
        if (!existingSignatureData || canEditSignature) return null;
        return (
            <div className="mt-2 text-center">
                <img
                    src={existingSignatureData}
                    alt="امضا"
                    style={{ maxWidth: '100%', maxHeight: '100px' }}
                />
                <div className="mt-1">
                    <small className="text-muted">
                        <i className="bi bi-check-circle text-success me-1"></i>
                        امضا ثبت شده است
                    </small>
                </div>
            </div>
        );
    };

    // ============================================================
    // رندر اصلی
    // ============================================================
    const isMoveMode = positionMode === 'free' && interactionMode === 'move';

    return (
        <div className="signature-container">
            {showLabel && <label className="form-label">{label}</label>}

            <div className="mb-1">
                <small className="text-muted">
                    <i className="bi bi-person me-1"></i>
                    متن امضا:
                </small>
                <div className="fw-bold" style={{ fontSize: textFontSize * 0.8, lineHeight: 1.4 }}>
                    {displayText ? (
                        getWrappedText(displayText).lines.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))
                    ) : (
                        <span className="text-muted">نام و سمت</span>
                    )}
                </div>
                {displayText && (
                    <small className="text-muted d-block">
                        <i className="bi bi-arrow-up me-1"></i>
                        موقعیت: {positionInfo?.description || positionInfo?.label || 'نامشخص'}
                        {positionMode === 'free' && (
                            <span className="text-muted ms-1">
                                (دستی: {Math.round(textOffset.x)}, {Math.round(textOffset.y)})
                            </span>
                        )}
                    </small>
                )}
            </div>

            {!hasExistingSignature && (
                <div className="alert alert-info py-1 px-2 mb-2" style={{ fontSize: '12px' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    با ماوس یا انگشت روی کادر امضا بکشید.
                    {positionMode === 'preset' ? (
                        <> متن "{displayText}" در موقعیت <strong>{positionInfo?.description || 'نامشخص'}</strong> قرار خواهد گرفت.</>
                    ) : (
                        <> ابتدا حالت <strong>"جابجایی متن"</strong> را انتخاب کنید، سپس متن را بکشید.</>
                    )}
                </div>
            )}

            {existingSignatureData && !canEditSignature ? (
                renderExistingSignature()
            ) : (
                <div
                    className="signature-wrapper d-flex justify-content-center"
                    style={{
                        border: isMoveMode && canEditPosition
                            ? '2px solid #4d6bfe'
                            : '2px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        maxWidth: '100%',
                        width: 'fit-content',
                        margin: '0 auto',
                        position: 'relative',
                        userSelect: 'none',
                        cursor: isMoveMode && canEditPosition ? 'grab' : 'default',
                        transition: 'border-color 0.2s'
                    }}
                >
                    <SignatureCanvas
                        ref={sigCanvas}
                        canvasProps={{
                            width: width,
                            height: height,
                            className: 'signature-canvas',
                            style: {
                                width: width + 'px',
                                height: height + 'px',
                                backgroundColor: backgroundColor,
                                touchAction: 'none',
                                display: 'block',
                                cursor: isMoveMode && canEditPosition ? 'grab' : 'crosshair'
                            }
                        }}
                        penColor={penColor}
                        backgroundColor={backgroundColor}
                        velocityFilterWeight={0.7}
                        minWidth={0.5}
                        maxWidth={2.5}
                        onEnd={() => setIsSignatureEmpty(false)}
                    />

                    {isMoveMode && (
                        <div
                            ref={moveLayerRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 20,
                                cursor: 'grab',
                                touchAction: 'none',
                                backgroundColor: 'rgba(0,0,0,0.01)'
                            }}
                            onMouseDown={handleMoveMouseDown}
                            onMouseMove={handleMoveMouseMove}
                            onMouseUp={handleMoveMouseUp}
                            onMouseLeave={handleMoveMouseUp}
                            onTouchStart={handleMoveMouseDown}
                            onTouchMove={handleMoveMouseMove}
                            onTouchEnd={handleMoveMouseUp}
                        />
                    )}

                    <canvas
                        ref={previewCanvasRef}
                        width={width}
                        height={height}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 10
                        }}
                    />

                    {isDragging && (
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 12px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            zIndex: 30,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <i className="bi bi-arrows-move me-1"></i>
                            در حال جابجایی...
                        </div>
                    )}
                    {isMoveMode && canEditPosition && !isDragging && !isSignatureEmpty && (
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            zIndex: 30,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <i className="bi bi-arrows-move me-1"></i>
                            متن را بکشید
                        </div>
                    )}
                    {!isMoveMode && canEditSignature && (
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            zIndex: 30,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <i className="bi bi-pencil me-1"></i>
                            امضا کنید
                        </div>
                    )}
                </div>
            )}

            {renderInteractionModeSelector()}
            {renderPositionSelector()}
            {renderLockStatus()}

            {showControls && (
                <div className="mt-2 d-flex gap-2 flex-wrap justify-content-center">
                    {!hasExistingSignature && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                    sigCanvas.current.clear();
                                    setIsSignatureEmpty(true);
                                    setSignatureData(null);
                                }}
                            >
                                <i className="bi bi-eraser me-1"></i>
                                پاک کردن
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={handleSave}
                                disabled={isSignatureEmpty}
                            >
                                <i className="bi bi-check2 me-1"></i>
                                ذخیره امضا
                            </button>
                        </>
                    )}

                    {hasExistingSignature && canEditSignature && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                    sigCanvas.current.clear();
                                    setIsSignatureEmpty(true);
                                    setSignatureData(null);
                                }}
                            >
                                <i className="bi bi-eraser me-1"></i>
                                پاک کردن
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={handleSave}
                                disabled={isSignatureEmpty}
                            >
                                <i className="bi bi-check2 me-1"></i>
                                به‌روزرسانی امضا
                            </button>
                        </>
                    )}

                    {hasExistingSignature && canEditPosition && !canEditSignature && (
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleSave}
                        >
                            <i className="bi bi-check2 me-1"></i>
                            ذخیره موقعیت
                        </button>
                    )}

                    {onCancel && (
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={onCancel}
                        >
                            <i className="bi bi-x-lg me-1"></i>
                            انصراف
                        </button>
                    )}
                </div>
            )}

            <ConfirmModal
                show={showConfirmModal}
                onClose={cancelSave}
                onConfirm={confirmSave}
                title="تأیید ثبت امضا"
                message={`
                    آیا از ثبت این امضا مطمئن هستید؟
                    پس از ذخیره، امکان تغییر امضا وجود ندارد.
                    برای تغییر باید با ادمین تماس بگیرید.
                `}
                confirmText="بله، ثبت می‌شود"
                cancelText="انصراف"
                confirmVariant="danger"
                loading={isSaving}
            />
        </div>
    );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;