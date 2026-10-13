import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages はリポジトリ名のサブパスで配信される
export default defineConfig({
  base: '/mahjong-nyumon/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
