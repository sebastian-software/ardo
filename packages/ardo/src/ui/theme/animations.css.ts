import { keyframes } from "@vanilla-extract/css"

export const fadeInUp = keyframes({
  from: {
    opacity: 0,
    transform: "translateY(20px)",
  },
  to: {
    opacity: 1,
    transform: "translateY(0)",
  },
})
