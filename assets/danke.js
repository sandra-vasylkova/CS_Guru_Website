// Password-gated gratitude modal for two teachers, opened from the </>
// icon on the Entdecken page.
//
// The gate password doubles as the AES-GCM decryption key (derived via
// PBKDF2), so there is no plaintext password check and no plaintext
// gratitude text anywhere in this file — only ciphertext. A wrong guess
// simply fails to decrypt.
(() => {
  const PBKDF2_ITERATIONS = 250000;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function b64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }

  async function deriveKey(password, saltB64) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: b64ToBuf(saltB64),
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
  }

  async function tryDecrypt(password, entry) {
    try {
      const key = await deriveKey(password, entry.salt);
      const plainBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64ToBuf(entry.iv) },
        key,
        b64ToBuf(entry.ct),
      );
      return JSON.parse(decoder.decode(plainBuf));
    } catch {
      return null;
    }
  }

  // Each teacher's password has two accepted literal spellings (capitalised
  // and lowercase). Everything else — "HANDA", "hAnDa", a wrong name — fails
  // every decrypt attempt below, so the check stays genuinely case-sensitive.
  const VAULT = {
    cs: [
      {
        salt: "xANxDLy7xxBn4KiZyxbztg==",
        iv: "XSWcwwKRiCohuKaH",
        ct:
          "EzdOd/u4Kl/noBCP4WC3JMFI8cyuZ5mNXm6RPu9fPFG2Gq5KOk3rpR28fg3L6wVlm48STjybtPvGrV9pELPRv98CxB/W2rBnVExyK7sfKOgSRocw18l0426YVJIPfo8IiGShtyKY+NQlxhnL9EurS5lr3/QoAhTLps6GTmkeoFRHBlUva4nQEnxzlEN0TodrALhz4HeqBqwajr86IGLeQBFu7nx+FPoSj9I5fSr/mgaEXBgZOBce5t02xN4QNEc9nzqS8cZF/Dk9Afmiv72KgZutGrGlUW/Us6d7ddOtk54KS71bVWEqiMuwZQKAYAJkRTWzXQqf3HGqV6aUAlZThH/XiK+9htut96ifgVW/2knCYrBDJK1ydrxzRT6RqHoYKx1nyynKMfWVs5/4Gn2hFpRXbqjRcUOtseJ4g8fiwHmuRF1JoKojdLlNF9mq7s/qLQ770jWhWRSNMYPlkTUoo4GcwEYBV7QS6ItjLDrxnUCsKuI3dNWgMozeVPvtrLkSjm2/0D/plJY/cWKJARQz+ekkhRZgxbgl4DAuTIWmEsbUFhq2EsuApW3YU0ruWFz5qkaU1QRZkEG/wo7cWQ5tz+DdsfnEvTVkVtjNm0FoDOQbQ04V5W2pwN8wF4Byb2Nac2AwAmptjCHOuKWtAhFhO3M6UhOjf1khPfUTlNwiYSjpgudvXAefFSyLhgN5++lndDGydytoqoOXSdrS9LQ7YdW8fx0MK0PTszx/kgRjv9IdigefxI3BhSjy3SjRHmk1qVwndGjUuIzOVMamT2tWkuP6xo4z9RYJT+bnIjKQmy0ks7yCtj7/CZFbFN7Qty3+srQ1QzKp6y/Wn4WZN1iDCS2Vn9g29bWdeZ9wDMB/csiEZ3GEvcEOnbIZYRYikzrUxxvmeMBpKCeor1OBrGdlHiZKHs2SYdhubYMAf6yMCv89ye5Rfaa6NIlA6Z+YGO0wRFffXC5PUvSi1RwU58fFABC8fgwhey20nOqoOVrdM1pMuLQRrpWRPkI5wkqUX9TBGLHYgd6lq2Y2NT7bnXOX06d8nR3hKv+lKOQQewxeFNTeh9bHn0RN8ZKyIqtzDSiefiDBSRfIW4TFBfQYSD5J+Zr5pwmuzsaq6pKZ8mo/25QatdNOWt7ltXdEg2olsUXqeaTLgkOhRBnabuPY2zoqR+tLD/GhiB48nuOEya+y6nD6+tya5gf0roJUrRzGbrgrBKUJcjzOO8IFuAlx6psa+M348Se1R+wmPgxqFkEFK7ti6WgMczRPypqlSJ3H2TMYm7uAjP50zzmXBxF6IGzcWVuVtHk0GBigCxzoWa2JWKcXTyKXlp4lAcvv3STWmwrIo3RR9bQ42epCNz2P8HHn0mwVbm2zi6pfEEAGDEq8DWF/cSC1pPb90AqL1X41WhWlq7NGPUOYvpJLxY9Wz7vGG06yZ7OJl+IY5JX64LGk+z8CVka/iUmEv3okWOqI2bOA6RwjEbptL0h5haU74J0unEC47KQ4k1K32qVJpY+5kjiU488bnzfLMHIlr2C+oUpJfK6Klm0APfxcTCwbR+VAfA==",
      },
      {
        salt: "maS9k0XG4EAwnpvbMycq8Q==",
        iv: "fL45HBdxlmtOtzND",
        ct:
          "XJS/LETXa4fhIzny1EnSO/nc9oMpyVUfoXEWjJu3let8rUkmLd8VpJqYAhdECugEIZSRvQFLAcZGl2h/2N5o8mFt95ajPMf+bIjJ9K+Lp3VjrYId+7Yn9GSZsLJSt8urYq33oUTeGFz2DqTrug1HMkMkDHO5uWjtqS8+qP99GGvJxmZpc/UczpGJ4xw73sxs1EJpt3JtTzXCphVtg+O4MFCwHtXfwYs1PBuuWTUkMU+7sVRu2X7tkYEh1QoZA+yMqCsSPoTTlmBmW8CLsurpmo7mNL5O9qbDcBUb4iyEQZGEn81u9ZypDC5o0pNZJHuUR/YTVbcMylx3wjb+5rGeIpsKt50nMAkfRoD1lCMRAW9niN2arVC40UxLMbcnTyyzlPWH1Drp0MeKt/Q0Z9ZgYSrf4BgBQ0nCbSIE6cZW7iWorEenmIVphJ/3KmUtaaxeqq+YjbR24JZRbhcC0OuNXHwIBjagzza9sch8dVsLcBfr8EPyPfZ3mE4hvpLxjx9dcUIgNAso7JrQPOUSvo/0zufpsJioK7EiJH1Ms/tDEZ/WBIwf/AYfcgxRrH7h0LaRlK/2KD+uhMOayrzwuaJotZ6LpB9QVM+QsbB47472XCCIrKnXDwT5HrGAg9xPj+GRk8mFdNLNEY74821K0DASefkSsw6/dCgTtRVLtypfaDGQg+ek0Dmt18OtH0f7USmRi6GTC2R8eQ9cyzRxV1tYRSU5o7jdadVYJ+qwAitqs8EOKcl/OHkYZSkKGQG3+Rdth0suvti9M2+AWKKPJvp2+AJ7iUQ4oYdBVIjZah20g6mEIxdMVfJKX7faiss8TVphrS4UQ1CDkdon1zvPUTRtEpV8srhYwwc18zsgp1p0ANqKwmsTDIn6hXn2mizy0J1HiSLKXgKb2qiBjPtPEkdZ21t9RFwP6tXompU90LV6XnVC416XvuCc+wKHYTbfrRJcze08sTWikM6HZLWRKPoO+xzgFGlRwnOxkDsS1eohT8/ATHndIkgwdtBnJpkvewS1wO7ZCbUgWuk9pfhHuQCVZd5IOljSBqDB09YJ6CE/lW/jsd67Mg6JkzSdOBjM2wqu2i3IGQRoiwMi9O21UD1+ZaE05KqzIQ0+eCrdZ6GpBRBXrhZ9iu9ZABbC698gnTHw/6QaC3fCDVeKZ4KZU2vDisRNyACsD8p7vURrNYuBpEKKki/SqD/XzfMGXii4giWgecLZGtZKmBSEIaC/k0DVS6gIaMaJdwThhBQksvXSP/M/kp2dao8QReOvbwqFetdYaWAaJMutVmC+lM/s+CVHuIktTE7YzL7amg43YOCmgQo2lgtdQU778xFtIklyrOcFJjzt0aOcvX7fOKgR6Hb01LBbC7Q+/6Wgp8l9+z+EvcNBH5gka9V2js02+WKHaz2GWomnAXSV0CR+IaVH6y4huxrDbj3NYRsfTpkwsfQm6IDo32MaxUHTjppktWyCztH6UWVob9/R7MKB6rUQj6sc7LCPcMQmbVYKVNIz/NgKyafFNeZS1tpyy6RXY5KhjhsEIMRoXJgCW/rYloZfIF7JpQ==",
      },
    ],
    math: [
      {
        salt: "M3LnhbjQNicHC3Le9qMrdg==",
        iv: "/PFGf0PeEsVB9EDo",
        ct:
          "yfUkil6N4s1lg8vecwAaUTi+l/cI8r3gEkT3PAMtNd3MzLkrgtHO9yb2hRiyp1+jyaYxxEl2jNGF5s5+VnMnEbFl9HRShXVfmgpyFSNudeVsSxEzXj1IC/1vvbgQNhkDxyH2gIPmxmdRS+fJwjolEVOY1lMfkaOTk+kRAwmVECtCOVGnqdKVgwt8V6atbbA8yBvzfTwaRTaVT2FvTTdpJyZJyHXOQTKAGlFcf7bA10ZZaOc9Yq9DIMtk1EvuchpTqX4Mn9vHWrTH+VtSNrWqo+s+T6cD3YYVRftlk7oSHDi5SJ0zb6d97mp37+FEWtJ2sFTGYX+DETP0eXArfHsqlFyNm8gB/4x3VFfKkY7LA3VOtjT7dVwj64m33+wRxEvGRdvdEzQ=",
      },
      {
        salt: "sjiaGWoCj2g3ukmt9wFitQ==",
        iv: "/tAJ/YG+aBq8k3ss",
        ct:
          "7NG+uNBPulOjBEcXiYdfobjLTFx4jQKeOs6JFbsBXyOoFMlD02QMgtJllOcm0s72Xb3oArwZ71DWeNmvRXB5pod8Wgqx6gzFkhgKh8MfmBYFbF9hK4E8qjoBppgbtLhzah1x7j8otfJV4eWQZvWUIprCro5BTJpcnLvZC/C1DT1mPWxLF8/uXkAeYw6P1JfdGRXdSvXpT7DIDt0/JERr1Es5T8tI8qX0v0aRolrLv4roACb+jYlBs2pkFJ+PqNAvAyQF2m20HrD6fb9paHW0BGmUlfLKHkoCf8w+sDtfV8tFPR2ng6Kx5vE+1ofOZ19/jCKNiQ/SKki4Az/rNwHJWsXVPJg2yo0chVNd2QE3RNfx2gRzMoclkmXXdgfrMX1zYqLOI2A=",
      },
    ],
  };

  async function unlock(password) {
    for (const entry of VAULT.cs) {
      const data = await tryDecrypt(password, entry);
      if (data) return { teacher: "cs", messages: data };
    }
    for (const entry of VAULT.math) {
      const data = await tryDecrypt(password, entry);
      if (data) return { teacher: "math", messages: data };
    }
    return null;
  }

  // ---- DOM wiring -----------------------------------------------------

  const modal = document.getElementById("danke-modal");
  const modalTrigger = document.getElementById("danke-trigger");
  const modalClose = document.getElementById("danke-modal-close");
  const modalBox = document.getElementById("modal-box");

  const gate = document.getElementById("gate");
  const gateForm = document.getElementById("gate-form");
  const gateInput = document.getElementById("gate-input");
  const gateSubmit = document.getElementById("gate-submit");
  const gateError = document.getElementById("gate-error");

  const csContent = document.getElementById("cs-content");
  const csPrompt = document.getElementById("cs-prompt");
  const csTrickBtn = document.getElementById("cs-trick-btn");
  const csTable = document.getElementById("cs-table");
  const csCards = document.getElementById("cs-cards");
  const csReveal = document.getElementById("cs-reveal");
  const csWarning = document.getElementById("cs-warning");

  const mathContent = document.getElementById("math-content");
  const cube = document.getElementById("cube");
  const cubeStage = document.getElementById("cube-stage");

  // ---- Running background text ----------------------------------------
  //
  // Rows of "Not if, but when" drifting behind the question, alternating
  // direction and speed. Each row holds the phrase group twice so the
  // -50% slide loops without a seam. It sits inside #cs-prompt, so it
  // disappears on its own when the trick starts.

  const marquee = document.getElementById("danke-marquee");

  if (marquee) {
    const group = new Array(6).fill("Not if, but when").join(" · ") + " · ";
    let rows = "";
    // More rows than before: the stage is turned and oversized, so it has
    // considerably more height to fill than the panel itself.
    for (let i = 0; i < 14; i++) {
      const seconds = 18 + (i % 7) * 4;
      const alpha = i % 2 ? 0.05 : 0.085;
      rows +=
        `<span class="danke-marquee__row" style="--d:${seconds}s;--o:${alpha}">` +
        `<i>${group}${group}</i></span>`;
    }
    marquee.innerHTML = `<span class="danke-marquee__stage">${rows}</span>`;
  }

  // ---- Modal open/close (mirrors the site's contact-details popup) ----
  //
  // Closing drops everything back to the gate, so the password has to be
  // entered again to get back in — and nothing decrypted is left sitting in
  // the DOM in the meantime.

  // Whatever the unlock produced, held only for as long as the modal is open.
  let csMessages = null;
  // Set by renderCsCards; puts the currently drawn card back.
  let putBackDrawnCard = null;
  let resetTimer = null;

  function resetModal() {
    csMessages = null;
    putBackDrawnCard = null;

    gateInput.value = "";
    gateError.textContent = "";
    gateSubmit.disabled = false;
    gate.classList.remove("is-shaking");
    gate.hidden = false;

    csContent.hidden = true;
    csPrompt.hidden = false;
    csTable.hidden = true;
    csCards.innerHTML = "";
    csReveal.innerHTML = "";
    csWarning.textContent = "";
    csWarning.classList.remove("is-visible");

    mathContent.hidden = true;
    cube.querySelectorAll(".danke-cube__face").forEach((face) => {
      face.innerHTML = "";
    });

    modalBox.classList.remove(
      "danke-modal__box--unlocked",
      "danke-modal__box--table",
    );
  }

  function closeModal() {
    modal?.classList.remove("danke-modal--open");
    // Reset once the fade-out is over, so the gate doesn't visibly snap
    // back into place while the box is still on screen.
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetModal, 260);
  }

  modalTrigger?.addEventListener("click", () => {
    // Reset on the way in too, so a pending close-reset can never fire
    // against a freshly opened modal.
    clearTimeout(resetTimer);
    resetModal();
    modal?.classList.add("danke-modal--open");
    gateInput.focus();
  });

  modalClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Registered once, not per unlock: the modal can now be unlocked any
  // number of times, and a listener added on each pass would render the fan
  // once per unlock.
  csTrickBtn?.addEventListener("click", () => {
    if (!csMessages) return;
    csPrompt.hidden = true;
    csTable.hidden = false;
    // Dim the box right down once the cards are out.
    modalBox.classList.add("danke-modal__box--table");
    renderCsCards(csMessages);
  });

  // Also once. Clicking anywhere in the box outside the pulled-out card puts
  // it back — scoped to the box, not the document, so it doesn't fight the
  // backdrop-click-to-close handler on the modal itself.
  modalBox.addEventListener("click", (e) => {
    if (putBackDrawnCard) putBackDrawnCard(e);
  });

  const CENTER_INDEX = 2;

  // ---- Card faces -----------------------------------------------------
  //
  // Every card gets its own front: a themed art layer behind the message
  // plus a corner index, German ranks (B/D/K). The order matches the fan,
  // so index 2 — the centre card, the one with the red back — is the
  // Herz-Dame. The art never sits on top of the text; the quote is the
  // point of the card.

  // Binärregen für den Karo-König. Feste Bitmuster statt Zufall, damit die
  // Karte bei jedem Ziehen gleich aussieht.
  const RAIN_BITS = [
    "0110100101101001",
    "1001011010010110",
    "0101101001011010",
    "1101001011010010",
    "0010110100110101",
    "1010010110101100",
  ];

  const rainColumns = () =>
    RAIN_BITS.map(
      (bits, i) => `<b style="left:${6 + i * 16}%">${bits.repeat(9)}</b>`,
    ).join("");

  const THEMES = [
    // Kreuz-Bube — Militär: Tarnflecken, Stencil-Streifen, Ordensmedaille.
    { key: "mil", rank: "B", suit: "&#9827;", emblem: "&#9827;" },
    // Joker — Harlekin: Rauten in Türkis und Rot, Narrenkappe.
    {
      key: "jok",
      rank: "JO",
      suit: "&#9733;",
      emblem:
        '<span class="danke-jester"><i></i><i></i><i></i><b></b><b></b><b></b></span>',
    },
    // Herz-Dame — gedimmtes Rot, nur Typografie. Die Karte mit dem roten
    // Rücken.
    {
      key: "qh",
      rank: "D",
      suit: "&#9829;",
      emblem: "",
      art: "",
    },
    // Pik-Bube — Perfektion: die volle Punktzahl, auf guillochiertem Grund.
    {
      key: "sp",
      rank: "B",
      suit: "&#9824;",
      emblem: "60<span>/60</span>",
    },
    // Karo-König — Code: Binärregen, Phosphorgrün, Raute als Pixel.
    {
      key: "kd",
      rank: "K",
      suit: "&#9830;",
      emblem: "",
      art: `<span class="danke-rain">${rainColumns()}</span>`,
    },
  ];

  // Opt-in diagnostic: add ?dankedebug=1 to the URL to print which fields
  // each message carries — field names only, never their content — and
  // whether the clickable word was rendered. Silent otherwise.
  const DEBUG = new URLSearchParams(location.search).has("dankedebug");

  function renderCsCards(messages) {
    // "seen" persists once a card has been drawn at least once (used to
    // unlock the center card). "current" tracks whichever single card is
    // presently pulled out, so it can be put back on an outside click.
    const seen = new Array(messages.length).fill(false);
    let current = null;
    let warningTimer = null;

    // Start from an empty table: renderCsCards can run again after a close.
    csCards.innerHTML = "";
    csReveal.innerHTML = "";

    // Fan geometry: cards pivot from a shared point at the bottom of the
    // stage, spreading out by rotation + a slight outward drop per card.
    const STEP_ROTATE = 9;
    const STEP_X = 64;
    const STEP_Y = 22;

    messages.forEach((msg, index) => {
      const isCenter = index === CENTER_INDEX;
      const offset = index - CENTER_INDEX;

      const slot = document.createElement("div");
      slot.className = "danke-card-slot";
      slot.style.transform = `translateX(${offset * STEP_X}px) translateY(${Math.abs(offset) * STEP_Y}px) rotate(${offset * STEP_ROTATE}deg)`;

      const theme = THEMES[index] || THEMES[0];

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "danke-card danke-card--" +
        theme.key +
        (isCenter ? " danke-card--center" : "");
      card.setAttribute(
        "aria-label",
        isCenter ? "Mittlere Karte ziehen" : "Karte ziehen",
      );

      // The word is only made clickable when there is actually a
      // continuation to reveal — otherwise clicking it would strip the
      // link and add nothing, which just reads as "nothing happened".
      // A message may name its own word; "mehr" is the fallback.
      const moreWord = msg.moreText ? msg.interactiveWord || "mehr" : "";

      // The continuation is rendered up front and merely hidden, rather
      // than being written in on click. Overwriting the paragraph would
      // destroy the link for good, so it could only ever work once per
      // card — after that the card was inert.
      // "mehr" and its trailing "…" are one single span, not two, so the
      // whole thing is one unambiguous hit target — no gap between a
      // clickable word and a separate, non-clickable ellipsis next to it.
      const textHtml = moreWord
        ? `${msg.text} ` +
          `<span class="danke-card__more">${moreWord}…</span>` +
          `<span class="danke-card__rest"> ${msg.moreText}</span>`
        : msg.text;

      const index2 = `${theme.rank}<i>${theme.suit}</i>`;

      card.innerHTML = `
        <span class="danke-card__flip">
          <span class="danke-card__face danke-card__face--back">
            <span class="danke-card__pips"><i></i><i></i><i></i><i></i></span>
            <img src="/assets/favicon-96x96.png" alt="" class="danke-card__logo" />
          </span>
          <span class="danke-card__face danke-card__face--front">
            <span class="danke-card__art">${theme.art || ""}</span>
            <span class="danke-card__ix">${index2}</span>
            <span class="danke-card__ix danke-card__ix--br">${index2}</span>
            <span class="danke-card__emblem">${theme.emblem}</span>
            <em class="danke-card__connector">${msg.connector}</em>
            <p class="danke-card__text">${textHtml}</p>
            <small class="danke-card__attribution">${msg.attribution}</small>
          </span>
        </span>
      `;

      if (DEBUG) {
        console.log(
          `[danke] Karte ${index + 1} — Felder: ${Object.keys(msg).join(", ")}` +
            ` | klickbares Wort gerendert: ${!!card.querySelector(".danke-card__more")}`,
        );
      }

      // Expanding the message replaces the paragraph's contents, which
      // would throw away a listener bound straight to the word. Delegating
      // from the card keeps it working however the text is rebuilt.
      // Purely a class flip: nothing is removed, so it stays correct
      // however often the card is drawn, put back and drawn again.
      const expand = () => {
        card.classList.add("danke-card--expanded");
      };

      card.addEventListener("click", (e) => {
        e.stopPropagation();

        // Once the card is out, a click anywhere on it reveals the rest —
        // the whole card is the target, not just the word. Landing a click
        // on a small inline span inside a mirrored, 3D-transformed face is
        // fiddly at the best of times, and a click on an already-drawn card
        // had nothing else to do anyway. "mehr" stays as the visual cue for
        // where the extra text is coming from.
        if (card.classList.contains("is-drawn")) {
          if (moreWord && !card.classList.contains("danke-card--expanded")) {
            expand();
          }
          return;
        }

        if (isCenter) {
          const allOthersSeen = seen.every((v, i) => i === CENTER_INDEX || v);
          if (!allOthersSeen) {
            csWarning.textContent =
              "Bitte ziehen Sie zunächst alle anderen Karten heraus.";
            csWarning.classList.add("is-visible");
            clearTimeout(warningTimer);
            warningTimer = setTimeout(
              () => csWarning.classList.remove("is-visible"),
              2600,
            );
            return;
          }
        }

        seen[index] = true;

        if (current) {
          const prev = current;
          current = { card, slot };
          retractCard(prev.card, prev.slot, () => drawCard(card, slot));
        } else {
          current = { card, slot };
          drawCard(card, slot);
        }
      });

      slot.appendChild(card);
      csCards.appendChild(slot);
    });

    // Handed to the box's single click listener rather than adding one here.
    putBackDrawnCard = (e) => {
      if (!current) return;
      if (current.card.contains(e.target)) return;
      if (!current.card.classList.contains("is-drawn")) return;
      const { card, slot } = current;
      current = null;
      retractCard(card, slot);
    };
  }

  // Runs `cb` once, after either the element's own transitionend fires or
  // `fallbackMs` elapses — whichever comes first. The fallback matters
  // because a backgrounded/occluded tab can pause running transitions
  // indefinitely, which would otherwise leave a card stuck mid-animation.
  function afterTransition(el, fallbackMs, cb) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      clearTimeout(timer);
      cb();
    };
    const onEnd = (e) => {
      if (e.target !== el) return;
      finish();
    };
    el.addEventListener("transitionend", onEnd);
    const timer = setTimeout(finish, fallbackMs);
  }

  // Like requestAnimationFrame, but guaranteed to eventually run even if
  // the tab is backgrounded/occluded and rAF is paused indefinitely — a
  // setTimeout fallback picks it up instead. Without this, a card's FLIP
  // "start" transform (set with transition:none, meant to be cleared one
  // frame later) can get stuck forever: the card ends up rendered at its
  // old tiny size/position even though its classes say it's fully drawn,
  // so later clicks on it (e.g. the "mehr" word) land on nothing.
  function nextFrame(cb) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cb();
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 100);
  }

  // Pulls a card out of the fan and animates it into the reveal stage,
  // bigger and glowing, using the FLIP technique so the motion stays
  // smooth regardless of the fan's own rotation.
  function drawCard(card, slot) {
    const startRect = card.getBoundingClientRect();

    card.classList.add("is-drawn", "is-glowing");
    csReveal.appendChild(card);

    const endRect = card.getBoundingClientRect();
    const dx =
      startRect.left + startRect.width / 2 - (endRect.left + endRect.width / 2);
    const dy =
      startRect.top + startRect.height / 2 - (endRect.top + endRect.height / 2);
    const scaleX = startRect.width / endRect.width;
    const scaleY = startRect.height / endRect.height;

    card.style.transition = "none";
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scaleX}, ${scaleY})`;
    card.getBoundingClientRect();

    nextFrame(() => {
      card.style.transition =
        "transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)";
      card.style.transform = "";
    });

    afterTransition(card, 850, () => {
      // Belt and suspenders: whatever happened above, land the card in
      // its correct final spot so it's never left stuck mid-animation.
      card.style.transition = "";
      card.style.transform = "";
      card.classList.add("is-flipped");
    });
  }

  // Reverses drawCard: flips the card face-down, then shrinks and slides
  // it back into its fan slot, using the same FLIP technique.
  function retractCard(card, slot, onDone) {
    card.classList.remove("is-flipped", "is-glowing");

    const flipEl = card.querySelector(".danke-card__flip");
    afterTransition(flipEl, 650, () => moveCardBack(card, slot, onDone));
  }

  function moveCardBack(card, slot, onDone) {
    const startRect = card.getBoundingClientRect();

    card.classList.remove("is-drawn");
    slot.appendChild(card);

    const endRect = card.getBoundingClientRect();
    const dx =
      startRect.left + startRect.width / 2 - (endRect.left + endRect.width / 2);
    const dy =
      startRect.top + startRect.height / 2 - (endRect.top + endRect.height / 2);
    const scaleX = startRect.width / endRect.width;
    const scaleY = startRect.height / endRect.height;

    card.style.transition = "none";
    card.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    card.getBoundingClientRect();

    nextFrame(() => {
      card.style.transition = "transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)";
      card.style.transform = "";
    });

    afterTransition(card, 750, () => {
      card.style.transition = "";
      card.style.transform = "";
      if (onDone) onDone();
    });
  }

  // Nine placeholder glyphs per face — the tiles are decoration, the real
  // words come out of the vault. The bottom face runs Fibonacci, as
  // something to find while turning the cube over.
  const CUBE_TILES = {
    front: ["π", "√", "∑", "∫", "∞", "φ", "θ", "≈", "Δ"],
    back: ["χ", "ψ", "ω", "ρ", "τ", "κ", "η", "ζ", "ξ"],
    right: ["θ", "Δ", "e", "i", "λ", "∞", "σ", "μ", "Ω"],
    left: ["√", "∫", "∂", "≤", "≠", "≥", "∈", "∑", "≅"],
    top: ["σ", "μ", "Ω", "∂", "∇", "α", "β", "γ", "δ"],
    bottom: ["1", "2", "3", "5", "8", "13", "21", "34", "55"],
  };

  // Which of the nine are filled in the face's own colour.
  const CUBE_LIT = {
    front: [0, 2, 6, 8],
    back: [1, 2, 3, 7],
    right: [1, 4, 8],
    left: [0, 4, 5, 7],
    top: [0, 1, 4, 5, 6],
    bottom: [1, 3, 5, 7],
  };

  // With a message the middle row is given over to it, so only the six
  // outer tiles are drawn; without one, all nine.
  function cubeFaceHtml(face, hasMessage) {
    const glyphs = CUBE_TILES[face];
    const lit = CUBE_LIT[face];
    const tile = (i) =>
      `<i class="danke-cube__tile${lit.includes(i) ? " danke-cube__tile--on" : ""}">` +
      `${glyphs[i]}</i>`;
    if (!hasMessage) return glyphs.map((_, i) => tile(i)).join("");
    return (
      [0, 1, 2].map(tile).join("") +
      `<p class="danke-cube__text"></p>` +
      [6, 7, 8].map(tile).join("")
    );
  }

  // [formula, left%, top%, font-size px, rotation, dim]
  const FORMULAS = [
    ["e<sup>iπ</sup> + 1 = 0", 5, 14, 30, -7, false],
    ["∑<sub>n=1</sub><sup>∞</sup> 1/n² = π²/6", 64, 9, 22, 5, true],
    ["φ = (1+√5)/2", 76, 30, 26, -4, false],
    ["a² + b² = c²", 3, 40, 19, 3, true],
    ["∫<sub>0</sub><sup>∞</sup> e<sup>−x²</sup> dx = √π/2", 11, 62, 24, -5, false],
    ["lim (1 + 1/n)<sup>n</sup> = e", 70, 58, 28, 6, true],
    ["d/dx sin x = cos x", 44, 6, 18, 2, false],
    ["n! = n · (n−1)!", 26, 87, 21, -3, true],
    ["cos²x + sin²x = 1", 58, 84, 23, 4, false],
    ["π ≈ 3,14159", 88, 72, 17, -6, true],
  ];

  function renderCube(messages) {
    const formulas = document.getElementById("danke-formulas");
    if (formulas && !formulas.childElementCount) {
      formulas.innerHTML = FORMULAS.map(
        ([tex, left, top, size, rot, dim]) =>
          `<span class="${dim ? "is-dim" : ""}" style="left:${left}%;top:${top}%;` +
          `font-size:${size}px;rotate:${rot}deg">${tex}</span>`,
      ).join("");
    }

    const order = ["front", "back", "right", "left", "top", "bottom"];
    order.forEach((face, i) => {
      const faceEl = cube.querySelector(`.danke-cube__face--${face}`);
      if (!faceEl) return;
      const message = messages[i] ?? "";
      faceEl.innerHTML = cubeFaceHtml(face, !!message);
      // Structure via innerHTML, the message itself as text — the vault's
      // wording is never treated as markup.
      const textEl = faceEl.querySelector(".danke-cube__text");
      if (textEl) textEl.textContent = message;
    });

    // Back to the default three-quarter view each time it is opened.
    cubeRotX = -20;
    cubeRotY = -30;
    applyCubeRotation();
    wireCube();
  }

  // Rotation state lives out here so the drag handlers can be attached once
  // and still drive whatever the current cube is. Wiring them per render
  // would stack up a fresh set of handlers — and a fresh spin interval —
  // on every unlock.
  let cubeWired = false;
  let cubeDragging = false;
  let cubeRotX = -20;
  let cubeRotY = -30;

  function applyCubeRotation() {
    cube.style.transform = `rotateX(${cubeRotX}deg) rotateY(${cubeRotY}deg)`;
  }

  function wireCube() {
    if (cubeWired) return;
    cubeWired = true;

    let lastX = 0;
    let lastY = 0;

    cubeStage.addEventListener("pointerdown", (e) => {
      cubeDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      cube.classList.add("is-dragging");
      cubeStage.setPointerCapture(e.pointerId);
    });

    cubeStage.addEventListener("pointermove", (e) => {
      if (!cubeDragging) return;
      cubeRotY += (e.clientX - lastX) * 0.4;
      cubeRotX -= (e.clientY - lastY) * 0.4;
      lastX = e.clientX;
      lastY = e.clientY;
      applyCubeRotation();
    });

    const stopDrag = () => {
      cubeDragging = false;
      cube.classList.remove("is-dragging");
    };
    cubeStage.addEventListener("pointerup", stopDrag);
    cubeStage.addEventListener("pointercancel", stopDrag);

    // Idle drift, but only while the cube is actually on screen.
    setInterval(() => {
      if (cubeDragging || mathContent.hidden) return;
      cubeRotY += 0.15;
      applyCubeRotation();
    }, 30);
  }

  gateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = gateInput.value.trim();
    if (!password) return;

    gateSubmit.disabled = true;
    gateError.textContent = "";

    const result = await unlock(password);

    gateSubmit.disabled = false;

    if (!result) {
      gateError.textContent =
        "Das ist nichts für deine Augen, du kleiner Rabauke!";
      gateInput.value = "";
      gateInput.focus();
      gate.classList.remove("is-shaking");
      void gate.offsetWidth;
      gate.classList.add("is-shaking");
      return;
    }

    gate.hidden = true;
    gateInput.value = "";
    modalBox.classList.add("danke-modal__box--unlocked");

    if (result.teacher === "cs") {
      // Picked up by the trick button's one permanent listener.
      csMessages = result.messages;
      csContent.hidden = false;
    } else {
      mathContent.hidden = false;
      renderCube(result.messages);
    }
  });
})();
