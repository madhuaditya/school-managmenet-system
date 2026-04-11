export const toMoney = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Number(amount.toFixed(2));
};

export const formatMoney = (value: number | string) => toMoney(value).toFixed(2);

export const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

export const yearOptions = (start = 2020, end = new Date().getFullYear() + 2) => {
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
};
