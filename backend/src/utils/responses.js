export function pickUser(u) {
  return { id: String(u._id), name: u.name, email: u.email };
}
