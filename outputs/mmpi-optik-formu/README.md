# MMPI-566 Optik Cevap Formu

Yalnızca cevap kağıdı, sayfa önizlemesi ve yazdırma bileşenleri. React 19 + TypeScript.
Mevcut proje kaynak kodu ve yetkili form örneği sağlanmadığı için bağımsız bir modül olarak hazırlanmıştır.

## Kapsam ve sınırlamalar

- Bu çalışma bir **yerleşim şablonudur**. Yetkili MMPI formunun birebir kopyası değildir.
- 1–566 madde numaraları ve boş D/Y daireleri bulunur. Madde metni, cevap anahtarı veya klinik içerik yoktur.
- D = Doğru, Y = Yanlış bir yerleşim varsayımıdır. Yetkili materyal ve uygulama yönergesiyle doğrulanmalıdır.
- Kamera, yükleme, OMR, puanlama, rapor, analiz, veri tabanı ve API entegrasyonu yoktur.
- Mevcut okuyucuyla uyumluluk henüz doğrulanmamıştır. Sayfa sayısı, numaralandırma, seçenek sırası, işaretler ve koordinatlar okuyucunun şablon tanımıyla eşleştirilmelidir.
- Formda kişisel veri tutulmaz. Form kimliği ve katılımcı kodu alanları basılı kağıtta doldurulur.

## Çıktılar

- `../optik-form.html`: Çift tıklayarak açılabilen önizleme ve dört sayfayı yazdırma ekranı. React, JavaScript ve CSS dosyanın içindedir; ekran yazı tipi için isteğe bağlı Google Fonts kullanılır, bağlantı yoksa yerel yazı tipine döner. Basılı form yalnızca Arial/Helvetica kullanır.
- `../MMPI-566-optik-cevap-formu.pdf`: Gerçek A4 boyutunda dört sayfalık boş çıktı.
- `../mmpi-optik-formu-kaynak.zip`: Modüler TypeScript kaynakları, testler ve kilitlenmiş paket listesi.

## Çalıştırma

Node.js 22.12 veya üzeri ve npm kullanın.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Derleme `dist/index.html` ve proje klasörünün bir üstündeki `optik-form.html` dosyasını üretir. Sunucu, CDN çalışma zamanı veya API anahtarı gerekmez.

## Bileşenler

- `src/form/layout.ts`: Sayfa, sütun, madde sırası ve milimetre tabanlı ortak ölçüler.
- `src/components/FormPage.tsx`: Kimlik alanları, yönerge, cevap sütunları ve sayfa alt bilgisi.
- `src/components/AnswerColumn.tsx`: Numaralar ve eşit boyutlu statik D/Y işaretleme alanları.
- `src/components/RegistrationMarks.tsx`: Dört köşe referansı ve sol üst yön işareti.
- `src/components/FormPreview.tsx`: Oranı koruyan ekran önizlemesi ve önceki/sonraki sayfa.
- `src/components/PageNavigation.tsx`: Dört sayfaya doğrudan erişim.
- `src/styles/form.css`: Basılı form geometrisi ve siyah-beyaz tipografi.
- `src/styles/print.css`: Ekran arayüzünü gizleyen, dört sayfayı tam boyutta basan kurallar.
- `src/styles/screen.css`: Mavi, beyaz ve gri tonlarında yalnızca önizleme arayüzü.

React uygulamasında bu modülün `App` bileşeni ve üç stil dosyası bir form ekranı olarak kullanılabilir. Mevcut uygulamanın çerçevesi farklıysa saf `layout.ts` yapısı yeniden kullanılabilir; mevcut çerçeveye entegrasyon yapılmış değildir. `@page` kuralları tüm belgeyi etkiler; üretimde formu ayrı bir yazdırma rotasında veya yalıtılmış bir belgede kullanın.

## Sabit form geometrisi

| Özellik | Değer |
| --- | --- |
| Şablon kimliği | MMPI566-DY-3C48-V1 |
| Kağıt | A4, 210 × 297 mm, dikey |
| Sayfa aralıkları | 1–144, 145–288, 289–432, 433–566 |
| Düzen | 3 sütun × 48 satır; son sütunda 38 madde |
| İşaretleme dairesi | 3,5 mm dış çap, 0,3 mm siyah sınır |
| Satır aralığı | Merkezden merkeze 4,25 mm |
| D/Y yatay merkez aralığı | 16 mm |
| Cevap ızgarası başlangıcı | x = 20 mm, y = 60 mm |
| Izgara başlığı | 7 mm |
| Sütun genişliği / aralığı | 51,333… mm / 8 mm |
| Köşe işaretleri | 5 × 5 mm; en yakın kenarlardan 10 mm içeride |
| Yön işareti | Sol üst karenin 2 mm sağında 1,5 × 5 mm ek çubuk |

Sayfalar yukarıdan aşağı, ardından soldan sağa numaralandırılır. Koordinat başlangıcı kağıdın sol üst köşesidir. `getBubbleGeometry(item, choice)` yalnızca statik merkez koordinatlarını verir; görüntü işlemez veya cevap okumaz. Görünüm bu ölçüleri CSS değişkenleriyle aynı kaynaktan alır. Son sayfadaki kullanılmayan 10 satırda daire veya madde numarası oluşturulmaz.

## Baskı

“Tüm sayfaları yazdır” düğmesi görünür sayfadan bağımsız olarak dört sayfayı yazdırır. Tarayıcıdaki PDF olarak kaydet seçeneği de kullanılabilir.

**A4 · Dikey · %100 / Gerçek boyut · Kenar boşlukları yok · Üst/alt bilgiler kapalı · Tek yüz**

“Sayfaya sığdır” kullanmayın. CSS ekran ölçeği baskıda kaldırılır. Tarayıcı veya yazıcı ayarları CSS tarafından zorla değiştirilemez. İlk baskıda kağıdın A4 olduğunu, tüm köşe karelerinin 5 mm olduğunu ve kesilmediğini fiziksel olarak ölçün. Kamera/okuyucu ile saha doğrulaması bu çalışmanın kapsamı dışındadır.

Yetkili madde metinleri gerekirse ayrı test kitapçığında veya ayrı bir içerik bileşeninde eşleştirilmelidir; optik koordinatları değiştirmeden cevap şablonundan ayrı tutulmalıdır. Düzen ölçüleri değişirse şablon kimliğini de değiştirin.

## Test

`npm test`: 566 benzersiz madde, dört doğru sayfa aralığı, 1.132 benzersiz daire konumu, sınırlar, sayfa/sütun geçişleri ve geçersiz numaralar.

Tarayıcı doğrulaması: masaüstü/mobil önizleme, tüm sayfa düğmeleri, görünür sayfadan bağımsız dört sayfalık baskı, 210 × 297 mm sayfa ölçüsü ve DOM daire merkezlerinin TypeScript geometrisiyle eşleşmesi. Doğrulama ayrıntıları için `../dogrulama.md` dosyasına bakın.
