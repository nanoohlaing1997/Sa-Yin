export const colors = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#11161F',
  muted: '#6B7382',
  border: '#E6E8EF',
  primary: '#2F6BFF',
  primarySoft: '#E8EFFF',
  expense: '#E5484D',
  income: '#17A673',
  danger: '#E5484D',
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const shadow = {
  shadowColor: '#0B1220',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
