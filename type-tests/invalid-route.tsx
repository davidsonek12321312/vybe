// Spec 001 REQ-003 negative type test (Scenario 4). This file must NOT
// compile: "/does-not-exist" is not a route. Checked by `npm run test:types`
// through tsconfig.typetest.json; excluded from `npm run typecheck`.
import { Link } from 'expo-router';

export function InvalidRouteFixture() {
  return <Link href="/does-not-exist">Invalid route</Link>;
}
