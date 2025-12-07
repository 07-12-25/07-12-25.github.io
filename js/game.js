import { AudioSynth } from "./audio.js";
import { CanvasEffects } from "./canvas.js";
import { encryptPrivateKey, decryptPrivateKey } from "./crypto.js";
import { loadGameConfig } from "./config.js";

// GLOBAL STATE
let CONFIG = null;
let activeTimerInterval = null;
let ethers = null;

const gameState = {
  currentLevel: 0,
  isProcessing: false,
  hints: {},
  currentQuestion: null,
  excitementLevel: 1.0,
};

const synth = new AudioSynth();
// Defer canvas init until DOM load
let canvasEffects;

// ======================
// DOM HELPERS
// ======================
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = text; // innerHTML to allow entities
}

// ======================
// GAME INITIALIZATION
// ======================
async function init() {
  CONFIG = await loadGameConfig();

  if (!CONFIG) {
    alert("Critical Error: Could not load configuration.");
    return;
  }

  canvasEffects = new CanvasEffects("bg-canvas", gameState);

  // Apply Config Text to UI (No hardcoded strings)
  const ui = CONFIG.config.ui.general;
  setText("start-btn", ui.startGameBtn);
  setText("question-text", ui.loadingText);
  setText("mobile-score-display", ui.currencySymbol + "0");
  setText("admin-console-title", ui.adminConsole || "Admin Console");

  const branding = CONFIG.config.ui.branding;
  if (branding) {
    setText("logo-text-top", branding.logoTop);
    setText("logo-text-bottom", branding.logoBottom);
    setText("logo-text-center", branding.logoCenter);
  }

  setupAgentModal(); // Dynamic construction of Agent Protocol
  setupLadder();
  setupLifelines();
  setupEventListeners();
}

function setupAgentModal() {
  if (!CONFIG.config.ui.agentProtocol) return;

  const agent = CONFIG.config.ui.agentProtocol;
  setText("agent-help-tooltip-btn", agent.tooltip);
  setText("agent-title", agent.modalTitle);
  setText("agent-close-text", agent.closeBtn);

  const container = document.getElementById("agent-dynamic-sections");
  if (!container) return;

  container.innerHTML = ""; // Clear any existing

  if (agent.sections && Array.isArray(agent.sections)) {
    agent.sections.forEach((sec) => {
      const div = document.createElement("div");
      div.className = "agent-section";

      const h3 = document.createElement("h3");
      h3.textContent = sec.title;

      const divContent = document.createElement("div");
      divContent.innerHTML = sec.content; // Allow HTML content from JSON

      div.appendChild(h3);
      div.appendChild(divContent);
      container.appendChild(div);
    });
  }
}

function setupLadder() {
  const ladder = document.getElementById("ladder-container");
  ladder.innerHTML = "";
  for (let i = CONFIG.levels.length - 1; i >= 0; i--) {
    const row = document.createElement("div");
    row.className = `ladder-row ${
      CONFIG.levels[i].isSafeHaven ? "milestone" : ""
    }`;
    row.id = `lvl-${i}`;
    row.innerHTML = `<span class="ladder-idx">${
      i + 1
    }</span><span class="ladder-val">${
      CONFIG.config.ui.general.currencySymbol
    }${CONFIG.levels[i].amount.toLocaleString()}</span>`;
    ladder.appendChild(row);
  }
}

function setupLifelines() {
  const lifelinesGroup = document.getElementById("lifelines-group");
  lifelinesGroup.innerHTML = "";

  if (CONFIG.config.ui.hints && CONFIG.config.ui.hints.length > 0) {
    const maxHints = Math.min(CONFIG.config.ui.hints.length, 3);
    for (let i = 0; i < maxHints; i++) {
      const hint = CONFIG.config.ui.hints[i];
      if (!hint.active) continue;

      gameState.hints[hint.id] = { ...hint, remaining: hint.count };

      const btn = document.createElement("div");
      btn.className = "lifeline-btn";
      btn.id = `hint-${hint.id}`;
      btn.setAttribute("data-hint", hint.id);
      btn.title = hint.label;

      if (hint.type === "5050") {
        btn.innerHTML = `<span class="lifeline-text">${hint.label}</span>`;
      } else {
        btn.innerHTML = `<svg class="lifeline-icon" viewBox="0 0 24 24">${hint.icon}</svg>`;
      }

      if (hint.count > 1) {
        const badge = document.createElement("div");
        badge.className = "hint-badge";
        badge.id = `badge-${hint.id}`;
        badge.textContent = hint.count;
        btn.appendChild(badge);
      }
      lifelinesGroup.appendChild(btn);
    }
  }
}

// ======================
// GAME FLOW
// ======================
function startSequence() {
  const delays = CONFIG.config.gameplay.delays;

  synth.resume();
  document.getElementById("start-btn").style.opacity = "0";
  document.getElementById("start-btn").style.pointerEvents = "none";

  const agentBtn = document.getElementById("agent-help-container");
  if (agentBtn) agentBtn.style.opacity = "0";

  document.getElementById("admin-toggle").classList.add("hidden");
  document.getElementById("logo-wrapper").classList.add("anim-active");
  gameState.excitementLevel = 4.0;

  setTimeout(() => {
    document.getElementById("start-overlay").classList.add("fade-out");
    document.getElementById("game-layout").classList.add("active");
    gameState.excitementLevel = 1.0;
    setTimeout(() => {
      document.getElementById("start-overlay").style.display = "none";
      loadQuestion();
    }, delays.startLoad.ms);
  }, delays.startAnim.ms);
}

function loadQuestion() {
  if (gameState.currentLevel >= CONFIG.levels.length) {
    showWinModal();
    return;
  }

  const levelQuestions = CONFIG.questions[String(gameState.currentLevel + 1)];
  if (!levelQuestions || levelQuestions.length === 0) {
    showModal(
      CONFIG.config.ui.feedback.gameOver,
      "No more questions available!"
    );
    return;
  }

  gameState.currentQuestion =
    levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
  document.getElementById("question-text").textContent =
    gameState.currentQuestion.text;

  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`ans-${i}`);
    box.className = "neon-box answer-box";
    box.style.visibility = "visible";
    box.style.opacity = "0";
    box.style.pointerEvents = "auto";
    box.style.filter = "none";
    document.getElementById(`text-${i}`).textContent =
      gameState.currentQuestion.options[i];
  }

  updateUI();
  showQuestionSequence();
  gameState.isProcessing = false;
}

function showQuestionSequence() {
  const delays = CONFIG.config.gameplay.delays;
  const questionBox = document.getElementById("question-box");
  questionBox.classList.remove("show");

  setTimeout(() => {
    questionBox.classList.add("show");
    setTimeout(() => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          document.getElementById(`ans-${i}`).classList.add("show");
        }, i * delays.answerStagger.ms);
      }
    }, delays.answerRevealStart.ms);
  }, delays.questionBoxReveal.ms);
}

function updateUI() {
  document
    .querySelectorAll(".ladder-row")
    .forEach((r) => r.classList.remove("active"));
  const current = document.getElementById(`lvl-${gameState.currentLevel}`);
  if (current) current.classList.add("active");

  const displayAmount =
    gameState.currentLevel === 0
      ? "0"
      : CONFIG.levels[gameState.currentLevel - 1].amount.toLocaleString();
  document.getElementById("mobile-score-display").textContent =
    CONFIG.config.ui.general.currencySymbol + displayAmount;
}

function selectAnswer(index) {
  if (gameState.isProcessing) return;
  gameState.isProcessing = true;

  const delays = CONFIG.config.gameplay.delays;
  const box = document.getElementById(`ans-${index}`);
  box.classList.add("selected");
  synth.playHeartbeat();

  setTimeout(() => {
    const correct = gameState.currentQuestion.correctIndex;
    if (index === correct) {
      box.classList.remove("selected");
      box.classList.add("correct");
      synth.playWin();
      setTimeout(() => {
        gameState.currentLevel++;
        triggerRoundTransition();
      }, delays.correctFeedback.ms);
    } else {
      box.classList.remove("selected");
      box.classList.add("wrong");
      document.getElementById(`ans-${correct}`).classList.add("correct");
      synth.playLoss();
      document.getElementById("game-layout").classList.add("shake");

      let winAmount = 0;
      for (let i = gameState.currentLevel - 1; i >= 0; i--) {
        if (CONFIG.levels[i].isSafeHaven) {
          winAmount = CONFIG.levels[i].amount;
          break;
        }
      }
      setTimeout(() => {
        showModal(
          CONFIG.config.ui.feedback.gameOver,
          `${
            CONFIG.config.ui.feedback.wrong
          }<br><span style="font-size:3rem; color:#ffd700;">${
            CONFIG.config.ui.general.currencySymbol
          }${winAmount.toLocaleString()}</span>`
        );
      }, delays.wrongFeedback.ms);
    }
  }, delays.intrigue.ms);
}

function triggerRoundTransition() {
  const delays = CONFIG.config.gameplay.delays;

  // 1. Hide the stage immediately
  document.getElementById("stage-area").style.opacity = 0;

  // 2. Wait 500ms for the stage fade-out to finish before starting sidebar animation
  setTimeout(() => {
    // === FIX START: Clean up old question while stage is hidden ===
    // This prevents the old question from flashing when the stage fades back in later
    document.getElementById("question-box").classList.remove("show");
    document.querySelectorAll(".answer-box").forEach((el) => {
      el.classList.remove(
        "show",
        "selected",
        "correct",
        "wrong",
        "hint-hidden"
      );
      el.style.visibility = "hidden"; // Force hidden until next load
    });
    // === FIX END ===

    const sidebar = document.getElementById("sidebar");
    const activeRow = document.getElementById(`lvl-${gameState.currentLevel}`);

    // Animation Logic to center sidebar
    if (activeRow) {
      const sidebarRect = sidebar.getBoundingClientRect();
      const activeRect = activeRow.getBoundingClientRect();
      const percentFromTop =
        ((activeRect.top - sidebarRect.top) / sidebarRect.height) * 100;
      const translateY =
        window.innerHeight / 2 - (activeRect.top + activeRect.height / 2);
      const translateX =
        window.innerWidth / 2 - (sidebarRect.left + sidebarRect.width / 2);

      sidebar.style.transformOrigin = `center ${percentFromTop}%`;
      sidebar.style.transform = `translate(${translateX}px, ${translateY}px) scale(2.5)`;
    } else {
      sidebar.style.transform = `translate(0, 0) scale(2.5)`;
    }

    sidebar.classList.add("expand");
    gameState.excitementLevel = 2.5;

    setTimeout(() => {
      const prevRow = document.getElementById(
        `lvl-${gameState.currentLevel - 1}`
      );
      if (prevRow) prevRow.classList.remove("active");

      const nextRow = document.getElementById(`lvl-${gameState.currentLevel}`);
      if (nextRow) {
        nextRow.classList.add("pulse-next", "active");
        setTimeout(
          () => nextRow.classList.remove("pulse-next"),
          delays.ladderPulse.ms
        );
      }

      setTimeout(() => {
        sidebar.classList.remove("expand");
        sidebar.style.transform = "";

        setTimeout(() => {
          // 3. Load new question logic first (sets text, prepares anims)
          loadQuestion();
          gameState.excitementLevel = 1.0;

          // 4. Finally fade stage back in (it will appear empty/clean first, then animate)
          document.getElementById("stage-area").style.opacity = 1;
        }, delays.roundTransitionFadeIn.ms);
      }, delays.roundTransitionContract.ms);
    }, delays.roundTransitionExpand.ms);
  }, 500);
}

// ======================
// HINTS
// ======================
function useHint(hintId) {
  const hint = gameState.hints[hintId];
  if (!hint || hint.remaining <= 0 || gameState.isProcessing) return;

  hint.remaining--;
  const badge = document.getElementById(`badge-${hintId}`);
  if (badge) {
    if (hint.remaining > 0) badge.textContent = hint.remaining;
    else badge.remove();
  }
  if (hint.remaining <= 0)
    document.getElementById(`hint-${hintId}`).classList.add("disabled");

  if (hint.type === "5050") {
    const correct = gameState.currentQuestion.correctIndex;
    const wrongs = [0, 1, 2, 3]
      .filter((x) => x !== correct)
      .sort(() => Math.random() - 0.5);
    document.getElementById(`ans-${wrongs[0]}`).classList.add("hint-hidden");
    document.getElementById(`ans-${wrongs[1]}`).classList.add("hint-hidden");
    synth.playTick();
  } else if (hint.type === "modal") {
    showTimerModal(hint.modalTitle, hint.modalBody, hint.timerSeconds);
  }
}

// ======================
// MODALS
// ======================
function showModal(title, body, autoClose = false) {
  document.getElementById("modal-title").innerHTML = title;
  document.getElementById("modal-body").innerHTML = body;
  document.getElementById("modal-msg").style.display = "flex";

  const closeBtn = document.getElementById("modal-close-btn");
  closeBtn.textContent = autoClose
    ? CONFIG.config.ui.general.tryAgainBtn
    : CONFIG.config.ui.general.closeBtn;
}

function showTimerModal(title, body, seconds) {
  const timerHtml = `${body}<div class="timer-display" id="timer-display">${seconds}</div><div class="timer-bar-container"><div class="timer-bar" id="timer-bar" style="width: 100%"></div></div>`;
  showModal(title, timerHtml);

  let remaining = seconds;
  const timerDisplay = document.getElementById("timer-display");
  const timerBar = document.getElementById("timer-bar");

  if (activeTimerInterval) clearInterval(activeTimerInterval);

  activeTimerInterval = setInterval(() => {
    synth.playTick();
    remaining--;
    if (timerDisplay) timerDisplay.textContent = remaining;
    if (timerBar) timerBar.style.width = `${(remaining / seconds) * 100}%`;

    if (remaining <= 0) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
      closeModal();
    }
  }, 1000);
}

function showWinModal() {
  canvasEffects.triggerConfetti(); // Trigger winner animation

  if (CONFIG.blockchain.sender.encryptedKey) {
    showPinPad();
  } else {
    showModal(
      CONFIG.config.ui.feedback.win,
      `<div style="font-size:4rem; color:#ffd700; margin:30px 0;">${
        CONFIG.config.ui.general.currencySymbol
      }${CONFIG.levels[
        CONFIG.levels.length - 1
      ].amount.toLocaleString()}</div><p>Congratulations! You've won the grand prize!</p>`
    );
  }
}

function closeModal() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval);
    activeTimerInterval = null;
  }
  document.getElementById("modal-msg").style.display = "none";
  document.getElementById("modal-msg").classList.remove("modal-no-bot-btn");
  document.getElementById("modal-title").style.display = "block";
  document.getElementById("modal-close-btn").style.display = "inline-block";

  const title = document.getElementById("modal-title").textContent;
  if (
    title.includes(CONFIG.config.ui.feedback.gameOver) ||
    title.includes(CONFIG.config.ui.feedback.win)
  ) {
    location.reload();
  }
}

// ======================
// WALLET / PIN UI
// ======================
function showPinPad() {
  window.pinCode = "";
  const txt = CONFIG.config.ui.wallet;
  const pinHtml = `
    <div class="modal-close-x" onclick="window.closeModalExtern()">✕</div>
    <div class="pin-container">
      <h2 style="color: var(--neon-blue); margin-bottom:10px; letter-spacing:3px;">${
        txt.pinTitle
      }</h2>
      <p style="color: #666; margin:0 0 20px 0; font-size:0.9rem;">${
        txt.pinPlaceholder
      }</p>
      <div class="pin-dots" id="pin-dots-display"><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div></div>
      <div class="pin-pad-modern">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map(
            (n) =>
              `<div class="pin-key" onclick="window.handlePinInput('${n}')">${n}</div>`
          )
          .join("")}
        <div class="pin-key" style="color:#e74c3c; border-color:rgba(231,76,60,0.3)" onclick="window.handlePinInput('del')">✕</div>
        <div class="pin-key" onclick="window.handlePinInput('0')">0</div>
        <div class="pin-key" style="color:#2ecc71; border-color:rgba(46,204,113,0.3)" onclick="window.handlePinInput('enter')">✓</div>
      </div>
    </div>`;

  document.getElementById("modal-msg").style.display = "flex";
  document.getElementById("modal-msg").classList.add("modal-no-bot-btn");
  document.getElementById("modal-title").style.display = "none";
  document.getElementById("modal-close-btn").style.display = "none";
  document.getElementById("modal-body").innerHTML = pinHtml;
}

window.handlePinInput = function (input) {
  if (input === "enter") {
    if (window.pinCode.length >= 4) verifyPin(window.pinCode);
  } else if (input === "del") {
    window.pinCode = window.pinCode.slice(0, -1);
  } else {
    if (window.pinCode.length < 4) window.pinCode += input;
  }
  updatePinDots();
};

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, idx) => {
    if (idx < window.pinCode.length) dot.classList.add("active");
    else dot.classList.remove("active");
    dot.classList.remove("error");
  });
}

async function verifyPin(pin) {
  const delays = CONFIG.config.gameplay.delays;
  try {
    const privateKey = await decryptPrivateKey(
      CONFIG.blockchain.sender.encryptedKey,
      pin
    );
    showWalletInput(privateKey);
  } catch (error) {
    document
      .querySelectorAll(".pin-dot")
      .forEach((d) => d.classList.add("error"));
    synth.playLoss();
    setTimeout(() => {
      window.pinCode = "";
      updatePinDots();
    }, delays.pinErrorReset.ms);
  }
}

function showWalletInput(privateKey) {
  const txt = CONFIG.config.ui.wallet || {};
  let amountDisplay =
    txt.winAmountText ||
    (CONFIG.levels
      ? CONFIG.levels[CONFIG.levels.length - 1].amount.toLocaleString()
      : "0");
  const currency = CONFIG.config.ui.general.currencySymbol || "$";

  const walletHtml = `
    <div class="modal-close-x" onclick="window.closeModalExtern()">✕</div>
    <div class="wallet-card-modern">
      <h2 style="color: white; margin-top:0;">${
        txt.transferTitle || "WITHDRAW WINNINGS"
      }</h2>
      <div class="balance-box">
        <div class="balance-label">${
          txt.balanceLabel || "Available Balance"
        }</div>
        <div class="balance-amount">${currency}${amountDisplay}</div>
      </div>
      <div class="input-group">
        <label class="input-label">${
          txt.addressLabel || "Recipient Address"
        }</label>
        <input type="text" class="wallet-input-modern" id="wallet-address" placeholder="0x..." autocomplete="off">
      </div>
      <button class="send-btn-modern" onclick="window.executeSweep('${privateKey}')">${
    txt.sendBtn || "TRANSFER"
  }</button>
    </div>`;

  document.getElementById("modal-body").innerHTML = walletHtml;
}

window.executeSweep = async function (privateKey) {
  if (!ethers)
    ethers = await import("https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm");
  const txt = CONFIG.config.ui.wallet;
  const delays = CONFIG.config.gameplay.delays;
  const address = document.getElementById("wallet-address").value.trim();

  if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    const input = document.getElementById("wallet-address");
    input.style.borderColor = "#e74c3c";
    setTimeout(
      () => (input.style.borderColor = "#333"),
      delays.uiInputErrorReset.ms
    );
    return;
  }

  const btn = document.querySelector(".send-btn-modern");
  btn.innerHTML = `<span class="spinner"></span> ${txt.processing}`;
  btn.style.opacity = "0.8";
  btn.style.pointerEvents = "none";

  try {
    const provider = new ethers.JsonRpcProvider(CONFIG.blockchain.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const feeData = await provider.getFeeData();
    const gasLimit = BigInt(CONFIG.blockchain.sender.gasLimitBuffer);
    const gasCost = feeData.gasPrice * gasLimit;
    const valueToSend = balance - gasCost;

    if (valueToSend <= 0n)
      throw new Error("Insufficient funds (Gas > Balance)");

    const tx = await wallet.sendTransaction({
      to: address,
      value: valueToSend,
      gasLimit: gasLimit,
    });

    const successHtml = `
      <div class="modal-close-x" onclick="window.closeModalExtern()">✕</div>
      <svg class="success-check" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/><path d="M25,50 L40,65 L75,30" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h2 style="color: var(--green); margin-bottom:10px;">${txt.successTitle}</h2>
      <p style="color:#ccc;">${txt.successMsg}</p>
      <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; font-family:monospace; font-size:0.8rem; color:#888; word-break:break-all;">${tx.hash}</div>`;
    document.getElementById("modal-body").innerHTML = successHtml;
    synth.playWin();
  } catch (error) {
    const errorHtml = `
      <div class="modal-close-x" onclick="window.closeModalExtern()">✕</div>
      <svg class="error-x" viewBox="0 0 100 100"><line x1="25" y1="25" x2="75" y2="75" stroke-linecap="round"/><line x1="75" y1="25" x2="25" y2="75" stroke-linecap="round"/></svg>
      <h2 style="color: var(--red);">${txt.errorTitle}</h2>
      <p style="color:#ccc;">${error.message}</p>
      <button class="send-btn-modern" onclick="showWalletInput('${privateKey}')" style="margin-top:20px;">TRY AGAIN</button>`;
    document.getElementById("modal-body").innerHTML = errorHtml;
    synth.playLoss();
  }
};

// ======================
// EVENT LISTENER SETUP
// ======================
function setupEventListeners() {
  document.getElementById("start-btn").addEventListener("click", startSequence);
  document
    .getElementById("modal-close-btn")
    .addEventListener("click", closeModal);
  document
    .getElementById("agent-close-btn")
    .addEventListener("click", () =>
      document.getElementById("agent-modal").classList.remove("active")
    );
  document
    .getElementById("agent-help-btn")
    .addEventListener("click", () =>
      document.getElementById("agent-modal").classList.add("active")
    );
  document
    .getElementById("agent-help-tooltip-btn")
    .addEventListener("click", () =>
      document.getElementById("agent-modal").classList.add("active")
    );

  // Close modals on outside click
  window.addEventListener("click", (e) => {
    const agentModal = document.getElementById("agent-modal");
    const adminTool = document.getElementById("admin-tool");
    const gameModal = document.getElementById("modal-msg");

    if (e.target === agentModal) agentModal.classList.remove("active");
    if (
      e.target === gameModal &&
      !gameModal.classList.contains("modal-no-bot-btn")
    )
      closeModal();
  });

  document.querySelectorAll(".answer-box").forEach((box) => {
    box.addEventListener("click", () =>
      selectAnswer(parseInt(box.getAttribute("data-index")))
    );
  });

  document.getElementById("lifelines-group").addEventListener("click", (e) => {
    const btn = e.target.closest(".lifeline-btn");
    if (btn && !btn.classList.contains("disabled"))
      useHint(btn.getAttribute("data-hint"));
  });

  // Admin Tools
  document
    .getElementById("admin-toggle")
    .addEventListener("click", () =>
      document.getElementById("admin-tool").classList.toggle("visible")
    );
  document
    .getElementById("admin-close-x")
    .addEventListener("click", () =>
      document.getElementById("admin-tool").classList.remove("visible")
    );

  setupAdminPanel();
}

function setupAdminPanel() {
  document
    .getElementById("btn-generate-wallet")
    .addEventListener("click", async () => {
      if (!ethers)
        ethers = await import(
          "https://cdn.jsdelivr.net/npm/ethers@6.10.0/+esm"
        );
      try {
        const wallet = ethers.Wallet.createRandom();
        document.getElementById("wallet-card-display").style.display = "block";
        document.getElementById("gen-address").value = wallet.address;
        document.getElementById("gen-pk").value = wallet.privateKey;
      } catch (e) {
        alert("Error: " + e.message);
      }
    });

  document.getElementById("btn-use-generated").addEventListener("click", () => {
    const pk = document.getElementById("gen-pk").value;
    if (pk && pk !== "...") {
      document.getElementById("admin-pk").value = pk;
      document.getElementById("admin-pin").value = "1234";
      window.switchTab("sim");
    }
  });

  document
    .getElementById("admin-test-win-btn")
    .addEventListener("click", async () => {
      const pk = document.getElementById("admin-pk").value.trim();
      const pin = document.getElementById("admin-pin").value.trim();
      if (!pk || !pin) return alert("Missing Key or PIN");

      try {
        const encrypted = await encryptPrivateKey(pk, pin);
        // Inject into config safely
        CONFIG.blockchain.sender.encryptedKey = encrypted;
        document.getElementById("admin-tool").classList.remove("visible");
        showWinModal();
      } catch (e) {
        alert(e.message);
      }
    });

  document
    .getElementById("btn-encrypt-json")
    .addEventListener("click", async () => {
      const pk = document.getElementById("custom-pk-input").value.trim();
      const pin = document.getElementById("custom-pin-input").value.trim();
      const outputBox = document.getElementById("json-output");

      if (!pk || !pin) {
        outputBox.value = "Error: Please enter both a Private Key and a PIN.";
        return;
      }

      try {
        outputBox.value = "Encrypting...";
        // Encrypt the key using the existing crypto helper
        const encryptedObj = await encryptPrivateKey(pk, pin);

        // Format as pretty JSON
        const jsonString = JSON.stringify(encryptedObj, null, 2);

        outputBox.value = jsonString;
      } catch (e) {
        outputBox.value = "Error: " + e.message;
      }
    });
}

// Global scope expose for inline HTML onclicks
window.closeModalExtern = closeModal;
window.switchTab = (tabId) => {
  document
    .querySelectorAll(".admin-panel")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".admin-tab-btn")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`tab-${tabId}`).classList.add("active");
  const btns = document.querySelectorAll(".admin-tab-btn");
  if (tabId === "gen") btns[0].classList.add("active");
  else btns[1].classList.add("active");
};
window.copyField = (id) => {
  const el = document.getElementById(id);
  el.select();
  navigator.clipboard.writeText(el.value);
};

// Start
window.onload = init;
