import { describe, expect, it } from "vitest"

import {
  axisMoney,
  money,
  percent,
  signedPercent,
  wholeMoney,
} from "@/lib/format"

describe("money", () => {
  it.each([
    { value: 1220.2, expected: "$1,220.20" },
    { value: 0, expected: "$0.00" },
    { value: 0.5, expected: "$0.50" },
    { value: 1234567.891, expected: "$1,234,567.89" },
  ])("$value → $expected", ({ value, expected }) => {
    expect(money(value)).toBe(expected)
  })
})

describe("wholeMoney", () => {
  it.each([
    { value: 1220.2, expected: "$1,220" },
    { value: 1220.7, expected: "$1,221" },
    { value: 0, expected: "$0" },
  ])("$value → $expected", ({ value, expected }) => {
    expect(wholeMoney(value)).toBe(expected)
  })
})

describe("axisMoney", () => {
  it.each([
    { value: 0, expected: "$0" },
    { value: 164, expected: "$164" },
    { value: 999, expected: "$999" },
    { value: 1000, expected: "$1.0k" },
    { value: 1220, expected: "$1.2k" },
  ])("$value → $expected", ({ value, expected }) => {
    expect(axisMoney(value)).toBe(expected)
  })
})

describe("percent", () => {
  it.each([
    { value: 0.247, digits: 0, expected: "25%" },
    { value: 0.247, digits: 1, expected: "24.7%" },
    { value: 0, digits: 0, expected: "0%" },
    { value: 1, digits: 0, expected: "100%" },
  ])("$value @ $digits dp → $expected", ({ value, digits, expected }) => {
    expect(percent(value, digits)).toBe(expected)
  })
})

describe("signedPercent", () => {
  it.each([
    { value: 0.145, expected: "+14.5%" },
    { value: -0.007, expected: "−0.7%" },
    { value: 0, expected: "0.0%" },
    // No baseline — must read as "not applicable", not as no change.
    { value: null, expected: "—" },
  ])("$value → $expected", ({ value, expected }) => {
    expect(signedPercent(value)).toBe(expected)
  })
})
