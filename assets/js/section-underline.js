(() => {
  const titleSelector = ".intro-container h3, .list-container h3, .text-container h3";
  const titles = document.querySelectorAll(titleSelector);

  if (!titles.length) {
    return;
  }

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const animationClass = "is-underline-animating";

  const playUnderlineAnimation = (element) => {
    element.classList.remove(animationClass);
    void element.offsetWidth;
    element.classList.add(animationClass);
  };

  const clearUnderlineAnimation = (element) => {
    element.classList.remove(animationClass);
  };

  if (!("IntersectionObserver" in window)) {
    titles.forEach((title) => playUnderlineAnimation(title));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const title = entry.target;

        if (entry.isIntersecting) {
          playUnderlineAnimation(title);
          return;
        }

        clearUnderlineAnimation(title);
      });
    },
    {
      threshold: 0.01,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  titles.forEach((title) => observer.observe(title));

  let pageEndTriggered = false;

  const maybeTriggerLastTitleAtPageEnd = () => {
    const viewportBottom = window.scrollY + window.innerHeight;
    const documentBottom = document.documentElement.scrollHeight;
    const isAtPageEnd = viewportBottom >= documentBottom - 4;

    if (isAtPageEnd && !pageEndTriggered) {
      playUnderlineAnimation(titles[titles.length - 1]);
      pageEndTriggered = true;
      return;
    }

    if (!isAtPageEnd) {
      pageEndTriggered = false;
    }
  };

  window.addEventListener("scroll", maybeTriggerLastTitleAtPageEnd, { passive: true });
  window.addEventListener("resize", maybeTriggerLastTitleAtPageEnd);
  maybeTriggerLastTitleAtPageEnd();
})();
