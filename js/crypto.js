// ======================
// CRYPTO UTILITIES
// ======================
export async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(privateKey, pin) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(pin, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(privateKey)
  );

  return {
    ciphertext: Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    salt: Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };
}

export async function decryptPrivateKey(encryptedObj, pin) {
  const salt = new Uint8Array(
    encryptedObj.salt.match(/.{2}/g).map((byte) => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    encryptedObj.iv.match(/.{2}/g).map((byte) => parseInt(byte, 16))
  );
  const ciphertext = new Uint8Array(
    encryptedObj.ciphertext.match(/.{2}/g).map((byte) => parseInt(byte, 16))
  );

  const key = await deriveKey(pin, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error("Decryption failed - wrong PIN");
  }
}
