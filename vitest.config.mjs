import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/database/**/*.test.mjs'],fileParallelism:false,testTimeout:60000,hookTimeout:180000}});
