import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        host: true, // Listen on all network interfaces (required for Render)
        watch: {
            ignored: ['**/storage/framework/views/**'], // Keep ignoring Laravel compiled views
        },
    },
    preview: {
        host: true, // Required for external access on Render
        allowedHosts: ['printababes.onrender.com'], // ✅ Correct domain
    },
});
