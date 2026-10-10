// src/components/common/SignatureDisplay.jsx
import React, { useRef, useEffect, useState } from 'react';

const SignatureDisplay = ({
    signatureData,
    textTop = '',
    textBottom = '',
    displayText = '',
    position = 'BC',
    width = 250,
    height = 140,
    textFontSize = 16,
    textColor = '#1a1a1a',
    textOpacity = 0.9,
    className = '',
    autoWidth = true
}) => {
    const canvasRef = useRef(null);
    const [computedWidth, setComputedWidth] = useState(width);

    const POSITIONS = {
        'TL': { h: 'left', v: 'top' },
        'TC': { h: 'center', v: 'top' },
        'TR': { h: 'right', v: 'top' },
        'ML': { h: 'left', v: 'middle' },
        'MC': { h: 'center', v: 'middle' },
        'MR': { h: 'right', v: 'middle' },
        'BL': { h: 'left', v: 'bottom' },
        'BC': { h: 'center', v: 'bottom' },
        'BR': { h: 'right', v: 'bottom' },
    };

    const parseFreePosition = (pos) => {
        const match = pos.match(/x:(-?\d+),y:(-?\d+)/);
        if (match) {
            return { x: parseInt(match[1]), y: parseInt(match[2]), type: 'free' };
        }
        return null;
    };

    const calculatePosition = (canvasWidth, canvasHeight, textWidth, textHeight, pos, fontSize) => {
        const freePos = parseFreePosition(pos);
        if (freePos) {
            let x = canvasWidth / 2 + freePos.x;
            let y = canvasHeight / 2 + freePos.y;
            const margin = 10;
            x = Math.max(margin + textWidth / 2, Math.min(canvasWidth - margin - textWidth / 2, x));
            y = Math.max(margin + textHeight / 2, Math.min(canvasHeight - margin - textHeight / 2, y));
            return { x, y };
        }

        const position = POSITIONS[pos] || POSITIONS['BC'];
        const margin = Math.max(fontSize * 0.5, 12);

        let x, y;
        switch (position.h) {
            case 'left': x = margin + textWidth / 2; break;
            case 'right': x = canvasWidth - margin - textWidth / 2; break;
            default: x = canvasWidth / 2;
        }
        switch (position.v) {
            case 'top': y = margin + textHeight / 2; break;
            case 'bottom': y = canvasHeight - margin - textHeight / 2; break;
            default: y = canvasHeight / 2;
        }
        return { x, y };
    };

    useEffect(() => {
        if (!canvasRef.current || !signatureData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            // ============================================================
            // 🔥 محاسبه عرض خودکار بر اساس ارتفاع
            // ============================================================
            const imgRatio = img.width / img.height;
            const displayHeight = height;
            const displayWidth = autoWidth
                ? height * imgRatio
                : width;

            if (autoWidth) {
                setComputedWidth(displayWidth);
            }

            // ============================================================
            // تنظیم ابعاد canvas
            // ============================================================
            const scale = 2;
            canvas.width = displayWidth * scale;
            canvas.height = displayHeight * scale;
            canvas.style.width = displayWidth + 'px';
            canvas.style.height = displayHeight + 'px';

            ctx.scale(scale, scale);
            ctx.clearRect(0, 0, displayWidth, displayHeight);

            // ============================================================
            // 🔥 پس‌زمینه سفید
            // ============================================================
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, displayWidth, displayHeight);

            // ============================================================
            // 🔥 رسم تصویر: پر کردن کل canvas (بدون فضای خالی)
            // ============================================================
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

            // ============================================================
            // ادامه منطق رسم متن
            // ============================================================
            let topText = textTop;
            let bottomText = textBottom;

            if (!topText && !bottomText && displayText) {
                const parts = displayText.split(' - ');
                if (parts.length === 2) {
                    topText = parts[0].trim();
                    bottomText = parts[1].trim();
                } else {
                    topText = displayText;
                }
            }

            if (!topText && !bottomText) return;

            const maxWidth = displayWidth - 30;

            const getOptimalFontSize = (text, maxW, fontSize) => {
                let size = fontSize;
                ctx.font = `bold ${size}px Vazir, sans-serif`;
                let textWidth = ctx.measureText(text).width;

                while (textWidth > maxW && size > 10) {
                    size -= 1;
                    ctx.font = `bold ${size}px Vazir, sans-serif`;
                    textWidth = ctx.measureText(text).width;
                }
                return size;
            };

            let finalFontSizeTop = getOptimalFontSize(topText, maxWidth, textFontSize);
            let finalFontSizeBottom = getOptimalFontSize(bottomText, maxWidth, textFontSize);

            let finalFontSize = Math.min(finalFontSizeTop, finalFontSizeBottom);
            if (!topText) finalFontSize = finalFontSizeBottom;
            if (!bottomText) finalFontSize = finalFontSizeTop;
            if (!topText && !bottomText) return;

            ctx.save();
            ctx.font = `bold ${finalFontSize}px Vazir, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lineHeight = finalFontSize * 1.2;
            const totalTextHeight = lineHeight * 2 + 4;

            const topWidth = topText ? ctx.measureText(topText).width : 0;
            const bottomWidth = bottomText ? ctx.measureText(bottomText).width : 0;
            const maxTextWidth = Math.max(topWidth, bottomWidth);

            const pos = calculatePosition(
                displayWidth,
                displayHeight,
                maxTextWidth,
                totalTextHeight,
                position,
                finalFontSize
            );

            ctx.globalAlpha = textOpacity;
            ctx.fillStyle = textColor;

            if (topText) {
                const yTop = pos.y - lineHeight / 2 - 2;
                ctx.fillText(topText, pos.x, yTop);
            }

            if (bottomText) {
                const yBottom = pos.y + lineHeight / 2 + 2;
                ctx.fillText(bottomText, pos.x, yBottom);
            }

            ctx.globalAlpha = 1;
            ctx.restore();
        };
        img.src = signatureData;
    }, [signatureData, textTop, textBottom, displayText, position, width, height, textFontSize, textColor, textOpacity, autoWidth]);

    if (!signatureData) {
        return (
            <div className={`text-center text-muted py-3 ${className}`}>
                <i className="bi bi-file-earmark-x fs-3 d-block mb-1"></i>
                <small>امضا ثبت نشده</small>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                width: computedWidth + 'px',
                height: height + 'px',
                maxWidth: '100%',
                display: 'inline-block',
                background: 'white'
            }}
        />
    );
};

export default SignatureDisplay;