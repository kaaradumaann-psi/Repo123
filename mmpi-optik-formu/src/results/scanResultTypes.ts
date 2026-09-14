import type { GrayImage, Point } from '../omr/omrTypes';

export type ReadStatus = 'unread' | 'blank' | 'single' | 'multiple' | 'ambiguous' | 'reliable' | 'invalid';
export type ResponseMeasurement = {
  responseId: string;
  choiceId: string;
  darkness: number;
  coverage: number;
};
export type ItemReadResult = {
  itemId: string;
  itemNumber: number;
  status: ReadStatus;
  choiceId: string | null;
  confidence: number;
  measurements: ResponseMeasurement[];
  reason: string;
};
export type QualityReport = {
  ok: boolean;
  reasons: string[];
  score: number;
  metrics: {
    brightness: number;
    shadowSpread: number;
    laplacianVariance: number;
    borderContrast: number;
    pixelsPerMm: number;
  };
};
export type PageReadSuccess = {
  ok: true;
  pageId: string;
  pageNumber: number;
  batchId: string;
  fingerprint: string;
  items: ItemReadResult[];
  quality: QualityReport;
  normalized: GrayImage;
  sourceCorners: Point[];
  warnings: string[];
};
export type PageReadFailure = {
  ok: false;
  code: string;
  message: string;
  quality?: QualityReport;
};
export type PageReadResult = PageReadSuccess | PageReadFailure;
export type ManualReview = { choiceId: string | null; reviewedAt: string };
export type ManualReviewEvent = Readonly<{
  itemId: string;
  action: 'review' | 'undo';
  reviewerId: string;
  recordedAt: string;
  previous: Readonly<ManualReview> | null;
  next: Readonly<ManualReview> | null;
}>;
export type StoredScanPage = PageReadSuccess & {
  sourceName: string;
  previewUrl: string;
  reviews: Record<string, ManualReview>;
  reviewHistory: readonly ManualReviewEvent[];
};
