/**
 * Where the till is: the store, and the register within it.
 *
 * A POS is always operating *somewhere*, and every screen in this app is
 * implicitly scoped to that somewhere — the stock counts, the day's sales, the
 * receipts. Nothing on screen said which one, so the app bar names it.
 *
 * The shape lives here rather than in `lib/fixtures.tsx` because this module is
 * pure and the fixtures are not (they carry JSX for icons). The data is still
 * the fixtures' — `posStores` there is the one list, and this only reads it.
 */

export type Register = {
  /** Unique across every store, so a register identifies itself on its own. */
  id: string
  name: string
}

export type Store = {
  name: string
  registers: readonly Register[]
}

/**
 * The trigger's label: the store and the register both, because either alone
 * is ambiguous — every store has a "Register 1", and "Register 1" says nothing
 * about which counter it sits on.
 *
 * Answers `null` for an id no store claims, which the caller renders as the
 * unselected state rather than as a register that doesn't exist.
 */
export function registerLabel(
  stores: readonly Store[],
  id: string
): string | null {
  for (const store of stores) {
    const register = store.registers.find((r) => r.id === id)
    if (register) return `${store.name} · ${register.name}`
  }
  return null
}

/**
 * Every register across every store, flattened, in the order they'd be listed.
 * Used to check ids are unique — two registers answering to one id would make
 * {@link registerLabel} depend on store order, which is not a thing the caller
 * should have to know.
 */
export function allRegisters(stores: readonly Store[]): Register[] {
  return stores.flatMap((store) => [...store.registers])
}
