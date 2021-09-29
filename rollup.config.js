import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy-assets";

export default {
  input: './src/module/index.mjs',
  output: [
    { file: './dist/js/bundle.js' },
    { file: './dist/js/bundle.min.js', plugins: [terser()], format: 'iife' }
  ],
  plugins: [
    nodeResolve({ browser: true }),
    copy({
      assets: [
        "../assets",
        "../templates",
      ],
    }),
  ]
};