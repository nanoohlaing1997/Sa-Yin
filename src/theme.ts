export const colors = {
  bg: '#F3F4F8',
  card: '#FFFFFF',
  text: '#1B1530',
  muted: '#7B778C',
  border: '#ECE9F2',
  // Brand: magenta taken from the app icon.
  primary: '#D6177F',
  primaryDark: '#9C0F5C',
  primarySoft: '#FCE7F2',
  expense: '#E5484D',
  income: '#14A06B',
  danger: '#E5484D',
};

export const spacing = (n: number) => n * 8;

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = {
  shadowColor: '#2A0F3D',
  shadowOpacity: 0.07,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;
