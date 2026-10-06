import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextVitals,
  // Legacy client forms initialize from fetched records in effects; keep this
  // performance diagnostic visible without treating it as a correctness gate.
  { rules: { "react-hooks/set-state-in-effect": "warn" } },
  globalIgnores([".next/**", "node_modules/**", "test-results/**"]),
]);
