import type { FormDefinition } from '../omr/omrTypes';
import type { ScanSet } from '../scanner/pageSequence';
import { sortedPages } from '../scanner/pageSequence';
import { resolveItem } from '../results/resultNormalizer';
import type { ItemAnswer } from '../workspace/caseTypes';

export function scanToAnswers(definition: FormDefinition, scan: ScanSet): ItemAnswer[] {
  const pages = sortedPages(scan);
  const answers: ItemAnswer[] = Array.from({ length: definition.totalItems }, () => undefined);
  for (const pageDef of definition.pages) {
    const stored = pages.find(p => p.pageNumber === pageDef.pageNumber);
    if (!stored) continue;
    for (const itemDef of pageDef.items) {
      const { choiceId, unresolved } = resolveItem(itemDef, stored);
      const idx = itemDef.itemNumber - 1;
      if (unresolved || !choiceId) {
        // Boş bırakılmış veya güvenilir değilse null olarak say (cannot say)
        // Eğer orijinal blank ise null, yoksa undefined bırakmıyoruz ki skor düşmesin? Blank olarak işaretle.
        // OMR'de blank status zaten var, ama resolveItem unresolved ise blank kabul edelim.
        answers[idx] = null;
      } else {
        if (choiceId === 'D' || choiceId === 'Y') answers[idx] = choiceId as ItemAnswer;
        else answers[idx] = null;
      }
    }
  }
  return answers;
}
