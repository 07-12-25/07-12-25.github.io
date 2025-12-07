# Who Wants to Be a Millionaire (Crypto Edition)

A modern, web-based implementation of the classic game show **“Who Wants to Be a Millionaire”**, built with vanilla JavaScript, CSS3 (glassmorphism), and the Web Crypto API.

This project features a unique **Blockchain Prize Mechanism**: the game configuration holds an encrypted Ethereum private key. If the player wins the final round and enters the correct PIN, the application decrypts the key in the browser and transfers the funds to the winner’s wallet.

---

## 🌟 Key Features

- **Progressive Gameplay**  
  15 levels of difficulty with “Safe Haven” milestones.

- **Three Lifelines**  
  50:50, Phone a Friend, and Ask AI.

- **Crypto Prize Integration**  
  - Admin tool to encrypt private keys using PBKDF2 and AES-GCM.  
  - Secure client-side decryption upon winning.  
  - Integrated `ethers.js` for handling blockchain transactions (Sepolia Testnet by default).

- **Dynamic Audio Engine**  
  Custom synthesizer using the Web Audio API (no external MP3s required).

- **Rich UI/UX**  
  Neon/glassmorphism design, 3D CSS logo animations, and particle effects.

- **Multi-Language Support**  
  JSON-based configuration supporting English, Russian, and Ukrainian.

- **AI Host Protocol**  
  Includes a specific context protocol for LLMs to act as the game show host via text-to-speech engines.

---

## 📂 Project Structure

```
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

---

## 🚀 Getting Started

### Prerequisites

Because this project uses JavaScript ES Modules (`<script type="module">`), you cannot open `index.html` directly from the file system (`file://`). You must serve it over HTTP.

### Installation

1. **Clone or download** the repository.
2. **Start a local server** (choose one option):
   - **VS Code**: Install the “Live Server” extension, right-click `index.html`, and choose **“Open with Live Server”**.
   - **Python**: Run  
     `python -m http.server 8000`  
     in the project root.
   - **Node**: Run  
     `npx http-server`  
     in the project root.
3. **Open in browser**: Navigate to `http://localhost:8000` (or the URL printed by your server).

### Configuration

By default, the game may load the Russian or English config depending on the fallback logic in `game.js`. To force a specific language, use URL parameters:

- English: `index.html?game=data/en.json`  
- Ukrainian: `index.html?game=data/uk.json`  
- Russian: `index.html?game=data/ru.json`

---

## 💰 Setting Up the Crypto Prize

The game allows an administrator to embed a prize (ETH) inside the game configuration securely.

### 1. Open the Admin Tool

1. Launch the game in your browser.  
2. Click the **wrench icon (🔧)** in the bottom-left corner.

### 2. Generate or Encrypt a Key

1. Go to the **Generator** tab.  
2. Enter a **private key** for the wallet holding the prize funds.  
3. Enter a **4-digit PIN** (this will be given to the player or used as the unlock code).  
4. Click **“Encrypt & Get JSON”**.

### 3. Update Configuration

1. Copy the generated JSON output.  
2. Open your active config file (for example, `data/en.json`).  
3. Replace the `blockchain.sender.encryptedKey` object with your new encrypted data.  
4. Ensure `blockchain.sender.gasLimitBuffer` is sufficient (default: `21000`).

> ⚠️ **Security Note**  
> Encryption uses PBKDF2 for key derivation and AES-GCM for encryption. While this is secure for typical web use, do **not** use a wallet containing life savings. Use a dedicated **burner wallet** with only the prize amount.

---

## 🤖 AI Agent Protocol

The configuration files (`data/*.json`) contain a section called `agentProtocol`. This text is designed to be fed into an LLM (such as ChatGPT or Perplexity) to allow an AI to role-play as the game show host.

- **Concept**: The AI reads the JSON questions and the user’s screenshots.  
- **Rules**: The protocol instructs the AI to be energetic, avoid spoilers, and respond according to the visible game state (for example, “Question Appears”, “Player Thinking”, “Correct Answer”).

---

## 🎮 How to Play

1. **Start**: Click **“Start Game”**.
2. **Answer questions**: Select the correct option (A, B, C, D) for 15 questions.
3. **Use lifelines** (optional):
   - **50:50**: Removes two wrong answers.
   - **Phone / AI**: Simulates external help with a short timer.
4. **Win the top prize**:
   - Answer Question 15 correctly.
   - Enter the **PIN** provided by the game admin.
   - Enter your **Ethereum wallet address**.
   - The game sweeps the prize funds to your address (on Sepolia testnet).

---

## 🛠 Technologies

- **Encryption**:  
  `crypto.subtle.importKey` (PBKDF2) and `crypto.subtle.encrypt` (AES-GCM).

- **Blockchain**:  
  `ethers.js` (v6) via dynamic CDN import.

- **Styles**:  
  CSS variables for easy theming (neon colors defined in `:root`).

---

## 📄 License

Open source. Feel free to modify and distribute.
