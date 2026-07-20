/**
 * Indefinite articles for the nouns screens declare ("item", "customer").
 *
 * Exists because the noun is a registry field and the sentence around it is
 * fixed, so "Add a ${noun}" produced "Add a item" the moment a screen chose a
 * vowel-initial name. The article has to be derived from the noun rather than
 * baked into the sentence, or every screen with a vowel noun reads as a typo.
 *
 * The rule is the letter test, not pronunciation: it is right for every noun
 * the registry declares today and for ordinary English words generally, but it
 * is wrong for the cases where spelling and sound disagree — "a unit", "a
 * one-off", "an hour", "an SKU". Those are worth knowing about rather than
 * guarding against: the input is a handful of author-chosen words, not user
 * text, so a screen that wants one can say so by declaring the noun with its
 * article already attached, and the fix stays where the exception is.
 */

const VOWELS = new Set(["a", "e", "i", "o", "u"])

/** `"an"` before a vowel-initial noun, `"a"` otherwise. */
export function article(noun: string): "a" | "an" {
  return VOWELS.has(noun.trim()[0]?.toLowerCase() ?? "") ? "an" : "a"
}

/** The noun with its article — `"an item"`, `"a customer"`. */
export function withArticle(noun: string): string {
  return `${article(noun)} ${noun}`
}
