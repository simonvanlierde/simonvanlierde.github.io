/** The public CV names its owner with one given name, followed by the full family name. */
export function personName(name: string) {
  const [givenName, ...family] = name.split(" ");
  return { givenName, familyName: family.join(" ") };
}
