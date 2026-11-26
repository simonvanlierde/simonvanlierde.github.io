// Start assembled, then explode. Inline, right after the figure, so the class
// is set before first paint: a deferred module could run later and make the
// parts jump. Removing it two frames later lets the transition run. Without
// JS or with reduced motion, the view stays exploded.
{
  const fig = document.querySelector(".exploded");
  if (fig && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fig.classList.add("is-assembled");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fig.classList.remove("is-assembled"));
    });
  }
}
