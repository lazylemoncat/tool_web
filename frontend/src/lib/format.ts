'use client';

export function formatMoney(value: string | number | undefined | null, currency = 'CNY', digits = 0) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '未设置';
  return new Date(value).toLocaleDateString('zh-CN');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function toDateTimeInput(value: string) {
  return `${value}T00:00:00`;
}
