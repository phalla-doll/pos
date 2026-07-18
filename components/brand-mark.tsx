"use client"

import { useId } from "react"

/**
 * The product's raindrop mark. Sized by the caller — it carries no dimensions
 * of its own so it can sit at rail size in the sidebar header and at row size
 * in a menu, and it deliberately has no background: the artwork is the logo.
 *
 * The gradient halves are built from `<mask>`/`<use>` pairs, which reference
 * their targets by id — so ids are per-instance. React's `useId` supplies the
 * uniqueness; the colons it embeds are stripped because `url(#…)` cannot
 * reference them.
 *
 * The artwork is 38×31 and fills its own bounds, but it renders beside lucide
 * icons, which carry ~2 units of margin inside a square 24 canvas. Drawn at
 * face value it therefore sat wider than its neighbours and flush to their
 * left edge. {@link VIEW_BOX} re-centres it on a square canvas with that same
 * margin ratio, so it optically reads as one of the icons.
 */
/**
 * Square canvas sized so the 38-wide artwork takes the same 83% of it that a
 * lucide glyph takes of its own, then offset to centre the art's bounding box
 * (x 0–38, y 1–31) inside it.
 */
const SIDE = 38 / (20 / 24)
const VIEW_BOX = [19 - SIDE / 2, 16 - SIDE / 2, SIDE, SIDE]
  .map((n) => +n.toFixed(2))
  .join(" ")

export function BrandMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "")
  const [left, leftMask, right, rightMask] = [
    `${uid}-l`,
    `${uid}-lm`,
    `${uid}-r`,
    `${uid}-rm`,
  ]

  return (
    <svg viewBox={VIEW_BOX} className={className} aria-hidden focusable="false">
      <defs>
        <path
          id={left}
          d="M9.5.917a9.5 9.5 0 0 1 9.5 9.5v9.5H9.5a9.5 9.5 0 0 1 0-19z"
        />
        <path
          id={right}
          d="M0 19.917v-9.5l.004-.27a9.5 9.5 0 1 1 9.496 9.77H0z"
        />
      </defs>
      <g fill="none" fillRule="evenodd">
        <path
          fill="#0B7ED0"
          d="M28.192 4.7c5.077 4.933 5.077 12.93 0 17.863-.17.165-.343.325-.519.479L19 31l-8.673-7.958c-.176-.154-.35-.314-.52-.479-5.076-4.932-5.076-12.93 0-17.863 5.077-4.933 13.309-4.933 18.385 0z"
        />
        <g transform="translate(0 11.083)">
          <mask id={leftMask} fill="#fff">
            <use href={`#${left}`} />
          </mask>
          <use fill="#2CD4ED" href={`#${left}`} />
          <path
            fill="#0DB4E2"
            d="M28.192-6.384c5.077 4.933 5.077 12.931 0 17.864-.17.165-.343.324-.519.478L19 19.917l-8.673-7.959c-.176-.154-.35-.313-.52-.478-5.076-4.933-5.076-12.93 0-17.864 5.077-4.933 13.309-4.933 18.385 0z"
            mask={`url(#${leftMask})`}
          />
        </g>
        <g transform="translate(19 11.083)">
          <mask id={rightMask} fill="#fff">
            <use href={`#${right}`} />
          </mask>
          <use fill="#3169FF" href={`#${right}`} />
          <path
            fill="#3153FF"
            d="M9.192-6.384c5.077 4.933 5.077 12.931 0 17.864-.17.165-.343.324-.519.478L0 19.917l-8.673-7.959c-.176-.154-.35-.313-.52-.478-5.076-4.933-5.076-12.93 0-17.864 5.077-4.933 13.309-4.933 18.385 0z"
            mask={`url(#${rightMask})`}
          />
        </g>
      </g>
    </svg>
  )
}
