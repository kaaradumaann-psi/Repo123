/**
 * kaynak.pdf'teki iki noktalı kod yorumları (Kod Analizleri).
 *
 * Anahtarlar kanonik biçimde yazılır: kodun iki rakamı küçükten büyüğe
 * sıralanır ("21" → "12"). Kaynakta kodların büyük kısmı "12/21" gibi her iki
 * sıralamayla birlikte ele alındığı için yorumlar ortak verilir; kaynağın
 * sıralamaya bağlı notları metin içinde korunmuştur. Metinler kaynak raporun
 * sadık özetleridir; olası tanılar kaynaktaki gibi listelenir.
 */

export type CodeInterpretation = {
  /** Kanonik kod etiketi, ör. "12/21". */
  code: string;
  text: string;
  /** Kaynakta verilmişse olası tanılar. */
  diagnosis?: string[];
  /** Kaynağın yönlendirdiği diğer kodlar. */
  seeAlso?: string;
};

const CODES: Record<string, CodeInterpretation> = {
  '12': {
    code: '12/21',
    text:
      'Bu kodun en belirgin özelliği bedensel rahatsızlık ve ağrıdır. Bireyler bedensel işlevleriyle çok fazla ilgilidir. Genel olarak hipokondriyak yakınmaları, somatizasyon bozukluğu ya da psikofizyolojik reaksiyon şeklinde kendini gösterir ve stres dönemlerinde daha da belirginleşir. Semptomlarının duygusal çatışmalarla ilgili olduğunu ve bunları kullanarak psikolojik sorunlarından kaçmaya çalıştıklarını anlamak istemezler. Yakınmaları belirsizdir ve medikal olarak ayrıştırılması zordur. Hipokondriak özelliklerinden dolayı herhangi bir tıbbi müdahale olabildiğince kısıtlı olmalıdır. 12 kodunda 1 ve 2 alt testleri arasında 5 T puanı kadar fark varsa 21’e bakılır: bu kişiler fiziksel semptom ve yakınmalarını dile getirir, bedensel işlevlerine aşırı ilgi gösterirler. Genel olarak belirgin organik bir patoloji yoktur ancak az da olsa var olan fiziksel sorunlarını abartma eğilimi gösterirler. Somatik yakınmalar arasında baş ağrısı, mide ağrısı, sırt ağrısı gibi ağrılar; kardiyak yakınmalar ya da anoreksiya, bulantı, kusma, ülser gibi gastrointestinal zorluklar odak noktasını oluşturur. Sinirlilik, huzursuzluk ve depresyonun eşlik ettiği yorgunluk, zayıflık ve baş dönmesi vardır. Hastalar yakınmalarını kullanma ve yaşam biçimi haline getirmeyi öğrendikleri için tedavi edilmeleri zordur; kısa süreli tedaviye cevap verebilirler ancak semptomları geri döner. Bedensel semptomlarının psikolojik sorunlardan kaynaklandığını reddederler; içgörüleri oldukça sınırlıdır. Duygularını ifade etmeleri güçtür ve özellikle öfke gibi olumsuz duyguların gösterileceği durumlarda kendilerini huzursuz hisseder ve öfkeyi somatizasyonla gösterirler.',
    diagnosis: ['Pasif-bağımlı kişilik bozukluğu', 'Somatizasyon bozukluğu', 'Depresyon'],
    seeAlso: '3 alt testi 1’in 5 T puanı alanı içindeyse 123/213 kodlarına da bakınız.',
  },
  '13': {
    code: '13/31',
    text:
      'Bu alt test hem normal hem de psikiyatrik hastalarda görülür. Bu hastalar genellikle immatür, benmerkezcil ve bağımlıdırlar; histerik özellikleri vardır. Dikkati kendi üzerlerinde toplamayı ve ilgi çekmeyi isterler ve bunu oldukça manipülatif bir biçimde yaparlar. Hastalar psikolojik sorunlarını somatik yakınmalar haline dönüştürürler; bu somatik yakınmalarında psikolojik etkenlerin de olabileceğini kabul etmezler, stres altında fiziksel semptomlar gösterirler. Yakınmalarında genellikle ikincil kazanç vardır (histeriden çok hipokondriyak özellikler gösterirler). Bedensel yakınmaları spesifik ve net olmamakla birlikte genellikle baş, göğüs, sırt ağrısı, uyuşma, el ve ayaklarda aşırı titreme şeklindedir; sıklıkla yorgunluk, baş dönmesi, uyuşukluk ve titreme görülür; yemek yemekten rahatsızlık ve bulantı gibi yakınmalar olabilir, bazen anoreksiya ve bulimiya görülür. 13/31 kodu ile birlikte 2 ve 7 testleri normal sınırlar içinde olsa bile birey bastırma, inkar, rasyonalizasyon ve projeksiyon mekanizmalarını aşırı bir biçimde kullanır; nadiren olumsuz kızgınlık duyguları gösterirler ve bu duygularla yüzleşmekten kaçınır ya da pasif-agresif bir biçimde davranır. Geleneksel psikoterapiye dirençlidirler; terapide kesin cevaplar ve çözümler olmazsa terapiyi başlangıç aşamasında bırakırlar. İçgörüleri yoktur; bedensel yakınmalarının psikolojik kaynaklı olduğuna ilişkin yorumlara çok dirençlidirler. Bedensel semptomlar ikincil kazanç sağlar: sorumluluk almama ve görevden kaçma. Yüksek K ile (özellikle 2, 7 ve 8’in T puanı 70’in ve F’nin 50’nin altında olduğu durumda) bireyler kendini normal, sorumluluk sahibi, yardımsever ve sempatik olarak sunmaya çalışır. Düşük 2 ile birlikte histerik kişilik özellikleri ve klasik psikosomatik semptomlar gösterirler.',
    seeAlso: '132/312, 134/314, 136/316, 137, 138/318, 139 kodlarına da bakınız.',
  },
  '14': {
    code: '14/41',
    text:
      'Erkeklerde kadınlardan daha sıktır. Benmerkezci, karamsar ve sızlanan kişilerdir. Hastaların hipokondriyak yakınmaları özgün olmayan baş ağrıları biçimindedir. Sosyal açıdan dışadönük olarak görülmelerine karşın karşı cinsle ilişkilerinde oldukça rahatsızlık yaşarlar. Aileye yönelik isyan duyguları olsa bile bunu ifade edemezler. Genel olarak aşırı alkol alımı tabloda görülür; karşı cinsle ilişki sorunları tanımlarlar; okul ve iş başarıları düşüktür. Kısa süreli semptomatik tedaviye iyi yanıt vermekle birlikte uzun süre tedavide kalamazlar. Alt test 3 de birlikte yükselmişse aile ve evlilik sorunları, kızgınlık ve sosyal yetersizlik duyguları ile birlikte bağımlılık-bağımsızlık çatışmaları ön plana çıkmıştır. Sorunlarının psikolojik kökenli olabileceğini inkar ettikleri için tedaviye dirençlidirler. Yüksek 1/Düşük 4 örüntüsü karşılaşılan sorunlarla başa çıkamama ve ev yaşantısındaki güçlüklerle bağlantılıdır; öfkelerini kolaylıkla dile getirmelerine karşın psikofizyolojik tepkiler verirler; sürekli yakınma ve karamsarlık genel özellikleridir.',
    diagnosis: ['Alkolizm', 'Daha seyrek olarak kadınlarda maskeli depresyon'],
  },
  '15': {
    code: '15/51',
    text:
      'Yetişkin erkekler yakınan, telaşlı ve eleştiren ve temel olarak pasif bir yaşam biçimine sahiptir; somatik alanda sorunlar getirirler. Genel olarak açık eyleme vuruk davranış yoktur; nadiren açık çatışma ve kararsızlık gösterirler. Bu kodda kadın hasta daha az görülmektedir; orta ve üst sosyo-ekonomik düzeyden gelen ve eğitimli kadınlarda karamsarlık yakınmaları oldukça fazladır. Bağımlı gibi görünseler de kişiler arası ilişkilerinde yarışmacı ve saldırgan olma eğilimleri vardır; bunları kontrol edebilmek için somatizasyon yakınmaları getirirler. Ergenlerde çatışmalarını ya da sorunlarını ifade etme güçlükleri vardır; sıklıkla kendilerinde bedensel hastalık olduğunu kabul ederler ve diğerleri ile bunu kullanarak ilişki kurarlar.',
    seeAlso: '15/51 kodunu yorumlarken 5 alt testini bırakarak yükselen üçüncü alt teste bakmak gereklidir.',
  },
  '16': {
    code: '16/61',
    text:
      'Bu bireyler katı, inatçı, eleştiriye açık, duyarlı ve diğerlerini suçlama eğiliminde olan kişilerdir. Her şeyi baştan savma eğilimindedirler, savunucudurlar ve duygusal ilişkiden endişe duyarlar. Genel olarak öfkelerini rasyonalizasyonu ve yansıtmayı kullanarak gösterirler. Kontrollerinin çok fazla olmasına karşın bu gruptaki kişilerde (özellikle ergenlerde) şiddetli öfke patlamaları görülmektedir. Alt test 8 de yükselmişse alışılmamış somatik uğraşların varlığı dikkate alınmalı, belki de somatik delüzyonların olabileceği düşünülmelidir; bazı bireyler bedensel uğraşlarıyla “psikotik bir dönemden” kurtulmaya gayret ederler.',
    diagnosis: ['Alt test 4’ün T değeri 70’ten azsa: Paranoid Şizofreni'],
  },
  '17': {
    code: '17/71',
    text:
      'Bu hastaların bedensel yakınmaları onların yaşadığı gerilim ve kaygıyı yansıtmaktadır. Yüksek enerji düzeyi ve ajitasyonla birlikte çoklu somatik semptomlar görülebilir. Bireyde gerilimin yarattığı somatik yakınmaların yanı sıra anksiyete belirgindir. Genel olarak bedensel işlevlerdeki bozuklukları ile obsesif bir biçimde uğraşırlar. Bu kod erkeklerde kadınlardan daha fazladır.',
  },
  '18': {
    code: '18/81',
    text:
      'Hastalarda düşmanlık ve saldırganlık duyguları vardır ancak bu duygularını uygun bir biçimde ifade edemezler. Beden işlevleri ve bedensel hastalıklara ilişkin delüzyonel düşüncelerini açıkça gösterirler. Genellikle bizar tabiatlı somatik yakınmaları vardır; somatik hezeyanları olabilir. Ayrıca somatik yakınmaları gerçek psikotik yaşantının ortaya çıkmasına karşı savunmaları yansıtıyor olabilir. Bu kişilerde karşı cinsin üyelerine ilişkin hostilite vardır; diğerlerine karşı güvensizlik, kendini onlardan kopmuş gibi hissetme uzaklaşma ve izolasyon ortaya çıkarabilir. Özellikle stres altında kişilerde şaşkınlık ve düşüncede konfüzyon olabilir; somatik uğraşları gerçek ile bağlantılarını koparabilir. Öfke ve hostilite duyguları belirgindir ancak bunu açıkça ifade edemezler. Tedavi sürecinde basit müdahaleler bu hastalara yetmez; içgörü sağlamaya yönelik yaklaşımlarla da yarar sağlanamaz. Bu kod tipini veren ergenlerin okul başarısı düşüktür, unutkanlık oldukça fazladır; baş ağrısı ve mide ağrısı gibi somatik yakınmaları vardır; arkadaşları azdır; hem okulda hem sosyal yaşamda uyumları bozuktur; madde bağımlılığı ya da intihar girişimleri olabilir. Bu örüntüyü gösteren ergenlerin 2/3’ü boşanmış ailelerden gelmektedir.',
    diagnosis: ['Eğer F alt testi de yükselmişse şizofreni', 'Pre-psikotik bozukluk tanısı da düşünülmelidir'],
  },
  '19': {
    code: '19/91',
    text:
      'Hastalar gergin ve kaygılı olarak tanımlanır; çok yoğun duygusal karmaşa yaşarlar. Sindirim sorunları, baş ağrıları ve bitkinlik gibi bedensel yakınmalar yaygındır ve bu kişiler semptomlarına yönelik psikolojik açıklamayı kabul etmezler. Kendilerinden beklentileri çok yüksektir ancak açık ve belirgin amaçları yoktur; engellenme duyguları kendileri için belirledikleri bu yüksek amaçları yerine getirememekten kaynaklanmaktadır. Pasif-bağımlı bireylerdir, yetersizliklerini kompanse etmek isterler. Bu kod tipi aynı zamanda beyin hasarı olan bireylerde görülmektedir; kendi sınırlılıkları ve yıkımları ile başa çıkmada güçlükleri vardır. Eğer bu profilde 2 ve 3 alt testlerinin değerleri 5 T puanından aşağıda ise 129 ve 139 koduna bakınız.',
    diagnosis: ['Organik beyin bozukluğuna bağlı güçlükler', 'Pasif-bağımlı kişilik bozukluğu'],
  },
  '01': {
    code: '10/01',
    text:
      'Bu kod oldukça nadirdir; sosyal açıdan rahatsız, içe çekilmiş, soğuk, pasif kişilerde ortaya çıkar. Genel olarak bunlara bedensel yakınmalar eşlik eder. Üçüncü yükselen alt test 8 olduğu zaman genellikle çok sayıda somatik yakınmalarla birlikte şizoid çekilme ve sosyal yetersizliğin olduğu söylenebilir. Sıklıkla 2 ve 3 yükselen testlerdir ve eğer T değeri 70’in üstünde ise destek sistemleri zayıflamıştır ve maskeli depresyon vardır.',
  },
  '23': {
    code: '23',
    text:
      'Bireyler kendilerini sıklıkla (özellikle düşük 9) zayıf, yorgun ya da tükenmiş hissederler ve bunların depresyonu genellikle uzun sürelidir. Mutsuzluğu tolere ederler ve görevlere başlayamadıkları, başladıklarında tamamlayamadıkları için düşük bir etkinlik düzeyinde fonksiyon gösterirler. Kod, histeroid savunmaların yetersiz kullanılışı sonucu ortaya çıkar; hastalar azalmış aktivite düzeyi, apati ve çaresizlik içeren depresyon gösterirler. Hastalar kişilik özellikleri olarak immatür, yetersiz ve bağımlı olarak tanımlanırlar; kronik sorunlarına alışmışlardır ve yıllar boyunca bu azalmış etkinlik düzeyinde işlevlerini sürdürürler. Bedensel yakınmalar sıklıkla histerik niteliktedir ve değişkendir. Bu hastalar psikoterapiye dirençlidir çünkü kronik sorunlarına nasıl uyum yapacaklarını öğrenmişlerdir; değişime ilişkin motivasyonları düşüktür. 23 kodlu erkekler görünüşte çok fazla başarı yönelimlidir ancak sıklıkla işlerinde fark edilmediklerinden yakınırlar. 23 kodlu kadınlar (özellikle düşük Mf ya da düşük Ma) zayıflık, apati ve belirgin depresyon gösterirler; evde ve işte mutsuzluk ve genel bir etkin olamama hali kronikleşmiştir, ayrıca evlilik ve aile uyumsuzluğu öyküsü vardır. Bu kod 25 yaşın üzerindekilerde daha sık ise de ergenlerde de görülür ve kötü arkadaş ilişkileri ile bağlantılıdır.',
    diagnosis: ['Depresif nevroz'],
    seeAlso: 'Eğer uygunsa 213/231 kodlarına bakınız; alt test 3, alt test 2’nin 5 T puanı alanı içinde ise 32 kodlarına bakınız.',
  },
  '24': {
    code: '24/42',
    text:
      'Bu tür profil veren hasta immatür, bağımlı ve benmerkezcidir. Dürtülerini kontrol etmekte zorluk çekmektedir ancak şu anda depresyon, pişmanlık ve suçluluk yaşamamaktadır. Sosyal olarak kabul edilmeyen bir biçimde eyleme vurma davranışından sonra rahatsızlık yaşar. Görünen suçluluk duygusu şiddetli olsa da (hatta olayla orantılı olmayacak kadar fazla) eyleme vuruk davranışlar gelecekte döngüsel bir biçimde tekrarlanır. Aile ile ilişki sorunları ve iş kaybı öyküsü bu örüntüye eşlik eder; içki içme, madde kötüye kullanımı ya da alkolizm ve yasal sorunlar sıktır. Çoğunlukla 3, 7 ya da 8 üçüncü yükselen testtir. Bu örüntüdeki ergenler kabul edilmiş sosyal standartlara belirgin bir aldırmazlık gösterirler; özellikle otorite figürlerine karşı küskün, tartışmacı, başkaları ile yakınlık kurmaktan korkan, suçlayıcı ve sıklıkla ilaç kullanan bireylerdir; yasal ihlaller (tutuklanma, mahkumiyet, göz hapsine olma) geneldir, bunun yanında evden ya da tedavi merkezlerinden kaçma da görülür. Birey davranışlarını değiştirmek için kesin bir biçimde niyetli olabilir ancak bu örüntü süreğendir ve uzun sürede prognoz iyi değildir; hızlı, geçici ilerleme gösterebilir ancak yüzeysel değişikliklerden daha öteye gidecek tedavide kalamaz. Tedavide katı sınırlamalar, stratejik terapi yordamaları, sık görüşme ve çevresel düzenlemelerin bir arada kullanımı çok yardımcı olabilir.',
    diagnosis: [
      'Psikopatik kişilik bozukluğu tanısı konulan bireylerde duruma bağlı depresyon',
      'Dürtü kontrol bozukluğu',
      'Stres karşısında alkol ya da madde kullanımı',
    ],
    seeAlso: '243/432, 247/427/472/742 ve 248 kodlarına da bakınız.',
  },
  '25': {
    code: '25/52',
    text:
      'Bu koddaki erkekler içe dönük, pasif, kararsız, depresif ancak idealist bireylerdir. Kaygılı ve geri çekilmişlerdir, somatik yakınma öyküsü verirler ve açık bir biçimde düşünememekten yakınabilirler. Nadiren flört ederler ve genellikle heteroseksüel uyumları göreceli olarak kötüdür. Sıklıkla bu kodda erkeklerde 7, 3, 4 ya da 0 alt testleri de birlikte yükselir. 25/52 koddaki kadınlar depresiftirler ve kendilerine yönelmişlerdir ancak başkalarına dayanmak yerine kendi kendilerine yetmeye çalışırlar. Bu kodda ergenler genellikle kardeşleri ya da arkadaşları ile ilişkilerinin kötü olması, utangaçlık, aşırı negativizm ya da aşırı duyarlık nedenleri ile başvururlar. Kişilerarası ilişkilerde utangaç, pasif ve çekingen olan bu ergenler sıklıkla mükemmeliyetçilik ve titizlikle birlikte aşırı entellektüalizasyon gösterirler; genellikle kaygı, suçluluk, aşırı duyarlık, kendini suçlama, depresyon ve sosyal beceriksizlik vardır.',
  },
  '26': {
    code: '26/62',
    text:
      'Alıngan, depresif ve eleştiriye aşırı duyarlı kişilerdir. Bu bireylerde altta yatan güçlü bir kızgınlık duygusu ve sıklıkla süreğen kişiler arası ilişki güçlükleri vardır. Genellikle paranoid eğilim gösterirler; nötr durumları kötü niyetli olarak değerlendirir ve yetersiz veriye dayanarak sonuç çıkarırlar. Küskünlük, ajitasyon, yorgunluk ve saldırganlık genellikle belirgindir. Sıklıkla bu bireyler başkaları onları reddetmeden önce onları reddetme düşüncesi ile ya da bağımlı olmaktan kaçınma aracı olarak kavgaya hazırdırlar. Pa alt testi belirgin bir biçimde yükseldiğinde ve/veya 4 ve 8 alt testi 70 T puanının üzerinde ise bireyin psikozun erken dönemlerinde olma olasılığı artar. Bu tür hastalar kızgın depresif kişilerdir; çok şiddetli kızgınlıklarını çevrelerine ve kendilerine karşı yöneltebilirler. Kızgınlıklarını ifade edemeyen diğer deprese hastalara göre bu hastalar açıkça hostil ve küskün olabilirler.',
    diagnosis: ['Psikozun erken dönemi'],
  },
  '27': {
    code: '27/72',
    text:
      'Bu hastalar pasiftir; kişiler arası ilişkilerinde bağımlı olduklarında kendilerini çok rahat hissederler. Korunduklarında ve başkalarının bakımı altına alındıklarında bu duruma çok kolay uyum sağlarlar. Bireyler çoğunlukla kendileri için çok yüksek standartlar belirleyerek stres yaşarlar. Stresleri arttığında başkalarından yardım isterler; depresyon ve endişeleri içinde belirgin bir biçimde ve yapışırcasına bağımlı hale gelirler. Bu görünen çaresizlik, uysallık ve kendini değersizleştirme düşünceleri başkalarını onları kurtarma ve korumaya yöneltir. Hs alt testi de yükselmişse bu bireyler kaygıyla bağlantılı somatik yakınmaların yanı sıra kendine acıma, suçlama ve başkalarının onlara bakmasını istemelerine karşın sosyal geri çekilme gösterirler.',
    seeAlso: '273/723, 274/724, 275/725, 278/728, 270 kodlarına da bakınız.',
  },
  '28': {
    code: '28/82',
    text:
      'Bu kod tipindeki kişiler anksiyete ve ajitasyonla birlikte şiddetli depresyon yaşayan hastalardır. Depresyon ve ajitasyon ile genellikle dikkat ve konsantrasyonda azalma, unutkanlık ve konfüzyon hali ortaya çıkabilir. Sıklıkla obsesif ruminasyonlar sergilerler; düşünce bozukluğu, yorgunluk gibi somatik yakınmalar sık görülür. Kişiler arası ilişkilerden ve aktivitelerden kendilerini izole edip çekilme eğilimleri vardır. İntihar girişimleri olabilir; dikkat edilmesi gerekir. Bu nedenle prognoz itibariyle hastanın değişmesi ihtimali zayıftır. Bu özelliklerin yanı sıra “şizofrenik özellikler” de gösterebilirler: işitsel ve görsel halüsinasyonlar ve sistemli hezeyanlar olabilir; düşünce bozukluğu değerlendirilmelidir. Garip karakterde somatik semptomlar görülebilir. Deprese, izole ve çekiniktirler. Bu kronik uyum örüntüsü genellikle hastaneye yatmayla son bulur. Bu bireylerde terapötik ilişki kurmak zordur; psikoterapi prognozu kötüdür; psikofarmakoloji en azından başlangıçta yararlı olabilir.',
    diagnosis: ['En sık konulan tanı: manik depresif psikoz, melankoli ve şizoaffektif bozukluk'],
    seeAlso: '281/821, 284/824 ve 287/827 kodlarına da bakınız.',
  },
  '29': {
    code: '29/92',
    text:
      'Bu gruptaki kişiler benmerkezci ve narsisistik olma eğilimindedirler; kendi değerlerini abartırlar. Bu bireyler yüksek bir enerji düzeyine sahiptir ancak bu depresyon ve kaygı ile bağlantılıdır; yüksek enerji düzeyi ya başa çıkmayı ya da bir kontrol kaybını telafi etme girişimini temsil eder. Genellikle üç tip birey bu kodu elde eder: (1) Ajite depresyonu olan bireyler — ağlama, feryat etme, depresif ruminasyonlar belirgindir; çocuklar gibi ilgi çekmek için çok fazla duygusal olabilirler. (2) Alttaki depresyonlarıyla manik savunmalar kullanarak başa çıkmaya çalışan bireyler — büyüklük düşünceleri ve inkar depresyonu maskelemede yeterli olabilir ancak çoğunlukla bu savunmalar uzun süre etkili değildir; bireyde daha sonra çok fazla içki içme davranışı ortaya çıkar. (3) Organik beyin sendromu olan, işlevsellik ve yeteneklerindeki azalmanın farkında ama bunu inkar etmeye ve başkalarından saklamaya çalışan bireyler — daha önce kolaylıkla yaptıkları şeyleri yapmamanın eksikliğine bağlı ajitasyon göstereceklerdir.',
  },
  '02': {
    code: '20/02',
    text:
      'Bu bireylerde sinirlilik, zayıflık, yorgunluk, benlik değerinde düşme belirgin özelliklerdir. Kod sosyal olarak geri çekilmiş hafif ancak kronik depresyonu olan bireyleri gösterir. Depresyon sıklıkla bireyin kişiler arası ve sosyal becerilerinin kötü olması ile bağlantılıdır ve aşağılık ve utangaçlık duyguları ile birliktedir. Profilde hem yetişkinler hem de ergenler özellikle sosyal ilişkilerde sinirlidirler ve engellenmiş hissederler; çok az arkadaşları vardır. Çoğu (özellikle test 1 düşükse) fiziksel olarak çekici olmadığını düşünür. Uykusuzluk, suçluluk duyguları ve endişe de sıklıkla vardır.',
    diagnosis: ['Pasif-agresif kişilik'],
  },
  '34': {
    code: '34/43',
    text:
      'Her iki kod tipi de kızgın, immatür ve bencildir. Evlilik uyumsuzluğu, rastgele cinsel ve yüzeysel ilişkiler, boşanma, alkolizm temel özelliklerdir. En belirgin özellikleri kronik ve şiddetli öfkedir; düşmanlık ve saldırganlık dürtüleri vardır. Öfkelerini olduğu gibi gösterirler ve bu duygularını uygun zamanda ifade edebilecek uygun yolları geliştirememişlerdir. Çoğunlukla aşırı kontrollü olmalarına karşın kısa saldırganlık dönemleri vardır. Başkalarını cezalandırma ve sorunları için başkalarını suçlama eğilimi içindedirler. Sıklıkla kişilik bozukluğu tanısı konulmaktadır; ancak 3 ve 4’ün göreceli yükseklikleri bu tür bireylerin kızgınlıklarını ve diğer impulslarını ne ölçüde ketlediğinin (eğer 3 yüksekse) ya da öfkelerinin daha fazla ifade edildiğinin (eğer 4 yüksekse) bir göstergesidir. Koddaki kadınlar sıklıkla yaşamlarının yüzeysel yönleri üzerinde çok fazla dururlar, sabırsızdırlar ve sürekli isterler; ayrıca hafif düzeyde psikosomatik yakınmaları vardır. 34/43 kodu, okulla ve otoriteyle çatışması olan ergenlerde çok sık görülür: hırsızlık, ilaç kullanımı, okuldan kaçma ve evden kaçma sıklıkla vardır; ayrıca intihar düşünceleri ve uyku güçlükleri gözlenir. Yüksek 3/Düşük 4 örüntüsünde birey kızgınlık duygularını dolaylı olarak gösterir; 4’ün 3’ten önemli ölçüde yüksek olduğu durumlarda kızgınlık baskındır ancak uzun süre baskı altında tutulmuş ve sonra öfke patlamalarıyla ifade edilmiştir.',
    diagnosis: ['Pasif-agresif kişilik bozukluğu, agresif tip'],
  },
  '35': {
    code: '35/53',
    text:
      'Bu koddaki erkekler pasif ve hatta geri çekilme eğilimindedirler. Davranımda bulunmaktan çok beklerler; inhibe ve güvensiz görünürler ancak çok güçlü ilgi gereksinimleri vardır. Genellikle utangaç, kaygılı ve sosyal olarak rahatsızdırlar (özellikle eğer Si alt testi yükselmişse). Çoğunun ahlak anlayışı farklıdır.',
  },
  '36': {
    code: '36/63',
    text:
      'Yüzeyde bu bireyler eleştiriye aşırı duyarlı, kuşkulu, gergin ve hatta şüphecidirler. Sıklıkla baş ağrıları ya da gastrointestinal yakınmaları da vardır. Sorunlar ortaya çıktığında başkalarını ya da durumları suçlarlar. Yüzeydeki bu durumun altında aile üyelerine karşı yaygın ve uzun süredir devam eden kızgınlık duyguları vardır; kızgınlık fark edildiğinde rasyonalize edilir. Bu hastalar eleştiriye aşırı duyarlıdır; belirgin anksiyete ve gerginlikleri vardır; sıklıkla somatik yakınmaları getirirler. Gerçekte bu bireylerin çoğu ile birlikte olmak zordur çünkü kendileri üzerinde odaklanırlar ve vücut pozisyonları sanki tetikte gibidir. Bu ikili kod kadınlar arasında erkeklere oranla daha fazladır. Alt test 6, 3’ten 5 ya da daha fazla T puanı yüksek olduğunda birey güç ve prestij kazanmak ister ve kızgın bir biçimde bencildir, hatta acımasız manipülasyonlar noktasına gidebilir; tipik olarak davranışlarında katı ve savunucudurlar; bazıları belirgin paranoid özellikler gösterebilir. Alt test 3, 6’dan yüksekse bu tür bireyler kızgınlıklarının farkında değildirler ancak bu başkaları için çok açık olabilir; kendi üzerinde odaklanma ve benmerkezcilik açıkça vardır ve genellikle incitme duyguları birliktedir.',
  },
  '37': {
    code: '37/73',
    text:
      'Çok sık rastlanamayan bir koddur; gerginlik, anksiyete, uykusuzluk, kronik rahatsızlık, diğer bedensel yakınmalar ve düşük akademik başarı ile bağlantılıdır. Bu semptomların altında çözümlenmemiş bağımlılık istekleri, yetersizlik duyguları yatmaktadır; ancak bu bireyler bastırmayı kullanırlar ve bu içgörüye önemli ölçüde engel olur. Birey düşünce ve davranışlarında tuhaf ve gariptir; belirli bir şeye odaklanmada, hatırlamada ve hatta karar vermede güçlükleri vardır. Kendilerini yabancılaşmış hissetseler de abartılmış bir sevilme gereksinimi duyarlar ancak başlanmaktan korkarlar; başkalarından sevgi almaya çalıştıklarında tipik olarak bunu çocuksu bir biçimde yaparlar ve başkaları bunu tuhaf bulur. Psikolojik karmaşaları oldukça büyüktür; öyle ki bu durum otistik aşırı düşünme ya da delüzyonlar gibi majör bir düşünce bozukluğunu temsil ediyor olabilir, buna davranışsal regresyon eşlik eder. Gerçek olmama duyguları ve duygusal uygunsuzluğa bulanık görme, baş dönmesi, ateş basması ve baş ağrıları eşlik eder. Bazıları kısa, cinsellikle dolu psikotik epizodlar gösterirler ve bunu daha sonra hatırlamazlar. Psikolojik stres ya da çatışmalar sonucunda kronik fiziksel yakınmalar geliştirirler; dışarıdan görülen davranışsal gerginlik ve kaygıya rağmen psikolojik sorunlarının varlığını inkar ederler.',
  },
  '38': {
    code: '38/83',
    text:
      'Bu hastalar ruhsal karmaşa içindedirler. Düşünme ve konsantrasyon bozukluklarından yakınırlar. Psikolojik stres fiziksel streslerle ifade edilir; fiziksel yakınmalar baş ağrısı, uykusuzluk ya da yorgunluk olabilir, bizar özellikleri vardır. İmmatür, egosantrik ve bağımlılık gibi histerik özelliklerin yanı sıra hostilite, gerginlik ve endişe sergilerler. Gerçek psikotik olabilirler; bir düşünce bozukluğu ihtimali dikkatle değerlendirilmelidir. Psikotik reaksiyonlar görüldüğünde bunlar davranışsal regresyona eşlik eden infantil ve narsisistik niteliklerdir. Çağrışımlarda bozukluk görülebilir; obsesif düşüncelere, açık delüzyona, halüsinasyonlara, anlamsız ve enkoheran konuşmaya rastlanabilir. Destekleyici yöntemler telkin edilmelidir.',
    diagnosis: ['Şizofreni', 'Bazı durumlarda histerik nevroz'],
  },
  '39': {
    code: '39/93',
    text:
      'Bu bireyler genellikle girişken, dışadönük ve açık olarak kendine güvenen kişilerdir; ancak çok yüzeysel olabilirler (özellikle eğer alt test Si 40 T puanının altında ise). Genellikle sözel olarak saldırgandırlar; bağımlılık-bağımsızlık çatışmaları vardır ve özellikle baskıcı anneye karşı kızgın olarak tanımlanırlar. Klinik ortamlarda dönemsel anksiyete ve akut rahatsızlık öyküleri vardır ve sıklıkla bunlara çarpıntı, taşikardi ve gastrointestinal alanla ilgili semptomlar eşlik eder. Genelde bu semptomlar medikal yönden doğal ve olası değildir. Tipik olarak bireylerdeki bu somatik yakınmalar güvenceyle birlikte verilen semptomatik tedaviye iyi yanıt verirler.',
  },
  '03': {
    code: '30/03',
    text:
      'Nadir görülen bu kod pasif, bağımlı ve geri çekilme boyutunda sosyal yönden pasif olan bireylerle bağlantılıdır. Ancak onlar bu tür bir uyumda göreceli olarak rahat görünürler ve sosyal durumlardan kaçmayı ve rahatsız edici duygularını bastırmayı yeğlerler. Stres durumlarında dönemsel psikosomatik yakınmalar görülebilir.',
  },
  '45': {
    code: '45/54',
    text:
      'Ergenler için bu kod öfke patlamalarının olduğunu gösterir; kuralları ve otoriteyi sevmezler ve sıklıkla okuldan kaçma, okula ara verme ve sınıfta kalma öyküleri vardır (özellikle 4 alt testi 5 alt testinden daha yüksek olduğunda bu daha belirgindir). Bireyler öfkelerini kontrol etmede büyük zorluk çekerler; ilaç kullanımı, hırsızlık veya anti-sosyal davranışlar da olabilir. Ancak bu ergenler girişken (insan canlısı), dışa dönük ve genellikle akranları tarafından sevilen kişilerdir ve prognoz iyidir. Bu koddaki yetişkinler liseden daha az eğitimi olan kişilerdir ve sıklıkla olgunlaşmamış ve narsisistiktir; görünümleri ve davranışları ile sosyal kurallara meydan okumaktan zevk duyarlar. Lise ya da daha yüksek eğitimi olan yetişkin erkeklerin narsisistik biçimde uyumsuz olma olasılığı daha azdır; bunun yerine bu bireyler kurumlara karşı sosyal protestolar ya da hareketler içine girerler; sıklıkla çok idealist ve fikirlerini açık ve etkin bir biçimde iletebilecek yetenektedirler; baskın olma ve bağımsızlık bu bireyler için önemli konulardır. Alt test 3’ün sonraki en yüksek test olduğu durumda birey aşırı kontrollüdür ve bağımlılık ve hatta pasifliği daha fazla vurguluyordur. 45 ve 54 kodlu kadınlar tipik olarak pasifliği kadınsı rol ve kendilikle birleştirirler; bu kadınların bazıları için bu erkeksi bir protesto ve/veya lezbiyen bir ilişkide erkek rolünün kabul edilmesidir; diğer kadınlarda, özellikle kırsal alan kadınlarında bu profil sadece geleneksel olarak kadınsı olmayan bir yaşam biçimini gösterir.',
    diagnosis: ['Pasif-agresif kişilik bozukluğu, pasif tip — erkeklerde 5 yüksektir, kadınlarda 5 düşüktür'],
  },
  '46': {
    code: '46/64',
    text:
      'Temel özellikler kızgınlık, küskünlük, güvensizlik, somurtkanlık, sinirlilik, eleştiriye ve başkalarının isteklerine karşı aşırı duyarlılık ve suçun başkaları üzerine yansıtılmasıdır. Bu bireyler kendilerini çok çabuk reddedilmiş hissederler; yetersiz veri ve çok az öngörü ile sonuçlara varırlar. Düşünceleri tipik olarak nasıl ihmal edildikleri, başkalarının nasıl hatalı olduğu ve kendilerini nasıl koruyabilecekleri üzerinde odaklanır; zor durumlar ya da sorunları yaratmada kendi rollerinin ne olduğu üzerinde düşünmezler. Bu bireylerin öyküleri ciddi sosyal ilişki sorunları, çok az yakın ilişkiler ve sıklıkla ilaç kullanımı ya da alkolizm gösterir. Başkalarının kendiyle çok fazla ilgilenmesini isterler ancak aynı davranış kendilerinden beklendiğinde gücenip kızarlar. Bu kod yetişkin normaller arasında nadirdir ancak ergenlik dönemine özgüdür: bu koddaki ergenlerin aileleriyle ve otorite figürleriyle sürekli çatışmaları vardır; onları kinci, düşman ve yalancı olarak görürler; impulsların kendine zarar verici biçimde kontrol edilmemesi karakteristiktir. Yetişkin erkeklerde bu kod sıklıkla psikotik ya da pre-psikotik durumlar ile (468/648) ya da borderline kişiliklerle (462/642 ve 463/643) bağlantılıdır; bireylerin hepsinde kuşkuculuk, güvensizlik ve aşırı genelleme ile paranoid özellikler vardır. Alt test 4, test 6’dan yüksek olduğunda aile ve iş güçlükleri tipiktir, bunlarla birlikte kızgınlık hakim özelliktir; alt test 6, 4’ten yüksek olduğunda daha çarpıcı paranoid özellikler ön plandadır. Kadınlarda 46/64 kodu psikoz ya da prepsikozla (özellikle eğer test 8 yüksek ve K düşük ise) ilişkili olabilir ancak sıklıkla pasif-agresif kişilik biçimleri ile özellikle erkeklere kızgınlıkla bağlantılıdır.',
    diagnosis: [
      'Pasif-agresif kişilik bozukluğu',
      'Eğer 8 alt testi yükselmişse borderline ya da psikotik bozukluk tanısı konabilir',
    ],
  },
  '47': {
    code: '47/74',
    text:
      'Bu bireylerde (hem ergenler hem yetişkinler) kızgınlık açıkça göze çarpan bir özellik ise de kendi kendini eleştirme ve suçluluk da sık görülür. Bireyin davranışı döngüsel bir örüntü gösterir: bir dönem için düşünmeden ya da çok az impuls kontrolü ile narsisistik ve kendi isteklerini önplana çıkarıcı bir biçimde eyleme vuruk davranış gösterirler; bu sırada sıklıkla başkalarının isteklerini, duygularını düşüncesizce ayaklar altına alır, sosyal ve yasal sınırlamaları çiğnerler. Eyleme vurma döneminden sonra (bu sıklıkla rastgele cinsel ilişkiler, fahişelik ya da aşırı alkol kullanımını içerir) davranışlarının sonucundan dolayı çok fazla pişmanlık, utanma ve suçluluk yaşarlar. Vicdan azapları çok şiddetli olur ancak davranışlarını kontrol etme (genellikle aşırı kontrol etme eğilimi) geçicidir ve daha sonra da eyleme vuruk davranış dönemleri beklenir. Davranışlarının altında bağımlılık ve bağımsızlık arasında büyük çatışma vardır. Görünen davranışsal sosyal aldırmazlıklara karşın güvensizdirler; güçlü ilgi ve güven gereksinimleri duyarlar. Başkaları tarafından konulan kuralları ve düzenlemeleri çok fazla sinir bozucu bulurlar; tipik olarak kendi duyguları ile çok fazla ilgilenirler, başkalarının duyguları ve durumlarına karşı çok fazla duyarsızdırlar. Psikoterapi suçluluk yaşadıkları dönemde yapılırsa etkili olabilir; ancak uzun süreli prognoz iyi değildir.',
    seeAlso: '247/427/274 kodlarına da bakınız.',
  },
  '48': {
    code: '48/84',
    text:
      'Bu kod tipindeki bireyler sinirlilik, hostilite, şüphelenme ve olasılıkla referans fikirlerinin yanı sıra yoğun sıkıntı yaşamaktadırlar. Yansıtma ve eyleme vuruk davranışlar asosyal yollarla ifade edilir. Sosyal açıdan izoledirler ve duygusal bağlanmadan korktukları için yakın kişiler arası ilişkilere girmezler. Bu bireylerin davranışları yordanamaz, değişkendir ve duruma uygun değildir. Cinsel kimlik sorunları vardır; ciddi alkol kullanım öyküsü ve madde bağımlılığı olabilir. Yargılama bozuk, içgörü sınırlıdır; sıklıkla intihar girişimi görülebilir. Ergenlerde bu kod çok geneldir ve en azından orta düzeyde ve belki de çok ciddi geçici uyum sorunları yansıtır; diğerlerinde bu prepsikotik bir süreci göstermektedir. Bu ergenler kızgın ve mutsuzdurlar, garip düşünce örüntüleri gösterirler, devam eden kişiler arası ilişki güçlükleri vardır ve uyumsuz biçimlerde impulsiftirler; akademik yönden başarısızdırlar ve suç işleyebilirler. Bu koddaki yetişkinler genellikle majör bir kişilik bozukluğu ya da psikotik bir süreç gösterirler. Sosyal yargılamanın kötü olması, uyumsuzluk ve impulsivite dışa vurma olasılığını artırır. Bu koddaki bireylerin işlediği suçlar (özellikle test 6 ve 9 da yüksekse) sıklıkla anlamsızca yapılmış, zalim ve acımasızdır, kötü planlanmıştır ve sapkın cinsel davranışlar ya da cinayet işleme dönemlerini içerir. Kadınların sıklıkla istenmeyen gebelikleri ve her alanda başarısız olan erkeklerle ilişki kurma öyküleri vardır; benlik değerleri düşüktür. Yüksek F/Düşük 2 ile birlikte bu bireyler genellikle başkalarından farklı ve yabancılaşmış olmaktan dolayı rahattırlar; sıklıkla saldırgan ve cezalandırıcıdırlar ve başkalarını kontrol etmeye çalışırlar; bu kişilere “sosyopat kişilik” tanısı konabilir.',
    diagnosis: [
      'Psikiyatrik yatan hasta ise şizofreni (Paranoid tip)',
      'Borderline kişilik bozukluğu',
      'Antisosyal, paranoid, şizoid kişilik bozukluğu',
    ],
    seeAlso: '482/842, 486/846, 489/849 kodlarına da bakınız.',
  },
  '49': {
    code: '49/94',
    text:
      'Hem yetişkinler hem de ergenler için bu kod kendi isteklerini ön plana çıkarma ve sınırlar, kurallar ve düzenlemelere kızma ile bağlantılıdır. Benmerkezci, narsisistik ve bencildirler; hedeflerine ulaşmak için çok fazla enerji harcasalar da kendilerine verilen sorumlulukları kabul etmede isteksizdirler. Çoğu aktivitelerini haz alma, heyecan ve kısa vadeli hedefler üzerine yoğunlaştırırlar. Sosyal standartların ve değerlerin onlar için önemi çok azdır; değerler konusunda bocalama yaşarlar ya da kendi değerlerini kendileri oluştururlar. Birey 20 yaşın üstünde olduğunda örüntü daha kalıcıdır ve daha fazla uyumsuzluk vardır. Kısa kişilerarası bağlantılarda ve sosyal durumlarda bu bireyler sıklıkla iyi izlenim bırakırlar çünkü enerji dolu ve güvenli görünürler; ancak uzun süreli ilişki durumunda genellikle başkalarına bağlanmaları konusunda yüzeysel ve yapay, hatta sorumsuz ve güvenilmez oldukları ve böylece insanlara yabancılaştıkları ortaya çıkar. Evlilik uyumları kötü olabilir ve birçoğu evlilik dışı ilişkilere girebilir. Bu koddaki ergenlerin tahmin edileceği gibi düşük bir engellenme eşiği vardır; ebeveynleri ile sık sık çatışırlar ve okuldan kaçarlar; genellikle impulsif, umursamaz ve kışkırtıcı davranışlar (örneğin yalan söyleme, dolandırma ve hırsızlık gibi) gösterirler; ilaç ve aşırı alkol kullanımı geneldir. Eğer K testi 50 T puanının üzerinde ise ve/veya test 2, 5, 7 ya da 0, 70 T puanı üstünde üçüncü yükselen test ise hem ergenler hem de yetişkinlerde suç işleme ya da antisosyal davranış olasılığı daha azdır. Alt test Si 50 T puanının altında olduğunda 49/94 özelliklerine sahip olsa bile bireyin sosyal ilişkileri iyidir. Bu kişiler için psikoterapi prognozu genellikle çok kötüdür; çoğu tedaviyi erken bitirir ve tedavi sırasında genellikle sinirli ve düşmanca bir tutum sergilerler.',
    diagnosis: [
      'Antisosyal kişilikle birlikte bazı tip karakter bozuklukları',
      'Pasif-agresif kişilik bozukluğu, agresif tip',
    ],
  },
  '04': {
    code: '40/04',
    text:
      'Koddaki bireyler hem kızgındırlar hem de kişilerarası ilişkilerde geri çekilmişlerdir. Tipik olarak kızgınlıklarını açık biçimde ifade etmezler, uygun biçimde atılgan davranmada güçlükleri vardır ve kıskançlık duygularını içlerinde tutma eğilimindedirler. Şüpheci, küskün ve utangaçtırlar; pasif olarak direnme eğilimindedirler. Yüksek puanla görülen bir depresyon durumu varsa bu çoğunlukla gerçek psikomotor retardasyon ya da negatifik depresyon belirtileri yerine depresif düşünce ve duygulara ilişkindir; depresyon davranışlarından dolayı suçlanmaktan çok o andaki sınırlılıklar nedeniyle hoşnutsuzluktan kaynaklanır. Kendi davranışlarına olan ilgisizlikleri nedeniyle psikoterapötik yaklaşımda fazla etkili değillerdir; kişisel olgunlaşma diğer yaklaşımlardan daha etkili olabilmektedir. Alt test 4’te yüksek puan alanlara bazen kişilik bozukluğu tanısı konulabilir ancak psikotik tanısı almazlar. Alt test 4’teki yükselme suça ilişkin davranışlar ve hapse girip çıkma oranıyla pozitif korelasyon gösterir.',
  },
  '56': {
    code: '56/65',
    text:
      'Bu kod tipindeki bireyler hakkında çok az bilgi vardır. Genel olarak duygularının incinmesi konusunda aşırı duyarlıdırlar ve başkaları ile duygusal ilişkiye girmede kendilerine güvenmezler, bundan korkarlar. Eğer başkaları onlardan bir şey isterlerse sinirlenirler. Çoğunluğunun eğitim düzeyi yüksektir ve kariyer sahibi kişilerdir.',
  },
  '57': {
    code: '57/75',
    text:
      'Kararsız, endişeli, içedönük, gergin, mutsuz ve sürekli onay bekleyen erkeklerdir. Eğitim düzeyi düşük olan erkeklerde kendi yetersizlikleri ile obsesif ruminasyonlar, anksiyete ve depresif dönemler vardır. Karşı cinsle ilişkilerinde sıklıkla kendilerini yetersiz hissederler. Kadınlarda bu çok daha azdır; 5 testinde görüldüğünden çok daha az agresif ve daha çok kendilerini analiz eden kişilerdir. Entellektüel olarak yarışmacıdırlar.',
  },
  '58': {
    code: '58/85',
    text:
      'Bu koddaki erkekler içe dönüktür ve zamanlarının çoğunu düşünme ile geçirirler. Genellikle konfüzyonda, mutsuz ve diğerlerine yabancılaşmış oldukları duygusunu yaşarlar ve ev çatışmaları vardır.',
  },
  '59': {
    code: '59/95',
    text:
      'Erkeklerde 5’in yükselmesi açık eyleme vuruk davranışların azaldığını gösterir; burada entellektüalizasyon, inkarın ve rasyonalizasyonun aşırı kullanımı vardır. Aslında bu koddaki erkeklerin çoğu akademik olarak başarılıdır. Duygusal bağımlılık (anne bağımlılığı) ve benlik atılganlığının olmaması sorun alanlarıdır. Kadınlarda 5 alt testinin yükselmesi saldırganlığın açığa çıkmasını gösterir; bu saldırganlık duruma bağlı sözel veya davranışsaldır. Bu kadınlar enerjik ve yarışmacıdırlar (erkeklerle yarışırlar), kendilerine güvenirler, engellenmemiş ve maceracıdırlar; eğer onların istekleri sorgulanır ya da engellenmek istenirse sinirli ya da kendine dönük olurlar.',
  },
  '05': {
    code: '50/05',
    text:
      'Bu koddaki erkekler içe dönüktür ve genellikle kişisel ve entellektüel izolasyon yaşarlar, diğerlerine ulaşmak istemezler. Diğerleri ile ilişkilerinde temkinli, engellenmiş, içe çekilmiş ve kaygılıdırlar. Aşırı kontrollüdürler ve her şeyi aşırı idealize ederler. Sosyal açıdan beceriksizdirler; atılgan olma konusunda sorunları vardır; kendi yeterlilikleri konusunda hep sorgulama içindedirler. Karşı cinsle ilişkilerinde sorunlar ve rahatsızlıklar vardır. Bu koddaki kadınlar tipik olarak daha az kendine güvenen, spontan ve güçlüdürler ve bu testin yükselmesinden beklenenden daha atılgandırlar. Sıklıkla kadınların eğitim düzeyi daha düşüktür; alt sosyo-ekonomik düzeyden gelirler.',
  },
  '67': {
    code: '67/76',
    text:
      'Oldukça nadir görülür. Bireyler gergin, kaygılı, aşırı duyarlı ve sıklıkla çabuk küsen kişilerdir. Başkalarının kendilerine haksızlık ettiğini düşünerek ilişkilerini bozarlar. Aşağılık ve/veya suçluluk duyguları vardır ve bunu diğerlerine yansıtırlar. Eğer 6 alt testi 7’den daha yüksekse ya da ikisi aynı düzeydeyse obsesif-kompulsif bozukluktan psikotik döneme bir geçiş olabileceği dikkate alınmalıdır.',
    diagnosis: ['Dekompanse obsesif kompulsif bozukluk', 'Alt test 6, 7’den daha yüksek ya da aynı düzeyde ise obsesif kompulsif bozukluktan şizofreniye geçiş olasıdır'],
  },
  '68': {
    code: '68/86',
    text:
      'Bu kodu alan kişilerde yoğun aşağılık duyguları dikkati çeker; kendilerine güvenleri ve saygıları yoktur. Bu bireyler mutsuz, sinirli, negativist olarak tanımlanır. Hem ergenlerde hem de yetişkinlerde bu kod ciddi psikopatolojiyi gösterir ve F alt testi de yükselmiştir; birey kabul edilmeyen yaşantılar getirir. Paranoid vadide paranoid şizofreni düşünülmelidir. Düşünce sürecindeki bozukluklar aşırı genellemeler, yanlış yorumlamalar ve delüzyonlarla kendini gösterir. Duygusal uygunsuzluk, aşırı idealleştirme, şüphe, güvensizlik, konsantre olmada güçlük, gerçek ile bağlantı kopukluğu ve bozuk kişiler arası ilişkiler vardır; bunlara depresyon ya da korkular ve fobiler eşlik eder. Bu bireylerin düşünce süreçleri garip olmamakla birlikte gerçeğe çok uygun değildir. Cinselliğe ilişkin içsel çatışmalar vardır. Tipik olarak sosyal açıdan içe çekilmiş ya da izoledirler (yetişkinlerin çoğu yalnızdır) ve zamanlarının çoğunu kendi kurdukları fanteziler ile geçirirler. Davranış açısından bu bireyler yordanamazdır; 4’ün yükseldiği durumlarda bu daha da zor olmaktadır. Ergenlerde genellikle saldırganlık nöbetleri (eğer K 50 T puanının altında ise), kötü arkadaş ilişkileri vardır; zamanlarının çoğunu kavga etmekle geçirirler, derslerinde başarısızdırlar ve aile içinde ciddi cezalandırmalar ve dayak vardır. 6 ve 8’in T puanı 80’in üzerinde ve 7 daha düşükse bu profil “Paranoid vadi” ya da “Psikotik V” olarak adlandırılır ve psikiyatri hastalarında sık görülür.',
    diagnosis: ['Paranoid durum', 'Paranoid şizofreni (6 ve 8 alt testleri 75 T puanının üstünde ise)', 'Şizoid kişilik'],
    seeAlso: '468/648, 486/846, 489/849 kodlarına da bakınız.',
  },
  '69': {
    code: '69/96',
    text:
      'Hastalar gergin ve anksiyöz kişilerdir. Grandiyözite ve egosantrik sezgiler içindedirler, heyecanlı ve enerjiktirler. Belirgin olan kızgınlık ve hostilitelerini sosyal açıdan kabul edilebilir bir biçimde dışsallaştırmada güçlükleri vardır. Düşünce bozukluğunun varlığı halinde bunun manik ya da şizofrenik özellikler mi olduğu gözden geçirilmelidir. Kod daha çok kadınlarda görülmektedir: bu koddaki kadınlar gergin, daldan dala atlayan, küçük durumlara aşırı tepki veren kişilerdir; durumları kendileri için tehdit olarak alırlar; gürültücü, ilgi çekici, sinirli ve şüpheci olma eğilimi içindedirler. Aile öykülerinde aşırı koruyucu ve sevecen bir anne vardır ancak çok sert disiplin verirler; baba genellikle karışmayan bir kişidir. Kadınlar duygusal ilişkiye girmekten korkarlar, diğerleri ile aralarına mesafe koyarlar; eleştiriye aşırı duyarlıdırlar ve güvensizlikleri kroniktir.',
    diagnosis: ['Manik bozukluğun bazı tipleri', 'Akut psikotik epizod', 'Alt test F ve Sc yüksekse paranoid şizofreni'],
    seeAlso: '698/968 kodlarına da bakınız.',
  },
  '06': {
    code: '60/06',
    text:
      'Erkeklerde çok az görülür; genç kadınlarda hemen hemen hiç görülmeyebilir. Kadınlarda özellikle 30 yaşından sonra rastlanır. Bunu veren bireyler utangaç, içe çekilmiş ve kişilerarası ilişkilerde huzursuzdurlar; diğerlerinin kendilerini sevmediğini ya da kabul etmediğini düşünürler. Eleştiriye aşırı duyarlıdırlar; kendilerini aşağılanmış hissettikleri için reddedilmeyi kolaylıkla kabul ederler. Duygularında oldukça mükemmeliyetçi ve aşırı kontrollüdürler.',
  },
  '78': {
    code: '78/87',
    text:
      'Psikolojik yardım arayan kişilerde oldukça sık görülür. Bu kodu veren bireyler nevrotik ve psikotik tanısı alabilirler. Yetişkinlerde 8 alt testi 7’den yüksekse akut psikotik durum vardır; ergenlerde 78 kodu 87 kodu kadar ciddi değildir. Bu kodda olan bireyler endişeli, kaygılı, gergin ve tekrarlayıcı ruminasyonları olan kişilerdir. Düşünce ve dikkatlerini toplama konusunda sorunları vardır. Stresleri o kadar fazladır ki uykusuzluk ve intihar düşünceleri görülebilir; intihar potansiyeli dikkatli bir biçimde değerlendirilmelidir. 8 alt testi 7 alt testinden daha yüksekse intihar girişimi tuhaftır ve kendine zarar vermeyi içerir. Bireylerde halüsinasyon ve delüzyonlar, duygudurumda sığlık ve gerçekle bağlantıda güçlükler olabilir. Diğer işlevlerde yıkım vardır ancak bunlar psikotik davranışlar şeklinde değildir. Yakın kişilerarası ilişkiler kurmada güçlükleri vardır; genelde içedönük ve çekiniktirler ve bu özellikler obsesif ruminasyonlarını arttırmaktadır. Düşünce bozukluğunun var olup olmadığı araştırılmalıdır; psikofarmakolojik müdahale yoğun anksiyetelerini azaltmakta faydalı olabilir. Psikolojik müdahale güçtür çünkü psikolojik çatışmaları kroniktir ve bundan dolayı kişilerarası ilişki zorlukları vardır. Karşı cinsle ilişkilerde kendilerini yetersiz hissederler; çoğu gevşemek için aşırı alkol alabilir. 7, 8’den büyükse: birey düşünce ve davranış bozukluğu geliştirmemek için hâlâ savaş vermektedir. 7, 8’den küçükse: her iki yükselme de 75 T puanının üstünde ve 8 alt testinde belirgin bir yükselme varsa tanı şizofrenidir; intihar girişimi varsa tuhaftır, kendini kesme ve cezalandırmayı içermektedir.',
    diagnosis: ['782 kodu: Depresif Bozukluk, Obsesif Kompulsif Bozukluk', '872 kodu: Şizofrenik Reaksiyon', '784/874 kodu: Şizofrenik Reaksiyon, Şizoid Kişilik Bozukluğu'],
  },
  '79': {
    code: '79/97',
    text:
      'Bu oldukça az görülen bir koddur. Bu bireyler ajitasyon düzeyinde kaygı yaşarlar. Korkuları vardır, olaylara aşırı tepki verirler; korkularına ve yetersizliklerine bağlı olarak kendilerini gevşetmeleri ve bunlardan kurtulmaları mümkün değildir ve aşırı ruminasyonlar gösterirler. Eğer 2 alt testi de yükselmişse depresyon görülür; ancak klinik tabloda anksiyete ve gerginlik ön plandadır ve hastalar sıklıkla fiziksel semptomlar (örneğin sırt ağrısı, kas spazmları ve uykusuzluk) getirirler. Bazı bireylerde manik örüntü vardır ve bu farmakolojik müdahale gerektirir. Bu kodu alan ergenlerin yoğun ilgi gereksinimleri vardır ancak kontrolü kaybedeceklerini düşünerek böyle bir şey yapmaktan kaçınırlar; ayrıca ergenlerde bağımlılık-bağımsızlık çatışması çok fazladır.',
  },
  '07': {
    code: '70/07',
    text:
      'Bu profili veren kişiler utangaç, içedönük, sosyal becerilerden yoksun, gergin ve endişelidirler; uykusuzluktan yakınırlar. Oldukça nadir görülür. Bu koddaki erkekler sosyal yetenekler ve/veya fiziksel görünümleri konusunda endişeli ve gergindirler, kendilerini yetersiz görürler. Çoğunluğu içedönüktür; güvensizlikleri ve karar verme güçlükleri onları konfüzyonda bırakır, aşırı kontrollüdürler ve kendilerini suçlarlar. Ruminasyonları uykusuzluk ile sonlanır. Anneleri ve kardeşleri ile yoğun çatışmaları vardır; sosyal alandaki yetersizlikleri karşı cinsle olan ilişkilerini de etkilemektedir. Kadınlarda eğer 5 alt testi 40 T puanının altında ise aynı örüntü vardır.',
  },
  '89': {
    code: '89/98',
    text:
      'Bu kod tipi ergenlerde ve yetişkinlerde ciddi psikopatolojiyi gösterir. Benmerkezcidir ve başkalarından çocuksu beklentileri vardır. Aşırı derecede idealize kişilerdir; günlerini fanteziler, hayal kurmalar ve ruminasyonlarla geçirirler. Gerginlik, ajitasyon ve uykusuzluk vardır. Genellikle çok konuşma, davranışsal huzursuzluk, duygusal labilite ve fikir uçuşmaları görülebilir. Kişilerarası ilişki durumlarında (örneğin terapi görüşmelerinde) konudan konuya atlarlar; terapötik odaklanma mümkün değildir. Kişilerarası ilişkilerinde özellikle karşı cinsle ilişkilerinde huzursuzluk oldukça tipiktir. Bireyler yakın kişilerarası ilişkilerden korkarlar ve bu nedenle bu tür ilişki kurmak istemezler. Stres altında dağılma belirtileri vardır. Kod daha da yükselirse delüzyon ve halüsinasyonlar görülür, psikotik bir tablo ortaya çıkar.',
    diagnosis: ['Şizofreni', 'Madde kullanımına bağlı psikoz'],
  },
  '08': {
    code: '80/08',
    text:
      'Genellikle sosyal açıdan çekingen kişilerdir. Kişilerarası ilişkilerde hata yapmak istemedikleri için ilişki kurmaktan kaçınırlar. Fantezi kurarak zamanlarını geçirirler. Sosyal izolasyonları o kadar fazladır ki kendi ailelerinden bile uzaklaşırlar. Bunun yanı sıra endişeli, kararsız, kaygılı, depresif ve diğerleri tarafından yanlış anlaşılan kişilerdir. Kendilerini neyin rahatsız ettiği, diğerlerinden ne istedikleri konusunda konfüzyonları vardır. Atılgan değillerdir; danışmanlık görüşmelerinde genellikle konuşmazlar.',
    diagnosis: ['Şizoid Kişilik'],
  },
  '09': {
    code: '90/09',
    text:
      'Kod oldukça nadirdir, özellikle erkeklerde çok az görülür. Bu koddaki bireyler enerjik ve olasılıkla ajitedirler. Genellikle yalnız kişilerdir. Si alt testinin yükselmesi bırakılarak yorum yükselen diğer iki alt test ile yapılmaktadır; daha sonra eğer gerekliyse Si alt testi yorumlanmalıdır.',
  },
};

/** Kodu kanonik biçime çevirir: "21" → "12". */
export function canonicalCode(code: string): string {
  const chars = code.split('').sort();
  return chars.join('');
}

/** İki noktalı kod için kaynak yorumu; yoksa undefined. */
export function codeInterpretation(code: string | undefined): CodeInterpretation | undefined {
  if (!code || code.length < 2) return undefined;
  return CODES[canonicalCode(code.slice(0, 2))];
}

/** Bilinen tüm kod anahtarları (test ve doğrulama için). */
export const KNOWN_CODES = Object.keys(CODES);
