import "@testing-library/jest-dom/vitest";

// Polyfill crypto.subtle.timingSafeEqual — this is a Cloudflare Workers
// extension that does not exist in the jsdom / Node.js Web Crypto API.
// We implement a constant-time comparison using XOR over equal-length buffers.
function toUint8Array(buf: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (buf instanceof ArrayBuffer) return new Uint8Array(buf);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function timingSafeEqualPolyfill(
  a: ArrayBuffer | ArrayBufferView,
  b: ArrayBuffer | ArrayBufferView,
): boolean {
  const aBytes = toUint8Array(a);
  const bBytes = toUint8Array(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

if (
  typeof crypto !== "undefined" &&
  crypto.subtle != null &&
  !("timingSafeEqual" in crypto.subtle)
) {
  try {
    Object.defineProperty(crypto.subtle, "timingSafeEqual", {
      value: timingSafeEqualPolyfill,
      writable: true,
      configurable: true,
    });
  } catch {
    // Fallback for environments where defineProperty is restricted
    (crypto.subtle as unknown as Record<string, unknown>).timingSafeEqual =
      timingSafeEqualPolyfill;
  }
}
