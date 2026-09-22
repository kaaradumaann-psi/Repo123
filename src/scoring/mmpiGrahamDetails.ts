/**
 * Graham 1987'ye dayalı klinik ölçek yüksek/düşük puan tanımları.
 * Kaynak doğrulama: docs/yeni/mmpiKaynak2 (AsılKaynak) with ocr.pdf
 * ve docs/mmpi-audit/SOURCE_FACTS.md içindeki bant doğrulamaları.
 * - Hs (1) yüksek liste: PDF p39 (kitap s.65) görsel doğrulandı; kullanıcı
 *   tarafından sağlanan 23 maddelik liste OCR ile uyumlu.
 * - D (2) yüksek liste: PDF p47 R (kitap s.79) · 21 madde — SOURCE-CL-009
 * - D düşük liste: PDF p48 L (kitap s.80-81) · 18 madde — SOURCE-CL-011
 * - Diğer ölçekler için yüksek/düşük listeler aynı kitabın ilgili bölümlerinden
 *   (Bölüm 5) alınmıştır; her biri Graham 1987 atıflıdır.
 * - s29 gibi iç referans kodları metin içinde gösterilmez; kaynak künyesi
 *   rapor alt bilgisinde topluca verilir.
 */

export type GrahamScaleDetail = {
  /** Ölçek kısa adı */
  id: string;
  /** Yüksek puan (T>=70) Graham listesi */
  high: string[];
  /** Düşük puan (T<=40) Graham listesi */
  low: string[];
  /** Ek not: düşük puan için de yüksek gibi klinik anlam taşıyabilir */
  lowNote?: string;
};

export const GRAHAM_DETAILS: Record<string, GrahamScaleDetail> = {
  Hs: {
    id: 'Hs',
    high: [
      'Aşırı bedensel uğraşları vardır.',
      'Çeşitli bedensel yakınmaları vardır; yakınmalar genellikle belirsizdir, belirginse mide ve karın bölgesine ilişkindir.',
      'Çabuk yorulur, yorgun ve bitkindir; kronik yorgunluk, ağrı ve güçsüzlükten yakınır.',
      'Diğer insanlara kızgındır ve düşmanca duygular taşır, ancak düşmanlığını dolaylı yollardan ifade eder.',
      'Başkalarından çok şey bekler ve kendisine çok fazla ilgi gösterilmesini ister.',
      'Duygularını dolaylı olarak ifade eder; kendisine acıma eğilimindedir.',
      'Karamsar, kötümser, yıkıcı ve alaycı bir yapısı vardır.',
      'Genellikle mutsuz ve tatminsizdir; diğerlerini bıktırır, yakınır ve sızlanır.',
      'Geleneksel, konformist ve dar görüşlüdür; sosyal becerilerden yoksundur.',
      'Diğer insanlarla ilgilenmez ve onlara yakınlık duymaz; kendine güvensiz ve ürkektir.',
      'Ağızdan çok anlatır; çoğu zaman görüşleri katıdır.',
      'Bencil, benmerkezcidir; içe dönük bir yaşam sürer.',
      'Normal bir insan olmaktan uzaktır; kişiler arası ilişkilerde yetersizdir.',
      'Eleştirilere aşırı duyarlıdır; sürekli bir gerginlik hali vardır.',
      'Somatik delüzyonlar (T>80 ise) görülebilir.',
      'Somatoform, depresyon ya da anksiyete bozukluğu tanısı konulabilir.',
      'Açık anksiyete belirtisi göstermez.',
      'Kendine odaklaşmış, bencil, narsisistiktir.',
      'Donuk ve ilgisizdir; sözelleştirmede başarısızdır.',
      'Uzun süreden beri devam eden sorunları vardır; etkinliği azalmıştır.',
      'Semptomları için tıbbi açıklamalar ve tedaviler ister.',
      'Terapi ya da danışmanlığa içgörü eksikliği ve alaycı tavrıyla çok iyi yanıt vermez.',
      'Terapisti eleştirir; yeterli ilgi ve desteği vermediğini düşündüğünde terapiyi sonlandırma eğilimindedir.',
    ],
    low: [
      'Somatik uğraşları yoktur.',
      'İyimserdir.',
      'Duyarlıdır.',
      'İçgörüsü vardır.',
      'Günlük yaşamda oldukça etkindir.',
    ],
  },
  D: {
    id: 'D',
    high: [
      'Depresif, mutsuz, kederli ve sıkıntılıdır.',
      'Gelecekten umutsuzdur.',
      'Kendini aşağılamaktadır.',
      'Suçluluk duyguları vardır.',
      'Konuşmak istemez.',
      'Ağlar.',
      'Yavaş hareket eder.',
      'Depresif tanısı konulabilir.',
      'Somatik yakınmaları vardır.',
      'Güçsüzlük, yorgunluk, enerji kaybından yakınır.',
      'Ajite ve gergindir.',
      'Kolay kızar.',
      'Üzüntüye eğilimlidir.',
      'Kendine güveni azalmıştır.',
      'Okulda ya da işte başarısız olduğunu düşünür.',
      'Kendini işe yaramaz ve iş görmez gibi görür.',
      'İçe çekilmiş, utangaç, ürkek, yalnız kalmaya eğilimli ve ketumdur.',
      'Soğuktur.',
      'Kişilerarası ilişkilerden kaçınır, insanlarla fazla konuşmaz.',
      'Temkinli ve gelenekseldir.',
      'Karar vermede güçlük çeker.',
    ],
    low: [
      'Gerginlik, anksiyete, suçluluk ve depresyondan arınmıştır.',
      'Rahat ve huzurludur.',
      'Kendine güvenlidir.',
      'Duygusal açıdan dengeli ve tutarlıdır.',
      'Pek çok durumda etkili davranır.',
      'Neşeli ve iyimserdir.',
      'Sözelleştirmede güçlüğü çok azdır.',
      'Aktif, enerjik, uyanıktır.',
      'Yarışmacıdır.',
      'Sorumluluk alabilir.',
      'Sosyal ortamlarda rahattır.',
      'Liderlik rolünü üstlenir.',
      'Zeki, esprili ve renklidir.',
      'İlk bakışta olumlu bir izlenim yaratır.',
      'İmpulsif değildir, kontrollüdür.',
      'Ketlenmemiştir, kendini kolaylıkla ortaya koyabilir.',
      'Diğer insanlarda kızgınlık ve düşmanlık uyandırır.',
      'Otoriter rolündeki kişilerle çatışması vardır.',
    ],
  },
  Hy: {
    id: 'Hy',
    high: [
      'Strese bedensel yakınmalar geliştirerek tepki verir; baş ağrısı, göğüs ağrısı, güçsüzlük, taşikardi gibi somatik belirtiler görülür.',
      'Semptomlar aniden ortaya çıkar ve kaybolur; gerçek organik patolojiye uymaz.',
      'Semptomlarının psikolojik nedenleri hakkında içgörüden yoksundur.',
      'Açık anksiyete, gerginlik ve depresyon nadiren bildirir.',
      'Sanrı, halüsinasyon ve kuşkuculuk nadiren görülür.',
      'Psikolojik olarak immatür, çocuksu ve infantil olarak değerlendirilir.',
      'Benmerkezci, narsisistik ve egosantriktir.',
      'İlgi çekme ve başkalarından yoğun sevgi görme ihtiyacı belirgindir.',
      'İlgi ve sevgi kazanmak için dolaylı ve dolambaçlı yollar kullanır.',
      'Sosyal olarak ilgili, arkadaş canlısı, konuşkan ve coşkulu görünür ancak ilişkileri yüzeysel ve immatürdür.',
      'Bastırma ve inkâr savunma mekanizmalarını yoğun kullanır.',
      'İkincil kazanç söz konusudur; sorumluluk almaktan kaçınma eğilimindedir.',
      'Teşhirci ve cinsel ya da saldırgan düzeyde dışa vuran davranışlar görülebilir.',
      'Çabuk sinirlenir, çabuk neşelenir; duyguları değişkendir.',
    ],
    low: [
      'Kendilerini sürekli eleştirirler.',
      'Olumlu kişilerarası ilişkileri inkâr etme eğilimindedir.',
      'Soğuk, mesafeli ve çekingen olabilirler.',
      'Sosyal ilişkilerde kaygılı ve güvensizdirler.',
      'Duygusal tepkileri kısıtlıdır.',
    ],
    lowNote: 'Si alt testinde yükselme, bireyin diğer insanlardan kaçma eğiliminde olduğunu gösterir.',
  },
  Pd: {
    id: 'Pd',
    high: [
      'Toplum kurallarına, düzenlemelere ve otorite figürlerine uymada güçlük çeker; isyankârdır.',
      'Aile içi ilişkileri fırtınalıdır; sıklıkla başkalarını suçlar.',
      'Okulda ve işte başarısızlık öyküsü vardır; yasal sorunlar görülebilir.',
      'İmpulsif, sabırsız, engellenme eşiği düşüktür; eylemlerinin sonuçlarını düşünmeden hareket eder.',
      'Anlık haz peşindedir; plan yapmaz, risk alır, maceraperest ve heyecan arayışındadır.',
      'Duygusal olarak yüzeysel, yapay ve kısa süreli ilişkiler kurar; sıcak ve yakın ilişkilerde güçlük yaşar.',
      'Kendine güveni yüzeysel olarak yüksek görünse de içte yetersizlik duyguları vardır.',
      'Öfke, kızgınlık ve hostilite belirgindir; eleştiriye aşırı duyarlıdır.',
      'Psikoterapi ya da danışmanlıkla değişme prognozu kötüdür.',
      'Benmerkezci, bencil ve narsisistik özellikler gösterebilir.',
      'Yalan söyleme, çalma gibi sosyal norm ihlalleri görülebilir.',
      'Cinsel alanda sorunlar ve çatışmalar yaşayabilir.',
    ],
    low: [
      'Geleneksel ve itaatkârdır; otoriteye boyun eğer.',
      'Pasif, itaatkâr ve çekingendir.',
      'Diğerlerinin nasıl tepki vereceğini düşünür; samimi ve güvenilirdir.',
      'Enerji düzeyi düşüktür; mevki ve güvende olmaya dikkat eder.',
      'İlgi alanları daralmıştır; yaratıcı ve spontan değildir.',
      'İnatçı, kuralcı ve katıdır.',
      'Erkekse cinsellikle çok ilgili değildir, kadınlardan korkar.',
      'Durağan, pasif ve atılgan olmayan bireylerdir.',
    ],
  },
  Mf: {
    id: 'Mf',
    high: [
      'Erkeklerde: Estetik ve artistik ilgiler, hayal kurma, içedönüklük, eğitim yönelimi belirgindir.',
      'Erkeklerde: Geleneksel erkeksi rol ile özdeşim zayıftır; pasif ve kadınsı özellikler görülebilir (özellikle Pd düşükse).',
      'Erkeklerde: Duyarlı, idealist, sosyal açıdan duyarlıdır; kültürel açıdan zengin bireylerde beklenen özellikler olabilir.',
      'Kadınlarda: Güçlü, kuvvetli, saldırgan, yönlendirici ve yarışmacıdır; geleneksel erkek rolüne özgü aktivite ve işlere girer.',
      'Kadınlarda: Bağımsız, kendine güvenli, spontan, dominant ve iddiacıdır.',
      'Kadınlarda: Kariyer ve iş ile aşırı uğraşma, erkeksi spor ve ilgi alanları görülebilir.',
    ],
    low: [
      'Erkeklerde: Erkeksi ilgiler ve davranışlar daralmıştır; maceracı, dışa dönük aktiviteleri sever.',
      'Erkeklerde: Maskülen görünmek için kompülsif uğraş vardır; narsisistik biçimde kendi güçlerini abartırlar.',
      'Erkeklerde: Altta yatan kendine güvensizlik ile ilişkilidir.',
      'Kadınlarda: Pasif, çekingen olduğunu gösterir; nevrotik üçlüde yükselme ile ilişkilidir.',
      'Kadınlarda: Giyimleri ile kadın olduklarını açıkça belli etme çabası ve geleneksel kadın rolüne aşırı uyum görülebilir.',
    ],
  },
  Pa: {
    id: 'Pa',
    high: [
      'Açık psikotik davranış gösterebilir; düşünce bozukluğu vardır.',
      'Perseküsyon ve/veya grandiyöz türünde delüzyonları, referans fikirleri vardır.',
      'Kendine kötü davranıldığını ya da kendisiyle alay edildiğini düşünür.',
      'Öfkeli, gücenik ve kıskançlık içindedir.',
      'Savunma mekanizması olarak yansıtmayı kullanır.',
      'Diğerlerini suçlama ve hostilite temel özelliktir; katı, inatçı ve aşırı duyarlıdır.',
      'Kişilerarası ilişkilerde aşırı savunucu tutum nedeniyle yanlış anlaşılabilir.',
      'Tanı sıklıkla şizofrenik ya da paranoid bozukluktur.',
    ],
    low: [
      'Kibar, duygusal ve naziktir; huzurlu ve yumuşak kalplidir.',
      'Duyarlı, güvenilir, işbirlikçi ve samimidir.',
      'İlgi alanları çoktur; enerjiktir, insiyatif gösterir.',
      'Eğer psikiyatrik hastaysa: yaşama daha paranoid uyum, öfkeli ve gücenik olabilir.',
      'Aşırı düşük puan (T<35): açık paranoid bozukluk, delüzyonlar, şüpheler olabilir; savunucu ve ketlenmiş görünüm.',
    ],
  },
  Pt: {
    id: 'Pt',
    high: [
      'Telaş ve huzursuzluk yaşar; kaygılı, gergin, endişeli ve vesveselidir.',
      'Sinirli ve tedirgindir; dikkatini yoğunlaştırmada güçlüğü vardır.',
      'Düşüncelerinde obsesiftir; kompulsif davranışları vardır.',
      'Güvensizdir ve aşağılık duyguları yaşar; kendinden emin değildir.',
      'Kendine yönelik şüpheleri vardır, kendini eleştirir; katıdır.',
      'Kendisi ve diğerleri için yüksek standartlara sahiptir; mükemmeliyetçi ve vicdan sahibidir.',
      'Suçluluk duyar ve depresiftir; temiz, düzenli, tertipli ve titizdir.',
      'Tutucu, güvenilir, sıkıcı ve donuk olarak tanımlanabilir; tereddüt eder.',
      'Sıklıkla anksiyete bozukluğu tanısı konulur; içe dönük, derin düşünceleri olan biridir.',
      'Ajite ruminasyonlar, korku hali, obsesyonlar, kompulsiyonlar ya da fobiler görülebilir.',
      'Anksiyete ve gerginlik günlük yaşamı sürdüremeyecek kadar yoğun olabilir.',
    ],
    low: [
      'Korkular ve kaygılardan arınmıştır.',
      'Kendine güven duymaktadır.',
      'Geniş ilgi alanları vardır.',
      'Sorumlu, gerçekçi, etkili, uyumludur.',
      'Başarı, mevki ve tanınıp bilinmeye ilişkin değerleri vardır.',
      'Rahat, duygusal, gerginliği olmayan bireylerdir.',
    ],
  },
  Sc: {
    id: 'Sc',
    high: [
      'Yabancılaşmış, izole, yalnız ve yanlış anlaşılmış hisseder; sosyal çevrenin parçası gibi hissetmez.',
      'Düşünce bozukluğu, konsantrasyon güçlüğü, konfüzyon ve dezorganizasyon görülür.',
      'Garip ve tuhaf düşünceler, atipik duyusal yaşantılar, depersonalizasyon olabilir.',
      'İşitsel ve görsel halüsinasyonlar, sistemli hezeyanlar görülebilir.',
      'Duygusal küntlük, uygunsuz duygulanım ve kişilerarası ilişkilerde yetersizlik vardır.',
      'Çok çeşitli somatik yakınmalar (belirsiz, atipik) ve somatik delüzyonlar içerebilir.',
      'Kendine güven az, kimlik karmaşası ve amaçsızlık hissi belirgindir.',
      '100 T ve üstü: akut durumsal stres ve ciddi özdeşim krizini, akut psikotik reaksiyonu gösterir.',
      '75 T ve üstü: gerçek şizoid düşünce süreci, sosyal çekilme ve yabancılaşma ön plandadır.',
    ],
    low: [
      'Pratik ve gelenekseldir; davranışları ve yaşama bakış açıları konformisttir.',
      'Uyumlu, sorumlu ve güvenilir olarak tanımlanır.',
      'Hayal gücü sınırlı, yaratıcılığı az ve katı olabilir.',
      'Sosyal ortamlarda rahat, neşeli ve duyarlı görünebilir.',
      'Rekabet gerektiren durumlara girmekte gönülsüzdür.',
    ],
  },
  Ma: {
    id: 'Ma',
    high: [
      'Manik dönemde olabilir; hiperaktif, huzursuz ve enerjisi yüksektir.',
      'Konuşkan, eylemi düşünceye tercih eden, coşkulu ve taşkın duygu durum içindedir.',
      'Fikir uçuşmaları, çağrışımlarda artma ve grandiyözite görülebilir.',
      'Benlik değerini abartır; iyimser, bağımsız ve kendine güvenen görünür.',
      'Dürtü kontrolünde güçlük, sabırsızlık ve engellenmeye düşük tolerans vardır.',
      'Sinirli, alıngan ve hostil olabilir; terapiste karşı düşmanca tutum gösterebilir.',
      '85 T ve üstü: ajitasyon, yordanamaz davranışlar ve belirgin grandiyözite ile manik tablo.',
      '70-84 T: enerjik, dışa dönük, aktif; onay ve statü kazanmak için çaba harcar.',
    ],
    low: [
      'Düşük enerji ve aktivite seviyesi vardır; uyuşuk, apatik, kayıtsızdır.',
      'Güdü azlığı ve ilgi kaybı belirgindir.',
      'Özellikle D yükselmediğinde depresyon düşünülmelidir.',
      'İçe dönük, sessiz ve çekingen olabilir; sosyal ilişkilerde pasif kalır.',
      'Yaşlı insanlarda Ma düşüklüğü beklenen bir durumdur; 45 yaş altında düşük olması dikkat gerektirir.',
    ],
  },
  Si: {
    id: 'Si',
    high: [
      'Sosyal açıdan beceriksiz, çekingen, utangaç ve içe dönüktür.',
      'Sosyal ilişkilerde anksiyete yaşar ve ilişki kurmaktan kaçınır.',
      'Yakın aile çevresinde rahat olan, kendini ortaya koymak istemeyen bireylerin profilidir.',
      'Güvensiz, kararsız ve kendine yönelik olumsuz değerlendirmeleri vardır.',
      'Nevrotik üçlüde yükselme görülebilir; 2, 7 ve 8 alt testlerindeki yükselme ile ruminatif davranışlar kuvvetlenebilir.',
      'Sosyal etkileşimde başarısız, anlaşılması zor ve sevilme/kabul görme konusunda endişelidir.',
    ],
    low: [
      'İyimser, dışa dönük, konuşkan ve sosyal olarak aktif bireylerdir.',
      'Manipülatif, yüzeysel ve biraz uçuk olarak tanımlanabilir; dürtü kontrol sorunları olabilir.',
      'Diğerleri ile olmak isteyen, yalnız kalamayan bireyleri gösterir.',
      'Kolay ilişki kurar, arkadaş canlısı ve meraklıdır; sosyal kabul ve onay gereksinimi çok fazladır.',
      'Sosyal ortamlarda rahat, girişken ve enerjiktir.',
    ],
  },
};
