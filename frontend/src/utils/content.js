export const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export const hasItems = (list) =>
    Array.isArray(list) &&
    list.some((item) => {
        if (typeof item === 'string') return item.trim().length > 0;
        return Object.values(item || {}).some((v) => typeof v === 'string' && v.trim().length > 0);
    });

export const firstText = (list, pick = (item) => (typeof item === 'string' ? item : item?.name)) => {
    const found = (Array.isArray(list) ? list : []).find((item) => hasText(pick(item)));
    return found === undefined ? '' : pick(found);
};
