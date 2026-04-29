"use strict";

/* ============================================================
   FUNKERSCHULE PRÜFUNGS-APP
   Finale Version
   - Offline-Frontend
   - HTML/CSS/Vanilla JS
   - keine externen Libraries
   - Prüfung mit zwei festen Szenen
   - keine Sofortkorrektur
   - Auswertung erst am Schluss
   ============================================================ */


/* ============================================================
   ASSETS
   Alle Dateien lokal ablegen.
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

  // Wird nach bestandener Prüfung automatisch abgespielt
  // und zusätzlich per Button nochmals abspielbar gemacht.
  passwordAudio: "audio/passwort4.mp3"
};


/* ============================================================
   SZENEN / AUFTRAGSKARTEN
   Wichtig:
   Die Auftragskarte enthält nur Stichwörter.
   Keine vollständigen Funksprüche zum Ablesen.
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
   PRÜFUNGSDIALOG
   speaker: "pc"   = Computer spricht automatisch
   speaker: "user" = Lernende Person spricht per PTT-Taste

   Prüfkonzept:
   - Funkdisziplin wird als type: "funk" markiert.
   - Inhalt wird als type: "content" markiert.
   - Pro Antwort muss nicht jedes Inhaltsdetail stimmen.
   - Es reicht mindestens EIN zentrales Inhaltsdetail pro Antwort.
   ============================================================ */

const STEPS = [
  /* ------------------------------------------------------------
     SZENE 1: TREFFPUNKT VEREINBAREN
     ------------------------------------------------------------ */

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
      { label: "Treffpunkt-Frage", type: "content", any: ["wo treffen", "wo ist", "treffpunkt", "wo sollen wir uns treffen"] },
      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",

    // Änderung:
    // Diese Nachricht soll absichtlich kaum verständlich sein.
    // In speakPc() wird bei distorted die Stimme extrem leise
    // und das Störgeräusch übersteuert laut abgespielt.
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

      // Inhaltlich genügt später mindestens eines dieser Details.
      { label: "Treffpunkt", type: "content", any: ["treffpunkt", "treffen"] },
      { label: "knorrige Eiche", type: "content", allAny: [["knorrige", "knorrigen"], ["eiche", "baum"]] },

      { label: "antworten am Schluss", type: "funk", end: ["antworten"] }
    ]
  },

  {
    scene: 0,
    speaker: "pc",

    // Änderung:
    // Bruno schlägt die Zeit selbst vor.
    // Anna muss nicht zuerst separat nach der Zeit fragen.
    text: "Verstanden, wir treffen uns um zwei Uhr nachmittags, antworten"
  },

  {
    scene: 0,
    speaker: "user",
    prompt: "Zwei Uhr geht nicht. Mache einen neuen Vorschlag.",
    label: "Vier Uhr vorschlagen",
    checks: [
      { label: "verstanden zuerst", type: "funk", start: ["verstanden"] },

      // Inhaltsprüfung tolerant:
      // Es reicht mindestens ein korrektes Detail,
      // die Gesamtwertung erlaubt zusätzlich Fehler.
      { label: "zwei Uhr geht nicht", type: "content", allAny: [["zwei", "2"], ["nicht", "geht nicht"]] },
      { label: "Unterricht oder Schule", type: "content", any: ["unterricht", "schule"] },
      { label: "vier Uhr", type: "content", any: ["vier uhr", "4 uhr", "vier", "4"] },

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


  /* ------------------------------------------------------------
     SZENE 2: BEOBACHTUNG MIT FERNGALS
     Korrektur:
     Bruno ruft zuerst nur Anna.
     Anna kann sich zuerst korrekt identifizieren.
     Erst danach stellt Bruno die Frage zur Position.
     ------------------------------------------------------------ */

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
      { label: "in Position oder bereit", type: "content", any: ["in position", "bin in position", "bereit"] },
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

      // Neues Prüfkonzept:
      // Inhaltlich reicht ein korrektes Detail:
      // z.B. „negativ“, „nicht blau“, „roter Bus“, „rotes Auto/Fahrzeug“.
      { label: "negativ / nein / nicht", type: "content", any: ["negativ", "nein", "nicht"] },
      { label: "Bus / Fahrzeug / Auto", type: "content", any: ["bus", "fahrzeug", "auto"] },
      { label: "rot", type: "content", any: ["rot", "roter", "rotes", "rottes"] },
      { label: "nicht blau", type: "content", allAny: [["nicht", "negativ", "nein"], ["blau", "blauer", "blauen"]] },

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

      // Zulässige Varianten: Leute, Menschen, Männer, Kinder usw.
      { label: "drei", type: "content", any: ["drei", "3"] },
      { label: "Personen / Menschen / Leute", type: "content", any: ["personen", "menschen", "leute", "männer", "maenner", "kinder"] },
      { label: "alte Scheune", type: "content", any: ["alte scheune", "alten scheune", "scheune", "stall"] },

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

      // Auch hier reicht inhaltlich ein zentrales Detail:
      // Feuer ODER stehen herum.
      { label: "Feuer", type: "content", any: ["feuer", "feuerstelle", "feuer gemacht"] },
      { label: "stehen herum", type: "content", any: ["stehen darum herum", "stehen herum", "stehen drumherum", "sind darum herum", "um das feuer"] },

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

      // Inhaltlich tolerant:
      // „ich beobachte weiter“ genügt.
      { label: "weiter beobachten", type: "content", allAny: [["beobachte", "beobachten"], ["weiter"]] },

      // Schluss darf Ende oder Schluss sein.
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

  // Standard-PTT: Leertaste
  pttKey: "Space",
  waitingForCustomKey: false,

  isPressed: false,
  currentTranscript: "",

  recognition: null,
  recognitionAvailable: false,

  examRunning: false,
  readyForUser: false,

  pressTimer: null,
  speakTimer: null
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
   Hinweis:
   Browser-Spracherkennung funktioniert nicht vollständig offline.
   Deshalb gibt es eine Notfall-Eingabe.
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
    // Bei Problemen wird die manuelle Eingabe eingeblendet.
    el.manualFallback.classList.remove("hidden");
  };
}


/* ============================================================
   PRÜFUNG STARTEN
   ============================================================ */

function startExam() {
  stopAllAudio();

  state.stepIndex = -1;
  state.answers = [];
  state.examRunning = true;
  state.readyForUser = false;
  state.isPressed = false;
  state.currentTranscript = "";

  el.startBtn.disabled = true;
  el.resultOverlay.classList.add("hidden");
  el.recordStatus.textContent = "Prüfung startet.";
  el.pcText.textContent = "Bereit.";

  nextStep();
}


/* ============================================================
   NÄCHSTER DIALOGSCHRITT
   ============================================================ */

function nextStep() {
  clearTimeout(state.speakTimer);
  clearTimeout(state.pressTimer);

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
    el.pcText.textContent = step.prompt;
    el.recordStatus.textContent = "Jetzt antworten: Leertaste halten, 1 Sekunde warten, sprechen, loslassen.";
    state.readyForUser = true;
  }
}


/* ============================================================
   COMPUTER SPRICHT
   Robuste Version:
   Falls speechSynthesis.onend hängen bleibt,
   läuft ein Fallback-Timer weiter.
   ============================================================ */

function speakPc(text, distorted, callback) {
  setRadio("receive");

  try {
    // Änderung:
    // Gestörte Meldung wird absichtlich massiv übersteuert.
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
    setRadio("standby");

    setTimeout(callback, 350);
  }

  // Fallback gegen Einfrieren der App
  const fallbackMs = Math.max(1800, text.length * 95);
  state.speakTimer = setTimeout(done, fallbackMs);

  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-CH";
      u.rate = 0.92;

      // Änderung:
      // Bei der gestörten Nachricht ist die Stimme extrem leise.
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
   Die sichtbare PTT-Taste wurde entfernt.
   Ausgelöst wird über die gewählte Tastaturtaste.
   ============================================================ */

function startPtt() {
  if (!state.examRunning || !state.readyForUser || state.isPressed) return;

  state.isPressed = true;
  state.currentTranscript = "";

  setRadio("send");
  playSfx("pttDown");

  el.recordStatus.textContent = "PTT gedrückt. 1 Sekunde warten …";

  clearTimeout(state.pressTimer);

  // Funkverzögerung: erst nach 1 Sekunde sprechen
  state.pressTimer = setTimeout(function () {
    if (!state.isPressed) return;

    playSfx("buzz");
    el.recordStatus.textContent = "Jetzt sprechen.";

    if (state.recognitionAvailable && state.recognition) {
      try {
        state.recognition.start();
      } catch (e) {
        // Falls bereits gestartet oder Browser blockiert:
        // keine Unterbrechung der Prüfung.
      }
    }
  }, 1000);
}


/* ============================================================
   PTT LOSLASSEN
   Erst nach Loslassen wird die Antwort gespeichert.
   Keine Sofortauswertung.
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

  saveCurrentAnswer(state.currentTranscript.trim());
}


/* ============================================================
   ANTWORT SPEICHERN
   ============================================================ */

function saveCurrentAnswer(text) {
  const step = STEPS[state.stepIndex];

  state.answers.push({
    stepIndex: state.stepIndex,
    label: step.label,
    text: text
  });

  el.recordStatus.textContent = "Antwort gespeichert. Keine Auswertung während der Prüfung.";

  setTimeout(nextStep, 700);
}


/* ============================================================
   NOTFALL-EINGABE SPEICHERN
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
   PRÜFUNG ABSCHLIESSEN UND AUSWERTEN
   Änderung:
   - maximal 2 Funkdisziplin-Fehler erlaubt
   - maximal 3 Inhaltsfehler erlaubt
   - pro Antwort zählt ein Inhaltsfehler nur dann,
     wenn KEIN zentrales Inhaltsdetail stimmt
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

    // Funkfehler werden einzeln gezählt.
    funkChecks.forEach(function (c) {
      if (!c.ok) funkErrors++;
    });

    // Inhaltsfehler:
    // Pro Antwort nur 1 Fehler, wenn gar kein Inhaltsdetail stimmt.
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
    html += `<div class="transcript">${escapeHtml(r.text || "Keine Antwort erkannt.")}</div>`;
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

    // Änderung:
    // Passwort kann nochmals abgespielt werden.
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
   EINZELANTWORT AUSWERTEN
   Wichtig:
   Eine Antwort gilt intern als bestanden, wenn:
   - alle Funkregeln in dieser Antwort stimmen
   - und mindestens ein Inhaltsdetail stimmt
   Die Gesamtprüfung verwendet zusätzlich Fehlertoleranzen.
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
    checks,
    passed: funkPassed && contentPassed
  };
}


/* ============================================================
   REGELPRÜFUNG
   any    = irgendein Begriff muss vorkommen
   start  = Antwort muss damit beginnen
   end    = Antwort muss damit enden
   allAny = aus jeder Gruppe muss mindestens ein Begriff vorkommen
   ============================================================ */

function checkRule(n, rule) {
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


/* ============================================================
   TEXT NORMALISIEREN
   Macht Prüfung toleranter:
   - Gross/Kleinschreibung egal
   - Umlaute vereinheitlicht
   - Satzzeichen entfernt
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
   FUNKGERÄT-BILD SETZEN
   ============================================================ */

function setRadio(mode) {
  el.radioImage.src = ASSETS.radio[mode] || ASSETS.radio.standby;
}


/* ============================================================
   SOUND HILFSFUNKTIONEN
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
   LEARNINGVIEW ABSCHLUSS
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
   HTML SICHER AUSGEBEN
   ============================================================ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* ============================================================
   TASTATURSTEUERUNG
   Leertaste gedrückt halten = PTT
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
   BUTTON-EVENTS
   ============================================================ */

el.startBtn.addEventListener("click", startExam);

el.retryBtn.addEventListener("click", startExam);

el.closeBtn.addEventListener("click", function () {
  el.resultOverlay.classList.add("hidden");
});

el.changeKeyBtn.addEventListener("click", setCustomKey);

el.saveManualBtn.addEventListener("click", saveManualAnswer);


/* ============================================================
   APP INITIALISIEREN
   ============================================================ */

initSpeechRecognition();
setRadio("standby");
