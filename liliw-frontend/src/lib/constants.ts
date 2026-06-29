/**
 * Application Constants
 * Centralized configuration for colors, sizes, and other constants
 */

// Brand Colors
export const COLORS = {
  primary: '#1565C0', // Blue - Primary accent
  secondary: '#0F1F3C', // Navy - Secondary/background
  primaryLight: 'rgba(21, 101, 192, 0.08)', // Light blue background
  primaryLightHover: 'rgba(21, 101, 192, 0.1)', // Slightly darker blue
  gradient: 'linear-gradient(135deg, #1565C0 0%, #0F1F3C 100%)',
  gradientToRight: 'linear-gradient(to right, #1565C0, #0B3D91)',
} as const;

// Border Colors & Styles
export const BORDERS = {
  primary: '#1565C0',
  light: 'rgb(229, 231, 235)',
  dark: 'rgb(55, 65, 81)',
} as const;

// Ring Colors (for focus states)
export const RINGS = {
  primary: '#1565C0',
} as const;

// Typography Sizes
export const SIZES = {
  // Text sizes
  xs: 'xs',
  sm: 'sm',
  base: 'base',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
  '3xl': '3xl',
  '4xl': '4xl',
  '5xl': '5xl',

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
} as const;

// Icon Sizes
export const ICON_SIZES = {
  sm: 16,
  base: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

// Animations
export const ANIMATIONS = {
  duration: {
    fast: 150,
    base: 300,
    slow: 500,
  },
  easing: 'ease-in-out',
} as const;

// ZIndex values (for layering)
export const Z_INDEX = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  notification: 70,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// API Configuration
export const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
} as const;

// Validation
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^[\d\s+\-()]+$/,
  postalCode: /^[0-9]{4,6}$/,
} as const;

// Content lengths
export const CONTENT_LENGTHS = {
  minNameLength: 2,
  maxNameLength: 100,
  minEmailLength: 5,
  maxEmailLength: 255,
  minMessageLength: 10,
  maxMessageLength: 5000,
  minReviewLength: 5,
  maxReviewLength: 1000,
} as const;

// Feature flags (for conditional rendering)
export const FEATURES = {
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePWA: true,
  enableVR: true,
  enableSearch: true,
} as const;

// Environment
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export default {
  COLORS,
  BORDERS,
  RINGS,
  SIZES,
  ICON_SIZES,
  ANIMATIONS,
  Z_INDEX,
  BREAKPOINTS,
  API_CONFIG,
  VALIDATION,
  CONTENT_LENGTHS,
  FEATURES,
  ENV,
};
