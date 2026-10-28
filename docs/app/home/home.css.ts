// The home page as a field notebook: dotted paper, washi tape, index cards,
// handwritten margin notes. Its own colors live in local variables so the
// notebook keeps its character in light and dark mode.
import { createVar, globalStyle, keyframes, style } from "@vanilla-extract/css"
import { vars } from "ardo/theme"

const ink = createVar()
const inkSoft = createVar()
const inkMuted = createVar()
const hand = createVar()
const link = createVar()
const dot = createVar()
const note = createVar()
const noteGreen = createVar()
const card = createVar()
const cardBorder = createVar()
const dash = createVar()
const ruled = createVar()
const ruledTop = createVar()
const feetColor = createVar()
const highlight = createVar()

const display = "'Bricolage Grotesque Variable', system-ui, sans-serif"
const handwriting = "'Caveat Variable', cursive"
const body = "'Figtree Variable', system-ui, sans-serif"
const small = "(max-width: 760px)"
const medium = "(max-width: 1099px)"
const motionOk = "(prefers-reduced-motion: no-preference)"

export const page = style({
  vars: {
    [ink]: "#1f1e1b",
    [inkSoft]: "#4a463f",
    [inkMuted]: "#6b6556",
    [hand]: "#a73b15",
    [link]: "#4f5b35",
    [dot]: "#e2ded2",
    [note]: "#fdf1c0",
    [noteGreen]: "#eef0e2",
    [card]: "#ffffff",
    [cardBorder]: "#e8e4d8",
    [dash]: "#ddd6c5",
    [ruled]: "#eef1f5",
    [ruledTop]: "#e8a48c",
    [feetColor]: "#b9b2a1",
    [highlight]: "rgba(253, 193, 21, 0.6)",
  },
  background: `radial-gradient(${dot} 1px, transparent 1.3px) 0 0 / 24px 24px, ${vars.color.bg}`,
  color: ink,
  fontFamily: body,
  fontSize: "18px",
  lineHeight: 1.6,
  textWrap: "pretty",
  overflow: "hidden",
  selectors: {
    ".dark &": {
      vars: {
        [ink]: "#ece6d8",
        [inkSoft]: "#c8c1b2",
        [inkMuted]: "#a39b8a",
        [hand]: "#f09b74",
        [link]: "#b9c58a",
        [dot]: "rgba(255, 255, 255, 0.06)",
        [note]: "#3b3524",
        [noteGreen]: "#2b3022",
        [card]: "#22211d",
        [cardBorder]: "#37352e",
        [dash]: "#45413a",
        [ruled]: "rgba(255, 255, 255, 0.05)",
        [ruledTop]: "#a65a3e",
        [feetColor]: "#5e594d",
        [highlight]: "rgba(253, 193, 21, 0.3)",
      },
    },
  },
})

globalStyle(`${page} a`, { color: link, textUnderlineOffset: "3px" })
globalStyle(`${page} a:hover`, { color: ink })
globalStyle(`${page} mark`, {
  background: `linear-gradient(transparent 52%, ${highlight} 52%, ${highlight} 90%, transparent 90%)`,
  color: "inherit",
  padding: "0 .06em",
})

// Shares Ardo's page frame, so the content edge lines up with the header and footer.
export const wrap = style({
  maxWidth: `calc(${vars.layout.pageMaxWidth} + 2 * ${vars.space.lg})`,
  margin: "0 auto",
  padding: `0 ${vars.space.lg}`,
  boxSizing: "border-box",
  "@media": { "(max-width: 768px)": { padding: `0 ${vars.space.md}` } },
})

export const section = style({ paddingTop: "104px", paddingBottom: "40px" })

export const displayFont = style({
  fontFamily: display,
  fontWeight: 800,
  letterSpacing: "-0.035em",
  textWrap: "balance",
})

export const h1 = style([
  displayFont,
  {
    fontSize: "80px",
    lineHeight: 0.98,
    margin: "26px 0 0",
    "@media": { [small]: { fontSize: "50px" } },
  },
])

export const h2 = style([
  displayFont,
  {
    fontSize: "54px",
    lineHeight: 1.02,
    margin: "0 0 18px",
    "@media": { [small]: { fontSize: "40px" } },
  },
])

export const h3 = style([displayFont, { fontSize: "30px", margin: "14px 0 16px" }])

export const lead = style({
  fontSize: "19px",
  lineHeight: 1.62,
  color: inkSoft,
  maxWidth: "620px",
  margin: 0,
  textWrap: "pretty",
})

export const muted = style({ color: inkSoft })

export const handNote = style({
  fontFamily: handwriting,
  fontWeight: 700,
  color: hand,
  fontSize: "28px",
  lineHeight: 1.05,
  margin: 0,
})

export const handGray = style([handNote, { color: inkMuted, fontSize: "26px" }])

export const noteLabel = style([handNote, { fontSize: "27px", lineHeight: 1, margin: "0 0 10px" }])

export const circled = style({
  position: "relative",
  display: "inline-block",
  // Room for the hand-drawn ring, so it doesn't run into the words around it.
  margin: "0 9px 0 7px",
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      inset: "-4px -8px -2px -8px",
      border: `2.5px solid ${hand}`,
      borderRadius: "52% 48% 50% 46%",
      transform: "rotate(-5deg)",
      pointerEvents: "none",
    },
  },
})

export const mono = style({ fontFamily: vars.font.mono })

export const button = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "48px",
  padding: "0 24px",
  borderRadius: "14px",
  font: `600 16px ${body}`,
  textDecoration: "none",
  border: `2px solid ${ink}`,
  color: ink,
  background: card,
  cursor: "pointer",
  boxSizing: "border-box",
})

globalStyle(`${page} a${button}`, { color: ink, textDecoration: "none" })

export const buttonPrimary = style({
  background: "#4f5b35",
  borderColor: "#4f5b35",
  color: "#fcf2dc",
  boxShadow: "0 6px 0 #343d22",
  "@media": {
    [motionOk]: { transition: "transform .15s ease, box-shadow .15s ease" },
  },
  selectors: {
    "&:active": { transform: "translateY(4px)", boxShadow: "0 2px 0 #343d22" },
  },
})

globalStyle(`${page} a${buttonPrimary}, ${page} a${buttonPrimary}:hover`, { color: "#fcf2dc" })

export const tape = style({
  position: "absolute",
  width: "118px",
  height: "30px",
  zIndex: 3,
  background:
    "repeating-linear-gradient(45deg, rgba(253, 193, 21, 0.62) 0 8px, rgba(253, 193, 21, 0.42) 8px 16px)",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
})

export const tapeGreen = style({
  background:
    "repeating-linear-gradient(45deg, rgba(97, 112, 66, 0.42) 0 8px, rgba(97, 112, 66, 0.26) 8px 16px)",
})

export const sticky = style({
  background: note,
  boxShadow: "0 14px 22px -8px rgba(70, 56, 20, 0.22), 0 1px 2px rgba(70, 56, 20, 0.14)",
  borderRadius: "3px",
  boxSizing: "border-box",
})

export const stickyGreen = style({ background: noteGreen })
export const stickyPlain = style({ background: card })

export const plainCard = style({
  background: card,
  border: `1px solid ${cardBorder}`,
  borderRadius: "18px",
  padding: "24px 24px 22px",
  boxSizing: "border-box",
})

export const indexCard = style({
  position: "relative",
  backgroundColor: card,
  borderTop: `3px solid ${ruledTop}`,
  borderRadius: "6px",
  padding: "22px 26px 28px",
  boxShadow: "0 12px 26px -12px rgba(60, 50, 30, 0.25), 0 1px 2px rgba(60, 50, 30, 0.12)",
  boxSizing: "border-box",
})

// The ruling sits under the written lines only, so text and lines always meet.
const ruleHeight = "32px"

globalStyle(`${indexCard} :is(p, ul, li)`, { lineHeight: ruleHeight })

globalStyle(`${indexCard} :is(p, ul)`, {
  backgroundImage: `linear-gradient(transparent calc(${ruleHeight} - 1px), ${ruled} calc(${ruleHeight} - 1px))`,
  backgroundSize: `100% ${ruleHeight}`,
})

globalStyle(`${indexCard} ul`, { gap: 0 })
globalStyle(`${indexCard} li::before`, { marginTop: "12px" })

export const circleNumber = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "46px",
  height: "46px",
  border: `3px solid ${hand}`,
  borderRadius: "50% 46% 52% 48%",
  fontFamily: handwriting,
  fontWeight: 700,
  fontSize: "30px",
  color: hand,
})

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
})

export const bullet = style({
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  lineHeight: 1.5,
  selectors: {
    "&::before": {
      content: '""',
      flex: "none",
      width: "8px",
      height: "8px",
      marginTop: "9px",
      borderRadius: "50%",
      background: "#617042",
    },
  },
})

export const check = style({
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  lineHeight: 1.5,
  selectors: {
    "&::before": {
      content: '"✓"',
      flex: "none",
      fontFamily: handwriting,
      fontWeight: 700,
      fontSize: "26px",
      lineHeight: 1,
      color: link,
      marginTop: "-1px",
    },
  },
})

export const bubble = style({
  position: "absolute",
  zIndex: 4,
  background: card,
  color: ink,
  border: `2.5px solid ${ink}`,
  borderRadius: "24px",
  padding: "10px 18px",
  fontFamily: handwriting,
  fontWeight: 700,
  fontSize: "28px",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      left: "38px",
      bottom: "-14px",
      width: "22px",
      height: "22px",
      background: card,
      borderRight: `2.5px solid ${ink}`,
      borderBottom: `2.5px solid ${ink}`,
      transform: "rotate(45deg) skew(8deg, 8deg)",
    },
  },
})

export const paper = style({
  position: "relative",
  filter:
    "drop-shadow(0 16px 22px rgba(46, 40, 22, 0.16)) drop-shadow(0 2px 3px rgba(46, 40, 22, 0.1))",
})

const tornBottomEdge =
  "polygon(0% 0%, 100% 0%, 100.0% 92.8%, 96.4% 97.2%, 92.9% 93.7%, 89.3% 92.3%, 85.7% 92.5%, 82.1% 93.5%, 78.6% 97.5%, 75.0% 91.8%, 71.4% 98.3%, 67.9% 94.3%, 64.3% 95.5%, 60.7% 98.1%, 57.1% 95.9%, 53.6% 93.1%, 50.0% 92.4%, 46.4% 97.3%, 42.9% 94.5%, 39.3% 92.1%, 35.7% 92.0%, 32.1% 94.5%, 28.6% 91.8%, 25.0% 95.1%, 21.4% 91.9%, 17.9% 94.1%, 14.3% 95.3%, 10.7% 92.0%, 7.1% 96.1%, 3.6% 92.6%, 0.0% 93.8%)"
const tornBothEdges =
  "polygon(0.0% 4.0%, 4.5% 4.3%, 9.1% 2.7%, 13.6% 3.8%, 18.2% 0.9%, 22.7% 0.9%, 27.3% 1.7%, 31.8% 4.6%, 36.4% 3.1%, 40.9% 2.4%, 45.5% 4.0%, 50.0% 3.2%, 54.5% 2.3%, 59.1% 5.3%, 63.6% 4.7%, 68.2% 2.0%, 72.7% 3.9%, 77.3% 3.7%, 81.8% 5.8%, 86.4% 4.9%, 90.9% 2.2%, 95.5% 6.4%, 100.0% 1.2%, 100.0% 98.4%, 95.5% 99.5%, 90.9% 97.4%, 86.4% 97.7%, 81.8% 93.9%, 77.3% 97.5%, 72.7% 96.3%, 68.2% 99.2%, 63.6% 98.5%, 59.1% 96.2%, 54.5% 97.0%, 50.0% 97.1%, 45.5% 97.7%, 40.9% 95.4%, 36.4% 98.8%, 31.8% 96.9%, 27.3% 98.1%, 22.7% 97.5%, 18.2% 93.7%, 13.6% 96.4%, 9.1% 94.4%, 4.5% 98.0%, 0.0% 96.0%)"

export const tornBottom = style({
  clipPath: tornBottomEdge,
  overflow: "hidden",
  background: "#fff",
})
export const tornBoth = style({ clipPath: tornBothEdges, overflow: "hidden", background: "#fff" })

export const shot = style({
  display: "block",
  width: "100%",
  height: "auto",
  selectors: { ".dark &": { filter: "brightness(0.94)" } },
})

export const doodle = style({ overflow: "visible", flex: "none" })
globalStyle(`${doodle} path`, {
  fill: "none",
  stroke: hand,
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
})

export const feet = style({ flex: "none" })
globalStyle(`${feet} path`, {
  fill: "none",
  stroke: feetColor,
  strokeWidth: 2.2,
  strokeLinecap: "round",
})

export const paperclip = style({ position: "absolute" })
globalStyle(`${paperclip} path`, {
  fill: "none",
  stroke: "#8f8b83",
  strokeWidth: 2.6,
  strokeLinecap: "round",
})

export const coffeeRing = style({ position: "absolute" })
globalStyle(`${coffeeRing} circle`, { fill: "none", stroke: "rgba(122, 84, 44, 0.14)" })

export const hideSmall = style({ "@media": { [small]: { display: "none" } } })

export const toolStrip = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "14px 28px",
  padding: "18px 0",
  borderTop: `1.5px dashed ${dash}`,
  borderBottom: `1.5px dashed ${dash}`,
  fontSize: "16px",
})

export const tool = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: 600,
})

export const facts = style({
  display: "inline-flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px 12px",
  background: card,
  border: `1.5px dashed ${dash}`,
  borderRadius: "10px",
  padding: "9px 16px",
  fontSize: "15px",
  transform: "rotate(-1deg)",
  boxShadow: "0 8px 16px -10px rgba(60, 50, 30, 0.35)",
  "@media": {
    [small]: {
      display: "inline-grid",
      gridTemplateColumns: "auto auto",
      justifyItems: "start",
      gap: "2px 12px",
    },
  },
})

globalStyle(`${facts} > svg`, { "@media": { [small]: { gridRow: "span 2" } } })

globalStyle(`${page} a${facts}`, { color: inkSoft, textDecoration: "none" })
globalStyle(`${page} a${facts}:hover`, { color: ink, borderColor: hand })

export const factSeparator = style({
  width: "4px",
  height: "4px",
  borderRadius: "50%",
  background: feetColor,
})

// Downloads and license stay together, so a wrapped label never ends on a dot.
export const factGroup = style({ display: "inline-flex", alignItems: "center", gap: "12px" })

export const swatchCard = style({
  display: "flex",
  flexDirection: "column",
  background: card,
  borderRadius: "6px",
  overflow: "hidden",
  boxShadow: "0 12px 24px -12px rgba(60, 50, 30, 0.3), 0 1px 2px rgba(60, 50, 30, 0.14)",
})

export const swatch = style({ height: "44px" })
export const swatchThin = style({ height: "22px" })

export const compareRow = style({
  display: "flex",
  gap: "14px",
  alignItems: "baseline",
  padding: "14px 0",
  borderBottom: `1.5px dashed ${dash}`,
  "@media": { [small]: { flexDirection: "column", gap: "2px" } },
})

export const compareName = style({
  flex: "0 0 170px",
  fontWeight: 700,
  "@media": { [small]: { flex: "none" } },
})

export const businessCard = style({
  position: "relative",
  background: "#ffffff",
  color: "#2a2720",
  borderRadius: "8px",
  padding: "30px 32px 26px",
  boxShadow: "0 14px 26px -14px rgba(60, 50, 30, 0.32), 0 1px 2px rgba(60, 50, 30, 0.12)",
  selectors: { ".dark &": { background: "#efe9dc" } },
})

globalStyle(`${businessCard} a`, { color: "#4f5b35" })
globalStyle(`${businessCard} p`, { color: "#4a463f" })

export const dashedTop = style({ borderTop: `1.5px dashed ${dash}` })

export const smallPrint = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px 24px",
  fontSize: "15px",
  color: inkMuted,
})

const bob = keyframes({
  "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
  "50%": { transform: "translateY(-10px) rotate(-1.5deg)" },
})

const peekUp = keyframes({
  "0%, 70%, 100%": { transform: "translateY(0)" },
  "78%, 90%": { transform: "translateY(-10px)" },
})

export const bobbing = style({
  "@media": { [motionOk]: { animation: `${bob} 5s ease-in-out infinite` } },
})
export const peeking = style({
  "@media": { [motionOk]: { animation: `${peekUp} 7s ease-in-out infinite` } },
})

// Layout of the individual sections.

const columns = (min: string) => `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`

export const sectionTight = style({ paddingTop: "48px" })

export const hero = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "24px",
  alignItems: "center",
  paddingTop: "48px",
  paddingBottom: "32px",
})

export const heroText = style({ flex: "1 1 560px", minWidth: 0 })

export const eyebrow = style({
  display: "inline-block",
  transform: "rotate(-2.5deg)",
  padding: "8px 16px",
  fontSize: "15px",
  fontWeight: 700,
})

export const heroLead = style({ fontSize: "21px", marginTop: "24px" })

export const buttonRow = style({
  display: "flex",
  gap: "14px",
  marginTop: "32px",
  flexWrap: "wrap",
})

export const factsRow = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "10px 18px",
  marginTop: "30px",
})

export const heroArt = style({
  flex: "0 1 430px",
  minWidth: "260px",
  position: "relative",
  paddingTop: "40px",
  // Centers the owl once it wraps below the text.
  marginInline: "auto",
  "@media": { [small]: { maxWidth: "340px" } },
})

export const heroBubble = style({
  top: 0,
  left: "4%",
  transform: "rotate(-5deg)",
  "@media": { [small]: { fontSize: "23px" } },
})

export const heroOwl = style({ display: "block", width: "100%", height: "auto" })

export const heroFeet = style({ position: "absolute", left: "-150px", bottom: "6px" })

export const teaser = style({
  position: "relative",
  paddingTop: "72px",
  paddingBottom: "120px",
  "@media": { [small]: { paddingBottom: "40px" } },
})

export const teaserMain = style({ transform: "rotate(-1.2deg)", maxWidth: "920px" })
export const teaserMainFrame = style({ aspectRatio: "2 / 1" })

export const teaserSecond = style({
  position: "absolute",
  right: "28px",
  bottom: "34px",
  width: "39%",
  minWidth: "280px",
  transform: "rotate(2.6deg)",
  "@media": {
    [small]: {
      position: "relative",
      right: "auto",
      bottom: "auto",
      width: "100%",
      minWidth: 0,
      marginTop: "28px",
    },
  },
})

export const teaserSecondFrame = style({ aspectRatio: "940 / 528" })

// Both notes need the full-width collage; on narrower screens they run into each other.
// The top note sits above the guide page so its arrow can reach the section rail.
export const teaserNoteTop = style({
  position: "absolute",
  top: "22px",
  left: "14px",
  "@media": { [medium]: { display: "none" } },
})

export const railArrow = style({ position: "absolute", left: "-12px", top: "33px" })

export const teaserNoteRight = style({
  position: "absolute",
  right: "44%",
  bottom: "-6px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  "@media": { [medium]: { display: "none" } },
})

export const tapeLeft = style({
  top: "-14px",
  left: "200px",
  transform: "rotate(-7deg)",
  "@media": { [small]: { left: "16px" } },
})
export const tapeRight = style({
  top: "-12px",
  right: "90px",
  transform: "rotate(6deg)",
  "@media": { [small]: { right: "16px" } },
})
export const tapeCenter = style({ top: "-12px", left: "42%", transform: "rotate(-3deg)" })
export const tapeLeftSmall = style({ top: "-12px", left: "30px", transform: "rotate(-8deg)" })
export const tapeRightSmall = style({ top: "-12px", right: "50px", transform: "rotate(7deg)" })
export const tapeFinal = style({ top: "-14px", left: "48px", transform: "rotate(-5deg)" })

export const shotCover = style({
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "top left",
  selectors: { ".dark &": { filter: "brightness(0.94)" } },
})

export const tiltLeft = style({ transform: "rotate(-0.8deg)" })
export const tiltLeftSoft = style({ transform: "rotate(-1deg)" })
export const tiltRight = style({ transform: "rotate(0.6deg)" })
export const tiltRightSoft = style({ transform: "rotate(0.8deg)" })
export const tiltSlight = style({ transform: "rotate(-0.4deg)" })

// Flex instead of grid, so a card that wraps alone stretches across the row.
export const cardGrid = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "28px",
  marginTop: "44px",
})

globalStyle(`${cardGrid} > *`, { flex: "1 1 300px" })

export const cardText = style({ margin: 0, color: inkSoft })

export const splitRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: "56px",
  alignItems: "center",
})
// Image on the left when side by side, text first once the row wraps.
export const splitReverse = style({ flexWrap: "wrap-reverse" })
export const splitText = style({ flex: "1 1 400px", minWidth: 0 })
export const splitMedia = style({ flex: "1 1 460px", minWidth: 0, position: "relative" })

export const promptColumn = style({
  flex: "1 1 420px",
  minWidth: 0,
  position: "relative",
  paddingBottom: "46px",
})

export const coffee = style({ right: "-30px", top: "-54px", transform: "rotate(18deg)" })

export const promptNote = style({
  position: "relative",
  transform: "rotate(1.6deg)",
  padding: "42px 36px 34px",
})

export const promptText = style({ fontSize: "21px", lineHeight: 1.55, margin: 0 })
export const promptAction = style({ marginTop: "26px" })

export const promptCopyControl = style({
  display: "inline-grid",
  justifyItems: "start",
  maxWidth: "100%",
  gap: "12px",
  textAlign: "left",
})

export const promptCopyFallback = style({ display: "grid", gap: "8px", width: "100%" })

export const promptCopyError = style({
  margin: 0,
  font: `400 14px/1.5 ${body}`,
  color: ink,
})

export const promptCopyField = style({
  display: "block",
  width: "100%",
  minHeight: "6rem",
  boxSizing: "border-box",
  resize: "vertical",
  padding: "12px",
  font: `400 14px/1.5 ${vars.font.mono}`,
  color: ink,
  background: card,
  border: `1px solid ${ink}`,
  borderRadius: "8px",
  selectors: {
    "&:focus-visible": { outline: `2px solid ${ink}`, outlineOffset: "2px" },
  },
})

export const promptAside = style({
  position: "absolute",
  left: "14px",
  bottom: "-4px",
  transform: "rotate(-2deg)",
})

export const engineGrid = style({
  display: "grid",
  gridTemplateColumns: columns("340px"),
  gap: "32px",
  marginTop: "48px",
})

export const engineCard = style({ padding: "26px 30px 30px" })
export const engineHead = style({ display: "flex", alignItems: "center", gap: "14px" })
export const engineName = style({ margin: 0, fontSize: "36px" })
export const engineProof = style({ margin: "14px 0 0", fontWeight: 700 })
export const engineLink = style({ margin: "10px 0 0", fontWeight: 700 })
export const familyNote = style({ margin: "26px 0 0 8px" })

// Four, two or one per row, so no card is ever left alone.
export const friendGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginTop: "40px",
  "@media": {
    "(max-width: 999px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    "(max-width: 599px)": { gridTemplateColumns: "minmax(0, 1fr)" },
  },
})

// The TypeScript 7 card carries a measured claim, so it takes two columns:
// with Vite and Oxc that fills a row of four, or a row of two on its own.
export const friendWide = style({
  gridColumn: "span 2",
  "@media": { "(max-width: 599px)": { gridColumn: "auto" } },
})

export const friendName = style({ fontSize: "20px" })
export const friendText = style({ margin: "10px 0 0", color: inkSoft, fontSize: "16px" })

export const mediaLeft = style({ transform: "rotate(-2deg)", width: "94%" })
export const mediaRight = style({ transform: "rotate(1.4deg)" })
export const mediaFrame = style({ aspectRatio: "1.45 / 1" })
export const componentsFrame = style({ aspectRatio: "2 / 1" })

// The callouts overlap the cards like a second scrap on the same page.
export const componentsSecond = style({
  position: "absolute",
  right: "-3%",
  bottom: "-84px",
  width: "40%",
  transform: "rotate(3deg)",
  "@media": {
    [medium]: { right: "2%" },
    [small]: {
      position: "relative",
      right: "auto",
      bottom: "auto",
      width: "62%",
      margin: "-36px 0 0 auto",
    },
  },
})

export const componentsSecondFrame = style({ aspectRatio: "5 / 4" })

export const mediaNoteLeft = style({
  position: "absolute",
  left: "10px",
  bottom: "-42px",
  transform: "rotate(2deg)",
})

export const moreLink = style({ margin: "22px 0 0", fontWeight: 700 })

export const swatchGrid = style({
  display: "grid",
  gridTemplateColumns: columns("220px"),
  gap: "26px",
  marginTop: "44px",
  maxWidth: "900px",
})

export const swatchTilt = [
  style({ transform: "rotate(-1.5deg)" }),
  style({ transform: "rotate(1deg)" }),
  style({ transform: "rotate(-0.6deg)" }),
]

export const swatchLabel = style({ padding: "14px 16px" })
export const swatchNote = style({ fontSize: "14px", color: inkMuted })
export const nightNote = style({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "30px",
})

export const compareGrid = style({
  listStyle: "none",
  margin: "32px 0 0",
  padding: 0,
  display: "grid",
  gridTemplateColumns: columns("420px"),
  columnGap: "48px",
})

export const fitGrid = style({
  display: "grid",
  gridTemplateColumns: columns("340px"),
  gap: "32px",
  marginTop: "40px",
})

export const fitNote = style({ padding: "30px 32px" })
export const fitTitle = style([displayFont, { fontSize: "24px", margin: "0 0 14px" }])

export const whyColumn = style({ maxWidth: "860px" })

export const quote = style([
  displayFont,
  {
    fontSize: "44px",
    lineHeight: 1.12,
    margin: 0,
    fontWeight: 700,
    letterSpacing: "-0.025em",
    "@media": { [small]: { fontSize: "32px" } },
  },
])

export const quoteBy = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "14px",
  marginTop: "20px",
})

export const signature = style({
  fontFamily: handwriting,
  fontWeight: 700,
  fontSize: "34px",
  color: ink,
})

export const principles = style({
  listStyle: "none",
  padding: 0,
  margin: "34px 0 0",
  display: "grid",
  gridTemplateColumns: columns("340px"),
  gap: "18px 28px",
  lineHeight: 1.5,
})

export const principleNumber = style({
  fontFamily: handwriting,
  fontWeight: 700,
  fontSize: "26px",
  color: hand,
})

export const finalSection = style({ paddingTop: "160px", paddingBottom: "96px" })

export const finalCard = style({
  position: "relative",
  background: note,
  borderRadius: "26px",
  padding: "60px 48px 52px",
  boxShadow: "0 20px 40px -20px rgba(70, 56, 20, 0.35)",
  "@media": { [small]: { padding: "40px 24px" } },
})

export const peekWindow = style({
  position: "absolute",
  right: "70px",
  top: "-104px",
  width: "150px",
  height: "108px",
  overflow: "hidden",
})

export const peekOwl = style({ display: "block", width: "150px", height: "auto" })
export const finalTitle = style({ maxWidth: "700px" })

export const companySection = style({ paddingTop: "56px", paddingBottom: "40px" })

export const cardPair = style({
  display: "grid",
  gridTemplateColumns: columns("340px"),
  gap: "40px",
  alignItems: "start",
})

export const cardKicker = style({
  fontFamily: handwriting,
  fontWeight: 700,
  fontSize: "25px",
  lineHeight: 1,
  margin: "0 0 14px",
})

globalStyle(`${businessCard} ${cardKicker}`, { color: "#6b6556" })

export const companyLogo = style({
  display: "block",
  width: "270px",
  maxWidth: "100%",
  height: "auto",
})
export const cardCopy = style({ margin: "18px 0 0", fontSize: "16px" })
export const cardLink = style({ margin: "10px 0 0", fontSize: "16px", fontWeight: 700 })
export const releaseRow = style({ marginTop: "48px" })

export const owlSaysHi = style({
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
})
