const HOUR_SECONDS = 60 * 60;
const SEVEN_DAYS_SECONDS = 7 * 24 * HOUR_SECONDS;

export type DeadlineClassification =
  | {
      kind: "invalid";
      importable: false;
      auditLabel: "Unavailable Deadline";
      routeMode: "Blocked";
      blockReason: "Deadline is missing or invalid.";
      warnings: [];
    }
  | {
      kind: "expired";
      importable: false;
      auditLabel: "Expired Market";
      routeMode: "Blocked";
      blockReason: "Market already expired.";
      warnings: [];
    }
  | {
      kind: "too-soon";
      importable: false;
      auditLabel: "Too Soon";
      routeMode: "Blocked";
      blockReason: "Market expires too soon for reliable audit.";
      warnings: [];
    }
  | {
      kind: "short-horizon";
      importable: true;
      auditLabel: "Short Horizon Audit";
      routeMode: "Short Horizon Testnet Receipt";
      warnings: readonly [
        "Fast resolution",
        "High urgency",
        "Testnet only",
      ];
    }
  | {
      kind: "standard";
      importable: true;
      auditLabel: "Standard Lifecycle Audit";
      routeMode: "Standard Testnet Receipt";
      warnings: [];
    };

export function classifyDeadline(
  deadlineValue: string | number | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): DeadlineClassification {
  const deadline = Number(deadlineValue);

  if (!Number.isFinite(deadline) || deadline <= 0) {
    return {
      kind: "invalid",
      importable: false,
      auditLabel: "Unavailable Deadline",
      routeMode: "Blocked",
      blockReason: "Deadline is missing or invalid.",
      warnings: [],
    };
  }

  if (deadline <= nowSeconds) {
    return {
      kind: "expired",
      importable: false,
      auditLabel: "Expired Market",
      routeMode: "Blocked",
      blockReason: "Market already expired.",
      warnings: [],
    };
  }

  if (deadline < nowSeconds + HOUR_SECONDS) {
    return {
      kind: "too-soon",
      importable: false,
      auditLabel: "Too Soon",
      routeMode: "Blocked",
      blockReason: "Market expires too soon for reliable audit.",
      warnings: [],
    };
  }

  if (deadline < nowSeconds + SEVEN_DAYS_SECONDS) {
    return {
      kind: "short-horizon",
      importable: true,
      auditLabel: "Short Horizon Audit",
      routeMode: "Short Horizon Testnet Receipt",
      warnings: [
        "Fast resolution",
        "High urgency",
        "Testnet only",
      ],
    };
  }

  return {
    kind: "standard",
    importable: true,
    auditLabel: "Standard Lifecycle Audit",
    routeMode: "Standard Testnet Receipt",
    warnings: [],
  };
}

export function isShortHorizonDeadline(
  deadlineValue: string | number | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return classifyDeadline(deadlineValue, nowSeconds).kind === "short-horizon";
}
