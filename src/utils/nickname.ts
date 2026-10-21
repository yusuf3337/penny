// Keep names usable in every supported language, including non-Latin scripts.
export const sanitizeNickname = (value: string): string =>
  value
    .replace(/[^\p{L}\p{M} ]/gu, '')
    .replace(/^[^\p{L}]+/u, '')
    .replace(/ +\p{M}+/gu, ' ')
    .replace(/ {2,}/g, ' ');

export const isValidNickname = (value: string): boolean =>
  /^\p{L}[\p{L}\p{M}]*(?: \p{L}[\p{L}\p{M}]*)*$/u.test(value);
