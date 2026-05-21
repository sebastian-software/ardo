import { type RefObject, useEffect } from "react"

export function useGlobalSearchShortcut(
  inputRef: RefObject<HTMLInputElement | null>,
  setIsOpen: (open: boolean) => void
) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [inputRef, setIsOpen])
}

type OutsideClickOptions = {
  containerRef: RefObject<HTMLDivElement | null>
  popoverClass: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function useOutsideClick({
  containerRef,
  popoverClass,
  isOpen,
  setIsOpen,
}: OutsideClickOptions) {
  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!(e.target instanceof Element)) {
        return
      }

      const target = e.target
      const inContainer = containerRef.current?.contains(target) === true
      const inPopover = target.closest(`.${popoverClass}`) != null
      if (!inContainer && !inPopover) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    document.addEventListener("touchstart", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("touchstart", handleOutsideClick)
    }
  }, [containerRef, popoverClass, isOpen, setIsOpen])
}
