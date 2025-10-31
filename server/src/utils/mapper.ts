export const removeNullAttributes = <T extends object>(dto: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(dto).filter(
        ([_, value]) =>
            value !== null &&
            value !== undefined &&
            (!Array.isArray(value) || value.length > 0)
        )
    ) as Partial<T>;
}