import type { NextConfig } from "next";
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load the Microsoft SEAL WebAssembly binary at build time so it is
// guaranteed to be bundled into the serverless function output on Vercel.
// node-seal is externalized, so its WASM file is NOT copied automatically;
// we embed it as a base64 data URL and pass it via the `wasmBinary` option.
let sealWasmBinary: Uint8Array | undefined;
try {
  const wasmPath = resolve(process.cwd(), 'node_modules', 'node-seal', 'dist', 'seal_throws.wasm');
  sealWasmBinary = readFileSync(wasmPath);
} catch {
  // Fallback: try the public copy
  try {
    const wasmPath = resolve(process.cwd(), 'public', 'seal_throws.wasm');
    sealWasmBinary = readFileSync(wasmPath);
  } catch {
    sealWasmBinary = undefined;
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['node-seal'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/node-seal/dist/*.wasm',
      './public/*.wasm',
    ],
  },
  env: {
    NEXT_PUBLIC_SEAL_WASM_BASE64: sealWasmBinary
      ? Buffer.from(sealWasmBinary).toString('base64')
      : '',
  },
};

export default nextConfig;
