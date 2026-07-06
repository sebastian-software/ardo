import type { Meta, StoryObj } from "@storybook/react-vite"

import { useRef } from "react"

import { MobileSlidePanel } from "./MobileSlidePanel"
import { ArdoNav, ArdoNavLink } from "./Nav"
import { ArdoSidebar } from "./Sidebar"

function MobileSlidePanelPreview() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const handleClose = () => {
    triggerRef.current?.focus()
  }

  return (
    <>
      <button ref={triggerRef} type="button">
        Menu trigger
      </button>
      <MobileSlidePanel
        title="Ardo"
        nav={
          <ArdoNav>
            <ArdoNavLink to="/guide/getting-started">Guide</ArdoNavLink>
            <ArdoNavLink to="/api-reference">API</ArdoNavLink>
          </ArdoNav>
        }
        themeToggle
        triggerRef={triggerRef}
        onClose={handleClose}
      >
        <ArdoSidebar />
      </MobileSlidePanel>
    </>
  )
}

const meta = {
  component: MobileSlidePanelPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
    },
  },
} satisfies Meta<typeof MobileSlidePanelPreview>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {}
