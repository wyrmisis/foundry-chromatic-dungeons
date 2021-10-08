// Node modules
import glob from "glob";
import path from "path";

// Rollup plugins
import { nodeResolve }  from '@rollup/plugin-node-resolve';
import { terser }       from "rollup-plugin-terser";
import copy             from "rollup-plugin-copy-assets";
import sourcemaps       from "rollup-plugin-sourcemaps";
import livereload       from 'rollup-plugin-livereload';

const watcher = (globs) => ({
  buildStart() {
    for (const item of globs) {
      glob.sync(path.resolve(item)).forEach((filename) => {
        this.addWatchFile(filename);
      });
    }
  }
})

export default {
  input: './src/module/index.mjs',
  output: [
    {
      file: './dist/js/bundle.js',
      sourcemap: true
    },
    {
      file: './dist/js/bundle.min.js',
      plugins: [terser()],
      sourcemap: true,
      format: 'iife'
    }
  ],
  plugins: [
    watcher(['src/**/*.hbs', 'src/**/*.html']),
    livereload('dist'),
    sourcemaps(),
    nodeResolve({ browser: true }),
    copy({
      assets: [
        "../assets",
        "../templates",
      ],
    }),
  ]
};
