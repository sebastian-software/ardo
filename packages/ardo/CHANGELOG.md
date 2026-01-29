# Changelog

## [1.2.0](https://github.com/sebastian-software/ardo/compare/ardo-v1.1.1...ardo-v1.2.0) (2026-01-29)


### Features

* auto-detect GitHub Pages base path from git remote ([995613b](https://github.com/sebastian-software/ardo/commit/995613bc1bd4635c351ebf05b36dd0888f0f5be9))


### Bug Fixes

* update templates and docs for GitHub Pages auto-detection ([aa372a9](https://github.com/sebastian-software/ardo/commit/aa372a970859f1fbd6b1503e297b569e60e71be4))

## [1.1.1](https://github.com/sebastian-software/ardo/compare/ardo-v1.1.0...ardo-v1.1.1) (2026-01-29)


### Bug Fixes

* remove route group wrapper to fix root path matching ([fffb3bf](https://github.com/sebastian-software/ardo/commit/fffb3bf0fd27aad7ec2a7b9b3f2e02c6eb067fdb))

## [1.1.0](https://github.com/sebastian-software/ardo/compare/ardo-v1.0.2...ardo-v1.1.0) (2026-01-29)


### Features

* add llms.txt and llms-full.txt for LLM-optimized documentation ([7a43f16](https://github.com/sebastian-software/ardo/commit/7a43f162410409ea9c7e6ff56e93a2138c6e427c))
* auto-generate TanStack route files to hide implementation detail ([2be55ea](https://github.com/sebastian-software/ardo/commit/2be55ea1d207a5e4c3fb731381b667d8b10e4fff))
* integrate create-ardo into release process, add deployment guide ([b313d06](https://github.com/sebastian-software/ardo/commit/b313d068ab5ea13d49ffb1157af59941e5c548b0))


### Bug Fixes

* add CSS for Shiki syntax highlighting dual-theme support ([aae6e22](https://github.com/sebastian-software/ardo/commit/aae6e2218a95f0c418e037650ee609d939154d52))
* add right padding to content area to prevent TOC overlap ([84d7e1d](https://github.com/sebastian-software/ardo/commit/84d7e1d3eafa27a68ca125a79bc66f5216fa9fdd))
* disable crawlLinks to fix prerender with base path ([ef6d378](https://github.com/sebastian-software/ardo/commit/ef6d378534787cefd862c2146d79856e059a2242))
* disable crawlLinks to fix prerender with base path ([6c4fabf](https://github.com/sebastian-software/ardo/commit/6c4fabf75cc6a3f179c1c67d0da492b10edaf900))
* remove background-color from Shiki spans to preserve code block styling ([149426b](https://github.com/sebastian-software/ardo/commit/149426bdd33386bca9f91e9791df14d233ed7dd4))
* resolve routes config early without external config file ([0424e34](https://github.com/sebastian-software/ardo/commit/0424e343bbf62c221a3b190a6edea0091ac1fbee))
* update logo with corrected export ([8e1147f](https://github.com/sebastian-software/ardo/commit/8e1147f5cd3ccb0db88d933f09f724ca661bff17))
* updated deps ([cae1da1](https://github.com/sebastian-software/ardo/commit/cae1da121dd950c86d7ce386795856e3355fb7dd))


### Code Refactoring

* integrate all plugins into ardo(), remove separate config file ([6d23a44](https://github.com/sebastian-software/ardo/commit/6d23a4443d4337fd8921e696c30906af0cfaafdd))
* migrate to JSX-first architecture with explicit props ([ff84d30](https://github.com/sebastian-software/ardo/commit/ff84d3036bd6c7f8101e023043ad44b85722ef1d))
* move boilerplate from plugin to scaffold template ([ada3a39](https://github.com/sebastian-software/ardo/commit/ada3a391a3f0f35a2c616e7fb4a0d91dee5c7efe))
* move TanStack and React plugin to regular dependencies ([9703453](https://github.com/sebastian-software/ardo/commit/970345364596858fec18663b98580677d1953f36))
* replace manual API docs with TypeDoc generation ([c4511b1](https://github.com/sebastian-software/ardo/commit/c4511b1662e0d24245b448675b8888f7d98b34cf))
* use wildcard versions for framework dependencies ([750a600](https://github.com/sebastian-software/ardo/commit/750a600d08a856090e9d2fd40ea069e9026458f4))

## [1.0.2](https://github.com/sebastian-software/ardo/compare/ardo-v1.0.1...ardo-v1.0.2) (2026-01-23)


### Bug Fixes

* generate routes in config hook before TanStack Router scans ([e4e0eaa](https://github.com/sebastian-software/ardo/commit/e4e0eaa3591ed0dd37d96a9206ad3960b9944f64))
* resolve ESLint unused variable errors ([3c4795d](https://github.com/sebastian-software/ardo/commit/3c4795d36af73c9016f775597776be513e237674))


### Tests

* add unit tests for config, toc, and containers ([e915d3c](https://github.com/sebastian-software/ardo/commit/e915d3c21d53fb1cb58a7e86c67ca62aa0436631))
