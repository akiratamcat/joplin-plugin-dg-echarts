# Apache ECharts engine (vendored)

These files are copied unchanged from the npm package `echarts` (and the
license files of the two packages that `dist/echarts.min.js` bundles).
Do not edit them. To update the engine, follow the steps below.

| Item | Value |
| ---- | ----- |
| Package | `echarts` |
| Version | 6.1.0 (6.1.0 or later is required: earlier versions have the XSS issue GHSA-fgmj-fm8m-jvvx) |
| Tarball | https://registry.npmjs.org/echarts/-/echarts-6.1.0.tgz |
| npm integrity | `sha512-q0yaFPggC9FUdsWH4blavRWFmxdrIodbkoKNAjJudAI6CA9gNPxHtV2RcZNEepZVlk4yvBYkOkbk6HIVpIyHZA==` |
| License | Apache-2.0 (see `LICENSE` and `NOTICE`; parts of d3 under BSD-3-Clause, see `LICENSE-d3`) |
| Bundled in `echarts.min.js` | `zrender` 6.1.0 (BSD-3-Clause, `LICENSE-zrender`), `tslib` 2.3.0 (0BSD, `LICENSE-tslib`) |
| Retrieved | 2026-11-23 |

## Files

| File | From | SHA-256 | Use |
| ---- | ---- | ------- | --- |
| `echarts.min.js` | `echarts/dist/echarts.min.js` | `b66b25aeb4df84e33199dc21694014d336d222cbd9deb0e5a7c14bd6aa0d0fd0` | Engine (official minified UMD build, 1,121,883 bytes) |
| `langJA-obj.js` | `echarts/i18n/langJA-obj.js` | `d02c200093ee98d3e1e0c87da57a80ba951ee332f10fde9680a3890744f26e13` | Locale (Japanese) |
| `langKO-obj.js` | `echarts/i18n/langKO-obj.js` | `ac44f46d72a7543fcb784e72397fc2399c6fd1f95b7f9021a4176a32942c5971` | Locale (Korean) |
| `langDE-obj.js` | `echarts/i18n/langDE-obj.js` | `76b51509858693c917c418e39326f56079e8bae6fd27ae0d705c6fc3e6493856` | Locale (German) |
| `langFR-obj.js` | `echarts/i18n/langFR-obj.js` | `d45c4f79f6e3a2f1a7e09fe745fc381286489bd677bd0af339035299c34c63e6` | Locale (French) |
| `langES-obj.js` | `echarts/i18n/langES-obj.js` | `2a034e39125f431186db59fea6e8f4b3dc5b98493d67e3b5869d39c748a78c81` | Locale (Spanish) |
| `langPT-br-obj.js` | `echarts/i18n/langPT-br-obj.js` | `9feef4d9db5a9321d785af2384712a84e77276e32caf8738a7712ee49501e0f8` | Locale (Portuguese, Brazil) |
| `langIT-obj.js` | `echarts/i18n/langIT-obj.js` | `d8b8fabf2f8d93d621af8424c7e44086cecc9cec107577c67249888e9d9d88da` | Locale (Italian) |
| `langRU-obj.js` | `echarts/i18n/langRU-obj.js` | `0a4d80522400de3b797494c58b94dc11b0de9580926a20498e2dc71e2f7bb8fa` | Locale (Russian) |
| `LICENSE` | `echarts/LICENSE` | `634293835b43a6dd2094fa39182a3d9a6b9ca43b7fdb9ac354e8037af2a3093a` | ECharts license (Apache-2.0) |
| `NOTICE` | `echarts/NOTICE` | `d491d358344f842685c1b1585970999db65fe30ecf7ef3867af8814f4016c016` | ECharts notice |
| `LICENSE-d3` | `echarts/licenses/LICENSE-d3` | `e1211892da0b0e0585b7aebe8f98c1274fba15bafe47fa1f4ee8a7a502c06304` | License of the d3 code in ECharts (BSD-3-Clause) |
| `LICENSE-zrender` | `zrender@6.1.0/LICENSE` | `a681e9d183c72b4af4856935893805eb48c08f0f5a3f260203db7444c20fb98a` | zrender license (BSD-3-Clause) |
| `LICENSE-tslib` | `tslib@2.3.0/LICENSE.txt` | `210b19e543130388c68654b7497e967119ce17145f66ab7d85688fbd70f08751` | tslib license (0BSD) |

Integrity of the other two tarballs: `zrender@6.1.0`
`sha512-oEGMDB6pOP2S6OwRR4PdVv610zrjnA3Bh+JnSG12fYJlBKjtNAoEb5fSUoCOOINlH96I2fU38/A2UpRKs67xYQ==`,
`tslib@2.3.0`
`sha512-N82ooyxVNm6h1riLCoyS9e3fuJ3AMG2zIZs2Gd1ATcSFjSA23Q0fzjjZeh0jbJvWVDZ0cJT8yaNNaaXHzueNjg==`.

English and Chinese are built into the engine. The other locales are the
`i18n/langXX-obj.js` files: `lib/i18n/langXX.js` is an ES module that Node's
`require` cannot load, and `i18n/langXX.js` requires `echarts/lib/echarts`.
See `docs/design.ja.md` (7.5, 10.3).

## Updating

1. `npm pack echarts@<version>` and check that the tarball's sha512 matches
   `npm view echarts@<version> dist.integrity`. Do the same for the `zrender`
   and `tslib` versions listed in its `package.json`.
2. Check the licenses, and whether `LICENSE` names any new bundled code.
3. Copy the files listed above byte for byte (`.gitattributes` keeps Git from
   changing their line endings) and update this file.
4. Update `ENGINE_VERSION` in `src/contentScript/engine.ts` (part of the cache
   key) and the list of series types in `src/contentScript/optionCheck.ts`
   (from the `seriesType` values the new build registers).
5. The input guard (`src/contentScript/inputGuard.ts`) removes known risky
   keys (a deny list). Check the release notes and the option reference for
   new options that load an external URL or take HTML, and add them.
   The sanitiser (`src/contentScript/sanitize.ts`) keeps a `<style>` only
   in the line forms zrender writes (`CSS_LINES`); if the tests in
   `tests/optionCheck.test.ts` fail there, check the new forms before
   adding them.
6. Run `npm test` (the package test compares the engine in the `.jpl` with
   this folder) and try the plugin in Joplin.
