export const dashboardTheme = {
  colors: {
    primary: '#4F46E5',
    dark: '#111827',
    background: '#F8FAFC',
    card: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  spacing: {
    screenPadding: 16,
    cardGap: 12,
    cardRadius: 18,
  },
  sizes: {
    iconSize: 26,
    minCardHeight: 135,
  },
  typography: {
    dashboardTitle: 22,
    featureTitle: 16,
    subtitle: 12,
    badge: 11,
  },
} as const;

export type DashboardTheme = typeof dashboardTheme;
