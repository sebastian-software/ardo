# Changelog

## [4.2.0](https://github.com/sebastian-software/ardo/compare/ardo-v4.1.0...ardo-v4.2.0) (2026-07-10)


### Features

* add external content collection reference ([5638c69](https://github.com/sebastian-software/ardo/commit/5638c696be07faa13bb493b5889f6d3505879d0a))
* add locale switcher ([0a3fadf](https://github.com/sebastian-software/ardo/commit/0a3fadf693cbf8b1a43792ccc8de2ba583c91f23))
* add static content collections ([714cfca](https://github.com/sebastian-software/ardo/commit/714cfca111b8b771c2907320d3465f23fddace4a))
* deliver v4.2 universal documentation workflows ([8e49e3c](https://github.com/sebastian-software/ardo/commit/8e49e3cbb58c6bb62320502db86dc0d48a58cdc5))
* detect locale content routes ([96bc520](https://github.com/sebastian-software/ardo/commit/96bc5208f8cb811e5ea58895bca220303634d9c5))
* enforce static documentation invariants ([d3a9e9e](https://github.com/sebastian-software/ardo/commit/d3a9e9eb9c25db6b4a6567449156f588c4cbc7c8))
* expose typed collection records ([4e55652](https://github.com/sebastian-software/ardo/commit/4e55652e51b133dccbe2e15c0cb4ba78be0781a6))
* generate locale-specific sidebars ([16e75e8](https://github.com/sebastian-software/ardo/commit/16e75e8159826c220299d33c69dbd422920ec6c3))
* generate static OpenAPI references ([9a976dd](https://github.com/sebastian-software/ardo/commit/9a976dd22383a32786e1cb2f9372b8ef17aac16b))
* validate page frontmatter metadata ([70470db](https://github.com/sebastian-software/ardo/commit/70470dbff482d58e29a278e0d9724a4e4176bf85))


### Bug Fixes

* avoid duplicate openapi generation ([853756b](https://github.com/sebastian-software/ardo/commit/853756b95cac3526b755bd5befb9ffb8a0bae23b))
* harden v4.2 release consumers and OpenAPI builds ([52064c5](https://github.com/sebastian-software/ardo/commit/52064c500db35ffa2afd6b8a48727432aa7a19b8))
* keep i18n routes below version base ([794e6d0](https://github.com/sebastian-software/ardo/commit/794e6d0aa8dd292db00fb15b9a7736f1f8ddcb52))
* preserve frontmatter redirects ([49f892e](https://github.com/sebastian-software/ardo/commit/49f892ee100b6f6cfdf115f58b091c5381854ca1))
* require lucide for UI consumers ([33b72c6](https://github.com/sebastian-software/ardo/commit/33b72c640484c34765466686f31bd7b3442ffe2e))
* satisfy v4.2 lint gate ([73b6189](https://github.com/sebastian-software/ardo/commit/73b61894a2e4e93e2ceafe239eb51c1fc7b66680))

## [4.1.0](https://github.com/sebastian-software/ardo/compare/ardo-v4.0.0...ardo-v4.1.0) (2026-07-09)


### Features

* add Mermaid diagram support for Markdown and MDX ([4704fd7](https://github.com/sebastian-software/ardo/commit/4704fd7b7db3d7fe2096bb8e0cc981731eae1d28)), closes [#67](https://github.com/sebastian-software/ardo/issues/67) [#290](https://github.com/sebastian-software/ardo/issues/290)
* add performance budgets for the docs build ([ba16eb9](https://github.com/sebastian-software/ardo/commit/ba16eb972fba01c12a41fb53c97140bcde2a9c14)), closes [#178](https://github.com/sebastian-software/ardo/issues/178) [#290](https://github.com/sebastian-software/ardo/issues/290)
* adopt Base UI as interaction layer foundation ([d1e2c9b](https://github.com/sebastian-software/ardo/commit/d1e2c9bc279c3df80f6d5e3e95fac05b3e9c101c)), closes [#290](https://github.com/sebastian-software/ardo/issues/290)
* rebuild Accordion and AccordionGroup on Base UI ([225ac0c](https://github.com/sebastian-software/ardo/commit/225ac0c95e8af8d8c8a92213d4097c2b6d0f4877)), closes [#72](https://github.com/sebastian-software/ardo/issues/72) [#290](https://github.com/sebastian-software/ardo/issues/290)


### Bug Fixes

* resolve rebase conflicts with v4.0.0 main ([beae4bc](https://github.com/sebastian-software/ardo/commit/beae4bc3278cee928ef90bf91d99017e3279d876)), closes [#290](https://github.com/sebastian-software/ardo/issues/290)


### Tests

* add Storybook stories for the Mermaid component ([9924f2d](https://github.com/sebastian-software/ardo/commit/9924f2d37543e8e558a42b498a8b7c7548263598))

## [4.0.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.8.1...ardo-v4.0.0) (2026-07-09)


### ⚠ BREAKING CHANGES

* Ardo 4.0 stabilizes the major-version docs URL contract; production docs should use canonical /vN/ paths and preserve older major folders during static deployments.

### Features

* add brand shortcut ([5fa1007](https://github.com/sebastian-software/ardo/commit/5fa1007204a82a6f6e63cf12951464441c640e81))
* add content source mapping ([b8a100a](https://github.com/sebastian-software/ardo/commit/b8a100a993daff9a054b918083cb9b7ede8f3381))
* add docs versioning and pages deploy ([013c349](https://github.com/sebastian-software/ardo/commit/013c349fd02d74ff132b735d50f2d0c125252b64))
* add jsx-first site navigation ([dfab5d6](https://github.com/sebastian-software/ardo/commit/dfab5d6645577850b95ac4d4a72a297089de5950))
* add jsx-first site navigation ([55f0d4c](https://github.com/sebastian-software/ardo/commit/55f0d4c7894d7283aad0d7d78a178164a1a70acf))
* add route identity builder ([4496625](https://github.com/sebastian-software/ardo/commit/449662538abb35cfcf94610dc82239c11f52a86d))
* add route metadata to generated sidebars ([41c479f](https://github.com/sebastian-software/ardo/commit/41c479f89ee4d774fe1e0a6378b4283e7764ee66))
* add route metadata to search index ([fc030fd](https://github.com/sebastian-software/ardo/commit/fc030fd5f26892d24b6b987015525f645a2c95fb))
* add static section search records ([0613964](https://github.com/sebastian-software/ardo/commit/0613964c9688a98b0eb4581bc8597e34c9dc4359))
* enable versioned docs deployment ([e6b542b](https://github.com/sebastian-software/ardo/commit/e6b542b9c42ab743fe567feba66ae9868e5e443f))
* harden v4 docs deployment readiness ([e86cd4c](https://github.com/sebastian-software/ardo/commit/e86cd4cd44c1e412f9767c92870665e7368d6294)), closes [#288](https://github.com/sebastian-software/ardo/issues/288)
* prepare locale-prefixed docs URLs ([c0fe0e8](https://github.com/sebastian-software/ardo/commit/c0fe0e8577e147c152b9c5449082f1fcb99ed556))
* stabilize version switcher paths ([b97014e](https://github.com/sebastian-software/ardo/commit/b97014e22011ec91f87c2be86c8f1d2de6be02df))
* thread route identity through build outputs ([0d17a14](https://github.com/sebastian-software/ardo/commit/0d17a14553e21424f64f17f5a1af9c1f052243a4))


### Bug Fixes

* address generated sidebar review findings ([d1434e1](https://github.com/sebastian-software/ardo/commit/d1434e1b65dbbc74c2c9a60f96964c66df9d34b1))
* address generated sidebar review findings ([da48557](https://github.com/sebastian-software/ardo/commit/da4855725e92aaf47122fe9bd5e93efb49afa0cf))
* address roadmap review feedback ([d8190f9](https://github.com/sebastian-software/ardo/commit/d8190f921412f08b9071122c295539156a815cdc))
* keep runtime sidebar output stable ([fe1fef7](https://github.com/sebastian-software/ardo/commit/fe1fef76fd588570f6783f3797fac9e7327a2462))
* stabilize mobile docs navigation test ([6100143](https://github.com/sebastian-software/ardo/commit/610014342a8451fa6e0ad64365850f6f69e94d54))
* stabilize mobile docs navigation test ([97881e1](https://github.com/sebastian-software/ardo/commit/97881e1470389dd970aedcc167acc7f6a20efc30))


### Code Refactoring

* centralize page metadata for search outputs ([5ee609d](https://github.com/sebastian-software/ardo/commit/5ee609d0a3dc49e026e71e72b5e9f74b9724c9d8))
* name internal lifecycle phases ([315f920](https://github.com/sebastian-software/ardo/commit/315f92055c25414f0024295f7b5beadbaabca9d1))
* share frontmatter metadata parsing ([00e7726](https://github.com/sebastian-software/ardo/commit/00e7726e2a6ac4b21e04b6d8c11ac798c8a2a8e7))

## [3.8.1](https://github.com/sebastian-software/ardo/compare/ardo-v3.8.0...ardo-v3.8.1) (2026-07-08)


### Bug Fixes

* address GitHub Pages flatten review feedback ([e02c600](https://github.com/sebastian-software/ardo/commit/e02c6003bf15d1a523d8458d0a13af6630177d1f))
* flatten GitHub Pages prerender output ([4c5fa82](https://github.com/sebastian-software/ardo/commit/4c5fa823821ece38aa47687eb8792c58d5a15c58))

## [3.8.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.7.0...ardo-v3.8.0) (2026-07-07)


### Features

* rework the sidebar navigation ([1332464](https://github.com/sebastian-software/ardo/commit/1332464108ffead5199689ae7566fb50505ae694))


### Bug Fixes

* mark linked sidebar parent active only on its own page ([36d592e](https://github.com/sebastian-software/ardo/commit/36d592e57ec519b4c63478dc124611398a0bc3f1)), closes [#277](https://github.com/sebastian-software/ardo/issues/277)


### Tests

* make parent-link class lookup attribute-order agnostic ([eeccac7](https://github.com/sebastian-software/ardo/commit/eeccac71c82e73c36c7a23064339e566a0d8af98))

## [3.7.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.6.1...ardo-v3.7.0) (2026-07-07)


### Features

* add neutral theme hue ([#193](https://github.com/sebastian-software/ardo/issues/193)) ([642c568](https://github.com/sebastian-software/ardo/commit/642c5687152e8be101f67ce48048a6bc9c6db86f))
* add theme policy and token override APIs ([7b9221a](https://github.com/sebastian-software/ardo/commit/7b9221a23fc407211a54c49862e258990347f63f))
* add UI chrome labels and accessibility polish ([830a381](https://github.com/sebastian-software/ardo/commit/830a3813cba23f047db349138c0eb427f252e967))
* elevate the default theme with hue-derived depth and a tintable logo ([b1a719a](https://github.com/sebastian-software/ardo/commit/b1a719a6eb19c0588a6196f082015f7feca1c161))
* generate llms text artifacts ([#194](https://github.com/sebastian-software/ardo/issues/194)) ([a6203db](https://github.com/sebastian-software/ardo/commit/a6203db6cd2afbf06f9c796e1ce05b2a567c76d9))
* refine default UI to a calmer, more sophisticated baseline ([de87843](https://github.com/sebastian-software/ardo/commit/de8784397e2a4a3e179c013d78e9539a63879852))


### Bug Fixes

* allow default tabs to switch ([8f681c1](https://github.com/sebastian-software/ardo/commit/8f681c1f4613e78fe1190abc41219dcad1800fcc))
* apply configured mdx plugins ([a28532b](https://github.com/sebastian-software/ardo/commit/a28532b4f56da95d93cab6a825cfa73e042ce4d5))
* apply theme before hydration ([37df01d](https://github.com/sebastian-software/ardo/commit/37df01de90a77020ea999e32f4d1d9792e2f3958))
* correct full-bleed layout seams and orphaned sidebar rail indicator ([65d080d](https://github.com/sebastian-software/ardo/commit/65d080d33b042e4943074fb627dd80f5d221815e))
* correct P2 config and build core behavior ([823c034](https://github.com/sebastian-software/ardo/commit/823c034b928613c5f0b9688b3c247300abf5c51e))
* declare app runtime packages as peers ([17da14f](https://github.com/sebastian-software/ardo/commit/17da14f07e632cb663547c256cf09c929689e7a3))
* harden code highlighting and runtime helpers ([efebaa9](https://github.com/sebastian-software/ardo/commit/efebaa9d515a6d38b637131088893a582f953384))
* harden UI shell CSS and mobile chrome ([7076b86](https://github.com/sebastian-software/ardo/commit/7076b860999ac867e8b5a9fca3ea1255e40963dc))
* improve UI accessibility behavior ([d1c10bd](https://github.com/sebastian-software/ardo/commit/d1c10bd54822301bca3033b50df8fe0ea8fa378a))
* keep sidebar when frontmatter is malformed ([d7d0b80](https://github.com/sebastian-software/ardo/commit/d7d0b80b7d69f580c3fb16eb3555a8a824f0c575))
* protect typedoc output and cold builds ([4fe4867](https://github.com/sebastian-software/ardo/commit/4fe4867ad24c1ad27906c833e3bbe5821cd7a35d))
* refresh route virtual modules in dev ([09b04d3](https://github.com/sebastian-software/ardo/commit/09b04d395c44013369f87665eddf92f628d8baf9))
* reset default list padding/margin on sidebar, TOC, rail, and search ([bb2106c](https://github.com/sebastian-software/ardo/commit/bb2106cc921c88ee8e9f03803f9132f385028b1a))


### Code Refactoring

* restore intended code block vertical margin ([673b74e](https://github.com/sebastian-software/ardo/commit/673b74e0419c3c3fa8ce5e4a0bb332b9606b7316))
* use shadow tokens for hero button and feature card ([b120dca](https://github.com/sebastian-software/ardo/commit/b120dca555627403762b0a46d6c3c206c58b8f71))


### Documentation

* refresh guide and contributor references ([c36ab85](https://github.com/sebastian-software/ardo/commit/c36ab852ecc0347dd5a33ac80edc5ae626b22bd8))


### CI/CD

* test the Node 22 line instead of a pinned patch ([353c191](https://github.com/sebastian-software/ardo/commit/353c1917efda971657c135a2a0dfb3ac35a09403))


### Tests

* add browser and core coverage gates ([fe82169](https://github.com/sebastian-software/ardo/commit/fe821692fed357a9f16c21b4aa0ac2a3c22b76e9))
* address typedoc route review feedback ([540950f](https://github.com/sebastian-software/ardo/commit/540950f9028391593a7f957345cb8bdac6cdda6a))
* cover mdx built-in plugin defaults ([2fe4153](https://github.com/sebastian-software/ardo/commit/2fe41538b109f9c9ebce1447ddb0a382f3cade07))
* cover typedoc route ordering ([f8cbefd](https://github.com/sebastian-software/ardo/commit/f8cbefd063218f8972a66288bfe5e5209b59c06f))

## [3.6.1](https://github.com/sebastian-software/ardo/compare/ardo-v3.6.0...ardo-v3.6.1) (2026-06-21)


### Bug Fixes

* harden footer HTML rendering ([#190](https://github.com/sebastian-software/ardo/issues/190)) ([b1f5b47](https://github.com/sebastian-software/ardo/commit/b1f5b47ca4c4323e945e400957184e17ac37db01))

## [3.6.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.5.0...ardo-v3.6.0) (2026-06-21)


### Features

* add Accordion components ([#141](https://github.com/sebastian-software/ardo/issues/141)) ([5ed5ee6](https://github.com/sebastian-software/ardo/commit/5ed5ee641d58b01ef1e5c75b9ba8ffe563cf8215))
* add Badge component ([#124](https://github.com/sebastian-software/ardo/issues/124)) ([09f2a59](https://github.com/sebastian-software/ardo/commit/09f2a598836fafb5af7a51c2de42d80096605d45))
* add build-time SEO and link outputs ([#185](https://github.com/sebastian-software/ardo/issues/185)) ([b82fdd2](https://github.com/sebastian-software/ardo/commit/b82fdd2428ce587159db553fa129afc690121d38))
* add Card and CardGroup components ([#140](https://github.com/sebastian-software/ardo/issues/140)) ([2e7156c](https://github.com/sebastian-software/ardo/commit/2e7156c57c2248d85f39d5a379285eb3d2a81828))
* add social metadata generation ([#186](https://github.com/sebastian-software/ardo/issues/186)) ([7544490](https://github.com/sebastian-software/ardo/commit/7544490ea719e3486619b06efd4db30588c37659))


### Bug Fixes

* expose search as accessible combobox ([#183](https://github.com/sebastian-software/ardo/issues/183)) ([a9d0dcb](https://github.com/sebastian-software/ardo/commit/a9d0dcb0d678fd6185854b2ac3853555e627b32e))
* make mobile drawer modal-safe ([#184](https://github.com/sebastian-software/ardo/issues/184)) ([0f68fab](https://github.com/sebastian-software/ardo/commit/0f68fab82a99e4557f670fa85fd0ce6cdaa83263))
* make tabs accessible ([#182](https://github.com/sebastian-software/ardo/issues/182)) ([3fc2eac](https://github.com/sebastian-software/ardo/commit/3fc2eac14cefce798afcbb8082dce03c7a1e75db))

## [3.5.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.4.0...ardo-v3.5.0) (2026-05-22)


### Features

* spacing polish for heading rhythm, code and card padding ([7ce4f6e](https://github.com/sebastian-software/ardo/commit/7ce4f6ee79b9d242dc3f5a46808d544a6966c089))

## [3.4.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.3.0...ardo-v3.4.0) (2026-05-21)


### Features

* context-aware sidebar rail with auto sidebars and bare layouts ([f7f2a69](https://github.com/sebastian-software/ardo/commit/f7f2a698046b78a8ab55a2549008934302cc87d2))
* duo-tone color system with warm chrome and cool code surfaces ([99a895d](https://github.com/sebastian-software/ardo/commit/99a895d15c1e5594080656f1581f0af066630d75))
* move search into the header with a mobile overlay ([b5025d7](https://github.com/sebastian-software/ardo/commit/b5025d7cc5438d34672e92c27c1314ae9adc6856))

## [3.3.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.2.1...ardo-v3.3.0) (2026-05-09)


### Features

* **ardo:** add lean favicon generation ([e2697df](https://github.com/sebastian-software/ardo/commit/e2697df78e327c66185d812f204b4a53ad084f26))
* **ardo:** merge default docs redesign ([1a4dea4](https://github.com/sebastian-software/ardo/commit/1a4dea4ebbf29503248c466672104e375858f5cb))
* **ardo:** redesign default docs UI ([f51712e](https://github.com/sebastian-software/ardo/commit/f51712edda7dd69d10501ae7665aa5e45afe14b0))
* **ardo:** support generated sidebar section order ([f44fb8e](https://github.com/sebastian-software/ardo/commit/f44fb8ec2a015f3c9fbb2833375aa8983ebdf222))
* **ardo:** support generated sidebar section order ([5de6dda](https://github.com/sebastian-software/ardo/commit/5de6dda10524996137d60ed4998e1704b81d285b))


### Bug Fixes

* **ui:** align sidebar collapse icons ([061e269](https://github.com/sebastian-software/ardo/commit/061e269245bbdef120d6d390298db4b85c3bcd4f))
* **ui:** widen and wrap footer layout ([1b4a95b](https://github.com/sebastian-software/ardo/commit/1b4a95bb11ec8f2ea350933245a0067db98c4641))


### Documentation

* polish positioning and homepage design ([b207e8f](https://github.com/sebastian-software/ardo/commit/b207e8ffc21dcf34dc3b2d1a38c4b035457715fe))

## [3.2.1](https://github.com/sebastian-software/ardo/compare/ardo-v3.2.0...ardo-v3.2.1) (2026-05-07)


### Bug Fixes

* **ardo:** resolve eslint violations ([c74095c](https://github.com/sebastian-software/ardo/commit/c74095ced4c19ce29da1f94994bb93d66b6030e8))
* updated deps ([744032a](https://github.com/sebastian-software/ardo/commit/744032a0d6151ebd0be07df04c94a8a60914048f))

## [3.2.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.1.0...ardo-v3.2.0) (2026-04-01)


### Features

* add breadcrumb navigation for mobile layout ([5fa60b5](https://github.com/sebastian-software/ardo/commit/5fa60b5573f3d89710e7c111eed0924f49d10c5c))
* implement data-driven TOC pipeline for MDX pages ([b9f6fb2](https://github.com/sebastian-software/ardo/commit/b9f6fb20d35615f80f25b208d7726adcda635d68))
* **ui:** restore steps component and clean typedoc output ([42f2108](https://github.com/sebastian-software/ardo/commit/42f21080450b7aef80918634138e8bf2061921f4))


### Bug Fixes

* auto fix eslint issues ([ac4668d](https://github.com/sebastian-software/ardo/commit/ac4668d85d4d0263cd75dd4c9c2b95ccdc23c0e9))
* auto fix eslint regex escaping issues ([37695fa](https://github.com/sebastian-software/ardo/commit/37695fa4a49bcd5e57327b911a73e3fd301e9c18))
* extract MobileMenu component to reduce Header line count ([9bad5ff](https://github.com/sebastian-software/ardo/commit/9bad5ffc23f4e99040ad91e8efa9dfd1bbc84e76))
* inject search into custom sidebar via cloneElement ([3ddf607](https://github.com/sebastian-software/ardo/commit/3ddf6075b00952feeea40d92c9ecab92fbbad63e))
* remove search from header (now lives in sidebar) ([d9c08e1](https://github.com/sebastian-software/ardo/commit/d9c08e11978064c4cafe4e98ff04d52bc8badefc))
* render search popover as portal to escape overflow clipping ([69c7a02](https://github.com/sebastian-software/ardo/commit/69c7a02d6c60e71a240d99782575d2c381472b9b))
* resolve all lint errors across packages ([f3bcafe](https://github.com/sebastian-software/ardo/commit/f3bcafe9fe7a7efc22f12e6e0d1dabc5cbe0af8c))
* resolve lint errors across breadcrumb, search, and header ([1eaf273](https://github.com/sebastian-software/ardo/commit/1eaf273da8215165f7d8048e51e2fb11db183525))
* resolve lint errors in TOC pipeline and MDX provider ([37529ac](https://github.com/sebastian-software/ardo/commit/37529acf2e7846938b834002f1ed3587232cdc37))
* resolve TypeScript strict mode errors ([5ae8a8b](https://github.com/sebastian-software/ardo/commit/5ae8a8bbcd2a41cc5b14e5ffbd3b09217fcdf18a))
* resolve TypeScript strict mode errors across packages ([967803a](https://github.com/sebastian-software/ardo/commit/967803a7645fdf270d2500f984b330b083bdd171))
* search always in sidebar, close button hover, clean up mobile CSS ([8322e17](https://github.com/sebastian-software/ardo/commit/8322e1779b0d2932a13f61cc52c4de326230b669))
* search popover can extend beyond sidebar width ([4f97920](https://github.com/sebastian-software/ardo/commit/4f979204b229af8b3baf195f82cd8c28ef86743f))
* search popover clicks work with portal rendering ([43e64ff](https://github.com/sebastian-software/ardo/commit/43e64ff39cab61d2b46d4a20a0a0604d00cd25ed))
* search popover no longer clipped by sidebar overflow ([69efe48](https://github.com/sebastian-software/ardo/commit/69efe4865d4d71186a5604c55aba37e9210151d8))
* search popover overflow and focus ring styling ([245d9d2](https://github.com/sebastian-software/ardo/commit/245d9d22f02474e0b5af91fc3c0053e7ee2038ae))
* search popover width matches sidebar, no horizontal overflow ([bfc75d2](https://github.com/sebastian-software/ardo/commit/bfc75d2dece0d3ac2d10daf0e47ebfa8f382aabe))
* show sidebar navigation in mobile slide-in panel ([20cf721](https://github.com/sebastian-software/ardo/commit/20cf721b7a0396bac07136d316c567c3401b935e))
* simplify to clean 3-column layout (sidebar | content | toc) ([b8d698d](https://github.com/sebastian-software/ardo/commit/b8d698df7bcca2d71f303dbd65dbf750f9f7566c))
* **styles:** sort code block css imports ([ad59072](https://github.com/sebastian-software/ardo/commit/ad59072f029655e5a66dd7e01236111a301c8b83))
* TOC sticky positioning and accurate scrollspy tracking ([fdd628a](https://github.com/sebastian-software/ardo/commit/fdd628a6b4ce25644abaab541640edf2575b94b4))
* **ui:** reset sidebar accordion button styles ([9520c09](https://github.com/sebastian-software/ardo/commit/9520c09f5ebc645b8cc6be27f56e0e284a48d2e4))
* use ArdoCodeBlock tag name in codeblock highlight plugin ([23c6284](https://github.com/sebastian-software/ardo/commit/23c62848bf7cb9b4d29dcd359d807db75ce0b118))


### Code Refactoring

* **ardo:** simplify codeblock and sidebar lint hotspots ([d03fb08](https://github.com/sebastian-software/ardo/commit/d03fb08fc7a43276c921cc156f7321680a70307a))
* **ardo:** split shiki pipeline and relax fs filename rule ([f12d94b](https://github.com/sebastian-software/ardo/commit/f12d94b379d52017e8e4b537a59d7af43adb571e))
* **ardo:** split typedoc and vite plugin helpers ([cfba512](https://github.com/sebastian-software/ardo/commit/cfba512b8dbab62c9fc901174498290a85ef45b8))
* extend theme system with fontSize scale, spacing tokens, and badge colors ([6ba5f9f](https://github.com/sebastian-software/ardo/commit/6ba5f9f4bdccdff11cf8aaae8f1e53858ba47aed))
* Mintlify-style card layout with fixed viewport and sidebar search ([aaf934c](https://github.com/sebastian-software/ardo/commit/aaf934c991b502f6a6f22c8fc42c41c6dc3c6fad))
* mobile menu as slide-in panel with unified 1024px breakpoint ([2789353](https://github.com/sebastian-software/ardo/commit/2789353999746ad268b802aba51c6f0d9ff1c0b0))
* polish content spacing, code blocks, and callout containers ([8cf4d58](https://github.com/sebastian-software/ardo/commit/8cf4d583c8085d1749d3005258b4fa018a54c45e))
* polish sidebar navigation spacing and alignment ([6c1160c](https://github.com/sebastian-software/ardo/commit/6c1160cc54571e66e74402ee87c4d19cc3662d20))
* prefix all public components, hooks, and types with Ardo ([73f83a7](https://github.com/sebastian-software/ardo/commit/73f83a793f235d8cf7bee4a04baf3759d027bcaa))
* redesign UI components for editorial refinement ([1cb37b0](https://github.com/sebastian-software/ardo/commit/1cb37b0686299610f4a7f8daf4c2843fb01597fb))
* remove themeConfig, move UI configuration to JSX props ([613ba58](https://github.com/sebastian-software/ardo/commit/613ba58a5a25d0b2f0c5d91e7e7826f398ae61d3))
* replace ArdoFeatures items prop with children-based composition ([d6b43cf](https://github.com/sebastian-software/ardo/commit/d6b43cfc0cef070c0e2e349b8510394e9721c91e))
* replace hardcoded ardo- CSS class names with Vanilla Extract styles ([f5490a4](https://github.com/sebastian-software/ardo/commit/f5490a40f310ce707601830c99a70c86e0e69868))
* replace shiki per-element class names with structural selectors ([060b2eb](https://github.com/sebastian-software/ardo/commit/060b2ebd688a35175f816503b5d44ffc2cb4fa4e))
* use short Vanilla Extract class name identifiers ([9a43962](https://github.com/sebastian-software/ardo/commit/9a43962cfcfe484e558fdb8b0b447fc246d56c9f))
* use Vanilla Extract generated class for shiki container ([5a9bf76](https://github.com/sebastian-software/ardo/commit/5a9bf769e3373c04aff4e33d935f9bd0639cdcee))

## [3.1.0](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.5...ardo-v3.1.0) (2026-03-04)


### Features

* add Storybook, migrate to Vanilla Extract, and add brand color customization ([bd1fbd0](https://github.com/sebastian-software/ardo/commit/bd1fbd0a9be8705ffd43112f523bbc76724ecca4))

## [3.0.5](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.4...ardo-v3.0.5) (2026-03-04)


### Bug Fixes

* **ui:** expose sidebar content in mobile burger menu ([a6f9219](https://github.com/sebastian-software/ardo/commit/a6f9219a51aabe49dd58c6968a617eac124a29d2))
* **ui:** restore mobile nav toggle and tabs default behavior ([cfaa704](https://github.com/sebastian-software/ardo/commit/cfaa7041bff2dd74f06c3170b6f1a200e742849b))


### Code Refactoring

* **ui:** split mobile top nav from sidebar burger menu ([ae7efd9](https://github.com/sebastian-software/ardo/commit/ae7efd9d7c6b46007dafbfd57db4f468bad5a6f7))

## [3.0.4](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.3...ardo-v3.0.4) (2026-03-03)


### Bug Fixes

* remove server-only re-exports from main entry point ([60a7af5](https://github.com/sebastian-software/ardo/commit/60a7af51ae82eda85493275121b3bdcfddcf6763)), closes [#85](https://github.com/sebastian-software/ardo/issues/85)


### Code Refactoring

* remove fsevents external workaround ([3a3c1ef](https://github.com/sebastian-software/ardo/commit/3a3c1efd53d863f6f332955bc6ca6ab42fe8d668))

## [3.0.3](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.2...ardo-v3.0.3) (2026-03-03)


### Bug Fixes

* externalize fsevents in both client and SSR builds ([e23566a](https://github.com/sebastian-software/ardo/commit/e23566a303b061f1726815880cf668e791a7fb70)), closes [#85](https://github.com/sebastian-software/ardo/issues/85)

## [3.0.2](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.1...ardo-v3.0.2) (2026-03-03)


### Bug Fixes

* move fsevents external from build to ssr config ([fa40a26](https://github.com/sebastian-software/ardo/commit/fa40a2636362e52e73c7d2ee2a655d186cff0dd1)), closes [#85](https://github.com/sebastian-software/ardo/issues/85)

## [3.0.1](https://github.com/sebastian-software/ardo/compare/ardo-v3.0.0...ardo-v3.0.1) (2026-03-03)


### Bug Fixes

* externalize fsevents to prevent Rolldown UTF-8 parse error ([6d0ccda](https://github.com/sebastian-software/ardo/commit/6d0ccdaba3d78aa7698c084ab0c28b8e5c2c472d)), closes [#85](https://github.com/sebastian-software/ardo/issues/85)


### Documentation

* add upstream issue references to fsevents workaround comment ([87b3170](https://github.com/sebastian-software/ardo/commit/87b31701b8c7f75add0f9385bbac0d6ad1c089e6))

## [3.0.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.8.0...ardo-v3.0.0) (2026-03-03)


### ⚠ BREAKING CHANGES

* The `:::tip`, `:::warning`, `:::danger`, `:::info`, `:::note`, and `:::code-group` directive syntax is removed. Use JSX components (`<Tip>`, `<Warning>`, `<Danger>`, `<Info>`, `<Note>`, `<CodeGroup>`) instead — they are auto-registered in MDX and require no imports.

### Features

* expand bundled Shiki languages for documentation use cases ([797186e](https://github.com/sebastian-software/ardo/commit/797186ec7d8aaf208874cce7be397756babfbe3c))
* remove container directive syntax in favor of JSX components ([7374efb](https://github.com/sebastian-software/ardo/commit/7374efb8caee507e2987189162f498d749a4c116))


### Bug Fixes

* handle &gt; characters in CodeBlock code prop for build-time highlighting ([f963ba3](https://github.com/sebastian-software/ardo/commit/f963ba3619e7a996ee47d6eaa0a7b28d6d92382d))
* prevent empty Shiki lines from collapsing in code blocks ([4f00132](https://github.com/sebastian-software/ardo/commit/4f001324f23a243e70e11ed7a05cb4f5e8c366c8))
* use mdx language for homepage code example highlighting ([e0ab704](https://github.com/sebastian-software/ardo/commit/e0ab704ef1a98733cb1e7cc817f8a74480fcfab6))

## [2.8.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.7.2...ardo-v2.8.0) (2026-03-03)


### Features

* improve CodeBlock usability outside MDX pipeline ([354d4ac](https://github.com/sebastian-software/ardo/commit/354d4ace384cafd2307c6c489ddf436c5e480c01)), closes [#66](https://github.com/sebastian-software/ardo/issues/66)
* support children as code source in CodeBlock with auto-outdent ([ca9c3ab](https://github.com/sebastian-software/ardo/commit/ca9c3ab7d264e1efdc0a800c440929f9d9688e60))
* support plain text children in CodeBlock ([11dcbb1](https://github.com/sebastian-software/ardo/commit/11dcbb11ab9a6363fca3822043bb09bd9880d5ff))

## [2.7.2](https://github.com/sebastian-software/ardo/compare/ardo-v2.7.1...ardo-v2.7.2) (2026-02-26)


### Bug Fixes

* resolve TypeDoc index module name via cache iteration ([80d4b71](https://github.com/sebastian-software/ardo/commit/80d4b71de24961ed2abc5a51a8500b784a1153e9)), closes [#54](https://github.com/sebastian-software/ardo/issues/54)

## [2.7.1](https://github.com/sebastian-software/ardo/compare/ardo-v2.7.0...ardo-v2.7.1) (2026-02-26)


### Bug Fixes

* provide default favicon to prevent browser console warnings ([d13b682](https://github.com/sebastian-software/ardo/commit/d13b6823d125cdc171e223de923c01db81937a44))
* provide default favicon to prevent browser console warnings ([1cf167d](https://github.com/sebastian-software/ardo/commit/1cf167d31d7ea29ad001ae4bddf2dd26a6abd6a7)), closes [#55](https://github.com/sebastian-software/ardo/issues/55)
* resolve package name per source file instead of globally ([902bfe9](https://github.com/sebastian-software/ardo/commit/902bfe91749b4252486c26fb941c26958149770b))
* update logo and favicon to new lineart version ([eeba325](https://github.com/sebastian-software/ardo/commit/eeba3256f3c632eba711982b473d6217b718678f))
* use Ardo logo as default favicon to prevent browser console warnings ([61d9667](https://github.com/sebastian-software/ardo/commit/61d9667a68a73e4d0ad7f8a74605b449f2489c4c)), closes [#55](https://github.com/sebastian-software/ardo/issues/55)
* use package name instead of 'index' for TypeDoc module names ([05c73d7](https://github.com/sebastian-software/ardo/commit/05c73d7eadf4ed9dd051882b4ea591152c5dcc71))
* use package name instead of 'index' for TypeDoc module names ([6e5724a](https://github.com/sebastian-software/ardo/commit/6e5724a8b1851ba5571540919ba0e45381b0929b)), closes [#54](https://github.com/sebastian-software/ardo/issues/54)
* use read-package-up for async package name resolution in TypeDoc ([0a4d115](https://github.com/sebastian-software/ardo/commit/0a4d1152be38699dadc07cb3fe4317ab85a4f494))

## [2.7.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.6.0...ardo-v2.7.0) (2026-02-13)


### Features

* add ArdoRoot combo component combining Provider, Layout, and routing ([dcd4893](https://github.com/sebastian-software/ardo/commit/dcd4893487a3999703fbfab5012e907786d48efc))
* add RootLayout component to eliminate html/head/body boilerplate ([d1df64e](https://github.com/sebastian-software/ardo/commit/d1df64e15834b82512a0180882734d719dea872b))
* make Footer context-aware with automatic config resolution ([a6ec21f](https://github.com/sebastian-software/ardo/commit/a6ec21fdb07fac109ff2a571f757b474ea0365cf))
* make Header context-aware with automatic title and logo resolution ([85af709](https://github.com/sebastian-software/ardo/commit/85af7092477e9bfaa7c7221bf03132e4d472c131))
* make Sidebar context-aware with automatic rendering from virtual module ([77948b0](https://github.com/sebastian-software/ardo/commit/77948b095d6798cc3b8e6e7bac4dc394cfc817a0))
* ship virtual module types via ardo/virtual, eliminate vite-env.d.ts ([3c2d0ea](https://github.com/sebastian-software/ardo/commit/3c2d0eaf9943425f1b28daaa59cf96c4192ae378))


### Bug Fixes

* remove unused SocialLinkConfig import in Header ([a9f6b2c](https://github.com/sebastian-software/ardo/commit/a9f6b2ce4d1cecbf6a569582c8fd01ea3bab0d38))


### Code Refactoring

* simplify all root.tsx files using ArdoRoot and RootLayout ([a96bb55](https://github.com/sebastian-software/ardo/commit/a96bb5590b6449e8552bb905a53ae139850d2242))

## [2.6.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.5.0...ardo-v2.6.0) (2026-02-13)


### Features

* add automatic title meta tags and rename Press to Ardo ([19da807](https://github.com/sebastian-software/ardo/commit/19da807fb6011b9fdca794b12766f55bdd5345ea))
* add git commit hash to footer build info ([603c53d](https://github.com/sebastian-software/ardo/commit/603c53d4b97041dca588182a8a2ba5d141fac2f3))
* add Steps and FileTree components, configuration reference, and showcase page ([826ccae](https://github.com/sebastian-software/ardo/commit/826ccae5cba53b455aad31a4d3362826d801bea6))
* switch docs hosting from GitHub Pages to Vercel ([3a88fad](https://github.com/sebastian-software/ardo/commit/3a88fad52634a4e152c397908e37786102aaef0e))


### Bug Fixes

* sidebar group title link uses correct styling and exact path matching ([9521b2f](https://github.com/sebastian-software/ardo/commit/9521b2fd7d0c7fbcd46a2176b64e0010e82dbf7d))

## [2.5.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.4.1...ardo-v2.5.0) (2026-02-12)


### Features

* add version display, build timestamp, sponsor link in footer ([691b047](https://github.com/sebastian-software/ardo/commit/691b047c81763ab80e41f30fb60bada732d8464a))
* add version display, build timestamp, sponsor link in footer ([8b66bdc](https://github.com/sebastian-software/ardo/commit/8b66bdc7b195be79d20bd5e9ba2913fb81a5d55c)), closes [#43](https://github.com/sebastian-software/ardo/issues/43)
* replace lucide-react with external SVG icons, add sideEffects, lazy-load search ([d6052f5](https://github.com/sebastian-software/ardo/commit/d6052f5180d6696bb5ce1b5be87dff22fcbfad5d)), closes [#43](https://github.com/sebastian-software/ardo/issues/43)
* replace lucide-react with external SVG icons, lazy-load search ([ca07af1](https://github.com/sebastian-software/ardo/commit/ca07af19f12bb7c32d4496361ddacd969710db94))


### Bug Fixes

* align all Shiki theme fallbacks with config defaults ([e64c89e](https://github.com/sebastian-software/ardo/commit/e64c89efa7a68d21d741b4e72d9bb92f5802f13d))
* apply default markdown theme in vite plugin for shiki ([908eb73](https://github.com/sebastian-software/ardo/commit/908eb73b55cddf4da5afde231d92532f0993a32a))
* format styles.css icon classes with prettier ([bf75f05](https://github.com/sebastian-software/ardo/commit/bf75f0549a631289ce67df4b9191c53caeeb1448))
* single source of truth for Shiki theme defaults ([1f1e7dd](https://github.com/sebastian-software/ardo/commit/1f1e7dd296da233793e6cd7588a98e343ca16c2c))

## [2.4.1](https://github.com/sebastian-software/ardo/compare/ardo-v2.4.0...ardo-v2.4.1) (2026-02-12)


### Bug Fixes

* align vite plugin Shiki theme fallbacks with config defaults ([2201bdc](https://github.com/sebastian-software/ardo/commit/2201bdca5ebf05b3b20adcd9a3a8a856488f4983))
* align vite plugin Shiki theme fallbacks with config defaults ([243686f](https://github.com/sebastian-software/ardo/commit/243686fae63b80ac0c6cb74d3432e4e06e4e7122))

## [2.4.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.3.0...ardo-v2.4.0) (2026-02-11)


### Features

* replace inline SVGs with Lucide icons and improve accessibility ([7624ff9](https://github.com/sebastian-software/ardo/commit/7624ff9ccfed9d4208701736c6bfcf70283f6430))
* style refinements for brand consistency ([a3ff42c](https://github.com/sebastian-software/ardo/commit/a3ff42cdba97af1dccdf2d89961f65cd6d79105c))
* style refinements for brand consistency and readability ([635841c](https://github.com/sebastian-software/ardo/commit/635841c11c8509bf49b7b5ed8beaecaa5c50cb76))


### Bug Fixes

* align config test with actual default theme names ([806f7e0](https://github.com/sebastian-software/ardo/commit/806f7e04d38fa20815f05c9fd4622b07461fdfca))

## [2.3.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.2.2...ardo-v2.3.0) (2026-02-11)


### Features

* add icon prop to HeroAction ([4d46119](https://github.com/sebastian-software/ardo/commit/4d46119bb288ce9757f089301ec6731260561eaf))
* add icon prop to HeroAction for button icons ([b4e87a6](https://github.com/sebastian-software/ardo/commit/b4e87a6a37b4a7a3df810c568ac0c880dd50e5ac))

## [2.2.2](https://github.com/sebastian-software/ardo/compare/ardo-v2.2.1...ardo-v2.2.2) (2026-02-11)


### Bug Fixes

* return "/" instead of undefined from detectGitHubBasename in dev mode ([afc8679](https://github.com/sebastian-software/ardo/commit/afc8679797c8e367a869ef200cdad055f70cb235))

## [2.2.1](https://github.com/sebastian-software/ardo/compare/ardo-v2.2.0...ardo-v2.2.1) (2026-02-11)


### Bug Fixes

* skip GitHub Pages basename in dev mode ([14d0adf](https://github.com/sebastian-software/ardo/commit/14d0adfa2dee9110ebec4d01988d999216afbc9b))

## [2.2.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.1.1...ardo-v2.2.0) (2026-02-11)


### Features

* add API nav links to scaffold and detect description from package.json ([3ea39a5](https://github.com/sebastian-software/ardo/commit/3ea39a5ad2e3341d6dd2fe7fb8f8c6bf5a4e8a40))

## [2.1.1](https://github.com/sebastian-software/ardo/compare/ardo-v2.1.0...ardo-v2.1.1) (2026-02-09)


### Bug Fixes

* **ardo:** set explicit button type for search clear action ([81f2df5](https://github.com/sebastian-software/ardo/commit/81f2df538c913d409f9d3c97bd97d9c0bacf8fd7))

## [2.1.0](https://github.com/sebastian-software/ardo/compare/ardo-v2.0.1...ardo-v2.1.0) (2026-02-09)


### Features

* auto-detect project metadata from package.json for footer ([0129df7](https://github.com/sebastian-software/ardo/commit/0129df7a8d7ba55c23c2fa1d42bb364c0806f5c3))
* refresh UI with editorial/modern look and feel ([7959769](https://github.com/sebastian-software/ardo/commit/795976968ec408fb080e253e9565c7c57519a755))


### Bug Fixes

* add code-group support and fix container directive syntax in MDX ([54e36a5](https://github.com/sebastian-software/ardo/commit/54e36a5654105d8aa5232a369b787ade6956c340))
* correct line highlighting, line numbers, and highlight indent ([a6a124a](https://github.com/sebastian-software/ardo/commit/a6a124a1c8fbd0453666fdfa8e0354d80e61282e))
* correct TypeDoc links for index routes in React Router ([ec1b630](https://github.com/sebastian-software/ardo/commit/ec1b630fbc479f853010517dcbef7f7850fc9981))
* enable line highlighting and line numbers for MDX code blocks ([9a3bd85](https://github.com/sebastian-software/ardo/commit/9a3bd857dd1d79ed278ffe1a5aa04340d887d92f))
* reduce code-group double borders and compact container padding ([98a76dc](https://github.com/sebastian-software/ardo/commit/98a76dc2c9ecbc2b49b5bbc29d5b3b4e0fc56d7a))
* resolve code block line spacing and container directive rendering ([9275432](https://github.com/sebastian-software/ardo/commit/9275432b6c5e7943be057fa8bdc16033f667670b))
* style formatting ([a15564b](https://github.com/sebastian-software/ardo/commit/a15564b6d044dc3619ef53ea7eb3af94a1d02381))
* update docs references, improve TOC heading IDs, and harden scaffold ([1d05a9b](https://github.com/sebastian-software/ardo/commit/1d05a9b2219b5d1c8c16c6d28d79d8aa641e55d2))

## [2.0.1](https://github.com/sebastian-software/ardo/compare/ardo-v2.0.0...ardo-v2.0.1) (2026-01-31)


### Miscellaneous

* **ardo:** Synchronize ardo versions

## [2.0.0](https://github.com/sebastian-software/ardo/compare/ardo-v1.2.3...ardo-v2.0.0) (2026-01-30)


### ⚠ BREAKING CHANGES

* Import path changed from ardo/theme to ardo/ui

### Features

* add Icon component and improve UI components ([eca1f3f](https://github.com/sebastian-software/ardo/commit/eca1f3fc0f98475af2c5f9a1e333edb371241819))
* add type-safe route support for Sidebar and Nav links ([6d2b06a](https://github.com/sebastian-software/ardo/commit/6d2b06a3bf376804d9b546599fdeacca78f94de6))
* expand homepage with marketing sections ([d496755](https://github.com/sebastian-software/ardo/commit/d4967559c5931c5d4799a2a4383c1b3d33ecb56f))
* export additional types and improve MDX provider ([fac0d2c](https://github.com/sebastian-software/ardo/commit/fac0d2cb02643a7bba128b65f68c9eae4d28b0ab))
* implement search using virtual module ([f742235](https://github.com/sebastian-software/ardo/commit/f74223598ac0775c3fd0fd650f59ac2db4419816))
* improve API index page with grouped and sorted entries ([dfa6bc2](https://github.com/sebastian-software/ardo/commit/dfa6bc28b2e2ebb583edbe9eab573091e5c3c06d))
* type-safe links for Hero actions ([b9b328b](https://github.com/sebastian-software/ardo/commit/b9b328b9e3ff8bb803bbf60e13623ca069a4f966))


### Bug Fixes

* align header logo with sidebar text ([e832c03](https://github.com/sebastian-software/ardo/commit/e832c030c3669d827283d48f92d5c92af2b6a42b))
* correct shiki configuration for MDX plugin ([bc06257](https://github.com/sebastian-software/ardo/commit/bc062571656913a68f33eaa3fa1c90c1062dca37))
* generate index routes as {slug}/index.tsx ([a6a839b](https://github.com/sebastian-software/ardo/commit/a6a839b56c8aff6b10ee0707b426518ed5800c0c))
* only log route generation on initial startup ([1543129](https://github.com/sebastian-software/ardo/commit/1543129b1db0577c287ee6ee92bc72e3327111d6))
* remove duplicate React plugin from Vite config ([a68208c](https://github.com/sebastian-software/ardo/commit/a68208c01ff2e5eba471a312784804d5b74b2db2))
* remove max-width from header container ([c962c4d](https://github.com/sebastian-software/ardo/commit/c962c4d30369135810595fee58a02a33817f989b))
* resolve CSS and routing issues after React Router migration ([95a66a5](https://github.com/sebastian-software/ardo/commit/95a66a5b93f83b86c4d73c39ed1bfb772c368832))
* update prettierignore and format files ([d80c904](https://github.com/sebastian-software/ardo/commit/d80c90455e30ec25dc802c3c1f2a884039dd08b8))
* use React Router Link for internal MDX links ([5744338](https://github.com/sebastian-software/ardo/commit/5744338aacacff7c79e04a5bcbf0b61c8d553603))


### Code Refactoring

* improve TypeDoc generator output ([38ee369](https://github.com/sebastian-software/ardo/commit/38ee369990b5f255b02accfd3a7d2f771929cadf))
* migrate from TanStack Start to React Router 7 ([b9e66ee](https://github.com/sebastian-software/ardo/commit/b9e66ee7e7a90d499c3ea7e85f735a59cae644dd))
* rename theme to ui, add Hero/Features, use ardo- prefix ([2202661](https://github.com/sebastian-software/ardo/commit/22026618b071593387345d40301d2dc6962ec57c))
* update code comments from TanStack to React Router ([bfe0f35](https://github.com/sebastian-software/ardo/commit/bfe0f351a2fa692871dc20241c0c11a38e3e35b3))
* use system fonts instead of Google Fonts ([8cc3c88](https://github.com/sebastian-software/ardo/commit/8cc3c88779256353656d8defa0f659915818b0ea))


### Documentation

* update READMEs for React Router migration ([cfb2e38](https://github.com/sebastian-software/ardo/commit/cfb2e38318bfd8906e8c06ae46042878a9120897))

## [1.2.3](https://github.com/sebastian-software/ardo/compare/ardo-v1.2.2...ardo-v1.2.3) (2026-01-29)


### Bug Fixes

* also auto-detect tsconfig.json in package root ([d44bc67](https://github.com/sebastian-software/ardo/commit/d44bc6748134fc92d09d04f2a4f443ae9f4a9670))

## [1.2.2](https://github.com/sebastian-software/ardo/compare/ardo-v1.2.1...ardo-v1.2.2) (2026-01-29)


### Bug Fixes

* auto-detect package root for TypeDoc entry points ([dd46e3a](https://github.com/sebastian-software/ardo/commit/dd46e3acb3064fbfbd317a006627341a770fd5cc))
* don't crash dev server when TypeDoc fails ([93edd20](https://github.com/sebastian-software/ardo/commit/93edd20b2058cdf74f23acd23f163273b8133f46))
* use ../src/index.ts as default TypeDoc entry point ([c52b42f](https://github.com/sebastian-software/ardo/commit/c52b42fb8618717790d26276fb04acf5d123f4cc))

## [1.2.1](https://github.com/sebastian-software/ardo/compare/ardo-v1.2.0...ardo-v1.2.1) (2026-01-29)


### Bug Fixes

* add logo, navigation and improve docs sidebar ([f8d574d](https://github.com/sebastian-software/ardo/commit/f8d574d604217ae4d0f8b2e023455651b8416539))

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
