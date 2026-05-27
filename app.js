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
