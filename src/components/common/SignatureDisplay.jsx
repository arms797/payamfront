// src/components/common/SignatureDisplay.jsx
import React, { useRef, useEffect } from 'react';

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
    className = ''
}) => {
    const canvasRef = useRef(null);

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

        const scale = 2;
        const displayWidth = width;
        const displayHeight = height;
        const canvasWidth = displayWidth * scale;
        const canvasHeight = displayHeight * scale;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';

        ctx.scale(scale, scale);
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, displayWidth, displayHeight);

            const imgRatio = img.width / img.height;
            let drawWidth = displayWidth;
            let drawHeight = displayHeight;

            if (imgRatio > 1) {
                drawHeight = displayWidth / imgRatio;
            } else {
                drawWidth = displayHeight * imgRatio;
            }

            const offsetX = (displayWidth - drawWidth) / 2;
            const offsetY = (displayHeight - drawHeight) / 2;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

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

            // ============================================================
            // 🔥 محاسبه اندازه فونت مناسب برای هر خط (به‌صورت جداگانه)
            // ============================================================
            const maxWidth = displayWidth - 30; // حاشیه ۱۵ پیکسل از هر طرف

            // تابع برای محاسبه فونت مناسب یک خط
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

            // اندازه فونت بهینه برای خط بالا
            let finalFontSizeTop = getOptimalFontSize(topText, maxWidth, textFontSize);
            let finalFontSizeBottom = getOptimalFontSize(bottomText, maxWidth, textFontSize);

            // اگر یکی از خط‌ها خالی نبود، از کوچک‌ترین اندازه استفاده کن تا هارمونی حفظ شود
            let finalFontSize = Math.min(finalFontSizeTop, finalFontSizeBottom);
            if (!topText) finalFontSize = finalFontSizeBottom;
            if (!bottomText) finalFontSize = finalFontSizeTop;
            if (!topText && !bottomText) return;

            // ============================================================
            // 🔥 رسم متن‌ها با اندازه فونت بهینه
            // ============================================================
            ctx.save();
            ctx.font = `bold ${finalFontSize}px Vazir, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lineHeight = finalFontSize * 1.2;
            const totalTextHeight = lineHeight * 2 + 4;

            // محاسبه پهنای خط‌ها با فونت نهایی
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
            ctx.shadowColor = 'rgba(255,255,255,0.9)';
            ctx.shadowBlur = 4;

            if (topText) {
                const yTop = pos.y - lineHeight / 2 - 2;
                ctx.fillText(topText, pos.x, yTop);
            }

            if (bottomText) {
                const yBottom = pos.y + lineHeight / 2 + 2;
                ctx.fillText(bottomText, pos.x, yBottom);
            }

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        };
        img.src = signatureData;
    }, [signatureData, textTop, textBottom, displayText, position, width, height, textFontSize, textColor, textOpacity]);

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
                width: width + 'px',
                height: height + 'px',
                maxWidth: '100%',
                display: 'inline-block',
                background: 'transparent',
                mixBlendMode: 'multiply'
            }}
        />
    );
};

export default SignatureDisplay;