export const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof value.toDate !== 'function'
    ) {
      cleaned[key] = removeUndefinedFields(value);
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned as Partial<T>;
};

export const nullIfUndefined = <T>(value: T | undefined | null): T | null => {
  return value === undefined ? null : value;
};
