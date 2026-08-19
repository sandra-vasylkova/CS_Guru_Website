// Password-gated gratitude modal, opened from the </> icon on Entdecken.
// The password is also the AES-GCM key (via PBKDF2), so this file holds no
// plaintext password and no plaintext text — a wrong guess just fails to
// decrypt.
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

  // Two literal spellings per teacher, capitalised and lowercase. Anything
  // else fails every decrypt, so the check stays case-sensitive.
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
        salt: "kMeblPjVRSyYHFpUuvMdoA==",
        iv: "dY0YiBUj4p0uhxPU",
        ct:
          "oRSCtm2iaFPP9CiuU98+YsGtML++ghpiMDin1vKJ3CKGxcW7fttrLIZQUg4T/mIUxk74No6UbaDvqyylsY1jfJjMX00E2VSY1p+0OieA9AMlUKsRY1DEsQVr8gYcCf1UHG0kbHeWrhfzIxA7KSishf/UsQn90KgmMMsn48kqdCEp6DSb5oeb/4nQgNHYCKBedw9XvOtjOEHVrG7ykpP4aOv2s14iDZ4uLF46r4vYyA5d33757khtRaCmtJD0bxqiQfT9qCeSJNpsEdTYxPxPSJxmlX9YkzbhYwgIAsOvoxo6Ihu8scfJKmV8xJJ10+bOUwj4veFYhZdbafAe8iVrEVDY1yTibokqXdPxIYm0FJ3RVQgJVch+JG1L4s5cXcsW2YeIEqDeq0W2xJzx+Nzl/J0PpZkiJcdKoz1X+WHBYjf0yRIAvOM645P7bbMBABfYOJvLiOQp9OCTFeiLd/glwbyWWyFVUVizidrcDUURa8+YPxbsMGc14Tckxbqqv63lhtfgHyd9bTwlGTbWjj5kNz6fmL6NJ7uwPhMb5HQro9ZXROO3yDMJ7RZYcvWTb48x8WomrIwyCOB0Sb5o9hmii4yiGhwSrqypiehC1j84zwDTJltNClVyKAclMjtYfSjF6CAPLN6fYIAKe2vOYbSGdY9wiVC8Z8N7shu+Qt9i7jGQuyDJ3064P4C7/UfidnKH8ODYCMjNwWff9DdZ7RgqoWwvCtonxQkC6iVGWSa/KcjqH5KexKH38GtPnPqKW6JbJHrbXdz2+R3n3E/FJ58OFsavlif0UC+kQgXWhG42aJQOgi0kR6hmvRJyK/nfJBFbb++ItBAAtlx28qhiw7MN6XDIjm7KbDwuexXBcnVf2sSZOI+0km5VVfjCm0QHae3O5pscKLZAihZSDAfz4qMlyBZrBZ1mGtJEZoEPwr1ptnI6JzS6mdbKNOYsOVWWjhyMVTnjNQNsS/29QBX8GdncLVk=",
      },
      {
        salt: "CUnsPa3EjAG8pl6Y/BugPg==",
        iv: "k5GLoRqu+Ke69nsW",
        ct:
          "NKoMktYapV868HW3a/56Mxphyi9529i6hbxmo+bbo7upokJp3QOtHU8mgagSpKdZd26N4Ksw0cR5K2u7agLpBjQU20lSP8O5gQtNlKQlSsQKhxNUapUwLp7964i/V4+PqZr9LzVdP6kTbBOXTL+cFRSfsPyQ+J9Y9sXGdET24nze9ZTel+v58S5sAj4A1GlRmVmesqQQ4EHiXjARf2wF+LQ4gLMbeX09SdUdFEDLiOIANeCPTQqDXbP2CpnArz2v9zYPdOWSA5bE3yyed6jRIPiSTbIcVAvtYIE7LcbAGjMTxobL4hhiTx9ZGpQiTGCBZW5a/j+1Sq7dkrPTOVtOtwau5PEsbp4T6ALNFjx5pmSke4mnd2hQphUW/Y82s3SvcBxWQWatUxO4W6ZJAXHcPGRCm018WxL0tOm3nTkVTxPb1Ji95qnfNHuKuhzISCfHuKxo67579BBD0FsADfV5Toyyos1mHsD5TXdYVwAUJ19rsIwq2AQpnjnQoD+Ghodem91uHYoAbEoP3bk0xoqcQx9OJUOIhCUXgPN6T6I6pxM7EElCDWp1vF3VC967PK1KVEDYsxXeHc0/M1kCq10MkpnBkId5i0FqUp4AqsZgXPatLya+u6ZSf+OOIDrF3y9FH/zcu8a/0VDYWlTMDGQb+sLtj2iH4p4WBT2xyMFNEFTDESaPDNWaywvDN/hqtqKP4NJVMaRX/RcCDs86UPe9ktbj5hSiAmSzNc+qo5CGd8CtesbRTKKo9eTIPlAnhxwvZb2yiz8CE0CZiiLpJWEtGOePFjll/wkC3svDJ1RZ1mFKp0QyzXiYcMTNYGRRs0OpA/4g4hkPugJhnxufurmDlPYCPoeqmjz9lzAhh6nY1gZNEPr4TksyKYIljKR/69/ILU1p2INpTG5cnPZ4sY7fv52T8Q8++I1mzjq+0lai3YPuv8QM4nusM8Z9f0wnA4UkAMPo9LBNa2scJK/FzDVofQU=",
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

  // ---- DOM wiring ----

  const modal = document.getElementById("encrypted-modal");
  const modalTrigger = document.getElementById("encrypted-trigger");
  const modalClose = document.getElementById("encrypted-modal-close");
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

  // ---- Running background text ----
  // Each row holds the phrase group twice, so the -50% slide has no seam.
  // Lives in #cs-prompt, so hiding the prompt removes it.

  const marquee = document.getElementById("encrypted-marquee");

  if (marquee) {
    const group = new Array(6).fill("Not if, but when").join(" · ") + " · ";
    let rows = "";
    for (let i = 0; i < 14; i++) {
      const seconds = 18 + (i % 7) * 4;
      const alpha = i % 2 ? 0.05 : 0.085;
      rows +=
        `<span class="encrypted-marquee__row" style="--d:${seconds}s;--o:${alpha}">` +
        `<i>${group}${group}</i></span>`;
    }
    marquee.innerHTML = `<span class="encrypted-marquee__stage">${rows}</span>`;
  }

  // ---- Modal open/close ----
  // Closing resets to the gate: the password is needed again, and nothing
  // decrypted is left in the DOM.

  // Held only while the modal is open.
  let csMessages = null;
  // Set by renderCsCards; puts the drawn card back.
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
    cube.querySelectorAll(".encrypted-cube__face").forEach((face) => {
      face.innerHTML = "";
    });

    modalBox.classList.remove(
      "encrypted-modal__box--unlocked",
      "encrypted-modal__box--table",
    );
  }

  function closeModal() {
    modal?.classList.remove("encrypted-modal--open");
    // After the fade, so the gate doesn't snap back on screen.
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetModal, 260);
  }

  modalTrigger?.addEventListener("click", () => {
    // Also on the way in, so a pending close-reset can't hit an open modal.
    clearTimeout(resetTimer);
    resetModal();
    modal?.classList.add("encrypted-modal--open");
    gateInput.focus();
  });

  modalClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Registered once: unlocking can happen repeatedly, and a listener per
  // unlock would render the fan once per unlock.
  csTrickBtn?.addEventListener("click", () => {
    if (!csMessages) return;
    csPrompt.hidden = true;
    csTable.hidden = false;
    modalBox.classList.add("encrypted-modal__box--table");
    renderCsCards(csMessages);
  });

  // Also once. Scoped to the box, not the document, so it doesn't fight the
  // backdrop-click-to-close handler.
  modalBox.addEventListener("click", (e) => {
    if (putBackDrawnCard) putBackDrawnCard(e);
  });

  const CENTER_INDEX = 2;

  // ---- Card faces ----
  // Order matches the fan, so index 2 is the centre card (red back).

  // Fixed bit patterns, so the card looks the same on every draw.
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

  // Herz-Dame pattern: strict geometric primitives — squares, rhombi,
  // triangles, hexagons, circles, rings, bars and crosses. Scattered, not
  // tiled: sizes, angles and tints all vary, clusters overlap, and several
  // run off the edge. Alpha is kept high enough to read as red — thin red
  // over a pale ground turns pink.
  //
  // [type, x, y, w, h, rotation, alpha] in a 100 x 161 viewBox.
  const QH_SHAPES = [
    ["triangle", 9, 13, 21, 19, -23, 0.34],
    ["square", 24, 7, 13, 13, 37, 0.26],
    ["bar", 41, 14, 26, 5, -61, 0.22],
    ["ring", 6, 31, 17, 17, 0, 0.3],
    ["circle", 31, 24, 11, 11, 0, 0.19],
    ["hexagon", 47, 6, 14, 14, 13, 0.28],
    ["square", 18, 39, 9, 9, 45, 0.35],
    ["cross", 62, 11, 15, 15, 29, 0.24],
    ["triangle", 78, 5, 17, 17, 143, 0.31],
    ["bar", 91, 19, 23, 4, 71, 0.21],
    ["circle", 71, 27, 8, 8, 0, 0.36],
    ["ring", 95, 41, 13, 13, 0, 0.25],
    ["square", 84, 36, 14, 14, 12, 0.2],
    ["triangle", 3, 52, 13, 13, 87, 0.27],
    ["bar", 14, 61, 18, 3, -34, 0.23],
    ["circle", 99, 58, 9, 9, 0, 0.22],
    ["square", 2, 73, 11, 11, 45, 0.18],
    ["hexagon", 97, 76, 12, 12, 41, 0.26],
    ["bar", 6, 92, 15, 4, 62, 0.19],
    ["circle", 93, 99, 6, 6, 0, 0.29],
    ["triangle", 4, 106, 16, 16, -47, 0.33],
    ["ring", 88, 112, 15, 15, 0, 0.27],
    ["square", 17, 118, 15, 15, 23, 0.3],
    ["cross", 31, 129, 13, 13, 54, 0.25],
    ["bar", 47, 121, 28, 5, 17, 0.21],
    ["circle", 8, 136, 12, 12, 0, 0.24],
    ["triangle", 66, 132, 19, 19, 118, 0.32],
    ["hexagon", 84, 137, 13, 13, 7, 0.23],
    ["square", 26, 148, 10, 10, 45, 0.28],
    ["bar", 55, 150, 21, 4, -26, 0.2],
    ["ring", 45, 158, 14, 14, 0, 0.22],
    ["circle", 76, 156, 8, 8, 0, 0.26],
    ["square", 96, 152, 12, 12, 33, 0.19],
    ["triangle", 38, 46, 8, 8, 66, 0.16],
    ["circle", 60, 52, 5, 5, 0, 0.17],
    ["bar", 70, 96, 12, 3, -52, 0.14],
    ["square", 33, 88, 7, 7, 45, 0.13],
    ["circle", 55, 108, 6, 6, 0, 0.15],
  ];

  function qhShape([type, x, y, w, h, rot, a]) {
    const fill = `rgba(214, 74, 74, ${a})`;
    const turn = rot ? ` transform="rotate(${rot} ${x} ${y})"` : "";
    const hw = w / 2;
    const hh = h / 2;
    const poly = (pts) =>
      `<polygon points="${pts}" fill="${fill}"${turn}/>`;

    if (type === "circle") {
      return `<circle cx="${x}" cy="${y}" r="${hw}" fill="${fill}"/>`;
    }
    if (type === "square" || type === "bar") {
      // square at rotation 45 is the rhombus; bar is simply a long, thin one
      return (
        `<rect x="${x - hw}" y="${y - hh}" width="${w}" height="${h}"` +
        ` fill="${fill}"${turn}/>`
      );
    }
    if (type === "triangle") {
      return poly(
        `${x},${y - hh} ${x + hw},${y + hh} ${x - hw},${y + hh}`,
      );
    }
    if (type === "hexagon") {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const t = (Math.PI / 3) * i - Math.PI / 2;
        pts.push(
          `${(x + hw * Math.cos(t)).toFixed(2)},${(y + hh * Math.sin(t)).toFixed(2)}`,
        );
      }
      return poly(pts.join(" "));
    }
    if (type === "cross") {
      const t = hw * 0.34;
      return poly(
        `${x - t},${y - hh} ${x + t},${y - hh} ${x + t},${y - t} ` +
          `${x + hw},${y - t} ${x + hw},${y + t} ${x + t},${y + t} ` +
          `${x + t},${y + hh} ${x - t},${y + hh} ${x - t},${y + t} ` +
          `${x - hw},${y + t} ${x - hw},${y - t} ${x - t},${y - t}`,
      );
    }
    // ring: filled annulus, so there is no hairline stroke
    const ri = hw * 0.58;
    return (
      `<path d="M${x - hw},${y} A${hw},${hw} 0 1 0 ${x + hw},${y}` +
      ` A${hw},${hw} 0 1 0 ${x - hw},${y} Z` +
      ` M${x - ri},${y} A${ri},${ri} 0 1 1 ${x + ri},${y}` +
      ` A${ri},${ri} 0 1 1 ${x - ri},${y} Z"` +
      ` fill="${fill}" fill-rule="evenodd"/>`
    );
  }

  function qhPattern() {
    return (
      `<svg class="quote-card__pattern" viewBox="0 0 100 161"` +
      ` preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
      `${QH_SHAPES.map(qhShape).join("")}</svg>`
    );
  }

  const THEMES = [
    // Kreuz-Bube — Militär
    { key: "mil", rank: "B", suit: "&#9827;", emblem: "&#9827;" },
    // Joker — Harlekin
    {
      key: "jok",
      rank: "JO",
      suit: "&#9733;",
      emblem:
        '<span class="encrypted-jester"><i></i><i></i><i></i><b></b><b></b><b></b></span>',
    },
    // Herz-Dame — beige, rotes Muster
    {
      key: "qh",
      rank: "D",
      suit: "&#9829;",
      emblem: "",
      art: qhPattern(),
    },
    // Pik-Bube — Perfektion
    {
      key: "sp",
      rank: "B",
      suit: "&#9824;",
      emblem: "60<span>/60</span>",
    },
    // Karo-König — Code
    {
      key: "kd",
      rank: "K",
      suit: "&#9830;",
      emblem: "",
      art: `<span class="encrypted-rain">${rainColumns()}</span>`,
    },
  ];

  // ?encrypteddebug=1 logs which fields each message carries — names only.
  const DEBUG = new URLSearchParams(location.search).has("encrypteddebug");

  function renderCsCards(messages) {
    // "seen" gates the centre card until the others have been drawn; "current"
    // is whichever card is presently pulled out.
    const seen = new Array(messages.length).fill(false);
    let current = null;
    let warningTimer = null;

    // renderCsCards can run again after a close.
    csCards.innerHTML = "";
    csReveal.innerHTML = "";

    // Cards pivot from a shared point, spreading by rotation and offset.
    const STEP_ROTATE = 9;
    const STEP_X = 64;
    const STEP_Y = 22;

    messages.forEach((msg, index) => {
      const isCenter = index === CENTER_INDEX;
      const offset = index - CENTER_INDEX;

      const slot = document.createElement("div");
      slot.className = "quote-card-slot";
      slot.style.transform = `translateX(${offset * STEP_X}px) translateY(${Math.abs(offset) * STEP_Y}px) rotate(${offset * STEP_ROTATE}deg)`;

      const theme = THEMES[index] || THEMES[0];

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "quote-card quote-card--" +
        theme.key +
        (isCenter ? " quote-card--center" : "");
      card.setAttribute(
        "aria-label",
        isCenter ? "Mittlere Karte ziehen" : "Karte ziehen",
      );

      // Only clickable when there is a continuation; otherwise the click would
      // strip the link and add nothing.
      const moreWord = msg.moreText ? msg.interactiveWord || "mehr" : "";

      // Continuation is rendered hidden rather than written in on click:
      // overwriting the paragraph destroyed the link, so it worked only once.
      const textHtml = moreWord
        ? `${msg.text} ` +
          `<span class="quote-card__more">${moreWord}…</span>` +
          `<span class="quote-card__rest"> ${msg.moreText}</span>`
        : msg.text;

      const index2 = `${theme.rank}<i>${theme.suit}</i>`;

      card.innerHTML = `
        <span class="quote-card__flip">
          <span class="quote-card__face quote-card__face--back">
            <span class="quote-card__pips"><i></i><i></i><i></i><i></i></span>
            <img src="/assets/favicon-96x96.png" alt="" class="quote-card__logo" />
          </span>
          <span class="quote-card__face quote-card__face--front">
            <span class="quote-card__art">${theme.art || ""}</span>
            <span class="quote-card__ix">${index2}</span>
            <span class="quote-card__ix quote-card__ix--br">${index2}</span>
            <span class="quote-card__emblem">${theme.emblem}</span>
            <em class="quote-card__connector">${msg.connector}</em>
            <p class="quote-card__text">${textHtml}</p>
            <small class="quote-card__attribution">${msg.attribution}</small>
          </span>
        </span>
      `;

      if (DEBUG) {
        console.log(
          `[encrypted] Karte ${index + 1} — Felder: ${Object.keys(msg).join(", ")}` +
            ` | klickbares Wort gerendert: ${!!card.querySelector(".quote-card__more")}`,
        );
      }

      // Class flip only, so repeated draws stay correct.
      const expand = () => {
        card.classList.add("quote-card--expanded");
      };

      card.addEventListener("click", (e) => {
        e.stopPropagation();

        // A drawn card reveals the rest on a click anywhere on it — hitting the
        // inline span inside a mirrored 3D face is unreliable.
        if (card.classList.contains("is-drawn")) {
          if (moreWord && !card.classList.contains("quote-card--expanded")) {
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

    // Handed to the box's single click listener.
    putBackDrawnCard = (e) => {
      if (!current) return;
      if (current.card.contains(e.target)) return;
      if (!current.card.classList.contains("is-drawn")) return;
      const { card, slot } = current;
      current = null;
      retractCard(card, slot);
    };
  }

  // Runs `cb` on transitionend or after `fallbackMs`, whichever is first.
  // An occluded tab can pause transitions indefinitely.
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

  // rAF with a setTimeout fallback: in an occluded tab rAF can pause, which
  // leaves a card's FLIP start transform uncleared — rendered at its old
  // size while its classes say otherwise, so clicks land nowhere.
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

  // Pulls a card into the reveal stage (FLIP, so the fan's rotation is fine).
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
      // Land it in its final spot whatever happened above.
      card.style.transition = "";
      card.style.transform = "";
      card.classList.add("is-flipped");
    });
  }

  // Reverses drawCard: flip face-down, then FLIP back into the slot.
  function retractCard(card, slot, onDone) {
    card.classList.remove("is-flipped", "is-glowing");

    const flipEl = card.querySelector(".quote-card__flip");
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

  // Placeholder glyphs; the words come from the vault. Bottom is Fibonacci.
  const CUBE_TILES = {
    front: ["π", "√", "∑", "∫", "∞", "φ", "θ", "≈", "Δ"],
    back: ["χ", "ψ", "ω", "ρ", "τ", "κ", "η", "ζ", "ξ"],
    right: ["θ", "Δ", "e", "i", "λ", "∞", "σ", "μ", "Ω"],
    left: ["√", "∫", "∂", "≤", "≠", "≥", "∈", "∑", "≅"],
    top: ["σ", "μ", "Ω", "∂", "∇", "α", "β", "γ", "δ"],
    bottom: ["1", "2", "3", "5", "8", "13", "21", "34", "55"],
  };

  // Which tiles carry the face's colour.
  const CUBE_LIT = {
    front: [0, 2, 6, 8],
    back: [1, 2, 3, 7],
    right: [1, 4, 8],
    left: [0, 4, 5, 7],
    top: [0, 1, 4, 5, 6],
    bottom: [1, 3, 5, 7],
  };

  // A message takes the middle row, leaving the six outer tiles.
  function cubeFaceHtml(face, hasMessage) {
    const glyphs = CUBE_TILES[face];
    const lit = CUBE_LIT[face];
    const tile = (i) =>
      `<i class="encrypted-cube__tile${lit.includes(i) ? " encrypted-cube__tile--on" : ""}">` +
      `${glyphs[i]}</i>`;
    if (!hasMessage) return glyphs.map((_, i) => tile(i)).join("");
    return (
      [0, 1, 2].map(tile).join("") +
      `<p class="encrypted-cube__text"></p>` +
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
    const formulas = document.getElementById("encrypted-formulas");
    if (formulas && !formulas.childElementCount) {
      formulas.innerHTML = FORMULAS.map(
        ([tex, left, top, size, rot, dim]) =>
          `<span class="${dim ? "is-dim" : ""}" style="left:${left}%;top:${top}%;` +
          `font-size:${size}px;rotate:${rot}deg">${tex}</span>`,
      ).join("");
    }

    // A 7th entry overrides the intro; without one the markup's own heading
    // stands. Falling back to messages[5] repeated the last face's text here.
    const intro = document.getElementById("math-intro");
    if (intro && messages[6]) intro.textContent = messages[6];

    const order = ["front", "back", "right", "left", "top", "bottom"];
    order.forEach((face, i) => {
      const faceEl = cube.querySelector(`.encrypted-cube__face--${face}`);
      if (!faceEl) return;
      const message = messages[i] ?? "";
      faceEl.innerHTML = cubeFaceHtml(face, !!message);
      // Structure as HTML, message as text — vault wording is never markup.
      const textEl = faceEl.querySelector(".encrypted-cube__text");
      if (textEl) textEl.textContent = message;
    });

    cubeRotX = -20;
    cubeRotY = -30;
    applyCubeRotation();
    wireCube();
  }

  // Rotation state is module-scoped so the handlers attach once; wiring them
  // per render would stack handlers and spin intervals.
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
    modalBox.classList.add("encrypted-modal__box--unlocked");

    if (result.teacher === "cs") {
      // Picked up by the trick button's permanent listener.
      csMessages = result.messages;
      csContent.hidden = false;
    } else {
      mathContent.hidden = false;
      renderCube(result.messages);
    }
  });
})();
