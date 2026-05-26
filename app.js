document.querySelectorAll(".topic__head").forEach((head) => {
  head.addEventListener("click", () => {
    const topic = head.closest(".topic");

    topic.classList.toggle("topic--open");
    topic.classList.toggle("topic--closed");
  });
});

const navToggle = document.querySelector(".nav__menu-btn");
const navClose = document.querySelector(".mobile-menu__close");
const mobileMenu = document.querySelector(".mobile-menu");

if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", () => {
    mobileMenu.classList.add("mobile-menu--open");
  });
}

if (navClose && mobileMenu) {
  navClose.addEventListener("click", () => {
    mobileMenu.classList.remove("mobile-menu--open");
  });
}

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu?.classList.remove("mobile-menu--open");
  });
});

const contactModal = document.querySelector(".contact-modal");
const contactButtons = document.querySelectorAll(
  ".nav__contact-button, .mobile-menu__contact",
);
const contactCloseButtons = document.querySelectorAll(
  ".contact-modal__close, .contact-modal__button",
);

contactButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    mobileMenu?.classList.remove("mobile-menu--open");
    contactModal?.classList.add("contact-modal--open");
  });
});

contactCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    contactModal?.classList.remove("contact-modal--open");
  });
});

if (contactModal) {
  contactModal.addEventListener("click", (event) => {
    if (event.target === contactModal) {
      contactModal.classList.remove("contact-modal--open");
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  mobileMenu?.classList.remove("mobile-menu--open");
  contactModal?.classList.remove("contact-modal--open");
});
