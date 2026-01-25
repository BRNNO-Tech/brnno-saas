/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
        './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    safelist: [
        'bg-purple-100', 'bg-purple-900/30', 'border-purple-300', 'border-purple-800', 'text-purple-800', 'text-purple-200',
        'bg-pink-100', 'bg-pink-900/30', 'border-pink-300', 'border-pink-800', 'text-pink-800', 'text-pink-200',
        'bg-amber-100', 'bg-amber-900/30', 'border-amber-300', 'border-amber-800', 'text-amber-800', 'text-amber-200',
        'bg-emerald-100', 'bg-emerald-900/30', 'border-emerald-300', 'border-emerald-800', 'text-emerald-800', 'text-emerald-200',
        'bg-blue-100', 'bg-blue-900/30', 'border-blue-300', 'border-blue-800', 'text-blue-800', 'text-blue-200',
        'bg-rose-100', 'bg-rose-900/30', 'border-rose-300', 'border-rose-800', 'text-rose-800', 'text-rose-200',
        'bg-indigo-100', 'bg-indigo-900/30', 'border-indigo-300', 'border-indigo-800', 'text-indigo-800', 'text-indigo-200',
        'bg-teal-100', 'bg-teal-900/30', 'border-teal-300', 'border-teal-800', 'text-teal-800', 'text-teal-200',
        'bg-cyan-100', 'bg-cyan-900/30', 'border-cyan-300', 'border-cyan-800', 'text-cyan-800', 'text-cyan-200',
    ],
}
