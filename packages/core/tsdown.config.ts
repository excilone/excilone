import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  unbundle: true,
  minify: true,
  tsconfig: 'tsconfig.lib.json',
  platform: 'node',
  publint: true,
})
