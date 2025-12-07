# Who Wants to Be a Millionaire (Crypto Edition)

A modern, web-based implementation of the classic game show "Who Wants to Be a Millionaire," built with **Vanilla JavaScript**, **CSS3 (Glassmorphism)**, and **Web Crypto API**.

This project features a unique **Blockchain Prize Mechanism**: the game configuration holds an encrypted Ethereum private key. If the player wins the final round and enters the correct PIN, the application decrypts the key in the browser and transfers the funds to the winner's wallet.

## 🌟 Key Features

  * [cite_start]**Progressive Gameplay:** 15 levels of difficulty with "Safe Haven" milestones[cite: 216].
  * [cite_start]**Three Lifelines:** 50:50, Phone a Friend, and Ask AI[cite: 210, 211, 212].
  * **Crypto Prize Integration:**
      * [cite_start]Admin tool to encrypt private keys using **PBKDF2** and **AES-GCM**[cite: 554, 557].
      * [cite_start]Secure client-side decryption upon winning[cite: 641].
      * [cite_start]Integrated **ethers.js** for handling blockchain transactions (Sepolia Testnet default)[cite: 214, 651].
  * [cite_start]**Dynamic Audio Engine:** Custom synthesizer using the Web Audio API (no external MP3s required)[cite: 510].
  * [cite_start]**Rich UI/UX:** Neon/Glassmorphism design, 3D CSS logo animations, and particle effects[cite: 8, 461, 518].
  * [cite_start]**Multi-Language Support:** JSON-based configuration supporting English, Russian, and Ukrainian[cite: 168, 271, 361].
  * [cite_start]**AI Host Protocol:** Includes a specific context protocol for LLMs to act as the game show host via text-to-speech engines[cite: 183].

## 📂 Project Structure

```text
game/
├── css/
│   └── style.css       # Neon/Glass UI styles and animations
├── data/
│   ├── en.json         # English config, questions, and AI prompt
│   ├── ru.json         # Russian config
│   └── uk.json         # Ukrainian config
├── js/
│   ├── audio.js        # Web Audio API synthesizer
│   ├── canvas.js       # Background particles and confetti
│   ├── config.js       # JSON loader
│   ├── crypto.js       # PBKDF2/AES-GCM encryption logic
│   └── game.js         # Core game loop and DOM manipulation
└── index.html          # Main entry point
```

## 🚀 Getting Started

### Prerequisites

Because this project uses JavaScript ES Modules (`<script type="module">`), you cannot open `index.html` directly from the file system (`file://`). You must serve it over HTTP.

### Installation

1.  **Clone or Download** the repository.
2.  **Start a Local Server**.
      * **VS Code:** Install the "Live Server" extension, right-click `index.html`, and choose "Open with Live Server".
      * **Python:** Run `python -m http.server 8000` in the project root.
      * **Node:** Run `npx http-server`.
3.  **Open in Browser:** Navigate to `http://localhost:8000`.

### Configuration

[cite_start]By default, the game may load the Russian or English config depending on the `game.js` fallback[cite: 550]. To force a specific language, use URL parameters:

  * **English:** `index.html?game=data/en.json`
  * **Ukrainian:** `index.html?game=data/uk.json`
  * **Russian:** `index.html?game=data/ru.json`

## 💰 Setting Up the Crypto Prize

The game allows an administrator to embed a prize (ETH) inside the game configuration securely.

1.  **Open the Admin Tool:**
      * Launch the game.
      * [cite_start]Click the **Wrench Icon (🔧)** in the bottom-left corner[cite: 489].
2.  **Generate or Encrypt a Key:**
      * Go to the **Generator** tab.
      * Enter a **Private Key** (for the wallet holding the prize money).
      * Enter a **4-digit PIN** (this will be given to the player or acts as the unlock code).
      * [cite_start]Click **"Encrypt & Get JSON"**[cite: 504].
3.  **Update Configuration:**
      * Copy the generated JSON output.
      * Open your active config file (e.g., `data/en.json`).
      * [cite_start]Replace the `blockchain.sender.encryptedKey` object with your new encrypted data[cite: 214].
      * [cite_start]Ensure the `blockchain.sender.gasLimitBuffer` is sufficient (Default: 21000)[cite: 215].

**⚠️ Security Note:** The encryption uses `PBKDF2` for key derivation and `AES-GCM` for encryption. While secure for web standards, do not use a wallet containing life savings. Use a dedicated "Burner Wallet" with only the prize amount.

## 🤖 AI Agent Protocol

[cite_start]The configuration files (`data/*.json`) contain a section called `agentProtocol`[cite: 183]. This text is designed to be fed into an LLM (like ChatGPT or Perplexity) to allow an AI to roleplay as the Game Show Host.

  * **Concept:** The AI reads the JSON questions and the user's screenshots.
  * [cite_start]**Rules:** The protocol instructs the AI to be energetic, avoid spoilers, and manage the "game state" (e.g., "Player Thinking", "Correct Answer")[cite: 184, 190].

## 🎮 How to Play

1.  **Start:** Click "Start Game".
2.  **Answer:** Select the correct option (A, B, C, D) for 15 questions.
3.  **Lifelines:**
      * [cite_start]**50:50:** Removes two wrong answers[cite: 210].
      * [cite_start]**Phone/AI:** Simulates a timer for external help[cite: 211, 212].
4.  **Win:** If you answer Question 15 correctly:
      * Enter the PIN provided by the game admin.
      * Enter your Ethereum wallet address.
      * [cite_start]The game sweeps the funds to your address[cite: 646].

## 🛠 Technologies

  * [cite_start]**Encryption:** `crypto.subtle.importKey` (PBKDF2) & `crypto.subtle.encrypt` (AES-GCM)[cite: 555, 559].
  * [cite_start]**Blockchain:** `ethers.js` (v6) via CDN dynamic import[cite: 651].
  * [cite_start]**Styles:** CSS Variables for easy theming (Neon colors defined in `:root`)[cite: 8].

## 📄 License

Open Source. Feel free to modify and distribute.
