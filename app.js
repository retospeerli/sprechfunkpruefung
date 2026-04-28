"use strict";

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

const TASKS = [
  {
    id: 1,
    title: "Aufgabe 1: Treffpunkt vereinbaren",
    scene: "img/scene1.png",
    pc: "Anna von Bruno, wo und wann treffen wir uns? antworten",
    required: {
      start: ["verstanden"],
      end: ["antworten"],
      contentAny: ["treffpunkt", "bruecke", "brücke", "baum", "felsen", "fluss", "scheune", "eiche", "feuerstelle", "kreuzung"],
      timeAny: ["uhr", "eins", "zwei", "drei", "vier", "fuenf", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwoelf", "zwölf"]
    }
  },
  {
    id: 2,
    title: "Aufgabe 2: Beobachtung beschreiben",
    scene: "img/scene2.png",
    pc: "Was siehst du? antworten",
    required: {
      start: ["verstanden"],
      end: ["antworten"],
      contentAny: ["ich sehe", "auto", "person", "scheune", "haus", "baum", "objekt", "rot", "blau", "nummer", "kennzeichen", "neben", "vor", "hinter"],
      minWords: 7
    }
  }
];

const state = {
  currentTask: -1,
  answers: [],
  pttKey: "Space",
  waitingForCustomKey: false,
  isPressed: false,
  canSpeak: false,
  recognition: null,
  recognitionAvailable: false,
  currentTranscript: "",
  pressTimer: null,
  examRunning: false
};

const el = {
  taskTitle: document.getElementById("taskTitle"),
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

const audio = {};
for (const [key, src] of Object.entries(ASSETS.sfx)) {
  audio[key] = new Audio(src);
}
audio.staticLow.loop = true;
audio.staticLow.volume = 0.28;

const passwordAudio = new Audio(ASSETS.passwordAudio);

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

  state.recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript + " ";
    }
    state.currentTranscript = text.trim();
  };

  state.recognition.onerror = () => {
    el.manualFallback.classList.remove("hidden");
  };

  state.recognition.onend = () => {
    if (state.isPressed && state.canSpeak) {
      try {
        state.recognition.start();
      } catch (e) {}
    }
  };
}

function playSfx(name) {
  const snd = audio[name];
  if (!snd) return;
  try {
    snd.currentTime = 0;
    snd.play().catch(() => {});
  } catch (e) {}
}

function setRadio(mode) {
  el.radioImage.src = ASSETS.radio[mode] || ASSETS.radio.standby;
}

function speakPc(text, after = null) {
  setRadio("receive");
  el.pcText.textContent = text;

  try {
    audio.staticLow.currentTime = 0;
    audio.staticLow.play().catch(() => {});
  } catch (e) {}

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-CH";
    utterance.rate = 0.92;
    utterance.onend = () => {
      stopReceive(after);
    };
    window.speechSynthesis.speak(utterance);
  } else {
    setTimeout(() => stopReceive(after), 2500);
  }
}

function stopReceive(after) {
  try {
    audio.staticLow.pause();
    audio.staticLow.currentTime = 0;
  } catch (e) {}

  setRadio("standby");
  if (typeof after === "function") after();
}

function startExam() {
  state.currentTask = -1;
  state.answers = [];
  state.examRunning = true;
  el.startBtn.disabled = true;
  el.pttBtn.disabled = false;
  el.resultOverlay.classList.add("hidden");
  nextTask();
}

function nextTask() {
  state.currentTask++;

  if (state.currentTask >= TASKS.length) {
    finishExam();
    return;
  }

  const task = TASKS[state.currentTask];
  el.taskTitle.textContent = task.title;
  el.sceneImage.src = task.scene;
  el.recordStatus.textContent = "Höre gut zu. Danach PTT halten, 1 Sekunde warten, dann sprechen.";
  el.manualText.value = "";
  state.currentTranscript = "";

  el.pttBtn.disabled = true;
  speakPc(task.pc, () => {
    el.pttBtn.disabled = false;
    el.recordStatus.textContent = "Jetzt antworten: PTT gedrückt halten.";
  });
}

function startPtt() {
  if (!state.examRunning || el.pttBtn.disabled || state.isPressed) return;

  state.isPressed = true;
  state.canSpeak = false;
  state.currentTranscript = "";
  el.pttBtn.classList.add("active");
  setRadio("send");
  playSfx("pttDown");
  el.recordStatus.textContent = "PTT gedrückt. 1 Sekunde warten …";

  state.pressTimer = setTimeout(() => {
    if (!state.isPressed) return;

    state.canSpeak = true;
    playSfx("buzz");
    el.recordStatus.textContent = "Sprechen.";
    if (state.recognitionAvailable && state.recognition) {
      try {
        state.recognition.start();
      } catch (e) {}
    }
  }, 1000);
}

function stopPtt() {
  if (!state.isPressed) return;

  state.isPressed = false;
  state.canSpeak = false;
  clearTimeout(state.pressTimer);
  el.pttBtn.classList.remove("active");
  setRadio("standby");
  playSfx("pttUp");

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
  }

  const answer = state.currentTranscript.trim();
  state.answers[state.currentTask] = answer;
  el.recordStatus.textContent = "Antwort gespeichert. Keine Auswertung während der Prüfung.";

  setTimeout(() => {
    nextTask();
  }, 900);
}

function saveManualAnswer() {
  if (!state.examRunning || state.currentTask < 0) return;
  state.answers[state.currentTask] = el.manualText.value.trim();
  el.recordStatus.textContent = "Manuelle Antwort gespeichert.";
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(normalized, words) {
  return words.some(word => normalized.includes(normalize(word)));
}

function startsWithAny(normalized, words) {
  return words.some(word => normalized.startsWith(normalize(word)));
}

function endsWithAny(normalized, words) {
  return words.some(word => normalized.endsWith(normalize(word)));
}

function wordCount(normalized) {
  if (!normalized) return 0;
  return normalized.split(" ").filter(Boolean).length;
}

function evaluateTask(task, answer) {
  const n = normalize(answer);
  const checks = [];

  const startOk = startsWithAny(n, task.required.start);
  checks.push({
    label: "beginnt mit „verstanden“",
    ok: startOk
  });

  const endOk = endsWithAny(n, task.required.end);
  checks.push({
    label: "endet mit „antworten“",
    ok: endOk
  });

  const contentOk = containsAny(n, task.required.contentAny);
  checks.push({
    label: "Inhalt passt zur Aufgabe",
    ok: contentOk
  });

  if (task.required.timeAny) {
    checks.push({
      label: "Zeitangabe vorhanden",
      ok: containsAny(n, task.required.timeAny)
    });
  }

  if (task.required.minWords) {
    checks.push({
      label: "Beobachtung ausreichend beschrieben",
      ok: wordCount(n) >= task.required.minWords
    });
  }

  const forbiddenFinish = n.includes("schluss") || n.includes("ende");
  checks.push({
    label: "kein falscher Gesprächsabschluss",
    ok: !forbiddenFinish
  });

  const score = checks.filter(c => c.ok).length;
  const passed = score >= checks.length - 1 && startOk && endOk && contentOk;

  return { task, answer, normalized: n, checks, passed };
}

function finishExam() {
  state.examRunning = false;
  el.pttBtn.disabled = true;
  setRadio("standby");

  const results = TASKS.map((task, i) => evaluateTask(task, state.answers[i] || ""));
  const passed = results.every(r => r.passed);

  el.resultTitle.textContent = passed ? "Prüfung bestanden" : "Prüfung noch nicht bestanden";

  let html = "";

  results.forEach((result, index) => {
    html += `<div class="result-task">`;
    html += `<h3>${TASKS[index].title}</h3>`;
    html += `<p><strong>Erkannte Antwort:</strong></p>`;
    html += `<div class="transcript">${escapeHtml(result.answer || "Keine Antwort erkannt.")}</div>`;
    html += `<p><strong>Auswertung:</strong></p>`;

    result.checks.forEach(check => {
      html += `<span class="term ${check.ok ? "ok" : "bad"}">${escapeHtml(check.label)}</span>`;
    });

    html += `</div>`;
  });

  if (passed) {
    html += `<p class="term ok">Bestanden. Notiere das Passwort.</p>`;
    playSfx("success");
    playPasswordAudio();
    sendLearningViewSolved();
  } else {
    html += `<p class="term bad">Noch nicht bestanden. Achte besonders auf „verstanden“ am Anfang, die passende Information und „antworten“ am Schluss.</p>`;
    playSfx("error");
  }

  el.resultContent.innerHTML = html;
  el.resultOverlay.classList.remove("hidden");
}

function playPasswordAudio() {
  try {
    passwordAudio.currentTime = 0;
    passwordAudio.play().catch(() => {});
  } catch (e) {}
}

function sendLearningViewSolved() {
  try {
    window.parent.postMessage("AppSolved", "*");
  } catch (e) {}
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setCustomKey() {
  state.waitingForCustomKey = true;
  el.recordStatus.textContent = "Drücke jetzt die gewünschte PTT-Taste.";
}

function keyName(code) {
  if (code === "Space") return "Leertaste";
  return code.replace("Key", "").replace("Digit", "");
}

document.addEventListener("keydown", (e) => {
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

document.addEventListener("keyup", (e) => {
  if (e.code === state.pttKey) {
    e.preventDefault();
    stopPtt();
  }
});

el.pttBtn.addEventListener("mousedown", startPtt);
el.pttBtn.addEventListener("mouseup", stopPtt);
el.pttBtn.addEventListener("mouseleave", stopPtt);
el.pttBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startPtt();
}, { passive: false });
el.pttBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  stopPtt();
}, { passive: false });

el.startBtn.addEventListener("click", startExam);
el.retryBtn.addEventListener("click", startExam);
el.closeBtn.addEventListener("click", () => el.resultOverlay.classList.add("hidden"));
el.changeKeyBtn.addEventListener("click", setCustomKey);
el.saveManualBtn.addEventListener("click", saveManualAnswer);

initSpeechRecognition();
setRadio("standby");
