import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['domain/**/*.test.ts', 'lib/**/*.test.ts', 'server/**/*.test.ts', 'web/**/*.test.tsx'],
  },
});
