import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormPage } from '../src/components/FormPage';
import { FORM_PAGES, formDefinition } from '../src/form/layout';
import { FORM_COPYRIGHT_LINE } from '../src/form/attribution';
import { createBatchId } from '../src/form/pageIdentity';

// The identity block is handwriting-only metadata. It must exist on the cover and nowhere else,
// otherwise continuation pages invite duplicate or conflicting entries during a scan session.
const IDENTITY_LABELS = ['FORM KİMLİĞİ', 'KATILIMCI KODU', 'TARİH'];

function renderPage(index: number) {
  return renderToStaticMarkup(createElement(FormPage, {
    page: FORM_PAGES[index]!, definition: formDefinition, batchId: createBatchId(), active: index === 0,
  }));
}

test('identity, participant code and date fields are rendered on the first page only', () => {
  const pages = FORM_PAGES.map((_, index) => renderPage(index));
  assert.equal(pages.length, 4);
  pages.forEach((html, index) => {
    const identityBlocks = html.split('identity-fields').length - 1;
    const labels = IDENTITY_LABELS.filter(label => html.includes(label));
    if (index === 0) {
      assert.equal(identityBlocks, 1, 'The cover must carry exactly one identity block.');
      assert.deepEqual(labels, IDENTITY_LABELS, 'The cover must carry all three identity labels.');
      assert.ok(html.includes('data-identity="cover"'));
      assert.equal(html.split('<b>/</b>').length - 1, 2, 'The date field must expose day/month/year separators.');
      assert.ok(html.includes('marking-example'), 'The marking example belongs to the instructions on the cover.');
    } else {
      assert.equal(identityBlocks, 0, `Page ${index + 1} must not repeat the identity fields.`);
      assert.deepEqual(labels, [], `Page ${index + 1} must not repeat any identity label.`);
      assert.ok(html.includes('data-identity="continuation"'));
      assert.ok(!html.includes('marking-example'));
    }
  });
});

test('every page keeps its own machine identity and item range while the cover keeps the handwriting', () => {
  const pages = FORM_PAGES.map((_, index) => renderPage(index));
  pages.forEach((html, index) => {
    const page = FORM_PAGES[index]!;
    const padded = `${String(page.pageNumber).padStart(2, '0')}<span> / ${String(formDefinition.totalPages).padStart(2, '0')}</span>`;
    assert.ok(html.includes(padded), `Page ${page.pageNumber} must print its own page number and total.`);
    assert.ok(html.includes(`${page.firstItem}–${page.lastItem}. maddeler`));
    assert.ok(html.includes('page-qr'), `Page ${page.pageNumber} must keep its machine-readable QR identity.`);
    assert.ok(html.includes(FORM_COPYRIGHT_LINE),
      `Page ${page.pageNumber} must carry the copyright line under the template id.`);
    assert.equal(html.split('width="5" height="5"').length - 1, 4,
      'All four 5 mm registration squares must survive on every page.');
    assert.equal(html.split('answer-row').length - 1,  page.items.length, 'Every item row must be present.');
  });
  // The cover is the only page allowed to differ in header height; the grid geometry is shared.
  assert.ok(pages[0]!.includes('paper-instructions') && pages[1]!.includes('paper-instructions is-compact'));
  assert.equal(FORM_PAGES.every(page => page.qrArea.x === 164 && page.qrArea.y === 18), true);
});
