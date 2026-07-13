document.querySelectorAll(".topic__head").forEach((head) => {
  head.addEventListener("click", () => {
    const topic = head.closest(".topic");

    topic.classList.toggle("topic--open");
    topic.classList.toggle("topic--closed");
  });
});

const menuBtn = document.querySelector(".nav__menu-btn");
const mobileMenu = document.querySelector(".mobile-menu");
const closeBtn = document.querySelector(".mobile-menu__close");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.add("mobile-menu--open");
  });
}

if (closeBtn && mobileMenu) {
  closeBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("mobile-menu--open");
  });
}

mobileMenu?.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    mobileMenu.classList.remove("mobile-menu--open");
  }
});

const contactButtons = document.querySelectorAll(
  ".nav__contact-button, .contact-modal-trigger",
);

const contactModal = document.querySelector(".contact-modal");
const contactClose = document.querySelector(".contact-modal__close");

contactButtons.forEach((button) => {
  button.addEventListener("click", () => {
    contactModal?.classList.add("contact-modal--open");
  });
});

contactClose?.addEventListener("click", () => {
  contactModal?.classList.remove("contact-modal--open");
});

contactModal?.addEventListener("click", (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove("contact-modal--open");
  }
});

// Lesson sidebar scroll tracking
const lessonSections = [...document.querySelectorAll(".lesson-section[id]")];
const lessonSidebarLinks = [
  ...document.querySelectorAll(".lesson-sidebar__link[href^='#']"),
];

if (lessonSections.length && lessonSidebarLinks.length) {
  const setActiveLessonLink = (sectionId) => {
    lessonSidebarLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("lesson-sidebar__link--active", isActive);
    });
  };

  const lessonObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleSections[0]) {
        setActiveLessonLink(visibleSections[0].target.id);
      }
    },
    {
      rootMargin: "-18% 0px -62% 0px",
      threshold: [0, 0.15, 0.35, 0.6],
    },
  );

  lessonSections.forEach((section) => lessonObserver.observe(section));
}
