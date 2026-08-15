// src/constants/signaturePositions.js
export const SIGNATURE_POSITIONS = {
    // ============================================================
    // ۹ حالت روی امضا
    // ============================================================
    'TL': {
        label: 'بالا-چپ',
        h: 'left',
        v: 'top',
        inside: true,
        description: 'گوشه بالا سمت چپ روی امضا'
    },
    'TC': {
        label: 'بالا-وسط',
        h: 'center',
        v: 'top',
        inside: true,
        description: 'مرکز بالای امضا'
    },
    'TR': {
        label: 'بالا-راست',
        h: 'right',
        v: 'top',
        inside: true,
        description: 'گوشه بالا سمت راست روی امضا'
    },
    'ML': {
        label: 'وسط-چپ',
        h: 'left',
        v: 'middle',
        inside: true,
        description: 'سمت چپ وسط امضا'
    },
    'MC': {
        label: 'وسط-وسط',
        h: 'center',
        v: 'middle',
        inside: true,
        description: 'دقیقاً وسط امضا'
    },
    'MR': {
        label: 'وسط-راست',
        h: 'right',
        v: 'middle',
        inside: true,
        description: 'سمت راست وسط امضا'
    },
    'BL': {
        label: 'پایین-چپ',
        h: 'left',
        v: 'bottom',
        inside: true,
        description: 'گوشه پایین سمت چپ روی امضا'
    },
    'BC': {
        label: 'پایین-وسط',
        h: 'center',
        v: 'bottom',
        inside: true,
        description: 'مرکز پایین امضا'
    },
    'BR': {
        label: 'پایین-راست',
        h: 'right',
        v: 'bottom',
        inside: true,
        description: 'گوشه پایین سمت راست روی امضا'
    },

    // ============================================================
    // ۲ حالت خارج از کادر
    // ============================================================
    'ABOVE': {
        label: 'بالای کادر',
        position: 'above',
        inside: false,
        description: 'بالای کادر امضا'
    },
    'BELOW': {
        label: 'پایین کادر',
        position: 'below',
        inside: false,
        description: 'پایین کادر امضا'
    },
};

export const POSITION_OPTIONS = Object.entries(SIGNATURE_POSITIONS).map(([key, value]) => ({
    key: key,
    label: value.label,
    description: value.description,
    inside: value.inside
}));