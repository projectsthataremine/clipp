const path = require("path");
const fs = require("fs");
const { machineIdSync } = require("node-machine-id");
const { subtle } = require("crypto").webcrypto;
const { PUBLIC_LICENSE_KEY, EDGE_FUNCTION_SECRET } = require("./constants");
const { TextEncoder } = require("util");

class AppStore {
  constructor() {
    this.lastActiveApp = "";
    this.isOpen = false;
    this.win = null;
    this.isLicenseValid = false;
    this.licenseCheckInterval = null;
    this.updateAvailable = false;
    this.requiresAuth = false;
    this.trialExpired = false;
    this.mouseClickListener = null;

    this.validateLicense();
  }

  setWindow(win) {
    this.win = win;
  }

  getWindow() {
    return this.win;
  }

  setUpdateAvailable(isAvailable) {
    this.updateAvailable = isAvailable;
    if (this.win) {
      this.win.webContents.send("update-available", { isAvailable });
    }
  }
  
  getUpdateAvailable() {
    return this.updateAvailable;
  }

  setRequiresAuth(requiresAuth) {
    this.requiresAuth = requiresAuth;
    if (this.win) {
      this.win.webContents.send("auth-required", { requiresAuth });
    }
  }

  getRequiresAuth() {
    return this.requiresAuth;
  }

  setTrialExpired(trialExpired) {
    this.trialExpired = trialExpired;
    if (this.win) {
      this.win.webContents.send("trial-expired", { trialExpired });
    }
  }

  getTrialExpired() {
    return this.trialExpired;
  }

  async open() {
    await this.openWithAnimation();
  }

  close() {
    this.isOpen = false;
    this.win.hide();
  }

  closeWithAnimation() {
    if (!this.win) return;

    const duration = 180; // Fast but smooth
    const startTime = Date.now();
    const bounds = this.win.getBounds();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out-quad for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 2);

      // Fade out
      this.win.setOpacity(1 - eased);

      // Subtle slide right (20px) for directional feel
      this.win.setPosition(
        bounds.x + Math.round(20 * eased),
        bounds.y
      );

      if (progress < 1) {
        setTimeout(animate, 16); // ~60fps
      } else {
        this.isOpen = false;
        this.win.hide();
        // Reset for next open
        this.win.setOpacity(1);
        this.win.setPosition(bounds.x, bounds.y);
      }
    };

    animate();
  }

  async openWithAnimation() {
    if (!this.win) return;

    // Get the display where the cursor currently is
    const { screen } = require('electron');
    const cursorPoint = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = currentDisplay.workArea;

    // Position window at right edge of the display where cursor is
    const windowX = displayX + displayWidth - 400;
    const windowY = displayY;

    // Set bounds BEFORE showing - important for proper positioning
    this.win.setBounds({
      x: windowX,
      y: windowY,
      width: 400,
      height: displayHeight
    });

    // Set initial animation state
    this.win.setOpacity(0);
    this.win.setPosition(windowX + 20, windowY);

    // show() both displays AND focuses the window atomically
    // This is more reliable than show() + setTimeout(focus())
    this.win.show();

    // Click-outside detection removed - only Esc key closes the window now

    const duration = 180;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out-quad
      const eased = 1 - Math.pow(1 - progress, 2);

      // Fade in
      this.win.setOpacity(eased);

      // Slide left to normal position
      this.win.setPosition(
        windowX + Math.round(20 * (1 - eased)),
        windowY
      );

      if (progress < 1) {
        setTimeout(animate, 16);
      } else {
        this.isOpen = true;
      }
    };

    animate();

    // Check auth status while animation is running
    const main = require('./main');
    if (main.checkAuthOnStartup) {
      await main.checkAuthOnStartup();
    }
  }

  get IsOpen() {
    return this.isOpen;
  }

  setLastActiveApp(appName) {
    this.lastActiveApp = appName;
  }

  getLastActiveApp() {
    return this.lastActiveApp;
  }

  setLicenseValid(isValid) {
    this.isLicenseValid = isValid;
  }

  getLicenseValid() {
    return this.isLicenseValid;
  }

  updateLicenseStatus(isValid) {
    this.isLicenseValid = isValid;
    if (this.win) {
      this.win?.webContents?.send("license-check-complete", { valid: true });
    }
  }

  async validateLicense() {
    try {
      const licensePath = path.join(__dirname, "license.json");
      let data;

      try {
        data = JSON.parse(fs.readFileSync(licensePath, "utf-8"));
      } catch (readError) {
        if (readError.code === "ENOENT") {
          // File doesn't exist, that's okay
          this.updateLicenseStatus(false);
          return;
        } else {
          // Some other read/parse error — real error
          throw readError;
        }
      }

      const { license_key, machine_id, expires_at, signature } = data;

      if (!license_key || !machine_id || !expires_at || !signature) {
        console.error("Missing required fields in license data.");
        this.updateLicenseStatus(false);
        return;
      }

      const currentMachineId = machineIdSync();

      if (currentMachineId !== machine_id) {
        console.error("Machine ID mismatch.");
        this.updateLicenseStatus(false);
        return;
      }

      const now = new Date();
      const expiresAt = new Date(expires_at);
      if (now >= expiresAt) {
        console.error("License has expired.");
        this.updateLicenseStatus(false);
        return;
      }

      const payload = { license_key, machine_id, expires_at };
      const signatureValid = await this.verifySignature(payload, signature);

      if (!signatureValid) {
        console.error("Signature verification failed.");
        this.updateLicenseStatus(false);
        return;
      }

      const { valid: isValidLicense } = await this.pingValidateLicense({
        license_key,
        machine_id,
      });

      if (!isValidLicense) {
        console.error("Network validation failed.");
        this.updateLicenseStatus(false);
        return;
      }

      console.log("✅ License is valid.");
      this.updateLicenseStatus(true);
      this.startLicenseValidationTimer();
    } catch (error) {
      console.error("License validation failed:", error);
      this.updateLicenseStatus(false);
    }
  }

  startLicenseValidationTimer() {
    if (this.licenseCheckInterval) {
      clearInterval(this.licenseCheckInterval);
    }

    this.licenseCheckInterval = setInterval(() => {
      this.validateLicense();
    }, 1000 * 60 * 60 * 5); // every 5 hours
  }

  async verifySignature(payload, signatureBase64) {
    if (!PUBLIC_LICENSE_KEY) throw new Error("Public key is missing");

    const publicKeyBytes = Uint8Array.from(
      Buffer.from(PUBLIC_LICENSE_KEY, "base64")
    );

    const cryptoKey = await subtle.importKey(
      "spki",
      publicKeyBytes.buffer,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));

    const signatureBytes = Uint8Array.from(
      Buffer.from(signatureBase64, "base64")
    );

    const isValid = await subtle.verify(
      "Ed25519",
      cryptoKey,
      signatureBytes,
      encodedPayload
    );

    return isValid;
  }

  async addLicenseKey(license_key) {
    const { valid, payload, signature } = await this.pingValidateLicense({
      license_key,
      machine_id: machineIdSync(),
      return_signed_license: true,
    });

    if (!valid) {
      throw new Error("Invalid license key.");
    }

    if (!payload || !signature) {
      throw new Error("Missing license payload or signature from server.");
    }

    const licensePath = path.join(__dirname, "license.json");

    const licenseData = {
      ...payload, // { license_key, machine_id, expires_at }
      signature, // attach server-provided signature
    };

    fs.writeFileSync(
      licensePath,
      JSON.stringify(licenseData, null, 2),
      "utf-8"
    );

    return await this.validateLicense();
  }

  async pingValidateLicense({
    license_key,
    machine_id,
    return_signed_license = false,
  }) {
    if (!license_key || !machine_id) {
      console.error("❌ Missing required fields for license validation.");
      return { valid: false };
    }
    try {
      const response = await fetch(
        "https://gmzwsqjmqakjijnnfxbf.supabase.co/functions/v1/validate_license",
        {
          method: "POST",
          headers: {
            Authorization: EDGE_FUNCTION_SECRET,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: +license_key,
            machine_id,
            return_signed_license,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "pingValidateLicense failed with status:",
          response.status
        );
        return { valid: false };
      }

      const data = await response.json();

      if (data.error) {
        console.error(
          "pingValidateLicense failed with status:",
          response.status,
          data
        );
        return { valid: false };
      }

      return data; // { valid: true, payload?, signature? }
    } catch (err) {
      console.error(
        "Network validation failed, falling back to local license:",
        err
      );
      return { valid: true }; // fallback to trusting local
    }
  }

  startMouseClickListener() {
    if (this.mouseClickListener) return;

    const { screen } = require('electron');

    let windowHasFocus = false;

    // Track if window ever gains focus
    const focusHandler = () => {
      console.log('[Focus] Window gained focus');
      windowHasFocus = true;
    };

    const blurHandler = () => {
      console.log('[Focus] Window lost focus (blur event)');
      if (this.isOpen) {
        this.closeWithAnimation();
        this.stopMouseClickListener();
      }
    };

    // Use 'once' so these handlers clean up automatically after first fire
    this.win.once('focus', focusHandler);
    this.win.once('blur', blurHandler);

    let consecutiveOutsideChecks = 0;
    const CHECKS_BEFORE_CLOSE = 3; // 150ms total (3 checks * 50ms)

    this.mouseClickListener = setInterval(() => {
      if (!this.isOpen || !this.win) {
        this.stopMouseClickListener();
        return;
      }

      // If window has focus, blur event will handle closing - no need to poll
      if (windowHasFocus) {
        return;
      }

      // Fallback for when window doesn't have focus: detect mouse outside
      const mousePos = screen.getCursorScreenPoint();
      const winBounds = this.win.getBounds();

      const isInside =
        mousePos.x >= winBounds.x &&
        mousePos.x <= winBounds.x + winBounds.width &&
        mousePos.y >= winBounds.y &&
        mousePos.y <= winBounds.y + winBounds.height;

      if (!isInside) {
        consecutiveOutsideChecks++;

        // Close if mouse has been outside for 3 consecutive checks
        if (consecutiveOutsideChecks >= CHECKS_BEFORE_CLOSE) {
          console.log('[Focus] Mouse outside for', CHECKS_BEFORE_CLOSE * 50, 'ms - closing');
          this.closeWithAnimation();
          this.stopMouseClickListener();
        }
      } else {
        // Reset counter if mouse comes back inside
        consecutiveOutsideChecks = 0;
      }
    }, 50); // Check every 50ms

    // Store cleanup function
    this.mouseClickCleanup = () => {
      this.win.off('focus', focusHandler);
      this.win.off('blur', blurHandler);
    };
  }

  stopMouseClickListener() {
    if (this.mouseClickListener) {
      clearInterval(this.mouseClickListener);
      this.mouseClickListener = null;
    }
    if (this.mouseClickCleanup) {
      this.mouseClickCleanup();
      this.mouseClickCleanup = null;
    }
  }

  cleanup() {
    console.log("Cleaning up AppStore intervals");
    if (this.licenseCheckInterval) {
      clearInterval(this.licenseCheckInterval);
      this.licenseCheckInterval = null;
    }
    this.stopMouseClickListener();
  }
}

module.exports = new AppStore();
