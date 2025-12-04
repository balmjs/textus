#!/usr/bin/env node
/**
 * Build script for Cloudflare Pages Functions
 * Compiles TypeScript functions to JavaScript with all dependencies bundled
 */

import { build } from 'esbuild';
import { mkdirSync, rmSync } from 'fs';
import { dirname } from 'path';

const ENTRY = 'functions/api/[[path]].ts';
const OUTPUT = 'dist/functions/api/[[path]].js';

async function buildFunctions() {
  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT), { recursive: true });

  // Remove old TS file if exists
  try {
    rmSync('dist/functions/api/[[path]].ts', { force: true });
  } catch {}

  await build({
    entryPoints: [ENTRY],
    outfile: OUTPUT,
    bundle: true,
    format: 'esm',
    platform: 'browser', // Use browser platform for Cloudflare Workers compatibility
    target: 'es2022',
    minify: true,
    sourcemap: false,
    conditions: ['workerd', 'worker', 'browser'],
    mainFields: ['browser', 'module', 'main'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  console.log('✓ Functions built successfully');
}

buildFunctions().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
