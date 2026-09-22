# MIGRATION_STAGING — DECISION-031 (A) öncesi kaynak-okuma hazırlığı

**Tarih:** 2026-09-22 (açıldı · batch 29) · **Durum:** STAGING — `src/` **dokunulmadı**; göçün
kendisi (adım iii–vi) açık **“DECISION-031 = A”** onayına tabiidir (DECISION-027/028 kapısı).
Bu belge yalnız adım (i)–(ii)’dir: blok seçimi + görsel kaynak okuması (`TABLO-NUMBERS`
disiplini: sayılar yalnız kadrajdan, asla OCR’dan).

**Kural:** birebir okunmamış hiçbir cümle buraya da yazılmaz; okunan her alıntı sayfa +
kadraj kanıtıyla durur. `final-count.ts` ve `KAPSAM` sayımları ölçüm olarak sabittir —
staging bulguları onay anında **yeniden sınıflandırmayı** (sayı uydurmadan) tetikler.

**Araç zinciri:** `python3 scripts/mmpi-audit/extract.py render --pages P --half both --dpi 300`
(tam sayfa) + PyMuPDF `get_pixmap(clip=…)` ile 600 dpi **kadraj** (`.audit/pages/v_b29_*.png`).
PDF: `docs/MMPI Kitap (1) (1).pdf` · sayfa eşlemesi `s.N = PDF p((N+16+1)/2)` yarım kuralı.

## İş kümesi (ledger kapanışı — 44 gövdesiz başlık)

| Blok | Kapsamdaki YOK satırları | Staging durumu |
|---|---|---|
| Pa (6) | `648` `678/876` `679` `680/860` `694/964` `698/968` (s.131–134) | **6/6 OKUNDU (aşağıda)** |
| Mf (5) | `564/654` (s.125 tablo satırı) | **1/1 OKUNDU — başlık DEĞİL bulgusu** |
| D (2) | 18 satır (s.83–92) | beklemede |
| Pd (4) | 13 başlık (3 I/II/III tablosundan düşürülmüş) | beklemede |
| Pt (7) | 2 satır (YOK satırı + `794` s.142) | beklemede |
| Sc (8) | 2 satır (`794` s.142 · `8726/Yüksek 9` s.146 — KAPSAM “Batch 18” tablosu) | beklemede |
| Ma (9) | `Yüksek 9/Yüksek K` (s.152) · `Yüksek 9/Düşük K` (s.153) | beklemede |

> Hs ve Hy bloklarının YOK satırları ledger kapanış satırına (148 · 106/44) **yansımamıştır**
> (Hs satırı 31|31|0; Hy satırı 12|12|0 — ⚠️ notlu tarihsel satırlar). Göç kümesi kapanış
> defteriyle **44**’tür; onay gelirse Hs/Hy içerikleri ayrıca gündem edilir (sessiz genişletme yok).

## Pa (6) bloğu — 6/6 birebir okundu (staged)

Kanıt: `extract.py render --pages 73,74,75 --half both --dpi 300` (p073 R = s.131,
p074 L = s.132, p074 R = s.133, p075 L = s.134) + 600 dpi kadrajlardan sayı-kontrolü.

### `648 Kodu` (s.131 · kadraj `v_b29_s131_648.png`)

> Süregen sorunlarına karşı savunucudurlar ve sorunlarında kendi rollerini inkâr ederler.
> Huzursuz, şüpheci, narsisistik, sürekli isteyen rolündedirler. Rasyonalizasyon ve
> yansıtma savunma mekanizmalarını kullanırlar. Klinik olarak referans fikirleri,
> delüzyonlar, duygusal labilite ve kaygı görülür. İmpulsif, manipülatif davranışları
> olabilir. Otorite figürleri ile çatışma içindedirler. İntihar girişimleri, ilaç
> kullanımı olabilir. Profil tipi kroniktir.

Başlık s.131’de **ayrıksıdır**; “Olası tanı” paragrafı yoktur. (`65/56 Kodu (Bakınız
56/65 Kodu)` satırı çapraz referanstır — gövde beklenmez; KAPSAM Pa satır 6 ile uyumlu.)

### `678/876 Kodları` (s.131–132 · kadrajlardan sayı-kontrolü)

> 6 ve 8, 7’den yüksek ise bu psikotik vadisi oluşturur. Ciddi psikopatolojileri vardır.
> Şizofrenik bozukluklardan paranoid tip tanısı konulabilir. Hallüsinasyonlar, delüzyonlar
> ve aşırı şüphelerle birlikte görülür. Affektleri donuktur. Bunlar ürkek, içedönük, sosyal
> ilişkilerde çekingen ama alkol aldıklarında agresif olan kişilerdir. Bellek ve konsantre
> olmada sorunları olabilir. Fantezi ve hayal âleminde yaşarlar. Geçmiş ya da hayali hatalar
> üzerinde ruminatif biçimde düşünürler.

Gövde s.131 altında başlar, s.132 üst paragrafıyla tamamlanır (sayfa-kırılması kadrajlarda
ayrı ayrı doğrulandı). **Koşul cümlesi** (CONFLICT-027 izinde): “6 ve 8, 7’den yüksek ise”
— sayısal eşik vermez; göçe sayı üretilmeden alınır.

### `679 Kodu` (s.132 · tam sayfa p074 L + kadraj teyidi)

> Aşırı duyarlı ve katıdırlar. Sosyal ve cinsel yaşamlarında, kendilerini bastırılmış
> hissederler; şüphecidirler ve güvensizlik duyarlar, çabuk gücenirler ve öfke
> patlamaları vardır. İmpulsif dönemlerini, dönemsel suçluluk ve kendine yönelme
> izlemektedir.

### `680/860 Kodları` (s.133 · kadraj `v_b29_s133_mid.png`)

> Hastalarda paranoid şizofrenide görülen paranoid özellikler ve düşünce bozukluğu vardır.
> Sistemli hezeyanlar görülebilir. Hastalar gerginlik, kaygı, depresyon yakınmaları ile
> kişisel sıkıntılarını ifade ederler. Sosyal olarak izole ve çekiniktirler. Sosyal
> ilişkilerde düşmanlık ve şüphe hakimir. Davranışlar genellikle sosyal açıdan uygun
> değildir ve önceden tahmin edilemez.

### `694/964 Kodları` (s.133 altı → s.134 üstü · kadrajlardan)

> Hastaların sosyal, aile ve iş yaşamları hostilitelerine, yargılamalarının bozukluğuna ve
> duygularını kontrol edememelerine bağlı olarak bozuktur. İçgörüleri yoktur ve suçu
> diğerlerinin üstüne atma tipiktir. Saldırma, mücadele etme ve hatta cinayet potansiyeli
> değerlendirilmelidir.

### `698/968 Kodları` (s.134 · kadraj `v_b29_s134_top.png` + batch 27 p075 L)

> 69/96 kodunda tanımlanan birey tipine ek olarak bu bireylerde ruhsal karışıklık,
> konfüzyon, düşünce ve dikkat toplamada güçlük vardır. Ayrıca delüzyonlar, paranoid şüphe
> ve hallüsinasyon da vardır. Eğer 8 alt testi, 6’dan 5 T puanı aşağıda ise 68/86 koduna
> bakın.

> Olası tanı: Şizofreni paranoid tip

**Koşul cümlesi (sayılı, birebir):** “Eğer 8 alt testi, 6’dan **5 T puanı** aşağıda ise” →
`KAPSAM` Pa Ek-örüntüler satırı (satır 385) ve **CONFLICT-044** kapanışı bu cümlenin
kaynakta **gövde-ici** olduğunu ölçmüştü; staging gövdesiyle birlikte göç sırasında
“geçiş koşulu” olarak ayrıca değerlendirilebilir (karar onaya tabi).

## Mf (5) — `564/654` BULGUSU: ayrıksı başlık DEĞİL

Kadroj `v_b29_s125_mf.png` (s.125 · 600 dpi): sayfada `564/654` **başlığı yoktur**. Kod
yalnız `56/65 Kodu` gövdesinin ikinci paragrafındaki parantez örneğidir (birebir):

> Daha ayrıntılı bilgi, üçüncü yükselen ölçeğe bakılarak elde edilir. T puanının 70’in
> üzerinde olduğu başka bir test varsa 5 dışlanır ve diğer 2 test değerlendirilir
> (örneğin, 564/654 kodu. 46/64 değerlendirilmeli ve test 5’te yükselme olduğu
> söylenmelidir).

**Sayı-kontrolü:** “70” ve “46/64” kadrajdan okundu (kaynak `46/64` yazıyor — `64/46`ya
sessiz normalize edilmez, DECISION-028). **Etki:** `KAPSAM` Mf tablosu satır 6 bu etiketi
“Kaynak başlığı” olarak sayıyor; defter satırı **yeniden yazılmaz**, KAPSAM’a ⚠️ notu
düşüldü. Onay (A) gelirse bu kalem gövde göçü değil **koşul-notu** olarak işlenir; gövde
sayacı için ±1’lik yeniden-sınıflandırma adayıdır (ölçülmüş, karar onayda).

## Bekleyen bloklar (37) — sıradaki staging turları

D (18 · s.83–92) → Pd (13 · s.111–120) → Pt/Sc (4 · s.140–146) → Ma (2 · s.152–153).
Her blok için: tam-sayfa render + gerektiğinde kadraj + birebir alıntı + koşul listesi.
**Toplu doldurma yok** (DECISION-028); staging ilerlemesi bu dosyanın tablosundan izlenir.

## Sayaç

**Staged: 7 / 44** (Pa 6 + Mf bulgusu 1) · bekleyen 37 · `src/` değişikliği: **YOK** ·
yeni conflict: **YOK** (Mf bulgusu DECISION-031 karar notu olarak işlendi).
