import { useMemo } from 'react';

/**
 * هوک فیلترهای آبشاری چندانتخابی
 * 
 * ترتیب: مقطع → دانشکده → گروه → رشته
 * ترکیب: AND بین فیلترها، OR داخل هر فیلتر
 * 
 * @param {Array} grooheList - لیست کامل گروه‌های آموزشی
 * @param {Array} reshtehList - لیست کامل رشته‌ها
 * @param {Array} selectedMaghtas - کدهای مقطع انتخاب‌شده (مثلاً ['5', '10'])
 * @param {Array} selectedDaneshkades - کدهای دانشکده
 * @param {Array} selectedGroohes - id گروه‌ها
 */
export const useCascadingFilters = (
    grooheList,
    reshtehList,
    selectedMaghtas = [],
    selectedDaneshkades = [],
    selectedGroohes = []
) => {

    // ============================================================
    // ۱. لیست مقطع‌ها (ثابت - همه)
    // ============================================================
    const maghtaOptions = useMemo(() => [
        { value: '5', label: 'کارشناسی' },
        { value: '10', label: 'کارشناسی ارشد' },
        { value: '15', label: 'دکتری تخصصی' }
    ], []);

    // ============================================================
    // ۲. لیست دانشکده‌ها (محدود به مقطع‌های انتخاب‌شده)
    // ============================================================
    const daneshkadeOptions = useMemo(() => {
        if (!grooheList || !reshtehList) return [];

        // گام ۱: اگه مقطع انتخاب شده، اول رشته‌ها رو فیلتر کن
        let allowedGrooheIds = null;

        if (selectedMaghtas.length > 0) {
            const filteredReshtehs = reshtehList.filter(r =>
                selectedMaghtas.includes(String(r.codeMaghta))
            );
            allowedGrooheIds = new Set(filteredReshtehs.map(r => r.grooheAmoozeshiId));
        }

        // گام ۲: دانشکده‌ها رو در بیار
        const map = new Map();
        grooheList.forEach(g => {
            // اگه مقطع انتخاب شده، فقط گروه‌هایی که توی allowedGrooheIds هستن
            if (allowedGrooheIds && !allowedGrooheIds.has(g.id)) return;

            if (g.codeDaneshkade && g.naamDaneshkadeh && !map.has(g.codeDaneshkade)) {
                map.set(g.codeDaneshkade, g.naamDaneshkadeh);
            }
        });

        return Array.from(map, ([code, name]) => ({
            value: code,
            label: name
        })).sort((a, b) => parseInt(a.value) - parseInt(b.value));
    }, [grooheList, reshtehList, selectedMaghtas]);

    // ============================================================
    // ۳. لیست گروه‌ها (محدود به مقطع + دانشکده‌های انتخاب‌شده)
    // ============================================================
    const grooheOptions = useMemo(() => {
        if (!grooheList || !reshtehList) return [];

        let filtered = [...grooheList];

        // فیلتر مقطع
        if (selectedMaghtas.length > 0) {
            const filteredReshtehs = reshtehList.filter(r =>
                selectedMaghtas.includes(String(r.codeMaghta))
            );
            const allowedGrooheIds = new Set(filteredReshtehs.map(r => r.grooheAmoozeshiId));
            filtered = filtered.filter(g => allowedGrooheIds.has(g.id));
        }

        // فیلتر دانشکده
        if (selectedDaneshkades.length > 0) {
            filtered = filtered.filter(g =>
                selectedDaneshkades.includes(g.codeDaneshkade)
            );
        }

        return filtered.map(g => ({
            value: g.id,
            label: `${g.onvanGrooheAmoozeshi}${g.vazeeat === false ? ' (غیرفعال)' : ''}`
        })).sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [grooheList, reshtehList, selectedMaghtas, selectedDaneshkades]);

    // ============================================================
    // ۴. لیست رشته‌ها (محدود به مقطع + دانشکده + گروه)
    // ============================================================
    const reshtehOptions = useMemo(() => {
        if (!reshtehList || !grooheList) return [];

        let filtered = [...reshtehList];

        // فیلتر مقطع
        if (selectedMaghtas.length > 0) {
            filtered = filtered.filter(r =>
                selectedMaghtas.includes(String(r.codeMaghta))
            );
        }

        // فیلتر دانشکده (از طریق گروه)
        if (selectedDaneshkades.length > 0) {
            const grooheIdsOfDaneshkades = grooheList
                .filter(g => selectedDaneshkades.includes(g.codeDaneshkade))
                .map(g => g.id);

            filtered = filtered.filter(r =>
                grooheIdsOfDaneshkades.includes(r.grooheAmoozeshiId)
            );
        }

        // فیلتر گروه
        if (selectedGroohes.length > 0) {
            const selectedGrooheIds = selectedGroohes.map(id => parseInt(id));
            filtered = filtered.filter(r =>
                selectedGrooheIds.includes(r.grooheAmoozeshiId)
            );
        }

        return filtered.map(r => ({
            value: r.id,
            label: `${r.codeReshte} - ${r.onvanReshte}`
        })).sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [reshtehList, grooheList, selectedMaghtas, selectedDaneshkades, selectedGroohes]);

    // ============================================================
    // ۵. خروجی
    // ============================================================
    return {
        maghtaOptions,
        daneshkadeOptions,
        grooheOptions,
        reshtehOptions
    };
};