// Polyfill de DOMMatrix para pdfjs en el runtime de Next.
//
// pdf.mjs tiene `const SCALE_MATRIX = new DOMMatrix()` a nivel de MODULO, asi
// que sin DOMMatrix el import falla entero con "ReferenceError: DOMMatrix is
// not defined" — ni siquiera llega a leer el archivo.
//
// pdfjs trae su propio polyfill, pero lo resuelve con
// `createRequire(import.meta.url).require("@napi-rs/canvas")`. Dentro del
// bundle de Next ese require no resuelve, el polyfill se salta en silencio y
// el modulo revienta al cargar. En Node puro si resuelve, y por eso el bug NO
// aparece corriendo scripts sueltos: solo dentro de la app.
//
// Implementacion 2D completa en vez de un stub: si pdfjs llega a usar la
// matriz para posicionar texto, las cuentas tienen que dar bien.

type Matrix2D = { a: number; b: number; c: number; d: number; e: number; f: number };

class DOMMatrixPolyfill implements Matrix2D {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[] | string | Matrix2D) {
    if (init === undefined) return;
    if (typeof init === "string") {
      const nums = init.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
      if (nums.length >= 6) this.setValues(nums);
      return;
    }
    if (Array.isArray(init)) {
      // Un array de 16 es una matriz 4x4; los 6 valores 2D estan en a,b,e,f.
      if (init.length === 16) {
        this.setValues([init[0], init[1], init[4], init[5], init[12], init[13]]);
      } else if (init.length >= 6) {
        this.setValues(init);
      }
      return;
    }
    this.setValues([init.a, init.b, init.c, init.d, init.e, init.f]);
  }

  private setValues(v: number[]): void {
    [this.a, this.b, this.c, this.d, this.e, this.f] = v;
  }

  get isIdentity(): boolean {
    return (
      this.a === 1 && this.b === 0 && this.c === 0 &&
      this.d === 1 && this.e === 0 && this.f === 0
    );
  }

  /** this = this * other */
  multiplySelf(other: Matrix2D): this {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }

  /** this = other * this */
  preMultiplySelf(other: Matrix2D): this {
    const { a, b, c, d, e, f } = this;
    this.a = other.a * a + other.c * b;
    this.b = other.b * a + other.d * b;
    this.c = other.a * c + other.c * d;
    this.d = other.b * c + other.d * d;
    this.e = other.a * e + other.c * f + other.e;
    this.f = other.b * e + other.d * f + other.f;
    return this;
  }

  multiply(other: Matrix2D): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(this).multiplySelf(other);
  }

  translateSelf(tx = 0, ty = 0): this {
    this.e += this.a * tx + this.c * ty;
    this.f += this.b * tx + this.d * ty;
    return this;
  }

  translate(tx = 0, ty = 0): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(this).translateSelf(tx, ty);
  }

  scaleSelf(sx = 1, sy?: number): this {
    const y = sy ?? sx;
    this.a *= sx;
    this.b *= sx;
    this.c *= y;
    this.d *= y;
    return this;
  }

  scale(sx = 1, sy?: number): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(this).scaleSelf(sx, sy);
  }

  rotateSelf(deg = 0): this {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return this.multiplySelf({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
  }

  rotate(deg = 0): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(this).rotateSelf(deg);
  }

  invertSelf(): this {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) {
      // Igual que el DOMMatrix real: una matriz no invertible se marca con NaN.
      this.a = this.b = this.c = this.d = this.e = this.f = NaN;
      return this;
    }
    const { a, b, c, d, e, f } = this;
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }

  inverse(): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill(this).invertSelf();
  }

  transformPoint(p: { x?: number; y?: number } = {}) {
    const x = p.x ?? 0;
    const y = p.y ?? 0;
    return {
      x: this.a * x + this.c * y + this.e,
      y: this.b * x + this.d * y + this.f,
      z: 0,
      w: 1,
    };
  }

  toString(): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
  }
}

/**
 * Instala los globals que pdfjs espera. Idempotente: si el entorno ya los
 * trae (o @napi-rs/canvas resolvio bien), no pisa nada.
 *
 * Hay que llamarla ANTES de cualquier `import("pdf-parse")` o
 * `import("officeparser")`.
 */
export function ensurePdfGlobals(): void {
  const g = globalThis as Record<string, unknown>;

  if (g.DOMMatrix === undefined) {
    g.DOMMatrix = DOMMatrixPolyfill;
    // pdfjs usa los tres nombres segun la ruta de codigo.
    g.WebKitCSSMatrix = DOMMatrixPolyfill;
    g.SVGMatrix = DOMMatrixPolyfill;
  }

  // Solo se usa en el pipeline de dibujo, que la extraccion de texto no toca.
  // Alcanza con que exista para que el modulo cargue.
  if (g.Path2D === undefined) {
    g.Path2D = class Path2D {
      addPath(): void {}
      moveTo(): void {}
      lineTo(): void {}
      closePath(): void {}
    };
  }
}
