# MMPI Uygulaması — Kapsamlı Kaynak / Literatür Denetimi (Audit)

**Tarih:** 18 Eylül 2026 · **Kapsam:** `src/scoring/*` içindeki tüm puanlama, norm, geçerlik,
türetilmiş ölçek ve yorum bileşenleri + `kaynaks/` deposu
**Yöntem:** Kod bileşen çıkarımı → özgün/birincil kaynak araması (Crossref, PubMed,
yayınevi kayıtları, hakemli dergi kaynakça listeleri) → formül–kaynak eşleştirme (Golden Rule).

Kurallar: Kaynak uydurma yok. Tahmini künye yok. Blog/ticari MMPI sitesi/SEO sayfası birincil
kaynak sayılmaz. Formül literatürdeki özgün tanımla birebir doğrulanamıyorsa bu açıkça yazılır.

## Statü tanımları

| Statü | Anlamı |
| --- | --- |
| **A** | Özgün kaynak doğrulandı (künye Crossref/PubMed/yayınevi kaydıyla; içerik–kod eşleşmesi) |
| **B** | Güçlü ikincil akademik kaynakla doğrulandı (özgün tam metin erişilemedi) |
| **C** | Kodda atıf var fakat özgün kaynak kesin doğrulanamadı |
| **D** | Kodda kaynak adı yok / kaynak bulunamadı |
| **E** | Kaynak var fakat kodun kullandığı formül/anahtarla bağlantısı birebir doğrulanamadı |

---

## Tablo 1 — Bileşen → Kaynak eşleştirmesi

| Bileşen | Kodda nerede | Kodda kullanılan veri/formül | Bulunan kaynak | Kaynak türü | APA 7 | Güven durumu |
| --- | --- | --- | --- | --- | --- | --- |
| Türk normları (Erkek/Kadın M/SD), T dönüşümü, Mf kadın ters çevrimi | `mmpiKeys.ts` (TURKISH_NORMS), `mmpiScoring.ts` (computeT) | T = 50 + 10·(X−M)/SD; Mf-Kadın: 50 + 10·(M−X)/SD | Savaşır (1981) El Kitabı, Sevinç Matbaası, Ankara | Kitap/manual | Doğrulandı (aşağıda) | A (künye); norm sayıları kitapla birebir karşılaştırılamadı (kitap erişimi yok) |
| Ölçek anahtarları (L,F,K,Hs–Si), madde yapısı | `mmpiKeys.ts` SCORING_KEYS | D/Y anahtar listeleri | Hathaway & McKinley (1940) makale; (1942) Manual | Makale + Manual | Doğrulandı | B (anahtarlar klasik set; madde madde birebir kontrol telifli orijinalle yapılamadı) |
| K düzeltme oranları (Hs .5, Pd .4, Pt 1, Sc 1, Ma .2) + ekleme tablosu | `mmpiKeys.ts` (K_CORRECTION, K_ADDITION_TABLE) | Tablodan okuma; oran yuvarlaması | Klasik MMPI puanlama sistemi: Hathaway & McKinley (1942); Dahlstrom, Welsh & Dahlstrom (1972) | Manual/Handbook | Doğrulandı | B; .4K kolonunda klasik basılı tabloyla birebir karşılaştırma yapılamadı (kodda K=3→2, K=4→1 gibi monotonik olmayan bir değer var — bu audit değiştirmedi) |
| Geçerlik bant yorumları (?, L, F, K ham+T), geçersizlik ölçütleri (boş ≥31, F ham ≥23), F-K>16 uyarı metni | `mmpiSource.ts`, `mmpiScoring.ts` | Ham/T bant tabloları | Depo içi rehber: `kaynaks/kaynak.pdf` (belge içi başlık “MMPI (KES-YAPIŞTIR)”, künyesiz) | Belge (depoda) | — | C (metinler belgeyle birebir; bibliyografik kimlik doğrulanamadı) |
| TR Endeksi — 16 tekrar çifti, ≤3 tutarlı | `mmpiConsistency.ts` (TR_PAIRS, trIndex) | 16 çiftte farklı yanıt sayısı ≤3 | Gravitz & Gerton (1976), JCP 32(3), 567–568; Greene (1979), JPA 43(1), 69–71; Dahlstrom (1972) eşlik atfı | Makale | Doğrulandı | A künye / E (16 çiftin tam listesi klasik listeyle uyumlu; özgün makale tablosuyla madde madde doğrulanamadı) |
| Dikkatsizlik Endeksi — 12 çift, ≥4 kuşku | `mmpiConsistency.ts` (CARELESS_PAIRS) | 12 çiftte beklenmeyen örüntü ≥4 | Greene (1978), JCP 34(2), 407–410 (özgün); Greene (1980) manual (4 kesimi; kodun atfı) | Makale + Kitap | Doğrulandı | A künye / E (12 çiftin madde numaraları tam metinle doğrulanamadı) |
| F-K Endeksi (Gough) | `mmpiConsistency.ts` (fkIndexAnalysis) | F ham − K ham; 0–9 geçerli, >9 sahte-kötülük, >16 kritik | Gough (1950), JCP 14(5), 408–413; Gough (1947), JASP 42, 215–225 | Makale | Doğrulandı | A (formül özgün tanımla birebir: ham F − ham K); bantlar (0–9/10–16/>16) klinik literatür kullanımı |
| Geçerlik konfigürasyonları (V, ters V, rastgele, tümü-D/Y…) | `mmpiValidityConfigs.ts` | L/F/K T eşik kuralları | Depo içi rehber + Greene (1980) kapalı-V 5–10T notu | Belge/Kitap | Kısmi | C/D (eşiklerin çoğu rehberden; kodda ayrı künye atfı yok) |
| Goldberg Ayrım Endeksi | `mmpiDerived.ts` computeDerivedIndexes | (L+Pa+Sc)−(Hy+Pt), T puanları; >45 psikotik | Goldberg (1965), Psychological Monographs 79(9, Whole 602), 1–28, DOI 10.1037/h0093885 | Makale (monograf) | Doğrulandı | A (formül, T puanı kullanımı ve 45 kesimi ikincil hakemli literatürle birebir: Brophy 1992, Psych Reports; Egger vd. 2003, Eur Psychiatry) |
| Taulbee İndeksi | `mmpiDerived.ts` | 16 karşılaştırma; ≤6 psikotik, ≥13 nevrotik, arası belirsiz | Taulbee & Sisson (1957), JCP 21(5), 413–417, DOI 10.1037/h0044567 | Makale | Doğrulandı | B (16 çift sayısı ve kesimler ikincil hakemli literatürle uyumlu; çift yönleri özgün makale tam metniyle doğrulanamadı → E notu) |
| Peterson İndeksi | `mmpiDerived.ts` | 6 kriter (≥4 klinik T≥70; F>64; max(Pa,Sc,Ma)>max(Hs,D,Hy); D>Hs&Hy; Sc>Pt; Pa>70∥Ma>70); ≥3 | Peterson, D. R. (1954), JCP 18(3), 198–200, DOI 10.1037/h0061349 | Makale | Doğrulandı | B (kriter yapısı Goldberg 1965 ve Türkçe MMPI literatürü tanımıyla uyumlu; özgün tam metin erişilemedi → E notu) |
| Wiggins içerik ölçekleri (13) | `mmpiDerived.ts` WIGGINS_KEYS | SOC/DEP/FEM/MOR/REL/AUT/PSY/ORG/FAM/HOS/PHO/HYP/HEA | Wiggins (1966), Psych Monographs 80(22, Whole 630), 1–42; Wiggins, Goldberg & Apelbaum (1971), JCCP 37(3), 403–410 | Makale (monograf) | Doğrulandı | A (13 ölçek kümesi özgün setle birebir) / E (madde anahtarları tek tek doğrulanamadı) |
| Wiggins T puanları için Türk M/SD | `mmpiDerived.ts` WIGGINS_NORMS | 13 çift M/SD | Kodda atıf yok; doğrulanabilir kayıt bulunamadı | — | — | D |
| Kişilik bozukluğu ölçekleri (11: HST…SZD) | `mmpiDerived.ts` PERSONALITY_KEYS | 11 DSM-yönelimli anahtar | Morey, Waugh & Blashfield (1985), JPA 49(3), 245–251; Türk uyarlaması Oral, Akça & Ceyhun (1994, kongre); derleme bağlamı Ceyhun & Oral (1998) | Makale + Bildiri + Kitap | Doğrulandı | B (11 ölçek kümesi birebir); kesim puanları (Hafif/Belirgin) kaynaksız → D |
| MAC (MacAndrew) | `mmpiDerived.ts` ADDICTION_KEYS | 49 madde (37D/12Y) | MacAndrew (1965), QJSA 26(2), 238–246, DOI 10.15288/qjsa.1965.26.238 | Makale | Doğrulandı | A (madde sayısı 49 uyumlu; anahtar tek tek doğrulanamadı) |
| MAC Türkiye kesim puanı 22 | `mmpiDerived.ts` addictionInterpretation | ham ≥22 | Ceyhun & Palabıyıkoğlu (1989), XXV. Ulusal Psikiyatri ve Nörolojik Bilimler Kongresi, Mersin | Kongre bildirisi | Doğrulandı (kayıt) | B (künye Ceyhun & Oral 1998 kaynakçasından; özgün bildiri tam metni bulunamadı). Özgün MAC ile Türkiye kesimi AYRI kaynaklardır |
| MAC ≥28 “ciddi risk” eşiği | `mmpiDerived.ts` | ham ≥28 | Kodda atıf yok | — | — | D |
| ICAS | `mmpiDerived.ts` ADDICTION_KEYS | 8 madde (6D/2Y); ≥5 kesim | Atsaides, Neuringer & Davis (1977), JCCP 45(4), 609–611, DOI 10.1037/0022-006X.45.4.609 — “Institutionalized Chronic Alcoholic Scale” | Makale | Doğrulandı | A (8 madde sayısı birebir; ölçek kimliği Colligan vd. 1988, JCP 44(3) ile teyitli) / kesim ≥5 kaynaksız → D |
| SAP | `mmpiDerived.ts` ADDICTION_KEYS | 36 madde (27D/9Y); ≥16 “Türkiye” kesimi | MacAndrew (1986), J. Stud. Alcohol 47(2), 161–166, DOI 10.15288/jsa.1986.47.161 | Makale | Doğrulandı | A (36 madde birebir); “Türkiye örnekleminde yüksek doğruluk” iddiası kodda atıfsız → D (Ceyhun, Palabıyıkoğlu & Özgen 1991 bildirisi olası ancak kesin doğrulanamadı; kaynak uydurulmadı) |
| O-H (Overcontrolled Hostility) | `mmpiDerived.ts` SPECIAL_KEYS | 31 madde (10D/21Y); ≥19 eşik | Megargee, Cook & Mendelsohn (1967), JAP 72(6), 519–528, DOI 10.1037/h0025242 | Makale | Doğrulandı | A (31 madde birebir) / eşik kaynaksız → D |
| Barron Es | `mmpiDerived.ts` SPECIAL_KEYS | 68 madde (38D/30Y); ≤35 düşük / ≥45 yüksek | Barron (1953), JCP 17(5), 327–333, DOI 10.1037/h0061962 | Makale | Doğrulandı (kullanıcının verdiği künye Crossref ile teyit edildi) | A künye / E (madde yapısı birebir doğrulanamadı); “1954 düzeltme yayını” doğrulanabilir kayıt olarak bulunamadı; yorum eşikleri kaynaksız → D |
| Welsh A / R | `mmpiDerived.ts` SPECIAL_KEYS | A: 39 madde; R: 40 madde; A T: M15/SD8, R T: M16/SD5 | Welsh (1956), “Factor dimensions A and R”, Welsh & Dahlstrom (Eds.), Basic readings on the MMPI (s. 264–281), Univ. of Minnesota Press | Kitap bölümü | Doğrulandı | B (madde sayıları klasikle uyumlu) / T dönüşüm sabitleri kaynaksız → D |
| Do (Dominans) | `mmpiDerived.ts` | 28 madde (7D/21Y) | Gough, McClosky & Meehl (1951), JASP 46(3), 360–366, DOI 10.1037/h0062542 | Makale | Doğrulandı | A (28 madde birebir) / eşikler kaynaksız → D |
| Dy (Bağımlılık) | `mmpiDerived.ts` | 56 madde (48D/8Y) | Navran (1954), JCP 18(3), 192, DOI 10.1037/h0056592 | Makale | Doğrulandı | A künye / E (klasik Dy 57 madde olarak geçer; kod 56 madde anahtarlıyor — 1 madde farkı açıklanamadı) |
| Kritik madde listesi (39 madde) | `mmpiCritical.ts` CRITICAL_ITEMS | 39 kritik madde + cinsiyetli 74 | Kodda isim yok; klasik kritik madde listeleriyle (Dahlstrom 1972; Greene 1980) çakışıyor | — | — | D (liste kimliği doğrulanamadı) |
| Klinik izlenimler (intihar riski vb.) | `mmpiCritical.ts` clinicalImpressions | D&Pt≥70; 78/87+Hs,D; F>… vb. | Dahlstrom (1972); Clopton & Baucom (1979), JPA 43(3), 293–296, DOI 10.1207/s15327752jpa4303_12 | Kitap + Makale | Doğrulandı | B/A |
| Tedaviye yanıt notu (“Reis, 1966”; K ham ≤15) | `mmpiCritical.ts` | K ham ≤15 → olumlu prognoz | Kod “Reis (1966)” diyor; özgün kayıt: **Ries**, H. A. (1966), JCP 22(2), 212–213, DOI 10.1002/1097-4679(196604)22:2<212::AID-JCLP2270220228>3.0.CO;2-T | Makale | Doğrulandı (künye) | E (K≤15 eşiği tam metin doğrulanamadı; kod yazımı “Reis”, gerçek soyad “Ries”) |
| Klinik yorum katmanı (tek ölçek T bantları, iki noktalı kodlar, olası tanılar) | `mmpiSource.ts`, `mmpiSourceCodes.ts`, `mmpiInterpretation.ts` | Bant tabloları + kod yorumları | Depo içi rehber `kaynaks/kaynak.pdf` (künyesiz) | Belge (depoda) | — | C |
| Profil kodu kuralı (Mf ve Si hariç en yüksek ikili) | `mmpiScoring.ts` | Uygulama kuralı | Kodda atıf yok (uygulama kararı) | — | — | D |

## Tablo 2 — Kaynak ↔ kod eşleşme kontrolü

| Kaynak | Kod ile gerçekten eşleşiyor mu? |
| --- | --- |
| Savaşır (1981) | Evet (norm/T dönüşüm/Mf ters çevrim kullanımı kodda bu künyeye bağlı) |
| Hathaway & McKinley (1940) | Evet (özgün envanter/ölçek kurulumu) |
| Hathaway & McKinley (1942) Manual | Kısmen (ölçek anahtarları klasik set; birebir madde kontrolü yapılamadı) |
| Dahlstrom, Welsh & Dahlstrom (1972) | Kısmen (kodun “Dahlstrom 1972” atıfları genel referans; birebir sayfa eşleşmesi doğrulanamadı) |
| Goldberg (1965) | Evet — formül (L+Pa+Sc)−(Hy+Pt), T puanları, >45 kesimi birebir |
| Taulbee & Sisson (1957) | Kısmen — 16 çift ve ≤6/≥13 kesimleri uyumlu; çift yönleri tam doğrulanamadı |
| Peterson (1954) | Kısmen — 6 kriter yapısı literatür tanımıyla uyumlu; tam metin erişilemedi |
| Wiggins (1966) | Evet — 13 ölçek kümesi birebir |
| Wiggins, Goldberg & Apelbaum (1971) | Kısmen (yorum normları bağlamı; kodun Türk M/SD değerleri bu makaleden doğrulanamadı) |
| Gravitz & Gerton (1976) | Kısmen — TR bağlamı ikincil atıflarla teyitli; “3–4 tutarsız” iddiası tam metin doğrulanamadı |
| Greene (1979) | Kısmen — TR endeksi ve optimal kesim tanımı; çift tablosu doğrulanamadı |
| Greene (1978) | Kısmen — dikkatsizlik ölçeği özgün çalışması; 12 çiftin numaraları doğrulanamadı |
| Greene (1980) | Evet (kodun atfı yorum kitabına: 4 kesimi, 5–10T notu) — 1978 makalesinden AYRI kaynaktır |
| Gough (1947/1950) | Evet — F ham − K ham formülü özgün tanımla birebir |
| Ries (1966) | Doğrulanamadı (eşik) — kodun “Reis 1966 / K≤15” atfı özgün makale tam metniyle doğrulanamadı |
| Clopton & Baucom (1979) | Evet (78/87 + 1,2 intihar girişimi bulgusu bağlamı) |
| Morey, Waugh & Blashfield (1985) | Evet — 11 kişilik ölçeği kümesi birebir; kesimler bu kaynaktan doğrulanamadı |
| MacAndrew (1965) | Evet (MAC kimliği; 49 madde sayısı uyumlu) |
| Ceyhun & Palabıyıkoğlu (1989) | Evet (MAC Türkiye kesimi 22; kayıt ikincil kaynakçadan doğrulandı) |
| MacAndrew (1986) | Evet (SAP kimliği; 36 madde birebir); Türkiye ≥16 kesimi kodda atıfsız |
| Atsaides, Neuringer & Davis (1977) | Evet (ICAS kimliği; 8 madde birebir); ≥5 kesimi kodda atıfsız |
| Megargee, Cook & Mendelsohn (1967) | Evet (O-H kimliği; 31 madde birebir) |
| Barron (1953) | Kısmen — künye birebir doğrulandı; 68 maddelik anahtar yapısı tam doğrulanamadı |
| Welsh (1956) | Kısmen — A/R kimliği ve madde sayıları uyumlu; T dönüşüm sabitleri doğrulanamadı |
| Gough, McClosky & Meehl (1951) | Evet (Do kimliği; 28 madde birebir) |
| Navran (1954) | Kısmen — künye doğrulandı; klasik 57 madde ile koddaki 56 madde arasındaki fark açıklanamadı |
| `kaynaks/kaynak.pdf` (“MMPI (KES-YAPIŞTIR)”) | Evet (metinler birebir bu belgeden) — bibliyografik kimlik doğrulanamadı |

## 1942 / 1943 sorusu (Hathaway & McKinley)

- University of Minnesota Press'in resmi test kayıtları, el kitabını **1942** tarihler:
  “A manual for the Minnesota Multiphasic Personality Inventory … was published in 1942 by the
  University of Minnesota Press (Hathaway & McKinley, 1942).”
- Literatürde **1943** gösteren kayıtlar da vardır (ör. Gravitz & Gerton 1976 kaynakçasında
  “The Minnesota Multiphasic Personality Schedule, Minneapolis: University of Minnesota Press, 1943”).
  Bunlar büyük olasılıkla farklı baskı/gösterim farklarıdır.
- Bu uygulama, yayınevinin resmi kaydını esas alarak manual için **1942**, envanterin kuruluş
  makalesi için **1940** künyesini kullanır. Uygulama kodundaki `references` alanında 1943
  gösterimi bulunuyordu; bu denetimle 1942/1940 kayıtlarıyla değiştirildi.

## Audit sırasında değişmeyen, yalnızca raporlanan bulgular

Puanlama mantığına (anahtarlar, normlar, ekleme tablosu, endeks formülleri) bu denetimle
**dokunulmadı**. Aşağıdaki farklar yalnızca kayıt altına alındı:

1. `K_ADDITION_TABLE.ratio4` (Pd, .4K) kolonunda K=3→+2, K=4→+1 şeklinde monotonik olmayan bir
   değer çifti vardır; basılı klasik K ekleme tablosuna erişim olmadığından birebir karşılaştırma
   yapılamadı.
2. Dy anahtarı 56 madde içerir; klasik Navran Dy ölçeği 57 madde olarak geçer.
3. Wiggins T puanları kodda Türk örneklemi M/SD ile hesaplanıyor; bu değerlerin yayınlanmış bir
   kaynağı kodda bulunmuyor.
4. Peterson/Taulbee kriterlerindeki bazı eşik ifadeleri ikincil literatür tanımlarıyla uyumludur;
   özgün 1954/1957 makalelerinin tam metinlerine erişim olmadığından kelime kelime eşleşme
   doğrulaması yapılamadı.

## Doğrulanmış APA 7 künyeler (Crossref/PubMed/yayınevi kaydıyla)

- Atsaides, J. P., Neuringer, C., & Davis, K. L. (1977). Development of an Institutionalized Chronic Alcoholic Scale. *Journal of Consulting and Clinical Psychology, 45*(4), 609–611. https://doi.org/10.1037/0022-006X.45.4.609
- Barron, F. (1953). An ego-strength scale which predicts response to psychotherapy. *Journal of Consulting Psychology, 17*(5), 327–333. https://doi.org/10.1037/h0061962
- Ceyhun, B., & Oral, N. (1998). *MMPI Değerlendirme Kitabı*. Bilimsel Tıp Yayınevi.
- Ceyhun, B., & Palabıyıkoğlu, R. (1989). *Yatan alkol bağımlılarında MMPI alkolizm skalalarının kullanımı* [Bildiri]. XXV. Ulusal Psikiyatri ve Nörolojik Bilimler Kongresi, Mersin, Türkiye.
- Clopton, J. R., & Baucom, D. H. (1979). MMPI ratings of suicide risk. *Journal of Personality Assessment, 43*(3), 293–296. https://doi.org/10.1207/s15327752jpa4303_12
- Dahlstrom, W. G., Welsh, G. S., & Dahlstrom, L. E. (1972). *An MMPI handbook: Vol. I. Clinical interpretation* (Rev. ed.). University of Minnesota Press.
- Goldberg, L. R. (1965). Diagnosticians vs. diagnostic signs: The diagnosis of psychosis vs. neurosis from the MMPI. *Psychological Monographs: General and Applied, 79*(9, Whole No. 602), 1–28. https://doi.org/10.1037/h0093885
- Gough, H. G. (1947). Simulated patterns on the MMPI. *Journal of Abnormal and Social Psychology, 42*(2), 215–225. https://doi.org/10.1037/h0063295
- Gough, H. G. (1950). The F minus K dissimulation index for the Minnesota Multiphasic Personality Inventory. *Journal of Consulting Psychology, 14*(5), 408–413. https://doi.org/10.1037/h0054506
- Gough, H. G., McClosky, H., & Meehl, P. E. (1951). A personality scale for dominance. *Journal of Abnormal and Social Psychology, 46*(3), 360–366. https://doi.org/10.1037/h0062542
- Gravitz, M. A., & Gerton, M. I. (1976). An empirical study of internal consistency in the MMPI. *Journal of Clinical Psychology, 32*(3), 567–568. https://doi.org/10.1002/1097-4679(197607)32:3<567::AID-JCLP2270320316>3.0.CO;2-U
- Greene, R. L. (1978). An empirically derived MMPI carelessness scale. *Journal of Clinical Psychology, 34*(2), 407–410. https://doi.org/10.1002/1097-4679(197804)34:2<407::AID-JCLP2270340231>3.0.CO;2-A
- Greene, R. L. (1979). Response consistency on the MMPI: The TR index. *Journal of Personality Assessment, 43*(1), 69–71. https://doi.org/10.1207/s15327752jpa4301_10
- Greene, R. L. (1980). *The MMPI: An interpretive manual*. Grune & Stratton.
- Hathaway, S. R., & McKinley, J. C. (1940). A multiphasic personality schedule (Minnesota): I. Construction of the schedule. *The Journal of Psychology, 10*(2), 249–254. https://doi.org/10.1080/00223980.1940.9917000
- Hathaway, S. R., & McKinley, J. C. (1942). *Manual for the Minnesota Multiphasic Personality Inventory*. University of Minnesota Press.
- MacAndrew, C. (1965). The differentiation of male alcoholic outpatients from nonalcoholic psychiatric outpatients by means of the MMPI. *Quarterly Journal of Studies on Alcohol, 26*(2), 238–246. https://doi.org/10.15288/qjsa.1965.26.238
- MacAndrew, C. (1986). Toward the psychometric detection of substance misuse in young men: The SAP scale. *Journal of Studies on Alcohol, 47*(2), 161–166. https://doi.org/10.15288/jsa.1986.47.161
- Megargee, E. I., Cook, P. E., & Mendelsohn, G. A. (1967). Development and validation of an MMPI scale of assaultiveness in overcontrolled individuals. *Journal of Abnormal Psychology, 72*(6), 519–528. https://doi.org/10.1037/h0025242
- Morey, L. C., Waugh, M. H., & Blashfield, R. K. (1985). MMPI scales for DSM-III personality disorders: Their derivation and correlates. *Journal of Personality Assessment, 49*(3), 245–251. https://doi.org/10.1207/s15327752jpa4903_5
- Navran, L. (1954). A rationally derived MMPI scale to measure dependency. *Journal of Consulting Psychology, 18*(3), 192. https://doi.org/10.1037/h0056592
- Oral, N., Akça, F., & Ceyhun, B. (1994). *Kişilik bozukluklarının MMPI'dan geliştirilen alt testler ile değerlendirilmesi* [Bildiri]. 30. Ulusal Psikiyatri Kongresi, Kayseri, Türkiye.
- Peterson, D. R. (1954). The diagnosis of subclinical schizophrenia. *Journal of Consulting Psychology, 18*(3), 198–200. https://doi.org/10.1037/h0061349
- Ries, H. A. (1966). The MMPI K scale as a predictor of prognosis. *Journal of Clinical Psychology, 22*(2), 212–213. https://doi.org/10.1002/1097-4679(196604)22:2<212::AID-JCLP2270220228>3.0.CO;2-T
- Savaşır, I. (1981). *Minnesota Çok Yönlü Kişilik Envanteri el kitabı (Türk standardizasyonu)*. Sevinç Matbaası.
- Taulbee, E. S., & Sisson, B. D. (1957). Configurational analysis of MMPI profiles of psychiatric groups. *Journal of Consulting Psychology, 21*(5), 413–417. https://doi.org/10.1037/h0044567
- Wiggins, J. S. (1966). Substantive dimensions of self-report in the MMPI item pool. *Psychological Monographs: General and Applied, 80*(22, Whole No. 630), 1–42. https://doi.org/10.1037/h0093901
- Wiggins, J. S., Goldberg, L. R., & Apelbaum, M. (1971). MMPI content scales: Interpretative norms and correlations with other scales. *Journal of Consulting and Clinical Psychology, 37*(3), 403–410. https://doi.org/10.1037/h0031954
- Welsh, G. S. (1956). Factor dimensions A and R. In G. S. Welsh & W. G. Dahlstrom (Eds.), *Basic readings on the MMPI in psychology and medicine* (pp. 264–281). University of Minnesota Press.
