# Ardo: UX/DX-Audit, Oktober 2026

Stand: 22. Oktober 2026, Commit `d57d0b3` auf `main`. Geprüft wurden Repo, Docs-Site
(lokal und live auf ardo-docs.dev), npm, das Basic-Beispiel und ein frisch gebautes Paket.
Ziel des Audits: Ardo maximal einfach, überschaubar und angenehm machen. Für Leute, die
es adoptieren, und für Leute, die damit gebaute Docs lesen.

Kurzfassung in einem Satz: Die Landing hält, was sie verspricht. Der Weg dahinter nicht.
Wer Ardo heute ausprobiert, scheitert an Schritt 2, und wer durchkommt, bekommt sieben
Dateien, drei Vokabulare fürs Theming und 26 Guide-Seiten ohne Gruppierung. Das ist alles
reparabel, und das meiste davon ist Aufräumen, nicht Neubau.

## Die fünf Hebel

| #   | Hebel                                                 | Warum es zählt                                                                                        | Aufwand |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------- |
| 1   | Docs und npm auf dieselbe Version bringen             | `pnpm add ardo@6` aus dem live Getting Started liefert heute ein 404. Schritt 2, Spiel vorbei.        | klein   |
| 2   | Den Agenten-Weg zum einen, klaren Einstieg machen     | Der Prompt ist die Tür. Heute stehen 25 Zeilen Routing davor, und der manuelle Weg hat 7 Dateien.     | klein   |
| 3   | Boilerplate aus `root.tsx` und `tsconfig.json` nehmen | Vier Zeilen, die niemand erraten kann, und ein Titel an drei Stellen.                                 | mittel  |
| 4   | Guide-Sidebar von 26 auf 12 Seiten                    | Historische, interne und doppelte Seiten stehen neben dem Pflichtprogramm.                            | mittel  |
| 5   | Theming auf ein Vokabular und einen Einstieg          | `color`, `brand`, `primary` meinen dasselbe. 13 Tokens tun nichts. Die eigene Site braucht 44 Zeilen. | mittel  |

## Was schon richtig gut ist

Das bitte nicht kaputtoptimieren.

- **Die Landing.** Eule, Haftnotizen, Kaffeering, „Ready to hatch your docs?". Sie hat eine
  eigene Stimme, keine Cyan-Lila-Verläufe, keine Buzzwords. Genau das, was `PRODUCT.md`
  als Anti-Referenz beschreibt, kommt nicht vor. Das ist in dieser Kategorie selten.
- **Der Build.** Basic baut in 1,2 Sekunden, rendert 3 Seiten vor, prüft 70 Links und sagt
  das in zwei ruhigen Zeilen. Ein Tippfehler in der Config bekommt „Unknown configuration
  option "Brand". Did you mean "brand"?". So sieht gute DX aus.
- **Die Lesefläche.** Dark Mode, Mobile, Suche, Tastatur: alles da, alles ruhig. Die
  Docs-UI erfüllt das „readers are mid-task"-Prinzip.
- **Die Ehrlichkeit.** Feature Status mit Shipped/Experimental/Deferred, eine Seite „Who
  should not use Ardo?", Benchmarks mit Link zur Messung, Issue 395 zum Nachmessen nach
  dem Release. Das baut Vertrauen, das keine Sternezahl ersetzen kann.
- **Das Drei-Hue-Versprechen.** Für Chrome-Farben hält es: ein `brand.color` färbt Header,
  Sidebar, Text, Ränder, Code-Flächen und Schatten in beiden Modi, und ein Kontrasttest
  prüft 12 Presets mal 3 Chroma-Stufen mal 2 Modi gegen WCAG AA.

## 1. Erster Kontakt: Marketing und die ersten fünf Minuten

### Beobachtungen

**Zwei Stimmen.** Die Landing spricht wie ein Mensch („yep, that's the whole prompt. grab a
coffee meanwhile."). Das README spricht wie ein CI-Protokoll: „Basic and its optional API
configuration also install, typecheck, and build against the packed Ardo package outside
the workspace." Wer über GitHub kommt, lernt Ardo zuerst als Testinfrastruktur kennen.

**Vier Taglines.** Die Hero-Headline „React docs, baked into plain HTML" ist stark und
konkret. Daneben laufen „Modern, open documentation for React teams" (README),
„React-first Static Documentation Framework" (package.json, llms.txt) und „Guides,
TypeScript API reference, and your components. In one place." (Open Graph). Eine reicht.

**Versionsschere.** Die Site redirectet auf `/v6/`, das Getting Started sagt `pnpm add
ardo@6`, der Hero daneben zeigt „ardo 5.0.0". npm kennt kein `ardo@6`. Für Neulinge ist das
kein Schönheitsfehler, sondern das Ende des Versuchs.

**Social Proof.** Die Zahlen, die ich finden konnte, in einer Tabelle, weil sie die
Strategie beeinflussen:

| Signal                       | Wert                   |
| ---------------------------- | ---------------------- |
| npm-Downloads, letzter Monat | 5.286                  |
| Letztes Release auf npm      | 5.0.0, 3. Oktober 2026 |
| GitHub-Sterne                | 1                      |
| Offene Issues                | 3                      |
| Repo-Alter                   | seit 23. Januar 2026   |

Die Landing zeigt Downloads und keine Sterne. Richtig so. Der „in good company"-Streifen
listet fünf Tools, davon drei aus dem eigenen Haus. Als Stack-Beschreibung ehrlich, als
Social Proof etwas selbstreferenziell.

### Empfehlungen

- README zur Textfassung der Landing machen: Headline, drei Sätze, der Prompt, ein
  manueller Weg, ein Link. Alles über Fixtures, Tags und „packed package" gehört nach
  CONTRIBUTING.
- Eine Tagline festlegen und in package.json, README, llms.txt, og:description benutzen.
  Mein Vorschlag ist die Hero-Zeile, sie ist die einzige mit einem Bild im Kopf.
- „in good company" in „the stack" oder „built with" umbenennen.
- Beim nächsten Release den Hero-Zähler und die Benchmarks in einem Rutsch prüfen (Issue
  395 ist schon da).

## 2. Setup-DX: Der Weg zur ersten Seite

### Die Wette auf den Agenten

Die Entscheidung steht: Leute richten Ardo über ihren Agenten ein, einen Starter gibt es
nicht mehr (ADR 0018). Dann muss dieser Weg der kürzeste und sichtbarste sein. Heute ist er
das nicht:

| Was ein Neuling heute vorfindet                   | Menge |
| ------------------------------------------------- | ----- |
| Zeilen Verweise vor dem Prompt im Getting Started | 25    |
| Varianten von `llms.txt`, die dort genannt werden | 3     |
| Nummerierte Schritte im manuellen Weg             | 6     |
| Dateien, die der manuelle Weg anlegt              | 7     |
| Zeilen bis zum Projektbaum, der alles erklärt     | 236   |

Auf der Landing ist der Prompt ein Klick mit Copy-Button und Kaffeering. In den Docs ist er
ein Codeblock ohne Button, hinter Skill-Ordner, SKILL.md, drei `llms.txt`-Varianten und
Git-Tags. Das Kopieren des Basic-Beispiels aus einem Tag ist Arbeit für den Agenten, nicht
für Menschen; die Docs beschreiben es aber so, als müsste der Leser es tun.

**Empfehlung:** Getting Started beginnt mit dem Prompt und einem Copy-Button, in zwei
Sätzen: „Gib das deinem Agenten. Er liest die versionierten Instructions und das getestete
Beispiel." Alles über Skills, `llms.txt`-Varianten und Tags wandert auf die Agenten-Seite.
Der manuelle Weg bleibt darunter als Fallback, aber mit den Vereinfachungen aus dem
nächsten Abschnitt auf drei Dateien geschrumpft. Davon profitiert auch der Agent: weniger
zu tun, weniger falsch zu machen.

### Die vier Zeilen, die niemand erraten kann

```json
"jsx": "react-jsx",
"jsxImportSource": "ardo",
"types": ["ardo/vite/client", "ardo/virtual"]
```

```tsx
import config from "virtual:ardo/config"
import "ardo/ui/styles.css"
<ArdoRoot config={config}>
```

Jede Zeile hat einen Grund, keine ist für einen React-Entwickler intuitiv. Ardo kennt
seine eigene Config, Ardo kennt sein eigenes Stylesheet. `ArdoRoot` könnte beides selbst
holen, und ein `"extends": "ardo/tsconfig"` könnte die TypeScript-Zeilen tragen. Das
senkt die Dateien von sieben auf drei (Config, root.tsx, eine MDX-Seite) und die
„Warum?"-Fragen auf null.

### Kleine Fallen mit großer Wirkung

- **Der Titel an drei Stellen.** Basic setzt „Ardo Basic Example" in `ardo.config.ts`, im
  `meta` von `root.tsx` und nochmal im `meta` von `home.tsx`. Der Config-Titel landet im
  Seitentitel nur als Suffix. Eine Quelle, bitte.
- **`githubPages` war standardmäßig an.** Wer ein GitHub-Remote hatte und nach Netlify
  deployte, bekam kommentarlos `/repo-name/` als Basispfad. Jedes Beispiel und acht
  Doku-Stellen setzten es deshalb auf `false`. Ohne Router war das Flag nur noch Zucker für
  `base: "/repo/"`, mit einem `git remote`-Aufruf beim Build und einem Unterschied zwischen
  Dev und Build. Seit diesem Audit ist es weg; `base` ist der einzige Schalter.
- **Welches TypeScript?** Getting Started: `typescript@6`. Basic: ein Nightly
  `7.1.0-dev.20261011.1`. API-Doku: dasselbe Nightly, zwingend. Drei Antworten auf eine
  Frage. Die ehrliche Antwort: „Für normale Docs reicht TypeScript 6 oder 7, für die
  API-Referenz brauchst du dieses Nightly, und das ist experimentell."
- **Drei `defineConfig`.** `defineArdoConfig` aus `ardo/config` ist richtig. `defineConfig`
  aus dem Paket-Root nimmt den alten `ArdoConfig`-Typ, und `defineConfig` aus `ardo/vite`
  ist Vites eigenes. Dazu `loadConfig`, das nach `press.config.ts` sucht, ein `./press.css`-
  Export und `pressConfig` im Plugin. Das sind Reste eines alten Namens, die in
  Autocomplete auftauchen. Raus damit, die eine Funktion bleibt.
- **Lärm beim Start.** Jeder Build und jeder Dev-Start druckt dreimal Vites Warnung zu
  `resolve.alias` mit `customResolver` (Issue 398 kennt das). Die Docs-Site bekommt zusätzlich
  drei `[ardo:api]`-Warnungen zu `@types/react`. Und der Tippfehler-Fehler kommt hinter einer
  Zeile „failed to load config from .../node_modules/.ardo/vite-06b4c78ea9c3.config.mjs",
  die einen internen Wrapper-Pfad ausplaudert. Der erste Eindruck eines Tools entsteht im
  Terminal; da sollte Ardo so ruhig sein wie seine Lesefläche.

## 3. Docs: Architektur und Ton

### Die Sidebar, wie sie heute aussieht

26 Guide-Seiten in einer flachen Liste, dazu 100 generierte API-Seiten. Die Reihenfolge
kommt aus `order` im Frontmatter, und vier Paare teilen sich eine Nummer (2/2, 6/6,
11/11, 13/13). Bei Gleichstand entscheidet die Verzeichnisreihenfolge, deshalb kann
„Comparison" über „Getting Started" landen. Zwei Seiten haben gar keine `order` und
stehen ganz unten: „Native API Documentation", ein Kernfeature, und „Migrate from
TypeDoc".

Dazwischen stehen Seiten, die ein Leser nie braucht: „create-ardo Lifecycle" (21 Zeilen
über ein Tool, das es nicht mehr gibt), „Component Inventory" (eine Base-UI-Policy für
Maintainer), drei Upgrade-Guides, und in „Feature Status" die Zeile „CI rejects lint
errors and warnings that exceed the per-rule budget". Das ist die Repo-CI, kein
Produktfeature.

### Der goldene Pfad ist ein Flussdelta

Vom ersten Satz des Getting Started bis zum ersten Befehl liegen 25 Zeilen, die zu
Skill-Ordner, SKILL.md, Agent Instructions, Basic Example, Adopt Ardo, `llms.txt`,
`/v6/llms.txt`, `/v6/llms-full.txt` und „the selected release's Git tag" verzweigen.
Danach sechs Schritte, in deren Mitte drei Absätze erklären, wie Ardo bare React-Imports
auflöst. Der Projektbaum, der alles auf einen Blick erklärt hätte, kommt in Zeile 236.

### Dieselbe Sache, achtmal

| Fakt                                           | Fundstellen |
| ---------------------------------------------- | ----------- |
| Node-Version (einmal 22.13, sonst 22.22)       | 6           |
| Import-Map (`ardo/react`, `ardo/runtime`, ...) | 6           |
| `githubPages: false` für Root-Deploys          | 8           |
| „Ardo manages React, React DOM, Vite"          | 8           |
| „Copy examples/basic from the ardo-v tag"      | 6           |
| Design-System-Paketgrenze                      | 6           |
| „Ardo 6 retires create-ardo"                   | 5           |

### Sätze, die Arbeit machen

Drei von zwölf, die der Docs-Durchgang gefunden hat:

- „Named types inside module-local and exported declaration namespaces participate in
  inherited-member expansion, including React's `export = React` declarations."
  (api-documentation.mdx)
- „Manifest and search readers use the same preparation/render options and final heading
  planner; sidebar and collection readers only extract preparation metadata." (markdown.mdx,
  ein Abschnitt für Maintainer mitten in „Markdown Features")
- „Before those releases, verification uses locally packed engine builds and the matching
  platform sidecars." (upgrade-to-v5.mdx)

Dazu veraltete Stellen: `tailwind.mdx` beschreibt ein `ardo()`-Plugin in `vite.config.ts`,
das Ardo 6 nicht mehr braucht; `typedoc.mdx` steht im Futur eines Releases, das vorbei
ist; der GitHub-Pages-Ablauf in `deployment.mdx` wird zwischen Schritt 1 und 2 von 47
Zeilen Major-Versionierung unterbrochen.

### Was fehlt

Kein Rezept für „Seite hinzufügen", „Sidebar-Abschnitt hinzufügen", „Logo tauschen",
„Schrift setzen". Kein FAQ. Keine npm/yarn-Tabs im Getting Started, obwohl die Gallery
genau dieses Widget zeigt. Kein Screenshot und kein Link auf eine laufende Basic-Site,
damit man sieht, was man bekommt.

### Empfehlungen

1. **Getting Started linear.** Voraussetzungen, Projektbaum, ein Befehl, `pnpm dev`,
   „so fügst du eine Seite hinzu", Link zu Deployment. Alles über Agenten auf eine Seite
   „For Agents" verschieben.
2. **Vier Agent-Seiten zu einer.** Agent Instructions, Adopt Ardo, Basic Example und
   create-ardo Lifecycle sagen dieselben Regeln viermal. Die CSS-Hook-Tabelle aus Adopt
   Ardo wandert ins Theming.
3. **Upgrades in eine eingeklappte Gruppe** am Ende, inklusive Feature Status. Repo-Absätze
   (version-snapshots, Ferromark-Release-Koordination) löschen.
4. **Maintainer-Inhalte raus** aus Markdown Features, Troubleshooting, Basic Example,
   Agent Instructions, Component Inventory, Feature Status.
5. **Jeden Fakt einmal** sagen und verlinken. Dabei 22.13 fixen und die Tailwind- und
   TypeDoc-Stellen aktualisieren.
6. **Eine Seite „Navigation & Site Chrome"** mit den fehlenden Rezepten.
7. **`order`-Kollisionen** auflösen, API-Doku und TypeDoc-Migration einordnen.

Ziel-Sidebar, 12 Seiten plus eine Gruppe:

1. What is Ardo
2. Getting Started
3. Writing Pages (Markdown, MDX, Frontmatter)
4. Components (Gallery, Icons als Abschnitt)
5. Navigation & Site Chrome (root.tsx, Header, Sidebar, Footer, Logo, Reihenfolge)
6. Theming (Custom Theme plus Tailwind)
7. API Reference from TypeScript (plus OpenAPI, TypeDoc-Migration als Abschnitt)
8. Content Sources
9. Deployment
10. Configuration (Referenz)
11. Troubleshooting & FAQ
12. For Agents
13. Upgrading (eingeklappt: v4, v5, v6, Feature Status)

## 4. Theming: Drei Hues, drei Vokabulare

### Beobachtungen

Die Leiter, die ein Adopter heute hat, von einfach nach tief:

| Stufe | Weg                                             | Zeilen | Dokumentiert in                      |
| ----- | ----------------------------------------------- | ------ | ------------------------------------ |
| 1     | `brand: { color: "blue" }` in ardo.config.ts    | 1      | custom-theme, configuration, README  |
| 2     | `--ardo-hue-brand: 240` in einer CSS-Datei      | 3 + 1  | custom-theme, site-ui                |
| 3     | `applyBrandTheme()` aus `ardo/theme` in .css.ts | 2 + 1  | custom-theme                         |
| 4     | `vars`-Contract in eigener .css.ts              | ~6     | custom-theme                         |
| 5     | Header/Footer als Komponente tauschen           | ~10    | custom-theme                         |
| 6     | „Full custom theme"                             | ?      | nur eine Export-Liste, kein Beispiel |

Das Problem ist nicht die Leiter, sondern dass jede Sprosse anders heißt:

| Was gemeint ist  | Config                 | CSS                 | `applyBrandTheme`      |
| ---------------- | ---------------------- | ------------------- | ---------------------- |
| Hauptfarbe       | `color`                | `--ardo-hue-brand`  | `primary`              |
| Akzent           | `accent`               | `--ardo-hue-accent` | `secondary`            |
| Chroma-Schlüssel | `color/accent/neutral` | –                   | `brand/accent/neutral` |
| Presets („blue") | ja                     | nein                | nein                   |

Beide Chroma-Schreibweisen stehen auf derselben Docs-Seite. `color` heißt in der Config
„Hue", in den Theme-Optionen „Token-Gruppe". `gray` und `slate` sind derselbe Wert.

Weitere Fundstücke aus dem Code:

- 13 von 111 Tokens werden emittiert und von keiner Komponente gelesen, darunter
  `--ardo-color-brandLight`, das die Docs als Beispiel zum Überschreiben vorschlagen.
- 33 von 68 Farbtokens ignorieren die Hues: Callouts (tip, warning, danger, info, note)
  und sechs Badge-Farben haben feste Hue-Werte. „Hue-derived everything" aus PRODUCT.md
  gilt also für das Chrome, nicht für den Inhalt.
- Token-Namen mischen kebab und camelCase: `--ardo-color-bgSoft`,
  `--ardo-layout-sidebarWidth`. `--ardo-font-size` und `--ardo-fontSize-base` existieren
  beide mit demselben Wert.
- Das Bootstrap-Skript setzt `.dark` und `.light`, aber kein CSS liest `.light`; die Docs
  lassen deshalb `:root:not(.dark)` schreiben.
- `hero.image.dark` ist typisiert und wird ignoriert; das Header-Logo wechselt, das
  Hero-Bild nicht.
- Logo: zwei Stellen (`brand.logo` in der Config, `logo` auf `ArdoHeader`), JSX gewinnt.
  Favicon: vier Einstiege (`brand.logo`, `icons.source`, `ArdoRootLayout favicon`,
  `public/`). Schriften: keine Option, kein Rezept, Issue 77 ist offen.
- Die eigene Docs-Site braucht `docs/app/theme.css.ts` mit 44 Zeilen inklusive
  `codeBg`- und `warning`-Overrides pro Modus. Das ist der stärkste Hinweis, dass drei Hues
  plus Chroma für eine echte Marke noch nicht reichen.
- `custom-theme.mdx` verspricht „five levels", hat acht Kapitel, und 150 der 560 Zeilen
  handeln von Runtime-Hooks und Icon-Registrierung, nicht von Theming.

### Empfehlungen

1. **Ein Vokabular:** `brand`, `accent`, `neutral` für Hues und Chroma, in Config, CSS
   und `applyBrandTheme`. `color` verschwindet als Hue-Name.
2. **`brand` in der Config wird der einzige Einstieg.** Presets, Zahlen, Chroma, Logo,
   perspektivisch `font`. `ardo/theme` schrumpft auf `vars` und `createTheme` für
   Fortgeschrittene, weil `applyBrandTheme` heute die Logik aus `brand.ts` dupliziert und
   alle 111 Variablen ein zweites Mal ausgibt.
3. **Tote Tokens löschen, Callouts und Badges aus den Hues ableiten.** Dann stimmt die
   Token-Tabelle, und das Produktprinzip gilt auch für den Inhalt.
4. **Favicon auf `brand.logo` plus optional `brand.icon`** zusammenziehen; `icons.source`,
   `ArdoRootLayout favicon`, die `.light`-Klasse und den `press.css`-Alias streichen.
5. **`custom-theme.mdx` auf die echte Leiter kürzen** (Config, CSS-Variablen, `vars` in
   `.css.ts`, Komponente tauschen), ein Schrift-Rezept ergänzen, `hero.image.dark`
   reparieren oder entfernen, Hooks und Icons in eigene Seiten.

## 5. Produktsicht: „Einfach" messbar machen

`PRODUCT.md` nennt zwei Zielgruppen und ein Erfolgskriterium: ein React-Team setzt eine
Site auf, das Standard-Theme sieht aus, als hätte sich jemand Mühe gegeben, und sie
shippen, ohne einen Stil anzufassen, können aber alles aus drei Hue-Zahlen umfärben.

Gegen dieses Kriterium gehalten:

| Zielgruppe | Moment          | Heute                                              |
| ---------- | --------------- | -------------------------------------------------- |
| Adopter    | Landing         | besteht                                            |
| Adopter    | Getting Started | fällt durch (ardo@6, 7 Dateien, 25 Zeilen Routing) |
| Adopter    | Umfärben        | besteht für Chrome, nicht für Callouts             |
| Adopter    | Logo, Schrift   | zwei bzw. null Wege                                |
| Leser      | Lesefläche      | besteht                                            |

Damit „einfach" nicht Geschmackssache bleibt, schlage ich eine Messlatte vor, gegen die
jeder künftige PR geprüft werden kann:

| Messlatte                                          | Ziel            | Heute            |
| -------------------------------------------------- | --------------- | ---------------- |
| Zeilen vor dem Agenten-Prompt im Getting Started   | 2               | 25               |
| Dateien, die ein Neuling von Hand anlegt           | ≤ 3             | 7                |
| Zeilen in tsconfig/root.tsx ohne erklärbaren Grund | 0               | 4                |
| Guide-Seiten in der Sidebar                        | ≤ 12 + 1 Gruppe | 26               |
| Zeilen für eine Marke mit Logo und Schrift         | ≤ 10            | 44 (eigene Site) |
| Warnzeilen bei `ardo dev` in Basic                 | 0               | 3                |

Was ich nicht weiß und deshalb als Annahme markiere:

- **Wie viele Adopter mit Agent kommen.** Dazu gibt es keine Daten. Die Agenten-Wette ist
  richtig als erster Weg; die Messlatte oben gilt für den zweiten Weg, und der muss trotzdem
  bestehen, weil Menschen Frameworks in fünf Minuten bewerten, auch wenn sie den Agenten
  später nutzen.
- **Wann Ardo 6 erscheint.** Steht das Release in Tagen an, ist Hebel 1 erledigt. Steht es
  in Wochen an, sollte die Site bis dahin auf `/v5/` zeigen oder `/v6/` als Vorschau
  markieren.
- **Ob die 13 ungenutzten Tokens extern genutzt werden.** Der Befund kommt aus einem
  Grep über Ardo und die Docs-Site; eine Consumer-Site könnte sie lesen. Ein Hinweis im
  Changelog reicht.

## Reihenfolge, die ich wählen würde

1. **Jetzt, klein (erledigt):** `githubPages` und `detectGitHubBasename` entfernt, `base`
   ist der einzige Schalter. `defineConfig`, `loadConfig`
   und `press.*` entfernt. Wrapper-Pfad aus der Fehlermeldung genommen. Die
   Vite-Alias-Warnung bleibt absichtlich sichtbar (Issue 398), und Node 22.13 im
   v5-Upgrade-Guide stimmt historisch.
2. **Danach, DX:** Prompt mit Copy-Button an den Anfang des Getting Started. `ArdoRoot`
   holt Config und Styles selbst. `ardo/tsconfig` zum Erweitern. Titel aus einer Quelle.
   Basic auf drei Dateien.
3. **Dann, Docs:** Getting Started linear, Agent-Seiten zusammenlegen, Upgrades
   einklappen, Maintainer-Inhalte raus, Rezepte ergänzen, README aus der Landing ableiten.
4. **Zuletzt, Theming:** ein Vokabular, `brand` als Einstieg, tote Tokens weg, Callouts aus
   Hues, Favicon-Einstiege zusammenziehen, Schrift-Rezept, `custom-theme.mdx` halbieren.

Schritt 1 war ein Nachmittag. Schritt 2 ist der, der Ardo von „sieht toll aus" zu „ist in
zwei Minuten da" bringt. Schritte 3 und 4 sind Aufräumen mit Lineal, und die beiden
Agenten-Berichte dieses Audits enthalten die Fundstellen mit Zeilennummern.

## Anhang: Geprüfte Quellen

- Repo: README, PRODUCT.md, CLAUDE.md, ADR 0010, 0018, 0019, `packages/ardo/src/{config,cli,vite,ui}`,
  `examples/basic`, `skills/ardo/SKILL.md`, alle 26 Guide-Seiten, `docs/app/home/*`.
- Browser: Landing, Getting Started, Component Gallery, lokal (1280 px, Mobile, Dark Mode).
- Live: `ardo-docs.dev` Root-Redirect, `/v6/guide/getting-started/`, `llms.txt`.
- npm: `ardo`, `create-ardo`, Downloads der letzten 30 Tage. GitHub: Sterne, Issues.
- Experimente: `pnpm --dir examples/basic build` (1,2 s), `ardo dev` in Basic (Warnungen),
  Build mit `Brand:` statt `brand:` gegen ein frisch gebautes Paket (klare Fehlermeldung).
