/**
 * Makes every size in the generated CSS proportional to the phone screen.
 *
 * Design width is 390px, so 1 design px = 100cqw / 390 of the .screen wrapper. That value is
 * exposed as `--u` (see src/index.css), and this plugin rewrites:
 *   Npx  -> calc(var(--u) * N)          (hairlines of 1px or less stay as-is)
 *   Nrem -> calc(var(--u) * N*16)
 *   Nvw  -> calc(var(--u) * N*3.9)       (vw meant "% of the phone width")
 *   Nvh / Ndvh / Nsvh / Nlvh -> calc(var(--vh) * N)   (--vh = 1% of the visible phone screen)
 *
 * Outside the screen (the desktop mockup chrome) --u is 1px and --vh is 1vh, so those keep
 * their exact current size. @media / @supports params are never touched.
 */
const NUM = String.raw`-?(?:\d+\.?\d*|\.\d+)`;
const RE = new RegExp(String.raw`(^|[^\w#.\-])(${NUM})(px|rem|dvh|svh|lvh|vh|vw)(?![\w-])`, "g");

const round = (n) => Math.round(n * 1000) / 1000;

function convert(value) {
  // keep url(...) payloads (inline SVG data URIs) untouched
  const parts = value.split(/(url\((?:[^()]|\([^()]*\))*\))/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(RE, (m, pre, num, unit) => {
        const n = parseFloat(num);
        if (n === 0) return m;
        switch (unit) {
          case "px":
            if (Math.abs(n) <= 1) return m;
            return `${pre}calc(var(--u) * ${round(n)})`;
          case "rem":
            return `${pre}calc(var(--u) * ${round(n * 16)})`;
          case "vw":
            return `${pre}calc(var(--u) * ${round(n * 3.9)})`;
          default:
            return `${pre}calc(var(--vh) * ${round(n)})`;
        }
      });
    })
    .join("");
}

const plugin = () => ({
  postcssPlugin: "screen-units",
  Declaration(decl) {
    // --u/--vh define the scale; --tap is a real-px minimum (44px touch target) that must not scale
    if (decl.prop === "--u" || decl.prop === "--vh" || decl.prop === "--tap") return;
    if (decl.parent?.type === "atrule" && decl.parent.name === "property") return;
    if (decl.__screenUnits) return;
    const next = convert(decl.value);
    if (next !== decl.value) decl.value = next;
    decl.__screenUnits = true;
  },
});
plugin.postcss = true;

export default plugin;
