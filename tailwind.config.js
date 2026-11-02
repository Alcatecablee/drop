/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8F8F7',
          muted: '#F1F1EF',
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#555552',
          faint: '#888885',
        },
        border: {
          DEFAULT: '#E5E5E3',
          dark: '#CCCCCC',
        },
        accent: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
