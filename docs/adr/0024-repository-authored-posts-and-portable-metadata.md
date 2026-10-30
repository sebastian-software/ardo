# ADR 0024: Repository-authored posts with portable publication metadata

## Status

Accepted. The implementation is opt-in through `publication` configuration.
AT account publication remains a separate future capability.

## Context

Ardo needs a chronological news or blog area with readable article pages,
images, and feed subscriptions. Its local content collections already validate
Markdown/MDX metadata and materialize routes. They do not yet define a post
lifecycle, chronological ordering, feed output, or an editorial layout.

AT Protocol and Atom serve different purposes. Atom is a feed format that can
be generated as a static file. AT Protocol publication writes records under an
account and introduces authentication and synchronization. Supporting the latter
does not need to be a prerequisite for publishing a static news area.

Standard.site defines publication and document metadata for long-form content
on AT Protocol. Aligning the authored metadata now avoids a separate vocabulary
when an AT publisher is added. The schema deliberately leaves body formats
open; using its metadata does not make arbitrary MDX portable.

Standard.site publishes its schemas as AT Lexicons, the protocol's
machine-readable schema format. These definitions provide the reference for
compatible metadata and validation at a future AT output boundary. Local
frontmatter remains an authoring contract with Ardo-specific editorial fields
and local asset and author references; it is not a raw AT record.

## Decision

Add a first-class, optional publication feature to Ardo. Use one post model for
news and blog entries; a site's presentation determines the label. Keep
repository-authored Markdown/MDX as the canonical content. Generate
chronological listings, static post pages, and a subscribable feed from that
source. Treat AT publication as a later, separate output of the same content.
Ordinary builds must not publish records to an external account.

Use the Standard.site field names with their documented meanings where they
apply: `title`, `description`, `publishedAt`, `updatedAt`, `tags`, `coverImage`,
and `path`. Author post metadata primarily in frontmatter rather than duplicating
it in route code or site configuration. `publishedAt` determines chronology;
editing a post does not change its original publication date. Additional
editorial fields such as `draft` belong to Ardo and must not be presented as
Standard.site fields. Drafts are excluded from public pages, feeds, and indexes.

Give each post an immutable local `id` in frontmatter, created once and retained
when the title, source filename, or public path changes. This is an Ardo
editorial field, not a Standard.site field. Feed identity and a later AT record
mapping use this stable identity rather than treating a renamed file as a new
post. Assign an opaque ID once when creating the source; the guide recommends
a generated UUID. Builds reject duplicate IDs within a source locale.

Posts with a future `publishedAt` are also excluded from public output. A build
at or after that instant makes them eligible; reaching a timestamp does not
change an already deployed static site. Generate both Atom and RSS feeds from
the same portable content. Feed entries contain the full article, including
its images.

Author image references in the form needed for local publishing. A future AT
publisher translates a cover image to an AT blob reference rather than asking
authors to write protocol-specific blob objects. Derived plaintext and the
publication reference are generated at the output boundary.

Keep full MDX support on the website. Portable outputs need an explicit static
representation of interactive components, such as text or an image. If a
component cannot be represented, the exporter reports the missing replacement.
The concrete body format for a future AT publisher remains open; the metadata
schema alone does not establish support in a reader.

## Authorship

Posts need to support multiple named authors with portraits and links to their
profiles. Keep editorial authorship separate from the account publishing an AT
record. A publication's account can publish a record without its owner being
the person who wrote the prose.

AT identities use stable DIDs. Profile data is application-specific: Bluesky's
profile schema offers optional display names, descriptions, and avatars, but
does not guarantee that an account has such a profile or provide a structured
professional-title field. Standard.site document contributors require a DID;
their role and display-name override are optional. The document schema has no
explicit primary-author field separate from the publishing record's identity.

Use shared local author profiles, referenced from a
post's frontmatter. A profile supplies the byline's name, portrait, biography,
optional professional title, links, and optional AT DID. Authors do not need an
AT account to appear on the website or in feeds. The exact local field names
and registry keys are documented in the publication guide. Resolved profiles
carry their local registry key as `id` independently of an optional DID.

A future publisher can map authors with DIDs to document contributors. Using
the open contributor role `author` is an Ardo mapping; other readers are not
guaranteed to reproduce Ardo's full byline. Representation of authors without
DIDs in that export remains part of the later AT publisher design.

## Responsive Images

The revised direction is for Ardo to generate image variants at different
resolutions during the build and reference them through `srcset` with
appropriate `sizes`. The output is served with the static website. Resizing
preserves the source aspect ratio by default; requesting a smaller resolution
does not imply a crop. The source image is not modified.

The automatic pipeline accepts local image files only, including files beside
the authored MDX. External image acquisition and externally hosted image
behavior remain the author's responsibility; the pipeline does not download or
optimize external URLs.

Distinguish two optional author-defined areas. A core area (A) identifies the
subject to frame and must remain fully visible. A preferred frame (B) expresses
an explicitly authored composition, including how tightly the subject should
be framed. Either can be specified without the other.

- Without A or B, every generated resolution preserves the original
  composition.
- With B, derive the target-aspect composition from that desired frame,
  adjusting to the source boundaries and preserving A whenever it is present.
  B is a framing preference; it cannot override A's preservation guarantee. An
  explicit B replaces the automatically inferred frame around A.
- With only A, frame tightly around the core plus a desired relative margin,
  then adapt to the target aspect ratio. A is both a preservation constraint
  and the starting point for the composition.

Express the desired margin per side relative to the corresponding width or
height of the resulting crop frame. For example, a requested margin of 15% on
each side aims for the core to occupy no more than 70% of either axis; adapting
to the target aspect ratio can add more space in one axis. This percentage is
a composition preference, not a mandatory inset.

Fit the composition to the available source content. Shift the crop inside
the source bounds and reduce margins where necessary while keeping A fully
visible. Unavailable margin alone does not fail a build. Source boundaries,
the target aspect ratio, and complete preservation of A are hard constraints;
the desired frame and breathing room yield to them. The adjustment must be
deterministic so that every resolution in a crop family retains the same
composition.

When framing is requested, generate 16:10 and 4:3 crop families, each at several
resolutions. If either required composition cannot preserve the whole core
area inside the source image, fail the build with a direct error identifying
the source image and target aspect ratio. Do not cut into A or silently replace
the requested composition with another output. The source image is never
modified.

Separate original, composition, and resolution. A crop family has one
composition and several resolutions. Different compositions must not compete
in the same resolution `srcset`. A `picture` element selects a source through
ordered media/type rules, while `srcset` and `sizes` guide resolution selection.
The layout must define the composition needed by each image placement; viewport
width alone does not distinguish a wide article image from a narrow card in
the same page.

## Image Presets

Select composition by the image's purpose through reusable presentation
presets. A preset can choose a fixed crop family or an ordered set of media
conditions with a fallback. The site selects the preset for a placement;
different placements can use the same source metadata with different presets.
There is no intended universal viewport rule for all article images.

The source's A/B metadata describes editorial framing. The presentation preset
describes source selection and layout sizing; resolution candidates within the
selected composition remain the browser's choice. Every source set contains
only one composition. Support site-defined presets and a small replaceable
starter set. The exact preset API remains part of the implementation plan.

Media conditions on `picture` sources evaluate the viewport and environment,
not the containing element's width. Presets must account for that distinction;
container queries cannot directly select a `picture` source.

Bunny was considered for on-demand optimization and cropping. Its Pull Zone
and Dynamic Images API can provide that behavior, but the local-build proposal
does not require an external image service.

## Site and Documentation Scope

News URLs remain independent of documentation versions. Marketing pages and
the site homepage have the same rationale: documentation versioning represents
version-specific API reference, guides, and detailed explanations rather than
the entire website. [ADR 0025](./0025-site-and-documentation-route-scopes.md)
records the broader routing direction and the remaining compatibility choices.

## Consequences

- Static hosting and repository review remain sufficient for the initial news
  area. AT account credentials are unnecessary for that release.
- Website rendering and portable exports need explicit, separate content
  contracts. Matching metadata names alone does not establish reader support.
- Collections need deliberate asset handling if images live beside authored
  posts: current materialization copies Markdown/MDX without rebasing relative
  imports or copying colocated assets. It also drops structured frontmatter
  objects, so a structured image descriptor needs pipeline changes.
- Ardo currently has no general raster-resizing pipeline. The local-build
  direction adds image processing and asset emission to the build, rather than
  only changing image URLs in rendered markup.
- Independent site and documentation routes require changes to route identity,
  links, development serving, build output, and version controls: the current
  version base applies to all routes, including bare layouts.
- Images used in feeds need durable absolute URLs. Feed readers must be able to
  display them without the website's component runtime.

## Implementation

`publication.from` identifies the canonical local posts directory;
`publication.to` owns a generated route subtree. Materialization retains nested
frontmatter and resolves relative MDX imports against the original source file.
Publication sources cannot live in Vite's public directory, where ordinary
asset copying would expose unpublished sources.

Core coordinates use a normalized center and a square size relative to the
oriented source's shorter side. Preferred frames use normalized top-left
coordinates and dimensions. Sharp generates content-addressed WebP renditions
without upscaling; SVG and animated images pass through without framing.
The development server regenerates pages and images when sources change.

A post's `feedContent` supplies the complete static Markdown article when native
MDX projection reports omissions. Both feeds share this representation. The
website retains the full MDX source, including interactive components.

A new translation workflow is outside this initial publication scope. Existing
strict locale contracts apply to `publication.from/<locale>/`. The concrete AT
body representation belongs to the later publisher design.

## References

- [Content collections](../../packages/ardo/src/vite/collections.ts)
- [Publication guide](../app/content/guide/publications.mdx)
- [Content materialization](../../packages/ardo/src/vite/content-sources.ts)
- [Static site architecture](./0020-static-site-without-react-router.md)
- [Standard.site document schema](https://standard.site/docs/lexicons/document)
- [Published document lexicon](https://pdsls.dev/at://did:plc:re3ebnp5v7ffagz6rb6xfei4/com.atproto.lexicon.schema/site.standard.document)
- [AT Lexicon schema format](https://atproto.com/guides/lexicon)
- [Atom format](https://www.rfc-editor.org/rfc/rfc4287)
- [Bunny CDN origins](https://bunny.net/docs/cdn/quickstart)
- [Bunny Dynamic Images](https://bunny.net/docs/optimizer/dynamic-images/overview)
- [Bunny image cropping](https://bunny.net/docs/optimizer/dynamic-images/cropping)
- [HTML image art direction](https://html.spec.whatwg.org/multipage/images.html#art-direction-based-selection)
- [AT identity](https://atproto.com/guides/identity)
- [Bluesky profile schema](https://github.com/bluesky-social/bsky/blob/main/lexicons/app/bsky/actor/profile.json)
