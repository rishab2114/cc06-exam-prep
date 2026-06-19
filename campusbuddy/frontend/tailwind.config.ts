import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1F6FEB' },
      },
      borderRadius: { xl: '12px' },
    },
  },
  plugins: [],
};

export default config;
