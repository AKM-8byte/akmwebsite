// =============================================================
//  İÇERİK: şehirler, kişiler, olaylar, kaynaklar ve arayüz yazıları
//  Bir olayı değiştirmek ya da eklemek için yalnızca bu dosyayı düzenle.
// =============================================================

// Şehirler: c = [boylam, enlem]. "base: true" olanların adı haritada hep görünür.
const CITIES = {
  istanbul:   { c: [28.98, 41.01], tr: "İstanbul", en: "Istanbul", base: true },
  samsun:     { c: [36.33, 41.29], tr: "Samsun", en: "Samsun", base: true },
  havza:      { c: [35.66, 40.97], tr: "Havza", en: "Havza" },
  amasya:     { c: [35.83, 40.65], tr: "Amasya", en: "Amasya" },
  tokat:      { c: [36.55, 40.31], tr: "Tokat", en: "Tokat" },
  sivas:      { c: [37.02, 39.75], tr: "Sivas", en: "Sivas", base: true },
  erzurum:    { c: [41.27, 39.90], tr: "Erzurum", en: "Erzurum", base: true },
  kayseri:    { c: [35.48, 38.72], tr: "Kayseri", en: "Kayseri" },
  hacibektas: { c: [34.56, 38.94], tr: "Hacıbektaş", en: "Hacıbektaş" },
  ankara:     { c: [32.86, 39.93], tr: "Ankara", en: "Ankara", base: true },
  eskisehir:  { c: [30.52, 39.78], tr: "Eskişehir", en: "Eskişehir" },
  inonu:      { c: [30.15, 39.82], tr: "İnönü", en: "İnönü" },
  bursa:      { c: [29.06, 40.18], tr: "Bursa", en: "Bursa", base: true },
  izmir:      { c: [27.14, 38.42], tr: "İzmir", en: "Smyrna (İzmir)", base: true },
  usak:       { c: [29.41, 38.68], tr: "Uşak", en: "Uşak" },
  afyon:      { c: [30.54, 38.76], tr: "Afyonkarahisar", en: "Afyonkarahisar" },
  kutahya:    { c: [29.98, 39.42], tr: "Kütahya", en: "Kütahya" },
  kocatepe:   { c: [30.40, 38.66], tr: "Kocatepe", en: "Kocatepe" },
  dumlupinar: { c: [29.98, 38.85], tr: "Dumlupınar", en: "Dumlupınar" },
  polatli:    { c: [32.15, 39.58], tr: "Polatlı", en: "Polatlı" },
  mudanya:    { c: [28.88, 40.37], tr: "Mudanya", en: "Mudanya" },
  sarikamis:  { c: [42.59, 40.33], tr: "Sarıkamış", en: "Sarıkamış" },
  kars:       { c: [43.10, 40.60], tr: "Kars", en: "Kars" },
  gumru:      { c: [43.85, 40.79], tr: "Gümrü", en: "Gyumri (Alexandropol)" },
  adana:      { c: [35.32, 37.00], tr: "Adana", en: "Adana", base: true },
  trabzon:    { c: [39.72, 41.00], tr: "Trabzon", en: "Trabzon", base: true },
  konya:      { c: [32.49, 37.87], tr: "Konya", en: "Konya", base: true },
  edirne:     { c: [26.56, 41.68], tr: "Edirne", en: "Edirne", base: true },
  diyarbakir: { c: [40.23, 37.91], tr: "Diyarbakır", en: "Diyarbakır" },
  lausanne:   { c: [6.63, 46.52], tr: "Lozan", en: "Lausanne" },
  sevres:     { c: [2.21, 48.82], tr: "Sevr (Paris)", en: "Sèvres (Paris)" },
};

// Haritadaki deniz ve nehir yazıları
const MAP_LABELS = [
  { c: [34.2, 42.9], tr: "KARADENİZ", en: "BLACK SEA", kind: "sea" },
  { c: [31.5, 35.0], tr: "AKDENİZ", en: "MEDITERRANEAN SEA", kind: "sea" },
  { c: [25.1, 38.9], tr: "EGE DENİZİ", en: "AEGEAN SEA", kind: "sea" },
  { c: [32.0, 39.15], tr: "Sakarya", en: "Sakarya", kind: "river" },
  { c: [34.3, 40.25], tr: "Kızılırmak", en: "Kızılırmak", kind: "river" },
];

// Görüş alanları: [batı boylamı, güney enlemi, doğu boylamı, kuzey enlemi]
const VIEWS = {
  anatolia: [25.5, 35.6, 45.2, 42.6],
  europe:   [0, 35.5, 45, 50],
};

// Kişiler. Fotoğraf yok: her kişi el çizimi tarzı bir siluet ve isim kartıyla gösterilir.
// hat: siluetteki başlık (kalpak, fes, şapka yok ya da başörtüsü).
const PEOPLE = {
  mk:        { name: "Mustafa Kemal Paşa", alt: "(Atatürk)", hat: "kalpak",
               tr: "Millî Mücadele'nin önderi; TBMM Başkanı ve Başkomutan",
               en: "Leader of the National Struggle; Speaker of the Assembly and Commander-in-Chief" },
  ismet:     { name: "İsmet Paşa", alt: "(İnönü)", hat: "kalpak",
               tr: "Batı Cephesi Komutanı; Lozan'da Türk heyetinin başkanı",
               en: "Commander of the Western Front; head of the Turkish delegation at Lausanne" },
  kazim:     { name: "Kâzım Karabekir Paşa", alt: "", hat: "kalpak",
               tr: "XV. Kolordu ve Doğu Cephesi Komutanı",
               en: "Commander of the XV Corps and the Eastern Front" },
  fevzi:     { name: "Fevzi Paşa", alt: "(Çakmak)", hat: "kalpak",
               tr: "Genelkurmay Başkanı",
               en: "Chief of the General Staff" },
  rauf:      { name: "Rauf Bey", alt: "(Orbay)", hat: "none",
               tr: "Denizci; Amasya Genelgesi'ni imzalayanlardan",
               en: "Naval officer; one of the signatories of the Amasya Circular" },
  alifuat:   { name: "Ali Fuat Paşa", alt: "(Cebesoy)", hat: "kalpak",
               tr: "XX. Kolordu Komutanı; Amasya Genelgesi'ni imzalayanlardan",
               en: "Commander of the XX Corps; one of the signatories of the Amasya Circular" },
  refet:     { name: "Refet Bey", alt: "(Bele)", hat: "kalpak",
               tr: "Komutan; Amasya Genelgesi'ni imzalayanlardan",
               en: "Commander; one of the signatories of the Amasya Circular" },
  akif:      { name: "Mehmet Âkif", alt: "(Ersoy)", hat: "none",
               tr: "Şair; İstiklal Marşı'nın yazarı",
               en: "Poet; author of the Turkish National Anthem" },
  halide:    { name: "Halide Edib", alt: "(Adıvar)", hat: "scarf",
               tr: "Yazar ve hatip; Anadolu'ya geçip orduda görev aldı",
               en: "Writer and orator; crossed to Anatolia and served in the army" },
  vahdettin: { name: "VI. Mehmed Vahdeddin", alt: "", hat: "fez",
               tr: "Son Osmanlı padişahı",
               en: "The last Ottoman sultan" },
  rizanur:   { name: "Rıza Nur", alt: "", hat: "none",
               tr: "Lozan'da Türk heyetinin ikinci delegesi",
               en: "Second delegate of the Turkish delegation at Lausanne" },
  hasan:     { name: "Hasan Bey", alt: "(Saka)", hat: "none",
               tr: "Lozan'da Türk heyetinin üçüncü delegesi",
               en: "Third delegate of the Turkish delegation at Lausanne" },
};

// Kaynak listesi. Olaylar bunlara "sources" alanındaki numaralarla bağlanır.
// en: İngilizce sayfada gösterilecek metin (yoksa text kullanılır).
const SOURCES = [
  { id: 1, text: "Mustafa Kemal Atatürk, Nutuk (Söylev), 1927. Türk Tarih Kurumu baskısı.",
    en: "Mustafa Kemal Atatürk, Nutuk (The Speech), 1927. Turkish Historical Society edition." },
  { id: 2, text: "Atatürk Araştırma Merkezi (AAM), “Atatürk Kronolojisi”, atam.gov.tr",
    en: "Atatürk Research Centre (AAM), “Atatürk Kronolojisi” (Atatürk Chronology), atam.gov.tr" },
  { id: 3, text: "Türkiye Büyük Millet Meclisi, “TBMM Tarihçesi”, tbmm.gov.tr",
    en: "Grand National Assembly of Turkey, “TBMM Tarihçesi” (History of the Assembly), tbmm.gov.tr" },
  { id: 4, text: "Genelkurmay Harp Tarihi Başkanlığı, Türk İstiklal Harbi (cilt dizisi), Ankara.",
    en: "Turkish General Staff, Directorate of Military History, Türk İstiklal Harbi (multi-volume series), Ankara." },
  { id: 5, text: "Andrew Mango, Atatürk: The Biography of the Founder of Modern Turkey, John Murray, 1999." },
  { id: 6, text: "Erik J. Zürcher, Turkey: A Modern History, I.B. Tauris, 3. baskı, 2004.",
    en: "Erik J. Zürcher, Turkey: A Modern History, I.B. Tauris, 3rd edition, 2004." },
  { id: 7, text: "Sina Akşin, Kısa Türkiye Tarihi, Türkiye İş Bankası Kültür Yayınları." },
  { id: 8, text: "Encyclopaedia Britannica, “Treaty of Sèvres” ve “Treaty of Lausanne” maddeleri, britannica.com",
    en: "Encyclopaedia Britannica, articles “Treaty of Sèvres” and “Treaty of Lausanne”, britannica.com" },
  { id: 9, text: "Treaty of Peace with Turkey, Signed at Lausanne, July 24, 1923 (antlaşmanın resmî metni).",
    en: "Treaty of Peace with Turkey, Signed at Lausanne, July 24, 1923 (official text)." },
  { id: 10, text: "Bernard Lewis, The Emergence of Modern Turkey, Oxford University Press." },
];

// Görseller ve lisansları (kaynak listesinde de gösterilir)
const IMAGES = {
  bandirma: {
    src: "img/bandirma.png",
    tr: "Bandırma Vapuru (dönem çizimi)", en: "The steamer Bandırma (period drawing)",
    credit: "Wikimedia Commons, “Bandırma Vapuru.png”",
    license: { tr: "Kamu malı", en: "Public domain" },
    url: "https://commons.wikimedia.org/wiki/File:Band%C4%B1rma_Vapuru.png",
  },
  amasya: {
    src: "img/amasya-genelgesi.jpg",
    tr: "Amasya Genelgesi'nin ilk sayfası, 1919", en: "First page of the Amasya Circular, 1919",
    credit: "Wikimedia Commons, “Amasya Genelgesi.pdf”",
    license: { tr: "Kamu malı", en: "Public domain" },
    url: "https://commons.wikimedia.org/wiki/File:Amasya_Genelgesi.pdf",
  },
  tbmm: {
    src: "img/tbmm-1920.jpg",
    tr: "Ankara'daki ilk Meclis binası, 1920 dolayları", en: "The first Assembly building in Ankara, c. 1920",
    credit: "Bain News Service, Library of Congress; Wikimedia Commons, “TGNA circa 1920.jpg”",
    license: { tr: "Bilinen telif kısıtlaması yok", en: "No known restrictions" },
    url: "https://commons.wikimedia.org/wiki/File:TGNA_circa_1920.jpg",
  },
  lozan: {
    src: "img/lozan-antlasmasi.jpg",
    tr: "Lozan'da imzalanan belgelerin 1923 tarihli Yunanca resmî baskısının kapağı",
    en: "Cover of the 1923 official Greek edition of the acts signed at Lausanne",
    credit: "Yunanistan Dışişleri Bakanlığı, 1923; Wikimedia Commons, “Treaty of Lausanne 1923 (Greek).jpg”",
    license: { tr: "Kamu malı", en: "Public domain" },
    url: "https://commons.wikimedia.org/wiki/File:Treaty_of_Lausanne_1923_(Greek).jpg",
  },
};

// Haritadaki diğer görsel kaynaklar
const OTHER_CREDITS = [
  { tr: "Harita verisi: Natural Earth (1:10m kara, 1:50m göller, 1:10m nehirler), naturalearthdata.com. Kamu malı.",
    en: "Map data: Natural Earth (1:10m land, 1:50m lakes, 1:10m rivers), naturalearthdata.com. Public domain." },
  { tr: "Yazı tipleri: EB Garamond, Cormorant Garamond, Courier Prime (Google Fonts). SIL Open Font License.",
    en: "Typefaces: EB Garamond, Cormorant Garamond, Courier Prime (Google Fonts). SIL Open Font License." },
  { tr: "Siluetler, animasyon sahneleri, pusula ve harita sembolleri bu site için SVG ile çizildi.",
    en: "Silhouettes, animated scenes, compass and map symbols were drawn in SVG for this site." },
];

// -------------------------------------------------------------
//  OLAYLAR
//  date / end: "YYYY-AA-GG"   cat: politics | war | diplomacy
//  scene: kart içindeki animasyon (js/scenes.js)
//  layers: haritada çizilecekler (js/map.js). t0 = başlama saniyesi, lp = yazının yeri.
//  keep: true olan çizgiler sonraki olaylarda soluk iz olarak kalır.
// -------------------------------------------------------------
const EVENTS = [
  {
    id: "samsun", date: "1919-05-19", cat: "politics",
    title: { tr: "Samsun'a çıkış", en: "Landing at Samsun" },
    place: { tr: "Samsun", en: "Samsun" },
    text: {
      tr: "Mustafa Kemal Paşa, 9. Ordu Müfettişi olarak 16 Mayıs 1919'da Bandırma Vapuru'yla İstanbul'dan ayrıldı ve 19 Mayıs'ta Samsun'a çıktı. Görünürdeki görevi bölgede asayişi sağlamaktı. Asıl amacı ise işgallere karşı dağınık hâldeki direnişi tek bir millî harekete dönüştürmekti. Millî Mücadele'nin başlangıcı olarak bu gün kabul edilir.",
      en: "On 16 May 1919 Mustafa Kemal Pasha left Istanbul aboard the steamer Bandırma as Inspector of the Ninth Army, and on 19 May he landed at Samsun. His official task was to restore order in the region. His real aim was to turn the scattered resistance against the occupations into a single national movement. This day is regarded as the beginning of the National Struggle.",
    },
    caption: {
      tr: "Bandırma Vapuru Karadeniz kıyısı boyunca ilerleyip Samsun'a yanaşıyor; haritada İstanbul'dan Samsun'a deniz yolu çiziliyor.",
      en: "The Bandırma steams along the Black Sea coast and docks at Samsun, while the map traces the sea route from Istanbul.",
    },
    scene: "ship", image: "bandirma", people: ["mk"], sources: [1, 2, 5],
    view: [27.3, 39.4, 38.4, 43.5],
    layers: [
      { type: "route", kind: "sea", keep: true, t0: 0.8, dur: 4,
        pts: ["istanbul", [29.15, 41.3], [30.4, 41.42], [31.6, 41.75], [33.3, 42.2], [34.9, 42.32], [35.95, 41.95], "samsun"] },
      { type: "pulse", p: "samsun", t0: 4.8 },
    ],
  },
  {
    id: "havza", date: "1919-05-28", cat: "politics",
    title: { tr: "Havza Genelgesi", en: "The Havza Circular" },
    place: { tr: "Havza", en: "Havza" },
    text: {
      tr: "Mustafa Kemal 25 Mayıs'ta Havza'ya geçti. 28 Mayıs'ta yayımladığı genelgeyle halkı işgalleri protesto etmek için büyük ve düzenli mitingler yapmaya, sesini dünyaya duyurmaya çağırdı. Bu çağrının ardından Anadolu'nun birçok yerinde mitingler düzenlendi.",
      en: "On 25 May Mustafa Kemal moved on to Havza. With a circular issued on 28 May he called on the people to hold large, orderly rallies against the occupations and to make their voice heard abroad. Rallies followed in many towns across Anatolia.",
    },
    note: {
      tr: "Genelgenin tarihi bazı kaynaklarda 28–29 Mayıs olarak verilir.",
      en: "Some sources date the circular to 28–29 May.",
    },
    caption: {
      tr: "Havza'dan çıkan çağrı telgraf hatlarıyla Anadolu'nun dört bir yanına yayılıyor.",
      en: "The call from Havza spreads along the telegraph lines to every corner of Anatolia.",
    },
    scene: "telegraph", sceneFrom: "havza", sceneTo: ["sivas", "ankara", "konya", "trabzon", "erzurum"],
    people: ["mk"], sources: [1, 2],
    view: [31.5, 38.3, 39.5, 42.2],
    layers: [
      { type: "route", kind: "land", keep: true, t0: 0.5, dur: 1.5, pts: ["samsun", "havza"] },
      { type: "rays", from: "havza", to: ["ankara", "sivas", "trabzon", "kayseri", "konya", "erzurum"], t0: 2 },
      { type: "pulse", p: "havza", t0: 1.8 },
    ],
  },
  {
    id: "amasya", date: "1919-06-22", cat: "politics",
    dateLabel: { tr: "21–22 Haziran 1919 gecesi", en: "Night of 21–22 June 1919" },
    title: { tr: "Amasya Genelgesi", en: "The Amasya Circular" },
    place: { tr: "Amasya", en: "Amasya" },
    text: {
      tr: "Amasya'da yazılan genelge, Millî Mücadele'nin amacını ve yolunu ilk kez açıkça ortaya koydu: “Vatanın bütünlüğü, milletin istiklali tehlikededir… Milletin istiklalini yine milletin azim ve kararı kurtaracaktır.” Genelge Sivas'ta ulusal bir kongre toplanacağını da duyurdu. Belgeyi Mustafa Kemal'le birlikte Rauf (Orbay), Ali Fuat (Cebesoy) ve Refet (Bele) imzaladı; Kâzım Karabekir de onay verdi.",
      en: "Drafted in Amasya, this circular stated the aim and method of the National Struggle openly for the first time: “The integrity of the homeland and the independence of the nation are in danger… Only the will and determination of the nation can save its independence.” It also announced a national congress in Sivas. It was signed by Mustafa Kemal together with Rauf (Orbay), Ali Fuat (Cebesoy) and Refet (Bele), and endorsed by Kâzım Karabekir.",
    },
    note: {
      tr: "Genelge 21'i 22 Haziran'a bağlayan gece yazıldı; bu yüzden kaynaklarda 21 ya da 22 Haziran olarak geçer.",
      en: "The circular was written on the night of 21–22 June, so sources give either date.",
    },
    caption: {
      tr: "Genelge telgrafla komutanlara ve illere ulaşıyor; haritada Amasya'dan çıkan hatlar yurda yayılıyor.",
      en: "The circular is wired to commanders and provinces; on the map, lines from Amasya spread across the country.",
    },
    scene: "telegraph", sceneFrom: "amasya", sceneTo: ["erzurum", "sivas", "ankara", "konya", "edirne"],
    image: "amasya", people: ["mk", "rauf", "alifuat", "refet", "kazim"], sources: [1, 2, 5, 7],
    view: [27, 37, 44, 42.4],
    layers: [
      { type: "route", kind: "land", keep: true, t0: 0.4, dur: 1.2, pts: ["havza", "amasya"] },
      { type: "rays", from: "amasya", to: ["istanbul", "edirne", "erzurum", "sivas", "ankara", "konya", "trabzon", "adana", "diyarbakir"], t0: 1.6 },
      { type: "pulse", p: "amasya", t0: 1.4 },
    ],
  },
  {
    id: "erzurum", date: "1919-07-23", end: "1919-08-07", cat: "politics",
    title: { tr: "Erzurum Kongresi", en: "The Erzurum Congress" },
    place: { tr: "Erzurum", en: "Erzurum" },
    text: {
      tr: "Mustafa Kemal 7'yi 8 Temmuz'a bağlayan gece askerlikten istifa etti ve mücadeleye sivil olarak devam etti. 23 Temmuz'da doğu illerinden gelen delegelerle toplanan Erzurum Kongresi iki hafta sürdü. Kongre, vatanın millî sınırlar içinde bölünmez bir bütün olduğunu, manda ve himayenin kabul edilemeyeceğini ilan etti. Mustafa Kemal kongre başkanı seçildi ve bir Temsil Heyeti kuruldu.",
      en: "On the night of 7–8 July Mustafa Kemal resigned from the army and carried on the struggle as a civilian. The Erzurum Congress, which opened on 23 July with delegates from the eastern provinces, lasted two weeks. It declared that the homeland within its national borders was one indivisible whole and that no mandate or protectorate could be accepted. Mustafa Kemal was elected chairman and a Representative Committee was formed.",
    },
    caption: {
      tr: "Delegeler salondaki yerlerini alıyor; kongrenin ana kararı bir belge gibi açılıyor.",
      en: "Delegates take their seats and the congress's main decision unrolls like a document.",
    },
    scene: "congress",
    sceneText: { tr: ["Vatan, millî sınırlar içinde", "bölünmez bir bütündür.", "Manda ve himaye kabul edilemez."],
                 en: ["Within its national borders", "the homeland is indivisible.", "No mandate, no protectorate."] },
    people: ["mk", "kazim"], sources: [1, 2, 5, 7],
    view: [33.5, 38.2, 43.5, 41.9],
    layers: [
      { type: "route", kind: "land", keep: true, t0: 0.4, dur: 3, pts: ["amasya", "tokat", "sivas", [39.49, 39.75], "erzurum"] },
      { type: "pulse", p: "erzurum", t0: 3.4, big: true },
      { type: "seal", p: "erzurum", t0: 3.6 },
    ],
  },
  {
    id: "sivas", date: "1919-09-04", end: "1919-09-11", cat: "politics",
    title: { tr: "Sivas Kongresi", en: "The Sivas Congress" },
    place: { tr: "Sivas", en: "Sivas" },
    text: {
      tr: "Yurdun dört bir yanından delegelerin katıldığı Sivas Kongresi, Erzurum kararlarını bütün ülke adına benimsedi. Bölgesel direniş cemiyetleri “Anadolu ve Rumeli Müdafaa-i Hukuk Cemiyeti” adıyla tek çatı altında birleştirildi. Manda fikri kesin olarak reddedildi ve Temsil Heyeti artık bütün milleti temsil eder hâle geldi.",
      en: "Attended by delegates from all over the country, the Sivas Congress adopted the Erzurum decisions in the name of the whole nation. The regional resistance societies were united under one roof as the “Society for the Defence of the Rights of Anatolia and Rumelia”. The idea of a mandate was rejected for good, and the Representative Committee now spoke for the whole nation.",
    },
    caption: {
      tr: "Ayrı ayrı kurulmuş direniş cemiyetleri Sivas'ta tek bir çatı altında birleşiyor.",
      en: "Separate resistance societies merge into a single organisation at Sivas.",
    },
    scene: "converge", people: ["mk", "rauf"], sources: [1, 2, 5, 7],
    view: [27, 36.8, 44, 42.4],
    layers: [
      { type: "route", kind: "land", keep: true, t0: 0.4, dur: 2, pts: ["erzurum", [39.49, 39.75], "sivas"] },
      { type: "rays", from: "sivas", to: ["edirne", "istanbul", "izmir", "konya", "adana", "trabzon", "erzurum", "diyarbakir", "bursa"], inward: true, t0: 2.2 },
      { type: "pulse", p: "sivas", t0: 3.4, big: true },
    ],
  },
  {
    id: "ankara", date: "1919-12-27", cat: "politics",
    title: { tr: "Ankara'ya geliş", en: "Arrival in Ankara" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "Temsil Heyeti 18 Aralık'ta Sivas'tan ayrıldı; Kayseri ve Hacıbektaş üzerinden 27 Aralık 1919'da Ankara'ya ulaştı. Demiryolu bağlantısı olan, İstanbul'la haberleşmeye yetecek kadar yakın ama işgal kuvvetlerinden uzak olan Ankara, hareketin merkezi oldu.",
      en: "The Representative Committee left Sivas on 18 December and, travelling via Kayseri and Hacıbektaş, reached Ankara on 27 December 1919. With its railway link, close enough to stay in touch with Istanbul yet far from the occupying forces, Ankara became the centre of the movement.",
    },
    caption: {
      tr: "Kış yolculuğu: Heyet karlı yollardan geçerek Ankara Kalesi'nin eteğine varıyor.",
      en: "A winter journey: the Committee crosses snowy roads to arrive below Ankara Castle.",
    },
    scene: "arrive", people: ["mk"], sources: [1, 2, 5],
    view: [30.5, 37.6, 38.5, 41.2],
    layers: [
      { type: "route", kind: "land", keep: true, t0: 0.4, dur: 3.5, pts: ["sivas", "kayseri", "hacibektas", "ankara"] },
      { type: "pulse", p: "ankara", t0: 4, big: true },
    ],
  },
  {
    id: "misak", date: "1920-01-28", cat: "politics",
    title: { tr: "Misak-ı Millî", en: "The National Pact" },
    place: { tr: "İstanbul", en: "Istanbul" },
    text: {
      tr: "Son Osmanlı Mebusan Meclisi 12 Ocak 1920'de İstanbul'da toplandı ve 28 Ocak'ta Misak-ı Millî'yi (Millî Ant) kabul etti. Altı maddelik bu belge, Mondros Ateşkesi imzalandığı sırada Türk çoğunluğun yaşadığı toprakların bölünemeyeceğini ve tam bağımsızlığı ilan ediyordu. Millî Mücadele'nin hedefleri böylece yazıya döküldü.",
      en: "The last Ottoman Chamber of Deputies met in Istanbul on 12 January 1920 and on 28 January adopted the Misak-ı Millî (National Pact). This six-article document declared that the lands inhabited by a Turkish majority at the time of the Armistice of Mudros could not be divided, and demanded full independence. The goals of the National Struggle were now written down.",
    },
    note: {
      tr: "Meclis belgeyi 28 Ocak'ta kabul etti, kamuoyuna 17 Şubat 1920'de duyurdu; kaynaklar bazen bu iki tarihten birini verir.",
      en: "The Chamber adopted it on 28 January and made it public on 17 February 1920; sources sometimes give either date.",
    },
    caption: {
      tr: "Altı madde tek tek yazılıyor ve belge mühürleniyor.",
      en: "Six articles are written one after another and the document is sealed.",
    },
    scene: "pact", people: [], sources: [2, 6, 7],
    view: VIEWS.anatolia,
    layers: [
      { type: "pulse", p: "istanbul", t0: 0.6, big: true },
      { type: "rays", from: "istanbul", to: ["ankara"], t0: 1 },
    ],
  },
  {
    id: "istanbul", date: "1920-03-16", cat: "war",
    title: { tr: "İstanbul'un işgali", en: "Occupation of Istanbul" },
    place: { tr: "İstanbul", en: "Istanbul" },
    text: {
      tr: "16 Mart 1920'de İtilaf devletleri İstanbul'u resmen işgal etti. Mebusan Meclisi'nin bazı üyeleri tutuklanarak Malta'ya sürüldü; meclis 18 Mart'ta son toplantısını yaptı. Mustafa Kemal 19 Mart'ta, olağanüstü yetkilerle Ankara'da toplanacak yeni bir meclis için seçim yapılmasını istedi. Halide Edib gibi pek çok aydın ve milletvekili gizlice Anadolu'ya geçti.",
      en: "On 16 March 1920 the Allied Powers formally occupied Istanbul. Several members of the Chamber of Deputies were arrested and exiled to Malta; the Chamber held its last session on 18 March. On 19 March Mustafa Kemal called for elections to a new assembly with extraordinary powers, to meet in Ankara. Many intellectuals and deputies, among them Halide Edib, secretly crossed to Anatolia.",
    },
    caption: {
      tr: "İtilaf gemileri Boğaz'a giriyor; kesik çizgi İstanbul'dan Anadolu'ya geçenleri gösteriyor.",
      en: "Allied warships enter the Bosphorus; the dashed line shows those who escaped from Istanbul to Anatolia.",
    },
    scene: "occupation", people: ["halide", "rauf"], sources: [2, 3, 6],
    view: [26, 38.8, 34, 42.2],
    layers: [
      { type: "zone", side: "en", t0: 0.4, pts: [[28.4, 40.85], [28.5, 41.25], [29.2, 41.3], [29.5, 41.0], [29.2, 40.75], [28.7, 40.8]] },
      { type: "ships", p: [28.95, 41.25], t0: 0.8 },
      { type: "ships", p: [28.3, 40.7], t0: 1.2 },
      { type: "arrow", side: "tr", dashed: true, from: "istanbul", to: "ankara", bend: -0.15, t0: 2.4, dur: 2.5 },
      { type: "pulse", p: "ankara", t0: 4.9 },
    ],
  },
  {
    id: "tbmm", date: "1920-04-23", cat: "politics",
    title: { tr: "Büyük Millet Meclisi açılıyor", en: "The Grand National Assembly opens" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "23 Nisan 1920 Cuma günü Ankara'da Büyük Millet Meclisi açıldı. Meclis, milletin tek meşru temsilcisi olduğunu ve hem yasama hem yürütme yetkisini kendinde topladığını ilan etti. Ertesi gün Mustafa Kemal meclis başkanı seçildi. İlk meclis binası bugün Kurtuluş Savaşı Müzesi olarak kullanılıyor.",
      en: "On Friday, 23 April 1920, the Grand National Assembly opened in Ankara. It declared itself the only legitimate representative of the nation, holding both legislative and executive power. The next day Mustafa Kemal was elected its Speaker. The first Assembly building is today the Museum of the War of Independence.",
    },
    caption: {
      tr: "Bayrak göndere çekiliyor, salonun ışıkları yanıyor ve vekiller binaya doğru geliyor.",
      en: "The flag is raised, the windows light up and the deputies gather at the building.",
    },
    scene: "assembly", image: "tbmm", people: ["mk"], sources: [2, 3, 5],
    view: [28.5, 37.8, 37.5, 41.8],
    layers: [
      { type: "pulse", p: "ankara", t0: 0.6, big: true },
      { type: "star", p: "ankara", t0: 1.2 },
    ],
  },
  {
    id: "sevr", date: "1920-08-10", cat: "diplomacy",
    title: { tr: "Sevr Antlaşması", en: "The Treaty of Sèvres" },
    place: { tr: "Sevr, Fransa", en: "Sèvres, France" },
    text: {
      tr: "İstanbul hükûmeti 10 Ağustos 1920'de Paris yakınlarındaki Sevr'de İtilaf devletleriyle bir barış antlaşması imzaladı. Antlaşma, Anadolu ve Trakya'nın büyük bölümünü işgal ve nüfuz bölgelerine ayırıyor, Osmanlı Devleti'ne küçük bir toprak parçası bırakıyordu. TBMM antlaşmayı tanımadı ve imzalayanları vatan haini ilan etti. Sevr hiçbir zaman yürürlüğe girmedi.",
      en: "On 10 August 1920, at Sèvres near Paris, the Istanbul government signed a peace treaty with the Allied Powers. It carved up most of Anatolia and Thrace into zones of occupation and influence, leaving the Ottoman state only a small territory. The Grand National Assembly refused to recognise the treaty and declared its signatories traitors. Sèvres never came into force.",
    },
    note: {
      tr: "Haritadaki taramalı bölgeler yaklaşıktır; antlaşmadaki sınırların tamamı hiçbir zaman çizilmedi.",
      en: "The hatched zones on the map are approximate; many of the treaty's borders were never fully drawn.",
    },
    caption: {
      tr: "Antlaşma kâğıdı parçalara ayrılıyor; haritada Sevr'in öngördüğü bölgeler şematik olarak taranıyor.",
      en: "The treaty paper falls apart; the map schematically hatches the zones Sèvres foresaw.",
    },
    scene: "torn", people: [], sources: [6, 7, 8],
    from: VIEWS.europe, view: [24.5, 35.3, 45.2, 42.6],
    layers: [
      { type: "pulse", p: "sevres", t0: 0.2 },
      { type: "zone", side: "gr", t0: 2.2, label: { tr: "Yunan yönetimi", en: "Greek administration" }, lp: [27.7, 37.95],
        pts: [[26.3, 39.15], [27.6, 39.35], [28.4, 38.7], [28.2, 37.8], [27.0, 37.6], [26.3, 38.2]] },
      { type: "zone", side: "gr", t0: 2.5, label: { tr: "Yunanistan'a", en: "To Greece" }, lp: [27.2, 41.25],
        pts: [[26.1, 40.65], [26.0, 41.95], [27.6, 42.05], [28.3, 41.55], [27.9, 41.05], [26.9, 40.75]] },
      { type: "zone", side: "en", t0: 2.8, label: { tr: "Boğazlar Bölgesi", en: "Zone of the Straits" }, lp: [27.5, 40.4],
        pts: [[26.0, 39.9], [26.3, 40.55], [27.9, 41.0], [28.6, 41.5], [29.8, 41.25], [30.0, 40.75], [29.0, 40.3], [27.0, 39.95]] },
      { type: "zone", side: "it", t0: 3.1, label: { tr: "İtalyan nüfuz bölgesi", en: "Italian zone of influence" },
        pts: [[28.5, 37.75], [29.8, 38.45], [32.4, 38.35], [33.7, 37.3], [32.6, 36.2], [30.0, 36.25], [28.3, 36.65]] },
      { type: "zone", side: "fr", t0: 3.4, label: { tr: "Fransız nüfuz bölgesi", en: "French zone of influence" },
        pts: [[34.6, 36.7], [34.9, 38.05], [37.4, 38.4], [39.8, 38.0], [40.4, 37.1], [38.4, 36.65], [36.1, 36.05]] },
      { type: "zone", side: "am", t0: 3.7, label: { tr: "Ermenistan'a", en: "To Armenia" }, lp: [42.4, 40.2],
        pts: [[39.4, 41.1], [41.4, 41.55], [43.4, 41.15], [44.0, 39.7], [43.4, 38.6], [41.4, 38.75], [39.5, 39.6]] },
      { type: "zone", side: "ku", t0: 4.0, label: { tr: "Özerk bölge önerisi", en: "Proposed autonomous area" }, lp: [42.3, 37.6],
        pts: [[39.9, 37.15], [40.0, 38.35], [41.4, 38.6], [43.3, 38.45], [44.3, 37.3], [42.0, 37.05]] },
    ],
  },
  {
    id: "dogu", date: "1920-09-28", end: "1920-12-03", cat: "war",
    title: { tr: "Doğu Cephesi ve Gümrü", en: "The Eastern Front and Gyumri" },
    place: { tr: "Sarıkamış · Kars · Gümrü", en: "Sarıkamış · Kars · Gyumri" },
    text: {
      tr: "Kâzım Karabekir komutasındaki Doğu Cephesi kuvvetleri Eylül 1920 sonunda harekete geçti; 29 Eylül'de Sarıkamış'ı, 30 Ekim'de Kars'ı aldı. Ardından imzalanan Gümrü Antlaşması, TBMM'nin bir devletle imzaladığı ilk antlaşma oldu. Doğu sınırı güvenceye alınınca asker ve silah batıya kaydırılabildi.",
      en: "Under Kâzım Karabekir, the forces of the Eastern Front moved at the end of September 1920, taking Sarıkamış on 29 September and Kars on 30 October. The Treaty of Gyumri (Alexandropol) that followed was the first treaty the Grand National Assembly signed with another state. With the eastern border secured, troops and weapons could be shifted to the west.",
    },
    note: {
      tr: "Gümrü Antlaşması 2'yi 3 Aralık 1920'ye bağlayan gece imzalandı; kaynaklarda 2 ya da 3 Aralık olarak geçer.",
      en: "The Treaty of Gyumri was signed on the night of 2–3 December 1920; sources give either date.",
    },
    caption: {
      tr: "Kırmızı oklar TBMM kuvvetlerinin Sarıkamış'tan Kars'a ve Gümrü'ye ilerleyişini gösteriyor.",
      en: "Red arrows show the Assembly's forces advancing from Sarıkamış to Kars and Gyumri.",
    },
    scene: "legend", people: ["kazim"], sources: [2, 4, 6],
    view: [38.5, 38.6, 46, 42.2],
    layers: [
      { type: "arrow", side: "tr", from: "erzurum", to: "sarikamis", bend: 0.1, t0: 0.6, dur: 1.4 },
      { type: "battle", p: "sarikamis", t0: 2 },
      { type: "arrow", side: "tr", from: "sarikamis", to: "kars", bend: -0.2, t0: 2.4, dur: 1.2 },
      { type: "battle", p: "kars", t0: 3.6 },
      { type: "arrow", side: "tr", from: "kars", to: "gumru", bend: 0.2, t0: 4, dur: 1.2 },
      { type: "seal", p: "gumru", t0: 5.3 },
    ],
  },
  {
    id: "inonu1", date: "1921-01-06", end: "1921-01-10", cat: "war",
    title: { tr: "Birinci İnönü Muharebesi", en: "First Battle of İnönü" },
    place: { tr: "İnönü, Eskişehir yakınları", en: "İnönü, near Eskişehir" },
    text: {
      tr: "Bursa'dan Eskişehir'e doğru ilerleyen Yunan kuvvetleri, İsmet Paşa komutasındaki Batı Cephesi'yle İnönü mevzilerinde karşılaştı. 6 Ocak'ta başlayan ilerleyiş, en ağır çarpışmaların yaşandığı 9–10 Ocak'tan sonra durdu ve Yunan kuvvetleri geri çekildi. Bu başarı, yeni kurulan düzenli ordunun güvenini artırdı. Hemen ardından, 20 Ocak 1921'de TBMM ilk anayasa olan Teşkilât-ı Esasiye Kanunu'nu kabul etti.",
      en: "Greek forces advancing from Bursa towards Eskişehir met İsmet Pasha's Western Front at the İnönü positions. The advance, which began on 6 January, stalled after the heaviest fighting on 9–10 January, and the Greek forces withdrew. The success gave the newly formed regular army confidence. Soon after, on 20 January 1921, the Assembly adopted its first constitution, the Law on Fundamental Organisation.",
    },
    caption: {
      tr: "Mavi ok Yunan ilerleyişini, kırmızı hat İnönü'deki savunmayı, geri dönen kesik ok çekilmeyi gösteriyor.",
      en: "The blue arrow shows the Greek advance, the red line the defence at İnönü, and the dashed arrow the withdrawal.",
    },
    scene: "legend", people: ["ismet"], sources: [2, 4, 6],
    view: [27.6, 38.6, 32.6, 41.0],
    layers: [
      { type: "arrow", side: "gr", from: "bursa", to: [29.95, 39.9], bend: 0.12, t0: 0.6, dur: 2 },
      { type: "front", side: "tr", t0: 1.8, pts: [[30.05, 40.15], [30.2, 39.95], [30.2, 39.7], [30.1, 39.5]] },
      { type: "battle", p: "inonu", t0: 2.8 },
      { type: "arrow", side: "gr", dashed: true, from: [29.85, 39.75], to: [29.2, 40.05], bend: 0.2, t0: 3.8, dur: 1.6 },
    ],
  },
  {
    id: "istiklal", date: "1921-03-12", cat: "politics",
    title: { tr: "İstiklal Marşı kabul ediliyor", en: "The National Anthem is adopted" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "TBMM, Mehmet Âkif'in (Ersoy) yazdığı şiiri 12 Mart 1921'de İstiklal Marşı olarak kabul etti. Âkif para ödülü yüzünden yarışmaya katılmak istememiş, ödülü sonunda bir hayır kurumuna bağışlamıştı. Marş, en zor günlerde milletin bağımsızlık inancının sesi oldu.",
      en: "On 12 March 1921 the Assembly adopted the poem by Mehmet Âkif (Ersoy) as the National Anthem (İstiklal Marşı, the “Independence March”). Âkif had been reluctant to enter the competition because of its cash prize, which he finally donated to a charity. The anthem became the voice of the nation's belief in independence in its hardest days.",
    },
    caption: {
      tr: "Bir mürekkep kalemi marşın ilk kelimesini kâğıda yazıyor: “Korkma!”",
      en: "A quill writes the anthem's first word on paper: “Korkma!” (“Fear not!”)",
    },
    scene: "quill", people: ["akif"], sources: [2, 3],
    view: [28.5, 37.8, 37.5, 41.8],
    layers: [{ type: "pulse", p: "ankara", t0: 0.6 }],
  },
  {
    id: "inonu2", date: "1921-03-23", end: "1921-04-01", cat: "war",
    title: { tr: "İkinci İnönü Muharebesi", en: "Second Battle of İnönü" },
    place: { tr: "İnönü, Eskişehir yakınları", en: "İnönü, near Eskişehir" },
    text: {
      tr: "Yunan ordusu Mart 1921'de daha güçlü bir taarruz başlattı. Güneyde Afyonkarahisar bir süre Yunan kuvvetlerinin eline geçti; kuzeyde ise İnönü mevzileri yine aşılamadı ve 31 Mart'ı 1 Nisan'a bağlayan gece Yunan kuvvetleri geri çekildi. Mustafa Kemal, İsmet Paşa'ya şu telgrafı çekti: “Siz orada yalnız düşmanı değil, milletin makûs talihini de yendiniz.” Aynı günlerde, 16 Mart'ta, Sovyet Rusya ile Moskova Antlaşması imzalanmıştı.",
      en: "In March 1921 the Greek army launched a stronger offensive. In the south Afyonkarahisar fell for a time, but in the north the İnönü positions held again, and on the night of 31 March–1 April the Greek forces withdrew. Mustafa Kemal wired İsmet Pasha: “There you have defeated not only the enemy but also the nation's ill fortune.” A few days earlier, on 16 March, the Treaty of Moscow had been signed with Soviet Russia.",
    },
    caption: {
      tr: "İki Yunan kolu ilerliyor; kuzeydeki kol İnönü'de durduruluyor ve geri çekiliyor.",
      en: "Two Greek columns advance; the northern one is stopped at İnönü and pulls back.",
    },
    scene: "legend", people: ["ismet"], sources: [1, 2, 4],
    view: [27.6, 38.2, 32.6, 41.0],
    layers: [
      { type: "arrow", side: "gr", from: "bursa", to: [29.95, 39.92], bend: 0.12, t0: 0.6, dur: 1.8 },
      { type: "arrow", side: "gr", from: "usak", to: [30.4, 38.78], bend: -0.15, t0: 0.9, dur: 1.8 },
      { type: "front", side: "tr", t0: 1.6, pts: [[30.05, 40.15], [30.2, 39.95], [30.2, 39.7], [30.1, 39.5]] },
      { type: "battle", p: "inonu", t0: 2.6 },
      { type: "arrow", side: "gr", dashed: true, from: [29.85, 39.78], to: [29.2, 40.08], bend: 0.2, t0: 3.6, dur: 1.6 },
    ],
  },
  {
    id: "kutahya", date: "1921-07-10", end: "1921-07-24", cat: "war",
    title: { tr: "Kütahya–Eskişehir ve Sakarya'ya çekiliş", en: "Kütahya–Eskişehir and the withdrawal to the Sakarya" },
    place: { tr: "Kütahya · Eskişehir · Afyonkarahisar", en: "Kütahya · Eskişehir · Afyonkarahisar" },
    text: {
      tr: "Temmuz 1921'de sayıca ve donanımca üstün Yunan ordusu Kütahya, Afyonkarahisar ve Eskişehir'i ele geçirdi. Ordunun yok olmaması için Mustafa Kemal, Sakarya Nehri'nin doğusuna çekilme kararı verdi. Bu kaygılı günlerde TBMM, 5 Ağustos'ta Mustafa Kemal'i üç ay süreyle Başkomutan yaptı. Ardından yayımlanan Tekâlif-i Milliye emirleriyle ordu için halktan yiyecek, giyecek ve taşıt toplandı.",
      en: "In July 1921 the Greek army, superior in numbers and equipment, took Kütahya, Afyonkarahisar and Eskişehir. To keep the army from being destroyed, Mustafa Kemal decided to withdraw east of the Sakarya River. In these anxious days, on 5 August, the Assembly made him Commander-in-Chief for three months. The National Obligations orders that followed collected food, clothing and transport from the people for the army.",
    },
    caption: {
      tr: "Mavi oklar üç şehre yönelen Yunan taarruzunu, kırmızı kesik ok Türk ordusunun Sakarya'nın doğusuna çekilişini gösteriyor.",
      en: "Blue arrows show the Greek offensive on three cities; the red dashed arrow shows the Turkish army's withdrawal east of the Sakarya.",
    },
    scene: "legend", people: ["mk", "ismet"], sources: [1, 2, 4],
    view: [27.6, 37.9, 33.6, 41.0],
    layers: [
      { type: "arrow", side: "gr", from: "bursa", to: [30.4, 39.85], bend: 0.12, t0: 0.5, dur: 1.6 },
      { type: "arrow", side: "gr", from: "usak", to: [29.9, 39.3], bend: 0.15, t0: 0.7, dur: 1.6 },
      { type: "arrow", side: "gr", from: "usak", to: [30.45, 38.8], bend: -0.15, t0: 0.9, dur: 1.6 },
      { type: "arrow", side: "tr", dashed: true, from: [30.7, 39.7], to: [32.0, 39.55], bend: -0.1, t0: 2.6, dur: 1.8 },
      { type: "front", side: "tr", t0: 4.2, pts: [[32.0, 40.05], [32.1, 39.8], [32.05, 39.5], [31.95, 39.25]] },
    ],
  },
  {
    id: "sakarya", date: "1921-08-23", end: "1921-09-13", cat: "war",
    title: { tr: "Sakarya Meydan Muharebesi", en: "Battle of the Sakarya" },
    place: { tr: "Sakarya Nehri, Polatlı yakınları", en: "Sakarya River, near Polatlı" },
    text: {
      tr: "Ankara'ya yaklaşan Yunan ordusu Sakarya Nehri boyunca durduruldu. 22 gün 22 gece süren savaşta Mustafa Kemal şu emri verdi: “Hatt-ı müdafaa yoktur, sath-ı müdafaa vardır. O satıh bütün vatandır.” Yani tek bir hat değil, bütün vatan savunulacaktı. 13 Eylül'de Yunan ordusu geri çekilmeye başladı. TBMM 19 Eylül'de Mustafa Kemal'e mareşal rütbesi ve “Gazi” unvanını verdi.",
      en: "The Greek army advancing on Ankara was stopped along the Sakarya River. During the battle, which lasted twenty-two days and nights, Mustafa Kemal ordered: “There is no line of defence, there is an area of defence. That area is the whole homeland.” In other words, not a single line but every inch of the country would be defended. On 13 September the Greek army began to withdraw. On 19 September the Assembly gave Mustafa Kemal the rank of Marshal and the title “Gazi”.",
    },
    caption: {
      tr: "Sayaç 22 günü sayıyor; haritada Yunan ilerleyişi Sakarya'da duruyor ve geri dönüyor.",
      en: "The counter runs through 22 days; on the map the Greek advance halts at the Sakarya and turns back.",
    },
    scene: "days", people: ["mk", "fevzi", "ismet"], sources: [1, 2, 4, 5],
    view: [29.6, 38.6, 34.0, 40.7],
    layers: [
      { type: "arrow", side: "gr", from: "eskisehir", to: [31.75, 39.45], bend: -0.1, t0: 0.5, dur: 1.8 },
      { type: "front", side: "tr", t0: 1.5, pts: [[32.05, 39.95], [31.95, 39.7], [31.85, 39.45], [31.95, 39.2], [32.2, 39.05]] },
      { type: "battle", p: [31.85, 39.5], t0: 2.4 },
      { type: "pulse", p: "ankara", t0: 2.6 },
      { type: "arrow", side: "gr", dashed: true, from: [31.6, 39.55], to: [30.65, 39.65], bend: 0.15, t0: 4, dur: 1.8 },
    ],
  },
  {
    id: "ekim1921", date: "1921-10-13", end: "1921-10-20", cat: "diplomacy",
    title: { tr: "Kars ve Ankara antlaşmaları", en: "The Treaties of Kars and Ankara" },
    place: { tr: "Kars · Ankara", en: "Kars · Ankara" },
    text: {
      tr: "Sakarya'dan sonra diplomasi hızlandı. 13 Ekim 1921'de Sovyet Rusya'nın katılımıyla Ermenistan, Azerbaycan ve Gürcistan'la imzalanan Kars Antlaşması doğu sınırını kesinleştirdi. 20 Ekim'de Fransa ile imzalanan Ankara Antlaşması'yla güneydeki savaş sona erdi; Fransa, TBMM hükûmetiyle antlaşma imzalayan ilk büyük İtilaf devleti oldu.",
      en: "After the Sakarya, diplomacy gathered pace. The Treaty of Kars, signed on 13 October 1921 with Armenia, Azerbaijan and Georgia with Soviet Russia taking part, settled the eastern border. The Treaty of Ankara, signed with France on 20 October, ended the fighting in the south; France became the first major Allied power to sign a treaty with the Ankara government.",
    },
    caption: {
      tr: "İki antlaşma belgesi mühürleniyor; doğu ve güney cepheleri kapanıyor.",
      en: "Two treaty documents are sealed; the eastern and southern fronts close.",
    },
    scene: "twodocs", people: [], sources: [2, 6, 7],
    view: VIEWS.anatolia,
    layers: [
      { type: "seal", p: "kars", t0: 0.8 },
      { type: "seal", p: "adana", t0: 2.0 },
      { type: "pulse", p: "ankara", t0: 2.6 },
    ],
  },
  {
    id: "taarruz", date: "1922-08-26", end: "1922-09-09", cat: "war",
    title: { tr: "Büyük Taarruz", en: "The Great Offensive" },
    place: { tr: "Kocatepe · Dumlupınar · İzmir", en: "Kocatepe · Dumlupınar · İzmir" },
    text: {
      tr: "Uzun bir hazırlığın ardından Türk ordusu 26 Ağustos 1922 sabahı, Afyonkarahisar yakınlarındaki Kocatepe'den yönetilen Büyük Taarruz'u başlattı. Yunan cephesi kısa sürede yarıldı; 30 Ağustos'taki Başkomutan Meydan Muharebesi'nde Yunan ana kuvvetleri kuşatılıp dağıtıldı. 1 Eylül'de Mustafa Kemal “Ordular! İlk hedefiniz Akdeniz'dir. İleri!” emrini verdi. 9 Eylül 1922'de Türk süvarileri İzmir'e girdi.",
      en: "After long preparation, on the morning of 26 August 1922 the Turkish army launched the Great Offensive, directed from Kocatepe near Afyonkarahisar. The Greek front was broken within days, and at the Battle of the Commander-in-Chief on 30 August the main Greek forces were encircled and scattered. On 1 September Mustafa Kemal ordered: “Armies! Your first objective is the Mediterranean. Forward!” On 9 September 1922 Turkish cavalry entered İzmir.",
    },
    note: {
      tr: "Batı Anadolu'nun tamamen kurtuluşu genellikle 18 Eylül 1922 olarak verilir; bazı kaynaklar taarruzun sonunu İzmir'e giriş (9 Eylül) kabul eder.",
      en: "The full liberation of western Anatolia is usually dated 18 September 1922; some sources end the offensive with the entry into İzmir (9 September).",
    },
    caption: {
      tr: "Kırmızı oklar Kocatepe'den başlayan taarruzu, Dumlupınar'daki kuşatmayı ve İzmir'e ilerleyişi gösteriyor.",
      en: "Red arrows show the offensive from Kocatepe, the encirclement at Dumlupınar and the advance to İzmir.",
    },
    scene: "offensive", people: ["mk", "ismet", "fevzi"], sources: [1, 2, 4, 5],
    view: [26.0, 37.6, 32.2, 40.7],
    layers: [
      { type: "front", side: "gr", t0: 0.3, pts: [[30.6, 40.0], [30.55, 39.75], [30.75, 39.35], [30.7, 39.0], [30.55, 38.75], [30.2, 38.55]] },
      { type: "arrow", side: "tr", from: "kocatepe", to: [30.05, 38.75], bend: 0.2, t0: 1.0, dur: 1.2 },
      { type: "arrow", side: "tr", from: [31.0, 38.6], to: [30.2, 38.95], bend: -0.25, t0: 1.2, dur: 1.2 },
      { type: "battle", p: "dumlupinar", t0: 2.4 },
      { type: "arrow", side: "tr", from: "dumlupinar", to: "izmir", bend: -0.08, t0: 3.0, dur: 2.4 },
      { type: "arrow", side: "tr", from: [30.4, 39.6], to: "bursa", bend: 0.1, t0: 3.4, dur: 2 },
      { type: "pulse", p: "izmir", t0: 5.4, big: true },
    ],
  },
  {
    id: "mudanya", date: "1922-10-11", cat: "diplomacy",
    title: { tr: "Mudanya Ateşkesi", en: "The Armistice of Mudanya" },
    place: { tr: "Mudanya", en: "Mudanya" },
    text: {
      tr: "Zaferin ardından İtilaf devletleri ateşkes istedi. Mudanya'daki görüşmeler 3 Ekim'de başladı ve 11 Ekim 1922'de ateşkes imzalandı. Buna göre Doğu Trakya savaşsız olarak Türk yönetimine bırakılacaktı. Görüşmelerde TBMM hükûmetini İsmet Paşa temsil etti.",
      en: "After the victory the Allies asked for an armistice. Talks at Mudanya began on 3 October, and the armistice was signed on 11 October 1922. Under it, Eastern Thrace was to be handed over to Turkish administration without further fighting. İsmet Pasha represented the Ankara government in the talks.",
    },
    caption: {
      tr: "Masaya belgeler konuyor ve ateşkes imzalanıyor; haritada Doğu Trakya işaretleniyor.",
      en: "Papers are laid on the table and the armistice is signed; on the map Eastern Thrace is marked.",
    },
    scene: "table", people: ["ismet"], sources: [2, 6, 7],
    view: [25.6, 39.2, 31.2, 42.2],
    layers: [
      { type: "pulse", p: "mudanya", t0: 0.6, big: true },
      { type: "zone", side: "tr", t0: 2.0, label: { tr: "Doğu Trakya", en: "Eastern Thrace" },
        pts: [[26.1, 40.65], [26.0, 41.95], [27.6, 42.05], [28.3, 41.55], [28.9, 41.25], [28.4, 40.95], [27.6, 40.95], [26.9, 40.7]] },
    ],
  },
  {
    id: "saltanat", date: "1922-11-01", cat: "politics",
    title: { tr: "Saltanatın kaldırılması", en: "Abolition of the Sultanate" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "İtilaf devletleri barış konferansına hem Ankara'yı hem İstanbul hükûmetini çağırınca TBMM, 1 Kasım 1922'de saltanatı kaldırdı. Böylece altı yüz yılı aşkın Osmanlı saltanatı sona erdi. Son padişah VI. Mehmed Vahdeddin, 17 Kasım'da bir İngiliz savaş gemisiyle İstanbul'dan ayrıldı. Halifelik bir süre daha devam etti.",
      en: "When the Allies invited both the Ankara and the Istanbul governments to the peace conference, the Grand National Assembly abolished the sultanate on 1 November 1922. More than six centuries of Ottoman rule by sultans came to an end. The last sultan, Mehmed VI Vahdeddin, left Istanbul aboard a British warship on 17 November. The caliphate continued for a while longer.",
    },
    caption: {
      tr: "Taç soluyor ve dağılıyor; ardından küçük bir gemi İstanbul'dan uzaklaşıyor.",
      en: "The crown fades and crumbles; then a small ship sails away from Istanbul.",
    },
    scene: "crown", people: ["mk", "vahdettin"], sources: [2, 3, 6],
    view: [24.5, 37.6, 34.5, 42.2],
    layers: [
      { type: "pulse", p: "ankara", t0: 0.6, big: true },
      { type: "arrow", side: "en", dashed: true, from: "istanbul", to: [24.9, 38.6], bend: 0.25, t0: 3, dur: 2.5,
        via: [[28.6, 40.85], [27.4, 40.6], [26.6, 40.35], [26.2, 40.0]] },
    ],
  },
  {
    id: "lozan1", date: "1922-11-20", cat: "diplomacy",
    title: { tr: "Lozan Konferansı başlıyor", en: "The Lausanne Conference opens" },
    place: { tr: "Lozan, İsviçre", en: "Lausanne, Switzerland" },
    text: {
      tr: "Barış konferansı 20 Kasım 1922'de İsviçre'nin Lozan kentinde açıldı. Türk heyetine İsmet Paşa başkanlık ediyordu; yanında Rıza Nur ve Hasan (Saka) vardı. Kapitülasyonlar, Musul ve borçlar gibi konularda anlaşma sağlanamayınca görüşmeler 4 Şubat 1923'te kesildi ve 23 Nisan 1923'te yeniden başladı.",
      en: "The peace conference opened on 20 November 1922 in Lausanne, Switzerland. İsmet Pasha headed the Turkish delegation, with Rıza Nur and Hasan (Saka) at his side. When no agreement could be reached on the capitulations, Mosul and the Ottoman debts, the talks broke off on 4 February 1923 and resumed on 23 April 1923.",
    },
    caption: {
      tr: "Konferans masası kuruluyor; alttaki çubuk görüşmelerin iki dönemini ve aradaki kesintiyi gösteriyor.",
      en: "The conference table is set; the bar below shows the two rounds of talks and the break between them.",
    },
    scene: "conference", people: ["ismet", "rizanur", "hasan"], sources: [2, 6, 8, 9],
    view: VIEWS.europe,
    layers: [
      { type: "rays", from: "ankara", to: ["lausanne"], t0: 1 },
      { type: "pulse", p: "lausanne", t0: 2.6, big: true },
    ],
  },
  {
    id: "lozan", date: "1923-07-24", cat: "diplomacy",
    title: { tr: "Lozan Antlaşması", en: "The Treaty of Lausanne" },
    place: { tr: "Lozan, İsviçre", en: "Lausanne, Switzerland" },
    text: {
      tr: "24 Temmuz 1923'te Lozan'daki Rumine Sarayı'nda barış antlaşması imzalandı. Türkiye'nin sınırları büyük ölçüde belirlendi, kapitülasyonlar kaldırıldı ve yeni Türk devleti uluslararası alanda tanındı. Musul sorunu İngiltere ile ayrıca görüşülmek üzere bırakıldı. Dört yıl önce Samsun'da başlayan savaş ve diplomasi dönemi böylece kapandı; sırada yeni devletin kuruluşu vardı.",
      en: "On 24 July 1923 the peace treaty was signed at the Palais de Rumine in Lausanne. Turkey's borders were largely settled, the capitulations were abolished and the new Turkish state won international recognition. The Mosul question was left to be negotiated separately with Britain. The years of war and diplomacy that began at Samsun four years earlier were over; what remained was to build the new state.",
    },
    caption: {
      tr: "Terazinin kefeleri dengeye geliyor ve antlaşma imzalanıyor; harita Lozan'dan Anadolu'ya dönüyor.",
      en: "The scales come into balance and the treaty is signed; the map turns from Lausanne back to Anatolia.",
    },
    scene: "scales", image: "lozan", people: ["ismet", "rizanur", "hasan"], sources: [6, 8, 9, 10],
    from: VIEWS.europe, view: VIEWS.anatolia,
    layers: [
      { type: "pulse", p: "lausanne", t0: 0.2, big: true },
      { type: "pulse", p: "ankara", t0: 3.2, big: true },
      { type: "star", p: "ankara", t0: 3.6 },
    ],
  },
  {
    id: "istanbul2", date: "1923-10-06", cat: "politics",
    title: { tr: "İstanbul'a giriş", en: "Entry into Istanbul" },
    place: { tr: "İstanbul", en: "Istanbul" },
    text: {
      tr: "Lozan Antlaşması'nın ardından İtilaf kuvvetleri İstanbul'u boşalttı. 6 Ekim 1923'te Şükrü Naili Paşa komutasındaki Türk birlikleri şehre girdi. Üç buçuk yılı aşan işgal sona ermişti.",
      en: "After the Treaty of Lausanne the Allied forces evacuated Istanbul. On 6 October 1923 Turkish troops under Şükrü Naili Pasha entered the city. An occupation of more than three and a half years was over.",
    },
    caption: {
      tr: "İtilaf gemileri Boğaz'dan ayrılıyor, Türk birlikleri şehre giriyor ve bayrak göndere çekiliyor.",
      en: "Allied warships leave the Bosphorus, Turkish troops march into the city and the flag is raised.",
    },
    scene: "liberation", people: [], sources: [2, 6, 7],
    view: [26, 38.8, 34, 42.2],
    layers: [
      { type: "arrow", side: "en", dashed: true, from: [28.9, 41.0], to: [25.4, 39.6], bend: 0.15, t0: 0.6, dur: 2.4,
        via: [[28.3, 40.8], [27.3, 40.6], [26.5, 40.3], [26.1, 40.0]] },
      { type: "arrow", side: "tr", from: [30.4, 40.75], to: "istanbul", bend: 0.15, t0: 2.2, dur: 1.6 },
      { type: "pulse", p: "istanbul", t0: 3.8, big: true },
    ],
  },
  {
    id: "baskent", date: "1923-10-13", cat: "politics",
    title: { tr: "Ankara başkent oluyor", en: "Ankara becomes the capital" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "13 Ekim 1923'te TBMM'nin kabul ettiği kanunla Ankara, Türkiye Devleti'nin yönetim merkezi, yani başkenti oldu. Millî Mücadele'yi yöneten küçük Anadolu kasabası, böylece yeni devletin kalbi hâline geldi.",
      en: "On 13 October 1923 a law passed by the Grand National Assembly made Ankara the seat of government, the capital of the Turkish state. The small Anatolian town that had led the National Struggle became the heart of the new state.",
    },
    caption: {
      tr: "Başkentlik İstanbul'dan Ankara'ya geçiyor; kalenin üstünde “Başkent” mührü beliriyor.",
      en: "The capital moves from Istanbul to Ankara; a “Capital” seal appears above the castle.",
    },
    scene: "capital", people: [], sources: [2, 3],
    view: [26.5, 37.6, 36.5, 42.2],
    layers: [
      { type: "rays", from: "istanbul", to: ["ankara"], t0: 0.6 },
      { type: "pulse", p: "ankara", t0: 1.8, big: true },
      { type: "seal", p: "ankara", t0: 2.4 },
    ],
  },
  {
    id: "cumhuriyet", date: "1923-10-29", cat: "politics",
    title: { tr: "Cumhuriyet ilan ediliyor", en: "The Republic is proclaimed" },
    place: { tr: "Ankara", en: "Ankara" },
    text: {
      tr: "29 Ekim 1923'te TBMM, Teşkilât-ı Esasiye Kanunu'nda yaptığı değişiklikle “Türkiye Devleti'nin şekl-i hükûmeti Cumhuriyettir” hükmünü kabul etti. Aynı akşam Mustafa Kemal oybirliğiyle Türkiye Cumhuriyeti'nin ilk cumhurbaşkanı seçildi; ilk başbakan İsmet Paşa oldu. Haber yurdun dört bir yanında top atışları ve kutlamalarla karşılandı. Samsun'da başlayan yol, Cumhuriyet'e ulaşmıştı.",
      en: "On 29 October 1923 the Grand National Assembly amended the Law on Fundamental Organisation to state that “the form of government of the Turkish State is a Republic”. That same evening Mustafa Kemal was unanimously elected the first President of the Republic of Turkey; İsmet Pasha became the first Prime Minister. The news was greeted with cannon salutes and celebrations across the country. The road that began at Samsun had reached the Republic.",
    },
    caption: {
      tr: "Meclis binasının üzerinde kutlama ışıkları; haritada haber Ankara'dan bütün yurda yayılıyor.",
      en: "Celebration lights above the Assembly; on the map the news spreads from Ankara across the country.",
    },
    scene: "republic", people: ["mk", "ismet"], sources: [1, 2, 3, 5, 6],
    view: VIEWS.anatolia,
    layers: [
      { type: "pulse", p: "ankara", t0: 0.4, big: true },
      { type: "star", p: "ankara", t0: 0.9 },
      { type: "rays", from: "ankara", to: ["istanbul", "edirne", "izmir", "bursa", "samsun", "trabzon", "erzurum", "sivas", "konya", "adana", "diyarbakir"], t0: 1.6 },
    ],
  },
];

// Arayüz yazıları
const UI = {
  tr: {
    title: "Cumhuriyet'e Giden Yol",
    subtitle: "Samsun'dan Cumhuriyet'e · 1919–1923",
    play: "Oynat", pause: "Durdur", prev: "Önceki olay", next: "Sonraki olay",
    replay: "Animasyonu tekrar oynat", sources: "Kaynaklar", people: "Kişiler",
    note: "Kaynaklar farklı diyor", src: "Kaynak", start: "Yolculuğa başla",
    introKicker: "Bir harita hikâyesi",
    intro: "30 Ekim 1918'de imzalanan Mondros Ateşkesi'yle Osmanlı Devleti Birinci Dünya Savaşı'ndan yenik çıktı. İtilaf devletleri ülkenin birçok yerine asker çıkardı; 15 Mayıs 1919'da Yunan ordusu İzmir'e girdi. Dört gün sonra küçük bir vapur Samsun'a yanaştı. Bu harita, o günden 29 Ekim 1923'te Cumhuriyet'in ilanına uzanan yolu anlatıyor.",
    howto: "Alttaki zaman çubuğunu sürükle, bir işarete dokun ya da ▶ ile kendiliğinden akmasını izle.",
    legendTitle: "Harita işaretleri",
    legend: { tr: "TBMM kuvvetleri", gr: "Yunan ordusu", en: "İtilaf devletleri", route: "Mustafa Kemal'in yolu", front: "Cephe hattı", battle: "Muharebe" },
    surnameNote: "Parantez içindeki soyadları 1934 Soyadı Kanunu'ndan sonra alındı.",
    sourcesTitle: "Kaynaklar",
    sourcesText: "Tarihler ve olaylar aşağıdaki eserlerle karşılaştırılarak yazıldı. Kaynakların birbirinden ayrıldığı yerler kartlarda ayrıca belirtildi.",
    imagesTitle: "Görseller ve lisanslar",
    backToMap: "Haritaya dön ↑",
    endTitle: "Yaşasın Cumhuriyet!",
    imageLicense: "Lisans",
    categories: { politics: "Siyaset", war: "Cephe", diplomacy: "Diplomasi" },
    months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  },
  en: {
    title: "The Road to the Republic",
    subtitle: "From Samsun to the Republic · 1919–1923",
    play: "Play", pause: "Pause", prev: "Previous event", next: "Next event",
    replay: "Replay animation", sources: "Sources", people: "People",
    note: "Sources differ", src: "Source", start: "Begin the journey",
    introKicker: "A story told on a map",
    intro: "With the Armistice of Mudros, signed on 30 October 1918, the Ottoman Empire left the First World War defeated. The Allied Powers landed troops across the country, and on 15 May 1919 the Greek army entered İzmir. Four days later a small steamer docked at Samsun. This map tells the story of the road from that day to the proclamation of the Republic on 29 October 1923.",
    howto: "Drag the timeline below, tap a marker, or press ▶ and watch it unfold.",
    legendTitle: "Map key",
    legend: { tr: "Grand National Assembly forces", gr: "Greek army", en: "Allied Powers", route: "Mustafa Kemal's route", front: "Front line", battle: "Battle" },
    surnameNote: "Surnames in brackets were adopted after the Surname Law of 1934.",
    sourcesTitle: "Sources",
    sourcesText: "Dates and events were checked against the works below. Where sources disagree, the cards say so.",
    imagesTitle: "Images and licences",
    backToMap: "Back to the map ↑",
    endTitle: "Long live the Republic!",
    imageLicense: "Licence",
    categories: { politics: "Politics", war: "Front", diplomacy: "Diplomacy" },
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
};
