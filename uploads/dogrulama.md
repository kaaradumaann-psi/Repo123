# Optik Form Doğrulaması

MMPI-566 için dört A4 sayfalık boş optik cevap formu şablonu oluşturuldu. Yetkili form veya mevcut uygulama kaynakları sağlanmadığından mevcut uygulamaya entegrasyon ve tarayıcı uyumluluğu iddiası yoktur.

## Geçen kontroller

- TypeScript tür kontrolü ve üretim derlemesi başarılı.
- Altı otomatik test başarılı: madde sırası, dağılım, koordinatlar, geçişler, geçersiz numaralar ve tek HTML derlemesi.
- Bağımlılık güvenlik denetimi: bildirilen açık yok.
- 566 madde numarası; eksik veya tekrarlanan numara yok.
- 1.132 boş D/Y dairesi; her maddede iki seçenek.
- Sayfa dağılımı: 1–144 / 145–288 / 289–432 / 433–566.
- Son sayfa 134 madde içeriyor; 567 ve sonrası için alan oluşturulmuyor.
- 1.132 dairenin tarayıcıdaki merkezleri TypeScript koordinatlarıyla karşılaştırıldı. En büyük merkez sapması 0,013 mm'den, çap sapması 0,003 mm'den küçük. Bunlar tarayıcının alt piksel yuvarlamalarıdır.
- Dört sayfaya doğrudan geçiş, tek etkin sayfa, önceki/sonraki sınırları ve yazdır düğmesinin çağrısı kontrol edildi.
- Masaüstü önizlemesi ve 390 / 320 px mobil genişlikler kontrol edildi. Mobilde yatay taşma yok.
- Yazdırmada önizleme arayüzü gizli, dört sayfa görünür, ekran ölçeği kaldırılmış.
- PDF: dört sayfa, A4, dikey. Ek boş sayfa yok.
- PDF'deki 566 basılı madde numarası gerçek PDF metin koordinatlarından tekrar sayılıp doğrulandı.
- Son PDF sayfası görsel olarak kontrol edildi: 566. madde, köşe referansları ve alt bilgi görünür; kesilme yok.

## Doğrulanmayanlar

- Fiziksel yazıcının ölçeklemesi veya kenar kesimi. İlk baskıda 5 mm köşe karelerini ölçün; A4, %100 ve tek yüz kullanın.
- Kamera, ışık, perspektif, kalem veya görüntü kalitesine bağlı okunabilirlik.
- Mevcut okuyucunun beklediği şablon, sayfa tanıma işaretleri ve cevap sırası.
- Yetkili MMPI formuyla eşdeğerlik veya klinik kullanım uygunluğu.
- Safari/Firefox ve mobil işletim sistemlerinin gerçek yazdırma diyalogları. Tarayıcı kontrolleri Chromium üzerinde yapıldı.

## Dosyalar

- `optik-form.html`: Sayfa seçmeli önizleme ve dört sayfayı yazdırma.
- `MMPI-566-optik-cevap-formu.pdf`: Hazır boş baskı çıktısı.
- `mmpi-optik-formu-kaynak.zip`: React + TypeScript bileşenleri, ayrı stiller, testler ve README.

Kamera, OMR, puanlama, raporlama, sonuç analizi, veri tabanı ve API entegrasyonu eklenmedi.
