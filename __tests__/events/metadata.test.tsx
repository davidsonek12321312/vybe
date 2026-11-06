/**
 * Event page metadata — Spec 002 REQ-048, task 18 (metadata escaping) and
 * threat T-XSS: a hostile title must not break out of <title> or og:title.
 * Uses Expo's own metadata serializer, as the server renderer does.
 */
import { serializeMetadataToReact } from '@expo/router-server/build/utils/metadata/serialize';
import { renderToStaticMarkup } from 'react-dom/server';

import { generateMetadata } from '../../src/app/events/[slug]';
import * as routeData from '../../src/features/events/route-data';
import { buildSampleEvents } from '../../src/features/events/sample-events';
import type { EventDetail } from '../../src/features/events/types';

const HOSTILE = 'Beach "Night" <script>alert(1)</script> & more';

afterEach(() => jest.restoreAllMocks());

async function renderHead(slug: string): Promise<string> {
  const metadata = await generateMetadata(undefined, { slug });
  return renderToStaticMarkup(<>{serializeMetadataToReact(metadata)}</>);
}

test('quotes, ampersands and <script> in a title are escaped in <title> and og:title', async () => {
  const sample = buildSampleEvents(new Date()).find((e) => e.slug === 'beach-social-001') as EventDetail;
  jest.spyOn(routeData, 'loadEventForRoute').mockResolvedValue({ ...sample, title: HOSTILE });

  const html = await renderHead('beach-social-001');

  expect(html).not.toContain('<script>');
  expect(html).toContain('<title>Beach &quot;Night&quot; &lt;script&gt;alert(1)&lt;/script&gt; &amp; more · MOVA</title>');
  expect(html).toContain('property="og:title" content="Beach &quot;Night&quot; &lt;script&gt;alert(1)&lt;/script&gt; &amp; more"');
});

test('unknown slug → "Event not available" title and noindex', async () => {
  jest.spyOn(routeData, 'loadEventForRoute').mockResolvedValue(null);
  const html = await renderHead('does-not-exist');
  expect(html).toContain('<title>Event not available · MOVA</title>');
  expect(html).toMatch(/<meta name="robots" content="noindex/);
});
