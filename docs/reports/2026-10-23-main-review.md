# Ardo: Review von main, Oktober 2026

Stand: 23. Oktober 2026, main bei `50cda75`, also nach PR 404 bis 411. Geprüft habe ich:

- den Code;
- die Docs-Site lokal, in Light, Dark und Mobile;
- das Basic-Beispiel mit dem Default-Theme;
- die generierte API-Referenz sowie `llms.txt` und `llms-full.txt`;
- README und npm-README.

Zwei unabhängige Durchgänge haben alle Guide-Seiten und das Theming erneut gegen den Code
gelesen. Ihre wichtigsten Befunde habe ich selbst nachgeprüft. Grundlage ist der
[Audit vom 22. Oktober](2026-10-22-ux-dx-audit.md).

Kurzfassung: Der Einstieg sitzt jetzt. `root.tsx` ist eine Zeile, `tsconfig.json` erbt,
die Guide-Sidebar ist halbiert, und der Prompt steht oben. Die Baustellen sind
weitergezogen, und zwar zu den Stellen, die man ab Tag zwei benutzt: die API-Referenz,
die Maschinen-Docs für Agenten, ein paar falsche Referenzseiten und das Theming.

## Messlatte: vorher und heute

| Messlatte                                          | Ziel            | 22. Oktober | Heute          |
| -------------------------------------------------- | --------------- | ----------- | -------------- |
| Zeilen vor dem Agenten-Prompt im Getting Started   | 2               | 25          | 1              |
| Zeilen in tsconfig/root.tsx ohne erklärbaren Grund | 0               | 4           | 0              |
| Guide-Seiten in der Sidebar                        | ≤ 12 + 1 Gruppe | 26          | 13 + 1 Gruppe  |
| Dateien, die der manuelle Weg anlegt               | ≤ 3             | 7           | 7, aber kürzer |
| Zeilen für eine Marke mit Logo und Schrift         | ≤ 10            | 44          | 44             |
| Warnzeilen bei `ardo dev` in Basic                 | 0               | 3           | 3 (Issue 398)  |

Main ist grün: Typecheck, Lint-Budget, 685 Unit-Tests in 107 Dateien und 64
Integrationstests in 13 Dateien laufen lokal durch. Der Docs-Build erzeugt 116 Seiten und
findet keine kaputten Links.

## Was jetzt richtig gut ist

- **Der Einstieg.** Der Prompt mit Copy-Button steht ganz oben, der Projektbaum vor den
  Schritten, und `<ArdoRoot />` ist eine komplette Site. Ein Integrationstest baut den
  manuellen Weg wörtlich nach.
- **Die Suche.** „logo“ findet „Change the Logo and Favicon“ als ersten Treffer.
- **Dark Mode und Mobile.** Komponenten, Callouts und Navigation sehen in beiden Modi
  ordentlich aus.
- **Die Robustheit.** Die PRs 404 bis 411 haben Routen-Validierung, Deployment-Pfade und
  die Suche auf Mobile abgesichert, jeweils mit Tests.

## 1. API-Referenz: für ein React-Framework zu wenig React

Das ist der größte Hebel. Zwei der Punkte kamen direkt aus deiner Sichtung.

**Komponenten sehen aus wie Funktionen.** Jede Komponentenseite zeigt eine
Funktionssignatur mit einem inline importierten Rückgabetyp:

```ts
ArdoHead(): import("react").JSX.Element | null
ArdoFeatures({ children, title, subtitle, className }: ArdoFeaturesProps): import("react").JSX.Element
```

Dazu kommen eine Tabelle „Parameters“, die das destrukturierte Objekt als Namen führt,
und eine Sektion „Returns“ mit `import("react").JSX.Element`. Bei einer Komponente
brauchen Leser nur drei Dinge: woher sie kommt, wie man sie schreibt und welche Props sie
hat. Die Props-Tabelle gibt es, aber sie steht ganz unten.

| Befund                                                 | Menge             |
| ------------------------------------------------------ | ----------------- |
| Seiten mit `import("react").JSX.Element`               | 36 (72 Vorkommen) |
| Nennungen anderer dokumentierter Typen, verlinkt       | 0                 |
| Nennungen anderer dokumentierter Typen, nicht verlinkt | 145 auf 45 Seiten |
| Seiten, die sagen, woher man importiert                | 1 von 97          |

**Typen sind nicht verlinkt.** Das betrifft `ArdoFeaturesProps` auf der Seite
`ArdoFeatures`, `ArdoConfig` als Rückgabe von `useArdoConfig` und `ArdoHeroAction` in
`ArdoHeroProps`. Alle stehen als Inline-Code ohne Link da. Der Renderer verlinkt nur
`{@link}`-Tags aus JSDoc, siehe `renderLinks` in `packages/ardo/src/api/renderer.ts`.
Typnamen in Tabellenzellen und Rückgaben gehen an der Verlinkung vorbei.

**Destrukturierte Parameter werden abgeschnitten.** `readParameter` nimmt den Text nur
bis zum ersten Doppelpunkt. Aus `{ code: codeProp, … }` wird so `{ code`, und die
Signatur heißt dann `ArdoCodeBlock({ code: ArdoCodeBlockProps)`. Betroffen sind
`ArdoCodeBlock`, `ArdoCodeGroup` und `ArdoTOC`.

**Die falschen Exporte sind dokumentiert.** Die Docs-Site generiert die Referenz aus dem
Paket-Root `ardo` (`entryPoints` in `docs/vite.config.ts`). Laut Agent Instructions
sollen Browser-Imports genau diesen Einstieg meiden. Außerdem fehlen dort die Exporte,
die die Guides lehren:

- `ArdoRoot`, die Komponente in jeder `root.tsx`;
- `ArdoNav`, `ArdoNavLink`, `ArdoHeaderActions`, `ArdoSocialLink`, `ArdoSidebarSection`,
  `ArdoGeneratedSidebar`, `ArdoRootLayout` und `ArdoErrorBoundary`;
- `ArdoCard`, `ArdoCardGroup`, `ArdoBadge`, `ArdoAccordion`, `ArdoIcon` und
  `registerIcons`;
- `defineArdoConfig` und `ArdoConfigProvider`.

Dafür stehen interne Helfer wie `resolveConfig` und `ResolvedConfig` drin. Die Gruppe
„Components“ mischt außerdem Inhaltskomponenten wie `ArdoTip` mit Laufzeit-Bausteinen wie
`ArdoOutlet` und `ArdoScripts`.

**JSDoc-Beispiele sind veraltet oder kaputt.**

- **`ArdoLayout`** zeigt `<Layout header={<Header … nav={...} />}>` mit `<Outlet />`.
  Die Namen haben kein Präfix, und den Prop `nav` gibt es nicht.
- **`ArdoSidebar`** zeigt `<Sidebar>` und `<SidebarSection>`.
- **`ArdoCodeBlock`** schließt sein Beispiel mit einem zweiten ` ```tsx `. Im Browser
  stehen deshalb die Fences als Text da, und die Signatur rutscht in denselben Block.

**Vorschlag.** Eine Komponentenseite, die sich wie React anfühlt:

````md
# ArdoFeatures

Features grid for multiple feature cards.

```tsx
import { ArdoFeatures } from "ardo/ui"

;<ArdoFeatures title="Key features">{children}</ArdoFeatures>
```

## Props

| Name    | Type     | Required | Description   |
| ------- | -------- | -------- | ------------- |
| `title` | `string` | No       | Section title |

Props type: [ArdoFeaturesProps](/api-reference/types/ardofeaturesprops)

## Example
````

Konkret im Generator, nach Wirkung sortiert:

1. **Einstiegspunkte mit Importpfad.** `entryPoints` nimmt zusätzlich eine Zuordnung an,
   etwa `{ "ardo/ui": "./src/ui/index.ts" }`. Jede Seite zeigt dann ihre Import-Zeile, und
   der Index gruppiert nach Importpfad. Davon hat jedes Ardo-Projekt etwas, das ein Paket
   mit Subpaths dokumentiert.
2. **Komponentenseiten ohne Funktionssignatur.** Bei Komponenten entfallen Signatur,
   „Parameters“ und „Returns“. Import, Nutzungszeile und Props-Tabelle rücken nach oben.
3. **Typen verlinken.** Bekannte Namen in Typzellen, Rückgaben und Props-Typen werden zu
   Links. Die nötige Map hat `renderLinks` schon.
4. **`import("…").X` zu `X` kürzen,** überall dort, wo Typen angezeigt werden.
5. **Destrukturierung richtig benennen,** zum Beispiel als `props`, statt am Doppelpunkt
   abzuschneiden.
6. **JSDoc-Beispiele reparieren** in Layout, Sidebar, DocPage, Footer und CodeBlock.

## 2. Maschinen-Docs: die Agenten-Anleitung steht ganz hinten

Ardo setzt auf Agenten. Der Setup-Prompt schickt sie zu den offiziellen Instructions, und
die finden sie in `llms.txt` und `llms-full.txt`. Beide Dateien sortieren alphabetisch
nach Pfad (`localeCompare` in `packages/ardo/src/vite/route-manifest.ts`). Dadurch kommt
`api-reference` vor `guide`:

| Datei           | Wo stehen die Agent Instructions?                               |
| --------------- | --------------------------------------------------------------- |
| `llms.txt`      | Zeile 104, nach 97 API-Links                                    |
| `llms-full.txt` | Abschnitt 98 von 115, nach 167 KB API-Referenz (47 % der Datei) |

Ein Agent mit knappem Kontext liest also erst die halbe API-Referenz, bevor er erfährt,
wie man Ardo einrichtet. Das betrifft jede Ardo-Site, nicht nur die eigene.

Dazu kommt: Der Prompt „Set up Ardo in this repository and follow the official
instructions.“ enthält keine URL. Welche Instructions der Agent findet, hängt von seiner
Suche ab.

**Vorschlag.**

- **Beide Dateien folgen der Sidebar-Reihenfolge,** also Abschnitte nach
  `sidebar.sectionOrder` und Katalog, Seiten nach `order`.
- **Die API-Referenz rückt ans Ende.** In `llms.txt` reicht dafür ein einziger Link auf
  ihren Index statt 97 Einträgen.
- **Der Prompt bekommt die URL** und bleibt trotzdem ein Satz: „Set up Ardo in this
  repository following ardo-docs.dev/llms.txt.“
- **Die Kopfzeile von `llms.txt` übernimmt die Tagline der Landing.** Bisher sagt sie noch
  „React-first Static Documentation Framework“.

## 3. Docs: Stellen, die falsch oder veraltet sind

Der erneute Durchgang hat Fehler gefunden, an denen ein Leser wirklich hängen bleibt.
Geordnet nach Schaden:

1. **Die Frontmatter-Referenz beschreibt Verhalten, das es nicht gibt.**
   - `layout` ist als `doc | home | page` dokumentiert. Wirkung haben aber nur `bare` und
     `default`, und der Validator lehnt `bare` als ungültig ab.
   - `hero` und `features` im Frontmatter rendern nur über `ArdoHomePage`, und das setzt
     keine Route automatisch ein. Wer `layout: home` mit Hero schreibt, bekommt eine leere
     Seite ohne Hero.
   - `outline: [2, 3]` wird ignoriert, nur `outline: false` wirkt. Auch `prev` und `next`
     werden ignoriert.
2. **TypeScript, vier Antworten.**
   - Getting Started und das npm-README sagen `typescript@6`.
   - Basic und die API-Doku pinnen das 7.1-Nightly, ebenso die Peer-Range im Paket.
   - Die Landing sagt „TypeScript 7“.
   - Wer manuell installiert, bekommt also eine andere Major als ein Agent, der Basic kopiert.
3. **Gegenteilige Anweisung für bestehende Repos.** Getting Started sagt, man solle die
   Konfiguration „in die Anwendung mergen“. Die Agent Instructions sagen, die Docs seien
   eine eigene Site im eigenen Paket. Die zweite Aussage stimmt.
4. **Veraltete Zeilen, zwei davon aus meinen eigenen PRs.**
   - Troubleshooting rät, „die Ardo-Styles zu importieren“, obwohl Ardo sie seit PR 409
     selbst lädt.
   - Der Upgrade-Guide mappt `ardo/press.css` auf „Import `ardo/ui/styles.css`“ und
     widerspricht sich damit selbst. Die Zeile stammt aus PR 408.
   - `examples/README.md` verlinkt die gelöschte `reference-projects.mdx`. Das ist mir in
     PR 410 entgangen.
5. **Kopierbare Fehler.**
   - Troubleshooting zeigt `<CodeBlock>` für TSX-Routen, aber `ardo/ui` exportiert nur
     `ArdoCodeBlock`.
   - Markdown & MDX importiert eigene Komponenten aus `./components/` neben der Route.
     Dort wird jede `.tsx`-Datei zur Seite.
   - Die Markdown-Basics zeigen „`_italic_ or _italic_`“ und „`**bold** or **bold**`“,
     weil der Formatter die Alternativen vereinheitlicht hat.
6. **Die Konfigurationsreferenz hinkt hinterher.**
   - `ardo/vite` soll angeblich „GitHub Pages base detection“ liefern.
   - `srcDir` ist dokumentiert, aber nichts liest es.
   - `head` heißt „deprecated“, wird aber stillschweigend ignoriert.
   - `collections`, `openapi` und `brand.chroma` fehlen ganz.
7. **Kleinere Widersprüche.**
   - Der Upgrade-Guide nennt einen falschen Ausgabepfad mit `<base path>` darin.
   - Deployment sucht den Versionsumschalter im Header, die anderen Seiten am Ende der
     Sidebar.
   - Laut Upgrade-Guide ersetzt `ErrorBoundary` die Root auch bei 404. In Wahrheit
     rendert sie dort innerhalb der Root.

Lesbarkeit:

- **Die Slugs passen nicht mehr zu den Titeln.** Beispiele: `component-playground` für
  Components, `site-ui` für Layout & Navigation, `custom-theme` für Theming. Solange
  Ardo 6 nicht released ist, kostet eine Umbenennung mit `redirectFrom` fast nichts.
- **Getting Started trägt in Schritt 5 Interna.** Es erklärt, wie React-Imports aufgelöst
  werden, und erwähnt `Layout` und `ErrorBoundary`. Beides gehört nach Layout & Navigation
  oder Troubleshooting.

## 4. Theming: unverändert die größte Baustelle für eigene Marken

Von den zwölf Theming-Befunden des ersten Audits gelten zehn unverändert und zwei
teilweise. Das war erwartbar, Theming war als letzter Schritt geplant. Die wichtigsten,
nach Wirkung:

- **Zwei Schemata für dieselben drei Hues.** Die Config sagt `color/accent/neutral`,
  `applyBrandTheme` sagt `primary/secondary/neutral`, und die Chroma-Schlüssel heißen
  jeweils anders.
  - Die Logik dahinter ist doppelt implementiert und weicht inzwischen ab: Die Config
    normalisiert negative Hues und prüft Zahlen, `applyBrandTheme` tut beides nicht.
  - Presets wie `"blue"` funktionieren nur in der Config.
- **Die Marke gilt nur innerhalb von `ArdoRoot`.** Wer seine Root aus `ArdoLayout` und
  `ArdoProvider` baut oder `ArdoHomePage` nutzt, verliert Brand-Farben und Logo, ohne
  Warnung.
- **Kein Schrift-Rezept.** Issue 77 wurde am 14. Oktober mit der Begründung geschlossen,
  CSS und Head-Konfiguration reichten. Ein Rezept dafür steht aber nirgends in den Docs.
- **Callouts und Badges haben feste Hues.** Die eigene Docs-Site braucht deshalb zehn
  Overrides: Ihr Terrakotta-Akzent kollidiert mit der Warnfarbe.
- **Docs, die nichts bewirken.** Das Theming-Beispiel überschreibt
  `--ardo-color-brandLight`, aber dieses Token liest keine Komponente. Insgesamt sind 13
  von 111 Tokens tot.
- **„gray“ und „slate“ sind nicht grau.** Beide Presets setzen Hue 260 bei voller Chroma
  und ergeben ein kräftiges Blau.
- **Das Hero-Bild aus dem Frontmatter.** `ArdoHero` kann jetzt Light und Dark,
  `ArdoHomePage` rendert aus `hero.image` aber nur `.light`.

**Die ersten drei Schritte:**

1. `applyBrandTheme` übernimmt das `ArdoBrandConfig`-Schema und dieselben Resolver.
2. Die Brand-CSS kommt aus `ArdoRootLayout` statt aus `ArdoRoot`.
3. Die Theming-Seite bekommt ein Schrift-Rezept und ein Beispiel mit einem Token, das
   wirklich wirkt.

## 5. Landing und Marketing

- **Die Bilder zeigen ein Ardo, das es nicht mehr gibt.**
  - Der Teaser zeigt die alte Sidebar mit „Site UI Configuration“, „Tailwind CSS“ und
    „create-ardo Lifecycle“, dazu die alte Getting-Started-Einleitung.
  - Das API-Bild zeigt die Seite `defineConfig`, die es seit PR 408 nicht mehr gibt.
- **„All prerendered … by Rust engines“ stimmt so nicht.** TypeScript 7 ist in Go
  geschrieben, und die Suche läuft über MiniSearch. „Claims you can check“ ist ein
  eigenes Prinzip der Landing. Ehrlicher wäre: „Markdown und Highlighting in Rust, Typen
  vom nativen TypeScript-Compiler.“
- **Ein Benchmark ohne Beleg.** „4.3× faster than TypeDoc“ hat als einzige Zahl keinen
  Link, und TypeDoc ist inzwischen ganz raus. Issue 395 deckt die Benchmark-Zahlen ab,
  die Screenshots aber nicht.
- **Die Docs-Site nutzt nicht das Default-Theme.** Sie ist olivgrün mit eigenen Schriften.
  Ein frisches Projekt ist beerenrot mit Systemschrift. Das ist legitim, sollte aber
  sichtbar sein, etwa durch einen Screenshot von Basic.
- **„Read the full comparison“ hält nicht, was die Landing zeigt.** Dort stehen zehn
  Nachbarn, der Vergleich in „What is Ardo?“ behandelt sechs.

## 6. Kleinere DX-Kanten

- **Fehlende `root.tsx`.** Ohne die Datei bricht der Build mit „app/root.tsx must export a
  default root component“ ab, darunter zehn Zeilen React-Stacktrace. Da `<ArdoRoot />`
  inzwischen eine komplette Site ist, könnte Ardo einfach darauf zurückfallen.
- **Default-Titel „Ardo“.** Ohne `ardo.config.ts` heißt jede Seite „… | Ardo“. Ardo liest
  den Paketnamen aus `package.json` ohnehin; er wäre der bessere Fallback.
- **Die Export-Tabelle im npm-README.** Es fehlt `ardo/config` mit `defineArdoConfig`,
  also der meistgenutzte Import. Ebenso fehlen `ardo/react`, `ardo/icons` und
  `ardo/tsconfig`.
- **Totes Stylesheet.** `ApiItem.css.ts` umfasst 255 Zeilen und 26 Styles mit fest
  kodierten Farben. Über `styles.css.ts` landet es in jedem Site-Stylesheet, aber keine
  Komponente benutzt es. Ein Rest aus der TypeDoc-Zeit, zuletzt im März geändert.

## Reihenfolge, die ich wählen würde

1. **Docs-Fehler aus Abschnitt 3.** Sie sind klein, eindeutig und treffen Leser direkt,
   vor allem die Frontmatter-Referenz und die TypeScript-Frage. Das ist ein Nachmittag.
2. **API-Referenz aus Abschnitt 1.** Sie ist auf jeder API-Seite sichtbar und betrifft
   jedes Ardo-Projekt mit `api`. Die Punkte 2 bis 6 sind klein, Punkt 1 ist mittel.
3. **llms-Reihenfolge und Prompt-URL aus Abschnitt 2.** Ein kleiner Eingriff mit großer
   Wirkung auf genau den Weg, den Ardo empfiehlt.
4. **Landing-Bilder neu aufnehmen,** sobald 2 und 3 sichtbar sind.
5. **Theming aus Abschnitt 4,** wie im ersten Audit als Schritt 4 geplant.
6. **DX-Kanten aus Abschnitt 6** nebenbei.
