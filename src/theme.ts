import { createTheme } from '@mantine/core';

// Carries over the tokens that used to live in the @theme block of global.css,
// so the app looks the same after dropping Tailwind. The old scale was
// half/one/two/three/four/five/six = 2/4/8/16/24/32/64px; Mantine only has five
// spacing slots, so `half` and `six` are written as literals at the few call
// sites that need them.
export const theme = createTheme({
  fontFamily:
    'Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  headings: { fontWeight: '700' },

  white: '#ffffff',
  black: '#000000',

  // The UI is monochrome — buttons are pure black on light and pure white on
  // dark. `dark` is the closest built-in palette; global.css pins the exact
  // filled/contrast values so the inversion works in both schemes.
  primaryColor: 'dark',

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  defaultRadius: 'md',
});
