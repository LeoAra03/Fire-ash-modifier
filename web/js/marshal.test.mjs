// Pruebas de marshal.js — ejecutar con: node web/js/marshal.test.mjs
import {
  marshalLoad, marshalDump, RSymbol, RString, RObject, RUserDef, RUserMarshal,
  RStruct, RRegexp, RFloat, RHash, RBignum, RClassRef,
} from "./marshal.js";

let pass = 0, fail = 0;
function eq(a, b, msg) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { pass++; }
  else { fail++; console.error("FALLA:", msg, "\n  esperado:", B, "\n  llegó:   ", A); }
}
function ok(c, msg) { if (c) pass++; else { fail++; console.error("FALLA:", msg); } }
const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join(" ");
const u8 = (arr) => new Uint8Array(arr);

// 1. Cumplimiento de especificación: bytes escritos a mano (formato Ruby real)
{
  // [1, 2, "hola"] en Marshal 4.8 real:
  // 04 08 5b 08 69 06 69 07 22 09 68 6f 6c 61
  const raw = u8([0x04,0x08,0x5b,0x08,0x69,0x06,0x69,0x07,0x22,0x09,0x68,0x6f,0x6c,0x61]);
  const v = marshalLoad(raw);
  ok(Array.isArray(v) && v.length === 3, "array de 3");
  eq(v[0], 1, "fixnum 1"); eq(v[1], 2, "fixnum 2");
  ok(v[2] instanceof RString && v[2].text === "hola", "string hola");
  const back = marshalDump(v);
  eq(hex(back), hex(raw), " hverdad: dump canónico idéntico");
}
{
  // {:E => true} como ivar de string UTF-8: I" hola \x06 : \x06 E T
  const raw = u8([0x04,0x08,0x49,0x22,0x09,0x68,0x6f,0x6c,0x61,0x06,0x3a,0x06,0x45,0x54]);
  const v = marshalLoad(raw);
  ok(v instanceof RString && v.text === "hola", "string con ivar");
  eq(v.ivars.length, 1, "1 ivar");
  eq(v.ivars[0][0].name, "E", "ivar :E");
  eq(v.ivars[0][1], true, "ivar true");
  eq(hex(marshalDump(v)), hex(raw), "dump ivar idéntico");
}
{
  // Símbolos con symlink: [:abc, :abc]
  const v = marshalLoad(marshalDump([new RSymbol("abc"), new RSymbol("abc")]));
  eq(v[0].name, "abc", "sym 1"); eq(v[1].name, "abc", "sym 2");
  const raw = marshalDump([new RSymbol("abc"), new RSymbol("abc")]);
  // debe contener ';' (0x3b) para el segundo
  ok(raw.includes(0x3b), "usa symlink");
}
{
  // Fixnums límite
  for (const n of [0, 1, -1, 122, 123, -123, -124, 255, 256, -256, -257, 65535, -65536, 0x7fffffff, -0x80000000]) {
    const v = marshalLoad(marshalDump(n));
    eq(v, n, "fixnum " + n);
  }
  // Bignum
  const big = 2n ** 70n + 12345n;
  eq(marshalLoad(marshalDump(big)).toBigInt().toString(), big.toString(), "bignum");
  eq(marshalLoad(marshalDump(-big)).toBigInt().toString(), (-big).toString(), "bignum neg");
}
{
  // Floats especiales
  for (const [v, raw] of [[1.5, "1.5"], [Infinity, "inf"], [-Infinity, "-inf"]]) {
    const o = marshalLoad(marshalDump(new RFloat(v)));
    ok(o.value === v && o.raw === raw, "float " + raw);
  }
  const nan = marshalLoad(marshalDump(new RFloat(NaN)));
  ok(Number.isNaN(nan.value) && nan.raw === "nan", "float nan");
}
{
  // Links: mismo objeto dos veces
  const shared = [1, 2];
  const v = marshalLoad(marshalDump([shared, shared]));
  ok(v[0] === v[1], "link preserva identidad");
  // Ciclo
  const cyc = [];
  cyc.push(cyc);
  const v2 = marshalLoad(marshalDump(cyc));
  ok(v2[0] === v2, "ciclo preservado");
}
{
  // Hash con default + claves objeto
  const h = new RHash([["a", 1], [2, "b"]], "dflt");
  const v = marshalLoad(marshalDump(h));
  eq(v.pairs.length, 2, "hash pares");
  eq(v.defVal.text, "dflt", "hash default");
}
{
  // Object RPG::Map simulado (como RGSS)
  const ev = new RObject("RPG::Event", [["@id", 1], ["@name", RString.fromText("Test")]]);
  const map = new RObject("RPG::Map", [
    ["@tileset_id", 1], ["@width", 20], ["@height", 15],
    ["@data", new RUserDef("Table", u8(20))],
    ["@events", new RHash([[1, ev]])],
  ]);
  const v = marshalLoad(marshalDump(map));
  eq(v.className, "RPG::Map", "clase mapa");
  eq(v.getIvar("width"), 20, "ancho");
  eq(v.getIvar("@events").pairs[0][1].getIvar("@name").text, "Test", "evento anidado");
  eq(marshalDump(v).length, marshalDump(map).length, "tamaño estable");
}
{
  // Struct, Regexp, ClassRef, UserMarshal, extended, uclass
  const st = new RStruct("MiStruct", [[new RSymbol("a"), 1]]);
  eq(marshalLoad(marshalDump(st)).name, "MiStruct", "struct");
  const rx = marshalLoad(marshalDump(new RRegexp(new TextEncoder().encode("a+"), 1)));
  ok(rx.options === 1, "regexp");
  eq(marshalLoad(marshalDump(new RClassRef("c", "Foo"))).name, "Foo", "classref");
  const um = marshalLoad(marshalDump(new RUserMarshal("Klass", [1])));
  eq(um.className, "Klass", "usermarshal");
  const arr = [1];
  arr.__ruby_extend = new RSymbol("M");
  const ve = marshalLoad(marshalDump(arr));
  eq(ve.__ruby_extend.name, "M", "extended");
  const arr2 = [2];
  arr2.__ruby_uclass = new RSymbol("C");
  eq(marshalLoad(marshalDump(arr2)).__ruby_uclass.name, "C", "uclass");
  const arr3 = [3];
  arr3.__ruby_ivars = [[new RSymbol("E"), true]];
  eq(marshalLoad(marshalDump(arr3)).__ruby_ivars.length, 1, "ivars en array");
}
{
  // Errores claros
  try { marshalLoad(u8([0x04, 0x08, 0x99])); ok(false, "tipo inválido debe fallar"); }
  catch (e) { ok(/desconocido/.test(e.message), "error tipo desconocido"); }
  try { marshalLoad(u8([0x05, 0x08])); ok(false, "versión debe fallar"); }
  catch (e) { ok(/versión/.test(e.message), "error versión"); }
}

console.log(`\nmarshal.js: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
