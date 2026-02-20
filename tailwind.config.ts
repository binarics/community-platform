import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        sage: {
          50: 'rgb(247, 249, 247)',
          100: 'rgb(232, 237, 232)',
          200: 'rgb(212, 223, 212)',
          300: 'rgb(168, 191, 168)',
          400: 'rgb(122, 155, 122)',
          500: 'rgb(82, 112, 82)',
          600: 'rgb(61, 90, 61)',
          700: 'rgb(45, 68, 45)',
        },
        terracotta: {
          50: 'rgb(253, 246, 244)',
          100: 'rgb(249, 232, 227)',
          200: 'rgb(243, 206, 194)',
          300: 'rgb(232, 166, 143)',
          400: 'rgb(217, 117, 82)',
          500: 'rgb(197, 90, 56)',
          600: 'rgb(168, 74, 47)',
        },
        clay: {
          100: 'rgb(243, 235, 227)',
          300: 'rgb(212, 184, 154)',
          600: 'rgb(125, 92, 63)',
        },
        cream: 'rgb(253, 251, 247)',
        charcoal: 'rgb(42, 47, 46)',
        slate: 'rgb(82, 99, 96)',
      },
    },
  },
  plugins: [],
}
export default config
