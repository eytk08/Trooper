/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Dark mode is driven by a `dark` class on <html> (see src/hooks/useTheme.js),
  // so the visitor can override their OS setting with the toggle in the navbar.
  darkMode: 'class',
  theme: {
    extend: {
      transitionTimingFunction: {
        // The easing used by the hero -> chat transition
        trooper: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
