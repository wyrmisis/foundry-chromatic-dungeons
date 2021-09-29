import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy-assets";

export default {
  input: './src/module/index.mjs',
  output: [
    { file: './dist/bundle.js' },
    { file: './dist/bundle.min.js', plugins: [terser()], format: 'iife' }
  ],
  plugins: [
    babel(),
    nodeResolve({ browser: true }),
    copy({
      assets: [
        "../assets",
        "../templates",
      ],
    }),
  ]
};