// Storage throws where blocked (sandboxed iframe, strict privacy modes);
// the default dark theme applies instead.
try {
  const t = localStorage.getItem("theme");
  if (t) document.documentElement.dataset.theme = t;
} catch {
  // Use the default theme.
}
