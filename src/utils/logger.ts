/**
 * Production-ready logging system for Vite + React (TypeScript)
 * Handles BigInt serialization safely.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component?: string;
}

class Logger {
  private loggedMessages = new Set<string>();
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;
  private enabled = true;

  // ---------- Base Log ---------- //
  private log(level: LogLevel, message: string, data?: any, component?: string) {
    if (!this.enabled) return;

    // 🔥 LOG EACH UNIQUE MESSAGE ONLY ONCE
    const messageId = `${message}:${this.safeStringify(data)}`;
    if (this.isDev && this.loggedMessages.has(messageId)) return;
    if (this.isDev) this.loggedMessages.add(messageId);

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      component,
      data: this.sanitizeData(data),
    };

    // DEV MODE → Styled logs
    if (this.isDev) {
      const prefix = this.getEmojiPrefix(level);
      const style = this.getConsoleStyle(level);

      console.groupCollapsed(`%c${prefix} ${message}`, style);
      console.log("Time:", entry.timestamp.toISOString());
      if (component) console.log("Component:", component);
      if (data) console.log("Data:", entry.data);
      console.groupEnd();
    }

    // PROD MODE → Only WARN + ERROR with timestamp
    if (this.isProd && (level === "warn" || level === "error")) {
      const method = level === "warn" ? console.warn : console.error;
      method(
        `[${level.toUpperCase()}] (${entry.timestamp.toISOString()}) ${message}`,
        entry.data || ""
      );
    }

    // Optional background monitoring
    if (this.isProd && level === "error") {
      void this.sendToMonitoring(entry);
    }
  }

  // ---------- Public API ---------- //
  debug(msg: string, data?: any, component?: string) {
    if (this.isDev) this.log("debug", msg, data, component);
  }

  info(msg: string, data?: any, component?: string) {
    if (this.isDev) this.log("info", msg, data, component);
  }

  warn(msg: string, data?: any, component?: string) {
    this.log("warn", msg, data, component);
  }

  error(msg: string, data?: any, component?: string) {
    this.log("error", msg, data, component);
  }

  userAction(action: string, metadata?: any, component?: string) {
    const sanitized = this.sanitizeUserData(metadata);

    if (this.isDev) {
      this.log("info", `UserAction: ${action}`, sanitized, component);
    }

    // Production analytics hook — safe
    if (this.isProd) {
      // e.g. analytics.track(action, sanitized)
    }
  }

  forComponent(name: string) {
    return {
      debug: (msg: string, data?: any) => this.debug(msg, data, name),
      info: (msg: string, data?: any) => this.info(msg, data, name),
      warn: (msg: string, data?: any) => this.warn(msg, data, name),
      error: (msg: string, data?: any) => this.error(msg, data, name),
      action: (act: string, meta?: any) => this.userAction(act, meta, name),
    };
  }

  setEnabled(state: boolean) {
    this.enabled = state;
  }

  // ---------- Sanitization & BigInt Handling ---------- //
  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, (_key, value) => {
        if (typeof value === "bigint") return value.toString() + "n";
        return value;
      });
    } catch {
      return "[Unserializable]";
    }
  }

  private sanitizeData(data: any) {
    if (!data) return data;
    try {
      const bigIntSafe = this.convertBigIntsToStrings(data);
      return this.limitDepth(bigIntSafe, 3);
    } catch {
      return "[Unserializable Data]";
    }
  }

  private convertBigIntsToStrings(obj: any): any {
    if (typeof obj === "bigint") return obj.toString() + "n";
    if (Array.isArray(obj)) return obj.map((i) => this.convertBigIntsToStrings(i));
    if (typeof obj === "object" && obj !== null) {
      const out: any = {};
      Object.entries(obj).forEach(([k, v]) => {
        out[k] = this.convertBigIntsToStrings(v);
      });
      return out;
    }
    return obj;
  }

  private sanitizeUserData(data: any) {
    if (!data || typeof data !== "object") return data;

    const sensitive = [
      "address", "privateKey", "seedPhrase", "password",
      "token", "wallet", "signature", "nonce",
      "portfolio", "balance", "transactionHash",
    ];

    const clean: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (sensitive.includes(key)) return;
      if (typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value)) {
        clean[key] = "0x***" + value.slice(-4);
      } else {
        clean[key] = this.convertBigIntsToStrings(value);
      }
    });

    return clean;
  }

  private limitDepth(obj: any, depth: number): any {
    if (depth <= 0) return "[Depth Limit]";
    if (typeof obj !== "object" || obj === null) return obj;

    if (Array.isArray(obj))
      return obj.slice(0, 10).map((i) => this.limitDepth(i, depth - 1));

    const out: any = {};
    Object.keys(obj)
      .slice(0, 20)
      .forEach((k) => (out[k] = this.limitDepth(obj[k], depth - 1)));
    return out;
  }

  // ---------- Styling & Emojis ---------- //
  private getEmojiPrefix(level: LogLevel) {
    return {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[level];
  }

  private getConsoleStyle(level: LogLevel) {
    return {
      debug: "color:gray; font-weight:normal;",
      info: "color:#0e7cf1;",
      warn: "color:#f5a623; font-weight:bold;",
      error: "color:#e63946; font-weight:bold;",
    }[level];
  }

  // Optional monitoring (non-blocking)
  private async sendToMonitoring(_entry: LogEntry) {
    try {
      // e.g. await fetch("/api/log", { method: "POST", body: JSON.stringify(entry) });
    } catch {
      // silent fail
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Preconfigured component loggers
export const uiLogger = logger.forComponent("UI");
export const poolLogger = logger.forComponent("PoolModule");
export const walletLogger = logger.forComponent("Wallet");