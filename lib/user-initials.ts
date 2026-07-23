/**
 * The initials for an identity avatar, derived from a display name so the
 * avatar and the name never disagree: the first letter of the first and last
 * whitespace-separated words, uppercased. A single word yields its first two
 * letters; empty or blank input yields "".
 */
export function userInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
