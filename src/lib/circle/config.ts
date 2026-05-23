export type CircleConfigState = {
  status: "configured" | "not-configured";
  missing: string[];
};

export function getCircleConfigState(): CircleConfigState {
  const required = [
    "CIRCLE_API_KEY",
    "CIRCLE_ENTITY_SECRET",
    "CIRCLE_WALLET_SET_ID",
    "NEXT_PUBLIC_CIRCLE_ENV",
  ];
  const missing = required.filter((key) => !process.env[key]);
  return {
    status: missing.length === 0 ? "configured" : "not-configured",
    missing,
  };
}
