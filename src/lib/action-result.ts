// Shared return shape for every Server Action. Never throw to the client —
// see CLAUDE.md §6/§4. Every action returns one of these.
export type ActionResult = { ok: true } | { ok: false; error: string };
