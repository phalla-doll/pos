"use client"

import * as React from "react"
import { Search } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function HeaderSearch() {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isMac, setIsMac] = React.useState(true)

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform))

    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <InputGroup className="ml-auto w-full max-w-xs">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput ref={inputRef} placeholder="Search..." />
      <InputGroupAddon align="inline-end">
        <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}
