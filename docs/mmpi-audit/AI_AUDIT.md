# AI Interpretation Audit (PHASE 11)

AI yorum katmanı denetimi. Kural (görev talimatı §39): **AI hesaplama yapmaz.**
AI'ya yalnızca doğrulanmış scoring çıktısı verilir ve kaynak kurallarına göre
yorum yaptırılır.

---

## Denetlenen modüller

| Modül | İşlev |
|---|---|
| `src/ai/aiInterpretation.ts` | AI yorum istemi / çıktı işleme |
| `src/components/results/AiInterpretationPanel.tsx` | AI yorum arayüzü |
| `supabase/functions/*` | AI çağrısının sunucu tarafı |
| `tests/aiSummaryPrivacy.test.ts` | Gizlilik testi (mevcut ✅) |

---

## Ön tarama bulguları (kod okuması)

### FINDING-AI-001 — AI'ya ne gönderiliyor?

Kontrol edilecek:
- AI istemi **ham cevap matrisini** içeriyor mu? (olmamalı — §39)
- İstemde **T puanları ve bant etiketleri** mi, yoksa AI'ya "hesapla" talimatı mı var?
- İstemde kaynak kural ID'leri (source trace) var mı? (§40)

Durum: **NOT_STARTED** (PHASE 11'de yapılacak)

### FINDING-AI-002 — Source trace yok

§40 gereği AI yorumunun hangi kaynak bilgilerinden üretildiği izlenebilmelidir:

```json
{ "sourceFactsUsed": ["SOURCE-VALIDITY-F-001", "SOURCE-CODE-004-008"] }
```

Bu denetim klasörü artık `SOURCE-*.md` ID'lerini ürettiği için, PHASE 11'de
AI çıktısına bu ID'leri eklemek **mümkündür**. Şu an eklenmemiştir.

Durum: **NOT_STARTED**

---

## Bağımlılık uyarısı

AI katmanı **scoring'den sonra** denetlenir. CONFLICT-001/002 (normlar) ve
PHASE 3-9 tamamlanmadan AI istemini değiştirmek anlamsızdır: yanlış hesaplanmış
bir veriyi yorumlayan istemi düzeltmek hatayı gizler.

Bu nedenle PHASE 11 için ön koşul:

```
PHASE 2  (madde anahtarları — Ek 9)          ✅ DONE (46/46 MATCH, 5 P0 FIXED)
PHASE 3  (validity)                          ✅ DONE (kitap s.29-42)
PHASE 4  (K correction + 15 konfig)          ✅ DONE (CHANGE-007..010)
PHASE 5  (clinical — Tablo 8..17)            🟡 kaynak tarafı DONE s.63-146 (Tablo 8-15 birebir; Ma/Si tabloları sırada)
PHASE 6  (norms — Tablo 30)                  ✅ DONE (26/26 MATCH)
PHASE 7  (subscales)                         ⬜ NOT_STARTED
PHASE 8  (derived — Ek 9c + Wiggins)          ✅ DONE (26/26 + anahtarlar)
PHASE 9  (code types — Bölüm 5)              🟡 IN_PROGRESS (Hs..Pt kapandı + Sc girişi; s.147+ sırada)
PHASE 10 (interpretation — Bölüm 6)          🟡 IN_PROGRESS (bant metinleri Hs..Sc doğrulandı)
   ↓
PHASE 11 (AI)
```

**Güncel AI engeli:** PHASE 9/10 bittiğinde CONFLICT-024/025/027/030/031 kapanır;
AI isteminin dayandığı **kod tipi yorumları** o zamana kadar eksik/yanlış bloğa
eşlenebilir (ör. `'8726'` → `78/87`). FINDING-AI-001/002 bu nedenle PHASE 11'e
bırakıldı — skor kaynağı sabitlenmeden istem değiştirmek hatayı gizler.
