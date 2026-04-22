const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/assets/stylesheets/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        'hf-blue':      '#0081A6',
        'hf-blue-dark': '#00607e',
        'hf-orange':    '#F07D00',
        'hf-green':     '#2ECC71',
        'hf-purple':    '#8B5CF6',
        'hf-yellow':    '#F5C518',
      },
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
