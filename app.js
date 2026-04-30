"use strict";

/* ============================================================
   FUNKERSCHULE PRÜFUNGS-APP
   Finale Version app.js
   - semantisch tolerantere Prüfung
   - automatische Wiederholung bei fehlendem Kerninhalt
   - kein Klick zwischen Funksprüchen
   - Buzz nur am Ende von Brunos Sendung
   - Aufnahmeverzögerung 0.6 Sekunden
   ============================================================ */

const ASSETS = {
  radio: {
    standby: "img/standby.png",
    receive: "img/receive.png",
    send: "img/send.png"
  },

  sfx: {
    pttDown: "audio/sfx/ptt-down.wav",
    pttUp: "audio/sfx/ptt-up-beep.wav",
    buzz: "audio/sfx/buzz.wav",
    staticLow: "audio/sfx/static-low.mp3",
    success: "audio/sfx/success.wav",
    error: "audio/sfx/error.wav"
  },

  passwordAudio: "audio/passwort4.mp3"
};


/* ============================================================
   SZENEN / AUFTRAGSKARTEN
   ============================================================ */

const SCENES = [
  {
    title: "Szene 1: Treffpunkt vereinbaren",
    image: "img/scene1.png",
    card: `
      <strong>Anruf durch Anna</strong>
      <ul>
        <li>Bruno anrufen</li>
        <li>Treffpunkt erfragen</li>
        <li>Störung korrekt behandeln</li>
        <li>Treffpunkt: knorrige Eiche</li>
        <li>2 Uhr geht nicht: Unterricht</li>
        <li>Vorschlag: 4 Uhr</li>
        <li>Gespräch korrekt beenden</li>
      </ul>
    `
  },

  {
    title: "Szene 2: Beobachtung mit Fernglas",
    image: "img/scene2.png",
    card: `
      <strong>Anruf durch Bruno</strong>
      <ul>
        <li>Bruno ruft Anna an</li>
        <li>Position bestätigen</li>
        <li>Bus: rot oder nicht blau</li>
        <li>Bei der alten Scheune: drei Personen</li>
        <li>Feuer / Personen stehen herum</li>
        <li>weiter beobachten</li>
        <li>Gespräch korrekt beenden</li>
      </ul>
    `
  }
];


/* ============================================================
   SEMANTISCHE BEDEUTUNGSGRUPPEN
   Diese Gruppen machen die Prüfung deutlich klüger.
   Es wird nicht stur ein Wort gesucht, sondern die Bedeutung.
   ============================================================ */

const CONCEPTS = {
  treffpunktFrage: [
    "wo treffen",
    "wo treffen wir",
    "wo sollen wir",
    "wo ist der treffpunkt",
    "treffpunkt",
    "wo machen wir ab",
    "wo kommen wir zusammen"
  ],

  treffpunktEiche: [
    "knorrige eiche",
    "knorrigen eiche",
    "bei der eiche",
    "beim baum",
    "beim alten baum",
    "beim knorrigen baum",
    "treffpunkt eiche",
    "treffpunkt bei der eiche"
  ],

  zweiUhrGehtNicht: [
    "zwei uhr geht nicht",
    "2 uhr geht nicht",
    "zwei geht nicht",
    "2 geht nicht",
    "nicht um zwei",
    "nicht um 2",
    "um zwei kann ich nicht",
    "um 2 kann ich nicht"
  ],

  unterricht: [
    "unterricht",
    "schule",
    "schulunterricht",
    "ich habe noch schule",
    "ich habe unterricht",
    "bin noch in der schule"
  ],

  vierUhr: [
    "vier uhr",
    "4 uhr",
    "um vier",
    "um 4",
    "vorschlag vier",
    "vorschlage vier",
    "ich schlage vier vor",
    "ich schlage 4 vor"
  ],

  position: [
    "in position",
    "bin in position",
    "ich bin in position",
    "bereit",
    "ich bin bereit",
    "auf position",
    "ich bin da"
  ],

  roterBus: [
    "roter bus",
    "rotes bus",
    "bus ist rot",
    "der bus ist rot",
    "rotes fahrzeug",
    "roter wagen",
    "rotes auto",
    "auto ist rot",
    "fahrzeug ist rot",
    "rot"
  ],

  nichtBlau: [
    "nicht blau",
    "kein blauer bus",
    "kein blau",
    "negativ blau",
    "negativ der bus",
    "nein der bus",
    "der bus ist nicht blau",
    "das fahrzeug ist nicht blau"
  ],

  busFahrzeug: [
    "bus",
    "fahrzeug",
    "auto",
    "wagen"
  ],

  dreiPersonen: [
    "drei personen",
    "3 personen",
    "drei menschen",
    "3 menschen",
    "drei leute",
    "3 leute",
    "drei maenner",
    "drei männer",
    "3 maenner",
    "3 männer",
    "drei kinder",
    "3 kinder",
    "drei"
  ],

  scheune: [
    "alte scheune",
    "alten scheune",
    "bei der scheune",
    "scheune",
    "stall",
    "alter stall",
    "alten stall"
  ],

  feuerOderHerumstehen: [
    "feuer",
    "feuerstelle",
    "feuer gemacht",
    "haben feuer gemacht",
    "machen feuer",
    "stehen herum",
    "stehen darum herum",
    "stehen drumherum",
    "stehen rundherum",
    "um das feuer",
    "beim feuer",
    "sie stehen",
    "sie sind um das feuer"
  ],

  weiterBeobachten: [
    "ich beobachte weiter",
    "beobachte weiter",
    "weiter beobachten",
    "ich beobachte weiterhin",
    "beobachte weiterhin",
    "ich bleibe dran",
    "bleibe dran",
    "ich mache weiter",
    "mache weiter",
    "ich schaue weiter",
    "schaue weiter",
    "ich überwache weiter",
    "ich ueberwache weiter"
  ]
};


/* ============================================================
   PRÜFUNGSDIALOG
   ============================================================ */

const STEPS = [
  {
    scene: 0,
    speaker: "user",
    prompt: "Beginne den Anruf.",
    label: "Anna ruft Bruno",
    checks: [
      { label: "Bruno von Anna", type: "funk", any: ["bruno von anna"] },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",
    text: "Anna von Bruno, verstanden, antworten"
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Frage nach dem Treffpunkt.",
    label: "Treffpunkt erfragen",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "Treffpunkt-Frage", type: "content", concept: "treffpunktFrage" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",
    text: "Krrr ... bei der knorrigen Eiche ... krrr ... antworten ...",
    distorted: true
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Du hast Bruno nicht verstanden.",
    label: "Wiederholung verlangen",
    checks: [
      { label: "nicht verstanden", type: "funk", any: ["nicht verstanden"] },
      { label: "wiederholen", type: "funk", any: ["wiederholen"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",
    text: "Ich wiederhole, Treffpunkt bei der knorrigen Eiche, antworten"
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Bestätige den Treffpunkt.",
    label: "Treffpunkt bestätigen",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "Treffpunkt / knorrige Eiche", type: "content", concept: "treffpunktEiche" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",
    text: "Verstanden, wir treffen uns um zwei Uhr nachmittags, antworten"
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Zwei Uhr geht nicht. Mache einen neuen Vorschlag.",
    label: "Vier Uhr vorschlagen",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "zwei Uhr geht nicht", type: "content", concept: "zweiUhrGehtNicht" },
      { label: "Unterricht oder Schule", type: "content", concept: "unterricht" },
      { label: "vier Uhr", type: "content", concept: "vierUhr" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",
    text: "Verstanden, Treffpunkt bei der knorrigen Eiche um vier Uhr, Schluss"
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Beende das Gespräch.",
    label: "Gespräch beenden",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "Ende oder Schluss", type: "funk", any: ["ende", "schluss"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Anna von Bruno, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Bruno ruft dich. Melde dich korrekt.",
    label: "Anna meldet sich",
    checks: [
      { label: "Bruno von Anna", type: "funk", any: ["bruno von anna"] },
      { label: "verstanden", type: "funk", any: ["verstanden"] },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Verstanden, bist du in Position, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Bestätige deine Position.",
    label: "Position bestätigen",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "in Position oder bereit", type: "content", concept: "position" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Verstanden, siehst du den blauen Bus, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Korrigiere die Beobachtung zum Bus.",
    label: "Busfarbe korrigieren",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "rot / nicht blau", type: "content", anyConcept: ["roterBus", "nichtBlau"] },
      { label: "Bus / Fahrzeug / Auto", type: "content", concept: "busFahrzeug" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Verstanden, wie viele Personen sind bei der alten Scheune, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Melde die Anzahl Personen bei der Scheune.",
    label: "Drei Personen melden",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "drei Personen / Leute / Menschen", type: "content", concept: "dreiPersonen" },
      { label: "alte Scheune", type: "content", concept: "scheune" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Verstanden, was tun sie, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Beschreibe, was die Personen tun.",
    label: "Feuer beschreiben",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "Feuer oder Herumstehen", type: "content", concept: "feuerOderHerumstehen" },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Verstanden, Auftrag, weiter beobachten, antworten"
  },

  {
    scene: 1,
    speaker: "user",
    prompt: "Bestätige den Auftrag und beende.",
    label: "Auftrag bestätigen und beenden",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },
      { label: "weiter beobachten", type: "content", concept: "weiterBeobachten" },
      { label: "Ende oder Schluss", type: "funk", end: ["ende", "schluss"] }
    ]
  },

  {
    scene: 1,
    speaker: "pc",
    text: "Ende"
  }
];


/* ============================================================
   APP-ZUSTAND
   ============================================================ */

const state = {
  stepIndex: -1,
  answers: [],

  pttKey: "Space",
  waitingForCustomKey: false,

  isPressed: false,
  currentTranscript: "",

  recognition: null,
  recognitionAvailable: false,

  examRunning: false,
  readyForUser: false,

  pressTimer: null,
  speakTimer: null,
  saveTimer: null,

  // Automatische Wiederholung bei fehlendem Kerninhalt
  repeat: {
    active: false,
    stepIndex: null,
    firstText: "",
    usedForSteps: {}
  }
};


/* ============================================================
   DOM-ELEMENTE
   ============================================================ */

const el = {
  taskTitle: document.getElementById("taskTitle"),
  taskCard: document.getElementById("taskCard"),
  sceneImage: document.getElementById("sceneImage"),
  radioImage: document.getElementById("radioImage"),
  pcText: document.getElementById("pcText"),

  startBtn: document.getElementById("startBtn"),
  pttBtn: document.getElementById("pttBtn"),
  changeKeyBtn: document.getElementById("changeKeyBtn"),
  keyLabel: document.getElementById("keyLabel"),

  recordStatus: document.getElementById("recordStatus"),

  manualFallback: document.getElementById("manualFallback"),
  manualText: document.getElementById("manualText"),
  saveManualBtn: document.getElementById("saveManualBtn"),

  resultOverlay: document.getElementById("resultOverlay"),
  resultTitle: document.getElementById("resultTitle"),
  resultContent: document.getElementById("resultContent"),

  retryBtn: document.getElementById("retryBtn"),
  closeBtn: document.getElementById("closeBtn")
};


/* ============================================================
   AUDIO LADEN
   ============================================================ */

const audio = {};

for (const [key, src] of Object.entries(ASSETS.sfx)) {
  audio[key] = new Audio(src);
}

audio.staticLow.loop = true;

const passwordAudio = new Audio(ASSETS.passwordAudio);


/* ============================================================
   SPRACHERKENNUNG
   ============================================================ */

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    state.recognitionAvailable = false;
    el.manualFallback.classList.remove("hidden");
    el.recordStatus.textContent = "Spracherkennung nicht verfügbar. Notfall-Eingabe aktiv.";
    return;
  }

  state.recognitionAvailable = true;
  state.recognition = new SpeechRecognition();

  state.recognition.lang = "de-CH";
  state.recognition.continuous = true;
  state.recognition.interimResults = true;

  state.recognition.onresult = function (event) {
    let text = "";

    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript + " ";
    }

    state.currentTranscript = text.trim();
  };

  state.recognition.onerror = function () {
    el.manualFallback.classList.remove("hidden");
  };
}


/* ============================================================
   PRÜFUNG STARTEN / WIEDERHOLEN
   ============================================================ */

function startExam() {
  stopAllAudio();

  el.resultOverlay.classList.add("hidden");
  el.resultContent.innerHTML = "";
  el.resultTitle.textContent = "Auswertung";

  state.stepIndex = -1;
  state.answers = [];
  state.examRunning = true;
  state.readyForUser = false;
  state.isPressed = false;
  state.currentTranscript = "";

  state.repeat.active = false;
  state.repeat.stepIndex = null;
  state.repeat.firstText = "";
  state.repeat.usedForSteps = {};

  el.startBtn.disabled = true;
  el.recordStatus.textContent = "Prüfung startet.";
  el.pcText.textContent = "Bereit.";

  try {
    passwordAudio.pause();
    passwordAudio.currentTime = 0;
  } catch (e) {}

  nextStep();
}


/* ============================================================
   NÄCHSTER SCHRITT
   ============================================================ */

function nextStep() {
  clearTimeout(state.speakTimer);
  clearTimeout(state.pressTimer);
  clearTimeout(state.saveTimer);

  state.readyForUser = false;
  state.isPressed = false;
  state.currentTranscript = "";

  state.stepIndex++;

  if (state.stepIndex >= STEPS.length) {
    finishExam();
    return;
  }

  const step = STEPS[state.stepIndex];
  const scene = SCENES[step.scene];

  el.taskTitle.textContent = scene.title;
  el.sceneImage.src = scene.image;
  el.taskCard.innerHTML = scene.card;
  el.manualText.value = "";

  if (step.speaker === "pc") {
    el.pcText.textContent = step.text;
    el.recordStatus.textContent = "Gegenstelle spricht.";

    speakPc(step.text, !!step.distorted, function () {
      nextStep();
    });
  } else {
    showUserPrompt(step.prompt);
  }
}

function showUserPrompt(prompt) {
  el.pcText.textContent = prompt;
  el.recordStatus.textContent = "Jetzt antworten: Leertaste halten, kurz warten, sprechen, loslassen.";
  state.readyForUser = true;
}


/* ============================================================
   COMPUTER SPRICHT
   Buzz wird nur am Ende von Brunos Sendung abgespielt.
   ============================================================ */

function speakPc(text, distorted, callback) {
  setRadio("receive");

  try {
    audio.staticLow.volume = distorted ? 1.0 : 0.22;
    audio.staticLow.currentTime = 0;
    audio.staticLow.play().catch(function () {});
  } catch (e) {}

  let finished = false;

  function done() {
    if (finished) return;

    finished = true;
    clearTimeout(state.speakTimer);

    stopStatic();
    playSfx("buzz");
    setRadio("standby");

    setTimeout(callback, 350);
  }

  const fallbackMs = Math.max(1800, text.length * 95);
  state.speakTimer = setTimeout(done, fallbackMs);

  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-CH";
      u.rate = 0.92;
      u.volume = distorted ? 0.08 : 1;
      u.onend = done;
      u.onerror = done;

      window.speechSynthesis.speak(u);
    } catch (e) {
      done();
    }
  } else {
    done();
  }
}


/* ============================================================
   PTT STARTEN
   Aufnahmeverzögerung: 0.6 Sekunden
   Kein Buzz beim User.
   ============================================================ */

function startPtt() {
  if (!state.examRunning || !state.readyForUser || state.isPressed) return;

  state.isPressed = true;
  state.currentTranscript = "";

  setRadio("send");
  playSfx("pttDown");

  el.recordStatus.textContent = "PTT gedrückt. Kurz warten …";

  clearTimeout(state.pressTimer);

  state.pressTimer = setTimeout(function () {
    if (!state.isPressed) return;

    el.recordStatus.textContent = "Jetzt sprechen.";

    if (state.recognitionAvailable && state.recognition) {
      try {
        state.recognition.start();
      } catch (e) {}
    }
  }, 600);
}


/* ============================================================
   PTT LOSLASSEN
   Nachlauf: 500 ms, damit verspätete Speech-Resultate
   noch gespeichert werden können.
   ============================================================ */

function stopPtt() {
  if (!state.examRunning || !state.readyForUser || !state.isPressed) return;

  state.isPressed = false;
  state.readyForUser = false;

  clearTimeout(state.pressTimer);

  setRadio("standby");
  playSfx("pttUp");

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
  }

  el.recordStatus.textContent = "Antwort wird gespeichert …";

  clearTimeout(state.saveTimer);

  state.saveTimer = setTimeout(function () {
    saveCurrentAnswer(state.currentTranscript.trim());
  }, 500);
}


/* ============================================================
   ANTWORT SPEICHERN
   Mit automatischer Wiederholungsanforderung:
   Wenn bei einem prüfungsrelevanten Inhalt gar kein Kerninhalt
   erkannt wurde, fragt Bruno einmal nach:
   „Nicht verstanden, wiederholen, antworten.“
   ============================================================ */

function saveCurrentAnswer(text) {
  const step = STEPS[state.stepIndex];

  if (!step || step.speaker !== "user") return;

  if (state.repeat.active && state.repeat.stepIndex === state.stepIndex) {
    const combinedText = joinTexts(state.repeat.firstText, text);

    state.answers.push({
      stepIndex: state.stepIndex,
      label: step.label,
      text: combinedText,
      firstText: state.repeat.firstText,
      repeatText: text,
      repeated: true
    });

    state.repeat.active = false;
    state.repeat.stepIndex = null;
    state.repeat.firstText = "";

    el.recordStatus.textContent = "Wiederholung gespeichert. Keine Auswertung während der Prüfung.";

    setTimeout(nextStep, 700);
    return;
  }

  if (shouldRequestRepeat(step, text)) {
    state.repeat.active = true;
    state.repeat.stepIndex = state.stepIndex;
    state.repeat.firstText = text;
    state.repeat.usedForSteps[state.stepIndex] = true;

    el.recordStatus.textContent = "Verbindung schlecht. Bruno verlangt eine Wiederholung.";

    speakPc("Nicht verstanden, wiederholen, antworten", false, function () {
      showUserPrompt("Wiederhole deine Meldung. Beginne mit: verstanden, ich wiederhole …");
    });

    return;
  }

  state.answers.push({
    stepIndex: state.stepIndex,
    label: step.label,
    text: text,
    repeated: false
  });

  el.recordStatus.textContent = "Antwort gespeichert. Keine Auswertung während der Prüfung.";

  setTimeout(nextStep, 700);
}

function shouldRequestRepeat(step, text) {
  if (!step || !step.checks) return false;

  if (state.repeat.usedForSteps[state.stepIndex]) return false;

  const contentChecks = step.checks.filter(function (c) {
    return c.type === "content";
  });

  if (contentChecks.length === 0) return false;

  const n = normalize(text);

  const atLeastOneContentOk = contentChecks.some(function (rule) {
    return checkRule(n, rule);
  });

  return !atLeastOneContentOk;
}

function joinTexts(first, second) {
  const a = String(first || "").trim();
  const b = String(second || "").trim();

  if (!a) return b;
  if (!b) return a;

  return a + " | Wiederholung: " + b;
}


/* ============================================================
   NOTFALL-EINGABE
   ============================================================ */

function saveManualAnswer() {
  if (!state.examRunning || !state.readyForUser) return;

  const text = el.manualText.value.trim();

  state.readyForUser = false;
  state.isPressed = false;

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
  }

  saveCurrentAnswer(text);
}


/* ============================================================
   PRÜFUNG ABSCHLIESSEN
   - maximal 2 Funkdisziplin-Fehler
   - maximal 3 Inhaltsfehler
   - pro Antwort nur 1 Inhaltsfehler, wenn gar kein Kerninhalt stimmt
   ============================================================ */

function finishExam() {
  stopAllAudio();

  state.examRunning = false;
  state.readyForUser = false;
  state.isPressed = false;

  setRadio("standby");
  el.startBtn.disabled = false;

  const results = state.answers.map(evaluateAnswer);

  let funkErrors = 0;
  let contentErrors = 0;

  results.forEach(function (r) {
    const funkChecks = r.checks.filter(function (c) {
      return c.type === "funk";
    });

    const contentChecks = r.checks.filter(function (c) {
      return c.type === "content";
    });

    funkChecks.forEach(function (c) {
      if (!c.ok) funkErrors++;
    });

    if (contentChecks.length > 0) {
      const atLeastOneContentOk = contentChecks.some(function (c) {
        return c.ok;
      });

      if (!atLeastOneContentOk) {
        contentErrors++;
      }
    }
  });

  const passed =
    results.length > 0 &&
    funkErrors <= 2 &&
    contentErrors <= 3;

  el.resultTitle.textContent = passed ? "Prüfung bestanden" : "Prüfung noch nicht bestanden";

  let html = "";

  results.forEach(function (r, i) {
    html += `<div class="result-step">`;
    html += `<h3>${i + 1}. ${escapeHtml(r.label)}</h3>`;

    if (r.repeated) {
      html += `<p><strong>Erster Versuch:</strong></p>`;
      html += `<div class="transcript">${escapeHtml(r.firstText || "Keine Antwort erkannt.")}</div>`;
      html += `<p><strong>Wiederholung:</strong></p>`;
      html += `<div class="transcript">${escapeHtml(r.repeatText || "Keine Wiederholung erkannt.")}</div>`;
    } else {
      html += `<div class="transcript">${escapeHtml(r.text || "Keine Antwort erkannt.")}</div>`;
    }

    html += `<p>`;

    r.checks.forEach(function (c) {
      html += `<span class="term ${c.ok ? "ok" : "bad"}">${escapeHtml(c.label)}</span>`;
    });

    html += `</p>`;
    html += `</div>`;
  });

  html += `
    <div class="result-step">
      <h3>Gesamtergebnis</h3>
      <p><strong>Funkdisziplin-Fehler:</strong> ${funkErrors} / maximal 2</p>
      <p><strong>Inhaltliche Fehler:</strong> ${contentErrors} / maximal 3</p>
    </div>
  `;

  if (passed) {
    html += `
      <p class="term ok">Bestanden. Notiere das Passwort.</p>
      <p>
        <button id="playPasswordBtn" class="main-btn" type="button">
          Passwort 4 nochmals abspielen
        </button>
      </p>
    `;

    playSfx("success");
    playPasswordAudio();
    sendLearningViewSolved();

    setTimeout(function () {
      const btn = document.getElementById("playPasswordBtn");

      if (btn) {
        btn.addEventListener("click", playPasswordAudio);
      }
    }, 0);
  } else {
    html += `<p class="term bad">Noch nicht bestanden. Wiederhole die Prüfung und achte auf Funkbegriffe, Reihenfolge und die wichtigsten Inhalte.</p>`;
    playSfx("error");
  }

  el.resultContent.innerHTML = html;
  el.resultOverlay.classList.remove("hidden");
}


/* ============================================================
   AUSWERTUNG EINER ANTWORT
   Bei Wiederholung wird zusätzlich geprüft, ob eine Wiederholung
   sprachlich markiert wurde. Diese Prüfung ist bewusst tolerant.
   ============================================================ */

function evaluateAnswer(answer) {
  const step = STEPS[answer.stepIndex];
  const n = normalize(answer.text);

  const checks = step.checks.map(function (rule) {
    return {
      label: rule.label,
      type: rule.type || "content",
      ok: checkRule(n, rule)
    };
  });

  if (answer.repeated) {
    checks.push({
      label: "Wiederholung angekündigt",
      type: "funk",
      ok: hasAny(normalize(answer.repeatText), [
        "ich wiederhole",
        "wiederhole",
        "noch einmal",
        "nochmals",
        "ich sage es nochmals",
        "ich sage es noch einmal"
      ])
    });
  }

  const funkChecks = checks.filter(function (c) {
    return c.type === "funk";
  });

  const contentChecks = checks.filter(function (c) {
    return c.type === "content";
  });

  const funkPassed = funkChecks.every(function (c) {
    return c.ok;
  });

  const contentPassed =
    contentChecks.length === 0 ||
    contentChecks.some(function (c) {
      return c.ok;
    });

  return {
    label: answer.label,
    text: answer.text,
    firstText: answer.firstText || "",
    repeatText: answer.repeatText || "",
    repeated: !!answer.repeated,
    checks,
    passed: funkPassed && contentPassed
  };
}


/* ============================================================
   REGELN PRÜFEN
   ============================================================ */

function checkRule(n, rule) {
  if (rule.concept) return hasConcept(n, rule.concept);
  if (rule.anyConcept) return rule.anyConcept.some(function (conceptName) {
    return hasConcept(n, conceptName);
  });

  if (rule.any) return hasAny(n, rule.any);
  if (rule.start) return startsAny(n, rule.start);
  if (rule.end) return endsAny(n, rule.end);

  if (rule.allAny) {
    return rule.allAny.every(function (group) {
      return hasAny(n, group);
    });
  }

  return false;
}

function hasConcept(n, conceptName) {
  const list = CONCEPTS[conceptName];

  if (!list) return false;

  return list.some(function (phrase) {
    return n.includes(normalize(phrase));
  });
}


/* ============================================================
   TEXT NORMALISIEREN
   ============================================================ */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(n, arr) {
  return arr.some(function (x) {
    return n.includes(normalize(x));
  });
}

function startsAny(n, arr) {
  return arr.some(function (x) {
    return n.startsWith(normalize(x));
  });
}

function endsAny(n, arr) {
  return arr.some(function (x) {
    return n.endsWith(normalize(x));
  });
}


/* ============================================================
   FUNKGERÄT-BILD
   ============================================================ */

function setRadio(mode) {
  el.radioImage.src = ASSETS.radio[mode] || ASSETS.radio.standby;
}


/* ============================================================
   SOUND
   ============================================================ */

function playSfx(name) {
  const snd = audio[name];

  if (!snd) return;

  try {
    snd.currentTime = 0;
    snd.play().catch(function () {});
  } catch (e) {}
}

function stopStatic() {
  try {
    audio.staticLow.pause();
    audio.staticLow.currentTime = 0;
  } catch (e) {}
}

function stopAllAudio() {
  clearTimeout(state.speakTimer);
  clearTimeout(state.pressTimer);
  clearTimeout(state.saveTimer);

  stopStatic();

  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {}
}

function playPasswordAudio() {
  try {
    passwordAudio.currentTime = 0;
    passwordAudio.play().catch(function () {});
  } catch (e) {}
}


/* ============================================================
   LEARNINGVIEW
   ============================================================ */

function sendLearningViewSolved() {
  try {
    window.parent.postMessage("AppSolved", "*");
  } catch (e) {}
}


/* ============================================================
   PTT-TASTE ÄNDERN
   ============================================================ */

function setCustomKey() {
  state.waitingForCustomKey = true;
  el.recordStatus.textContent = "Drücke jetzt die gewünschte PTT-Taste.";
}

function keyName(code) {
  if (code === "Space") return "Leertaste";

  return code
    .replace("Key", "")
    .replace("Digit", "");
}


/* ============================================================
   HTML SICHERN
   ============================================================ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* ============================================================
   TASTATURSTEUERUNG
   ============================================================ */

document.addEventListener("keydown", function (e) {
  if (state.waitingForCustomKey) {
    e.preventDefault();

    state.pttKey = e.code;
    state.waitingForCustomKey = false;

    el.keyLabel.textContent = keyName(e.code);
    el.recordStatus.textContent = "PTT-Taste gespeichert.";

    return;
  }

  if (e.code === state.pttKey && !e.repeat) {
    e.preventDefault();
    startPtt();
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === state.pttKey) {
    e.preventDefault();
    stopPtt();
  }
});


/* ============================================================
   BUTTONS
   ============================================================ */

el.startBtn.addEventListener("click", startExam);
el.retryBtn.addEventListener("click", startExam);

el.closeBtn.addEventListener("click", function () {
  el.resultOverlay.classList.add("hidden");
});

el.changeKeyBtn.addEventListener("click", setCustomKey);
el.saveManualBtn.addEventListener("click", saveManualAnswer);


/* ============================================================
   START
   ============================================================ */

initSpeechRecognition();
setRadio("standby");
