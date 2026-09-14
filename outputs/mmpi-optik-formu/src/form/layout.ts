export const FORM = {
  templateId: 'MMPI566-DY-3C48-V1',
  totalItems: 566,
  columnCount: 3,
  rowsPerColumn: 48,
  pageWidthMm: 210,
  pageHeightMm: 297,
  contentLeftMm: 20,
  contentWidthMm: 170,
  gridTopMm: 60,
  gridHeaderMm: 7,
  columnGapMm: 8,
  rowPitchMm: 4.25,
  bubbleDiameterMm: 3.5,
  markerInsetMm: 10,
  markerSizeMm: 5,
  choices: [
    { code: 'D', label: 'Doğru', centerInColumnMm: 27 },
    { code: 'Y', label: 'Yanlış', centerInColumnMm: 43 },
  ],
} as const;

export type AnswerChoice = (typeof FORM.choices)[number]['code'];
export type FormColumn = { index: number; items: number[] };
export type FormPageDefinition = {
  number: number;
  firstItem: number;
  lastItem: number;
  columns: FormColumn[];
};

export const ITEMS_PER_PAGE = FORM.columnCount * FORM.rowsPerColumn;
export const PAGE_COUNT = Math.ceil(FORM.totalItems / ITEMS_PER_PAGE);
export const COLUMN_WIDTH_MM =
  (FORM.contentWidthMm - (FORM.columnCount - 1) * FORM.columnGapMm) / FORM.columnCount;

// Reading order: top to bottom in each column, then left to right.
export const FORM_PAGES: FormPageDefinition[] = Array.from({ length: PAGE_COUNT }, (_, p) => ({
  number: p + 1,
  firstItem: p * ITEMS_PER_PAGE + 1,
  lastItem: Math.min((p + 1) * ITEMS_PER_PAGE, FORM.totalItems),
  columns: Array.from({ length: FORM.columnCount }, (_, c) => ({
    index: c,
    items: Array.from({ length: FORM.rowsPerColumn }, (_, r) =>
      p * ITEMS_PER_PAGE + c * FORM.rowsPerColumn + r + 1,
    ).filter(item => item <= FORM.totalItems),
  })),
}));

// Static template geometry only. This does not detect or interpret answers.
// Coordinates use the physical page's top-left corner as the origin.
export function getBubbleGeometry(item: number, choice: AnswerChoice) {
  if (!Number.isInteger(item) || item < 1 || item > FORM.totalItems) {
    throw new RangeError('Item must be an integer from 1 to 566.');
  }
  const option = FORM.choices.find(option => option.code === choice);
  if (!option) throw new RangeError('Unknown answer choice.');
  const indexOnPage = (item - 1) % ITEMS_PER_PAGE;
  const column = Math.floor(indexOnPage / FORM.rowsPerColumn);
  const row = indexOnPage % FORM.rowsPerColumn;
  return {
    page: Math.floor((item - 1) / ITEMS_PER_PAGE) + 1,
    xMm: FORM.contentLeftMm + column * (COLUMN_WIDTH_MM + FORM.columnGapMm)
      + option.centerInColumnMm,
    yMm: FORM.gridTopMm + FORM.gridHeaderMm + (row + 0.5) * FORM.rowPitchMm,
    diameterMm: FORM.bubbleDiameterMm,
  };
}
