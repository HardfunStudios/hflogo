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
        'hf-blue':       '#0081A6',
        'hf-blue-dark':  '#006e8e',
        'hf-blue-light': '#00A8C0',
        'hf-yellow':     '#FFAA00',
        'hf-red':        '#D51414',
        'hf-gray':       '#929292',
      },
      fontFamily: {
        sans:   ['Montserrat', ...defaultTheme.fontFamily.sans],
        roboto: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
