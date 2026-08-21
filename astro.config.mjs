import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL ?? 'https://w-valzelli.github.io';
const base = process.env.BASE_PATH ?? '/stint-analyzer';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
