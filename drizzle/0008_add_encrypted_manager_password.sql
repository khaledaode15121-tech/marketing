-- Store an encrypted copy for authorized password viewing while keeping the hash for login verification.
ALTER TABLE `users`
  ADD COLUMN `passwordEncrypted` text NULL AFTER `passwordHash`;
