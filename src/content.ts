/**
 * content.ts — the single source of truth for copy, timings, names, cities
 * and counter values. Change the working name, a headline, a city or a
 * scene's scroll range here and nothing else needs to move.
 */

// ─── Brand ──────────────────────────────────────────────────────────────────

/** Working name. Every string below interpolates it, so renaming is one edit. */
export const BRAND = { name: 'RICAMBIO' } as const
const B = BRAND.name

/**
 * Car finish. 'painted' = deep Italian red with clearcoat (a scale model).
 * 'clay' = warm clay-red, matte (a designer's clay model).
 */
export const CAR_FINISH: 'painted' | 'clay' = 'painted'

export const PALETTE = {
  paper: '#D1D7DE',
  ink: '#111111',
  inkDeep: '#14181D',
  orange: '#E8731E', // action: "Order a print" and the primary CTA only
  teal: '#2B7A8C', // trust: fit confirmed, passed checks, scan light
  red: '#9E1B1E', // car paint, marker strike-throughs, red footnote
  clay: '#B5533C',
  interior: '#2A2D31',
} as const

// ─── Scroll track and scene timings ─────────────────────────────────────────

/** Height of the scroll track in viewport heights. */
export const TRACK = { desktopVh: 1300, mobileVh: 1500 } as const

export type SceneId =
  | 'hero'
  | 'snap'
  | 'search'
  | 'request'
  | 'scan'
  | 'sparkle'
  | 'print'
  | 'ship'
  | 'click'
  | 'home'
  | 'library'
  | 'cta'

export interface SceneRange {
  id: SceneId
  /** Name shown in the ?debug HUD. */
  name: string
  start: number
  end: number
}

/**
 * Global progress ranges (0 → 1). Ranges must be contiguous and sorted.
 * To retime, move a boundary: the scene before and after it share it.
 */
export const SCENES: readonly SceneRange[] = [
  { id: 'hero', name: '00 Hero', start: 0.0, end: 0.05 },
  { id: 'snap', name: '01 Snap', start: 0.05, end: 0.14 },
  { id: 'search', name: '02 Search fails', start: 0.14, end: 0.22 },
  { id: 'request', name: '03 Request', start: 0.22, end: 0.3 },
  { id: 'scan', name: '04 Torino scan', start: 0.3, end: 0.45 },
  { id: 'sparkle', name: '05 Sparkle', start: 0.45, end: 0.52 },
  { id: 'print', name: '06 Checks + print', start: 0.52, end: 0.66 },
  { id: 'ship', name: '07 Ship', start: 0.66, end: 0.725 },
  { id: 'click', name: '08 Click, it fits', start: 0.725, end: 0.815 },
  { id: 'home', name: '09 Print at home', start: 0.815, end: 0.875 },
  { id: 'library', name: '10 Library grows', start: 0.875, end: 0.955 },
  { id: 'cta', name: '11 Keep them on the road', start: 0.955, end: 1.0 },
]

export const sceneRange = (id: SceneId): SceneRange => SCENES.find((s) => s.id === id)!

/**
 * Beats inside each scene, in the scene's LOCAL time (0 → 1).
 * Read with `remap(local, ...BEATS.snap.crack)`.
 */
export const BEATS = {
  hero: { exit: [0.7, 1] },
  snap: {
    dolly: [0, 0.35],
    crack: [0.4, 0.52],
    snap: [0.52, 0.56],
    fall: [0.56, 0.8],
    droop: [0.84, 0.97],
    annotate: [0.86, 1],
  },
  search: { pullOut: [0, 0.25], cards: [0.25, 0.85], hold: [0.85, 1] },
  request: { chips: [0, 0.35], button: [0.35, 0.55], beacon: [0.55, 0.7], others: [0.7, 1] },
  scan: {
    seam: [0, 0.1],
    notify: [0.1, 0.18],
    sweep: [0.18, 0.38],
    mesh: [0.38, 0.52],
    cad: [0.52, 0.7],
    mirror: [0.7, 0.8],
    upload: [0.8, 1],
  },
  sparkle: { seamClose: [0, 0.15], arc: [0.15, 0.45], burst: [0.45, 0.6], page: [0.6, 0.85], tap: [0.85, 1] },
  print: { checks: [0, 0.25], glide: [0.25, 0.4], layers: [0.4, 0.8], finish: [0.8, 1] },
  ship: { pack: [0, 0.55], travel: [0.55, 1] },
  click: { descend: [0, 0.2], insert: [0.2, 0.4], airflow: [0.4, 0.55], form: [0.55, 0.8], network: [0.8, 1] },
  home: { seam: [0, 0.15], download: [0.15, 0.45], print: [0.45, 0.8], fits: [0.8, 1] },
  library: { pullBack: [0, 0.35], sources: [0.35, 0.6], never: [0.6, 0.8], counters: [0.8, 1] },
  cta: { flyBack: [0, 0.5], golden: [0.5, 1] },
} as const satisfies Record<SceneId, Record<string, readonly [number, number]>>

// ─── Story numbers ──────────────────────────────────────────────────────────

export const NUMBERS = {
  clipGrams: 2.4,
  clipYear: 1999,
  daysSearching: [1, 6, 23],
  ownersWanting: 37,
  scanPoints: { desktop: 20000, mobile: 5000 },
  caliper: { scanned: 2.07, measured: 2.0 },
  dimensions: { pin: 6.2, tab: 2.0, width: 14.8 },
  printSet: 3,
  printMinutes: 118, // 1 h 58 m
  shipDays: 3,
  fitConfirmed: { first: 1, afterEmre: 14, afterSelin: 15 },
  /** DEMO placeholder values — not real data. Shown with a "demo" tag. */
  demo: { partsInLibrary: 1284, modelsCovered: 23, fitConfirmations: 9417 },
} as const

// ─── Places and people ──────────────────────────────────────────────────────

export interface City {
  key: string
  lat: number
  lon: number
}

export const CITIES = {
  istanbul: { key: 'istanbul', lat: 41.01, lon: 28.98 },
  torino: { key: 'torino', lat: 45.07, lon: 7.69 },
  ankara: { key: 'ankara', lat: 39.93, lon: 32.86 },
} as const

/**
 * Named cities that light up with "+1" in Scene 03. Each is one owner; the
 * rest of the NUMBERS.ownersWanting total (Emre included) are unlabelled
 * dots on the map.
 */
export const WANTING_CITIES: readonly City[] = [
  { key: 'milano', lat: 45.46, lon: 9.19 },
  { key: 'muenchen', lat: 48.14, lon: 11.58 },
  { key: 'lyon', lat: 45.76, lon: 4.84 },
  { key: 'birmingham', lat: 52.49, lon: -1.89 },
  { key: 'ankara', lat: 39.93, lon: 32.86 },
  { key: 'izmir', lat: 38.42, lon: 27.14 },
  { key: 'wien', lat: 48.21, lon: 16.37 },
  { key: 'barcelona', lat: 41.39, lon: 2.17 },
  { key: 'roma', lat: 41.9, lon: 12.5 },
  { key: 'athina', lat: 37.98, lon: 23.73 },
  { key: 'zuerich', lat: 47.38, lon: 8.54 },
  { key: 'bologna', lat: 44.49, lon: 11.34 },
]

/** Parts floating in the Scene 10 constellation. `fits` is DEMO data. */
export const LIBRARY_PARTS = [
  { key: 'louvre', model: '116', fits: 41 },
  { key: 'visorClip', model: '156', fits: 128 },
  { key: 'switchLug', model: '147', fits: 96 },
  { key: 'flapGear', model: '164', fits: 23 },
  { key: 'handleBezel', model: '75', fits: 37 },
  { key: 'gloveLatch', model: '33', fits: 18 },
  { key: 'tweeterGrille', model: '916', fits: 12 },
  { key: 'cableClip', model: '105', fits: 9 },
] as const

export type LibraryPartKey = (typeof LIBRARY_PARTS)[number]['key']

/** CTA and footer targets. Point these at the platform once it is deployed. */
export const LINKS = {
  findPart: '#find-your-part',
  uploadPart: '#upload-a-part',
  joinMaker: '#join-as-a-maker',
  howItWorks: '#top',
  safety: '#never-print',
  garages: '#sources',
  contact: '#contact',
} as const

// ─── Copy ───────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'tr'

const en = {
  meta: {
    title: `${B} — parts that no longer exist, made again`,
    description:
      'The shared library of 3D files for parts nobody makes anymore — and the print shop that makes them real.',
  },
  ui: {
    langLabel: 'Language',
    soundLabel: 'Sound',
    soundOn: 'On',
    soundOff: 'Off',
    soundHint: 'Toggle sound effects',
    skipToEnd: 'Skip to the end',
    loading: 'Printing layer',
    demo: 'demo figures',
  },
  people: {
    emre: 'EMRE · ISTANBUL',
    luca: 'LUCA · TORINO',
    selin: 'SELIN · ANKARA',
  },
  cities: {
    istanbul: 'Istanbul',
    torino: 'Torino',
    ankara: 'Ankara',
    milano: 'Milano',
    muenchen: 'München',
    lyon: 'Lyon',
    birmingham: 'Birmingham',
    izmir: 'Izmir',
    wien: 'Wien',
    barcelona: 'Barcelona',
    roma: 'Roma',
    athina: 'Athína',
    zuerich: 'Zürich',
    bologna: 'Bologna',
  } as Record<string, string>,
  hero: {
    label: `${B} — parts that no longer exist, made again.`,
    headline: ['Twenty years on the road.', 'Undone by three grams of plastic.'],
    sub: 'The shared library of 3D files for parts nobody makes anymore — and the print shop that makes them real.',
    scrollCue: 'Scroll',
  },
  snap: {
    headline: 'Snap.',
    sub: 'One clip. The rest of the car is perfectly fine.',
    annotation: 'AC VENT CLIP · 2.4 g · 1999 · DISCONTINUED',
  },
  search: {
    headline: 'Nobody has it. Not the dealer, not the shops, not the junkyard.',
    query: 'ac vent clip 146',
    results: [
      { where: 'Dealer parts', finding: 'Not produced anymore' },
      { where: 'Online parts shops', finding: 'No listings for this model' },
      { where: 'Marketplace / junkyard', finding: 'Used · condition unknown' },
    ],
    daysLabel: 'Days searching',
  },
  request: {
    headline: "So he asks. And he isn't the only one.",
    appTitle: 'Find a part',
    chipLabels: ['Make', 'Model', 'Year', 'Area', 'Part'],
    chips: ['Alfa Romeo', '146', '2001', 'Cabin · Dashboard', 'AC vent clip'],
    empty: 'No file for this part yet.',
    request: 'Request this part',
    requested: 'Requested ✓',
    wantCounter: '{n} owners want this part',
  },
  scan: {
    headline: "Someone, somewhere, still has the part. That's enough.",
    caption: 'MEANWHILE — TORINO',
    notification: '{n} owners need the AC vent clip you have.',
    steps: ['Light sweep', 'Point cloud', 'Mesh', 'CAD'],
    pointsUnit: 'pts',
    caliper: 'Calipers',
    scanned: 'scan',
    measured: 'measured',
    insight:
      'The scan is the reference. The calipers are the truth. A 0.1 mm error is the difference between a click and a crack.',
    mirror: 'Only have the broken one? We scan its mirror twin and flip it.',
    mirrorAxis: 'MIRROR AXIS',
    uploading: 'Uploading',
    file: {
      title: 'AC vent clip — Alfa Romeo 146 (930)',
      meta: 'v1 · 3MF + STEP · print settings included',
      material: 'Material: ASA (sun-exposed cabin)',
      contributor: 'Contributed by Luca, Torino',
    },
  },
  sparkle: {
    headline: 'Found it.',
    notification: '✨ Your part exists now.',
    badge: 'Be the first to confirm fit',
    materialOk: 'Print in ASA.',
    materialBad: 'PLA',
    materialBadReason: 'softens in a hot cabin.',
    aftermarket: 'Aftermarket replacement part, not an original.',
    download: 'Download file',
    order: 'Order a print',
  },
  print: {
    headline: "Checked before it's printed. Measured before it ships.",
    checksTitle: 'Three automatic checks',
    checks: [
      { title: 'Approved part.', body: 'Not a safety part.' },
      { title: 'Published file.', body: 'All print settings included.' },
      { title: 'Right material.', body: 'Cabin, sun-exposed → ASA.' },
    ],
    footnote: 'If any check fails, the order is held and we contact you.',
    set: 'Set of {n}',
    hours: 'h',
    minutes: 'm',
    pipeline: ['Queue', 'Slice', 'Print', 'Finish', 'Check'],
    tolerance: '2.00 mm · within tolerance ✓',
  },
  ship: {
    headline: 'Three days later.',
    qr: 'Did it fit? Scan me.',
    label: 'TORINO → ISTANBUL',
    day: 'Day',
  },
  click: {
    headline: "His 'yes' makes the next search shorter.",
    scanning: 'Scanning QR',
    formTitle: 'Did it fit your 146?',
    options: ['Fits', 'Needs tweaking', 'Does not fit'],
    formNote: "Each answer updates the part's fitment record.",
    badgeOne: 'Fit confirmed by {n} owner',
    badgeMany: 'Fit confirmed by {n} owners',
    rankingTitle: '146 · AC vent clip',
    ranking: ['AC vent clip v1 — Luca, Torino', 'Universal vent clip, 3 sizes', 'Vent clip 145/146 — remix'],
  },
  home: {
    headline: 'Have a printer? The file comes with everything your first print needs.',
    caption: 'Meanwhile in Ankara.',
    downloaded: 'Downloaded',
    fileName: 'ac-vent-clip_146_v1.3mf',
    settingsTitle: 'print-settings',
    settings: [
      ['layer', '0.16 mm'],
      ['walls', '4'],
      ['infill', '40% gyroid'],
      ['material', 'ASA 250 °C'],
      ['bed', '100 °C'],
    ],
    orientation: 'orientation · upright, supports under the tab',
  },
  library: {
    headline: 'One part at a time, the library grows.',
    parts: {
      louvre: 'vent louvre',
      visorClip: 'sun visor clip',
      switchLug: 'window switch lug',
      flapGear: 'AC flap gear',
      handleBezel: 'door handle bezel',
      gloveLatch: 'glovebox latch',
      tweeterGrille: 'tweeter grille',
      cableClip: 'heater cable clip',
    } as Record<LibraryPartKey, string>,
    fitCount: '{n} fit confirmations',
    sourcesTitle: 'Where the files come from',
    sources: [
      { title: 'Owners scan their own.', body: 'A part, a phone or scanner, and calipers.' },
      { title: 'Partner garages.', body: 'They replace the same failing parts every week.' },
      { title: 'Send-in service.', body: 'Post us a broken original. We scan it, publish the file and print yours.' },
    ],
    neverTitle: 'What we never print',
    never: ['Brakes', 'Steering', 'Suspension', 'Seat belts', 'Airbags', 'Fuel system'],
    neverCaption: 'If it keeps you alive, it comes from the manufacturer.',
    counters: ['parts in library', 'models covered', 'fit confirmations'],
  },
  cta: {
    headline: 'Keep them on the road.',
    primary: 'Find your part',
    secondary: 'Upload a part',
    tertiary: 'Join as a maker',
  },
  footer: {
    disclaimer: `${B} is not affiliated with or endorsed by Alfa Romeo or Stellantis. Brand and model names are used only to describe compatibility. All parts are aftermarket replacements, not original parts.`,
    links: ['How it works', 'Safety & scope', 'For garages', 'Contact'],
    note: 'Working name. A university course project.',
  },
}

export type Copy = typeof en

const tr: Copy = {
  meta: {
    title: `${B} — artık var olmayan parçalar, yeniden üretiliyor`,
    description:
      'Artık kimsenin üretmediği parçaların ortak 3D dosya kütüphanesi — ve onları gerçeğe dönüştüren baskı atölyesi.',
  },
  ui: {
    langLabel: 'Dil',
    soundLabel: 'Ses',
    soundOn: 'Açık',
    soundOff: 'Kapalı',
    soundHint: 'Ses efektlerini aç ya da kapat',
    skipToEnd: 'Sona atla',
    loading: 'Katman basılıyor',
    demo: 'demo rakamlar',
  },
  people: {
    emre: 'EMRE · İSTANBUL',
    luca: 'LUCA · TORINO',
    selin: 'SELİN · ANKARA',
  },
  cities: {
    istanbul: 'İstanbul',
    torino: 'Torino',
    ankara: 'Ankara',
    milano: 'Milano',
    muenchen: 'Münih',
    lyon: 'Lyon',
    birmingham: 'Birmingham',
    izmir: 'İzmir',
    wien: 'Viyana',
    barcelona: 'Barselona',
    roma: 'Roma',
    athina: 'Atina',
    zuerich: 'Zürih',
    bologna: 'Bologna',
  },
  hero: {
    label: `${B} — artık var olmayan parçalar, yeniden üretiliyor.`,
    headline: ['Yirmi yıldır yollarda.', 'Üç gramlık bir plastiğe yenildi.'],
    sub: 'Artık kimsenin üretmediği parçaların ortak 3D dosya kütüphanesi — ve onları gerçeğe dönüştüren baskı atölyesi.',
    scrollCue: 'Kaydır',
  },
  snap: {
    headline: 'Çıt.',
    sub: 'Tek bir klips. Arabanın geri kalanı turp gibi.',
    annotation: 'KLİMA MENFEZ KLİPSİ · 2,4 g · 1999 · ÜRETİMİ BİTTİ',
  },
  search: {
    headline: 'Kimsede yok. Ne yetkili serviste, ne parçacılarda, ne de hurdacıda.',
    query: '146 klima menfez klipsi',
    results: [
      { where: 'Yetkili servis', finding: 'Artık üretilmiyor' },
      { where: 'Online parça siteleri', finding: 'Bu model için ilan yok' },
      { where: 'İkinci el / hurdacı', finding: 'Kullanılmış · durumu belirsiz' },
    ],
    daysLabel: 'Kaç gündür arıyor',
  },
  request: {
    headline: 'Sonunda soruyor. Ve soran bir tek o değil.',
    appTitle: 'Parça bul',
    chipLabels: ['Marka', 'Model', 'Yıl', 'Bölge', 'Parça'],
    chips: ['Alfa Romeo', '146', '2001', 'Kabin · Torpido', 'Klima menfez klipsi'],
    empty: 'Bu parça için henüz dosya yok.',
    request: 'Bu parçayı talep et',
    requested: 'Talep edildi ✓',
    wantCounter: '{n} araç sahibi bu parçayı istiyor',
  },
  scan: {
    headline: 'Bir yerlerde, birinin elinde o parça hâlâ var. Bu kadarı yeter.',
    caption: 'BU SIRADA — TORINO',
    notification: '{n} araç sahibi, sende olan klima menfez klipsini bekliyor.',
    steps: ['Işık taraması', 'Nokta bulutu', 'Mesh', 'CAD'],
    pointsUnit: 'nokta',
    caliper: 'Kumpas',
    scanned: 'tarama',
    measured: 'ölçülen',
    insight:
      'Tarama referanstır. Gerçeği kumpas söyler. 0,1 mm’lik bir hata, “klik” ile “çıt” arasındaki farktır.',
    mirror: 'Elinde sadece kırık olan mı var? Karşı taraftaki simetrik ikizini tarar, aynalarız.',
    mirrorAxis: 'SİMETRİ EKSENİ',
    uploading: 'Yükleniyor',
    file: {
      title: 'Klima menfez klipsi — Alfa Romeo 146 (930)',
      meta: 'v1 · 3MF + STEP · baskı ayarları dahil',
      material: 'Malzeme: ASA (güneş alan kabin)',
      contributor: 'Katkı: Luca, Torino',
    },
  },
  sparkle: {
    headline: 'Buldu.',
    notification: '✨ Parçan artık var.',
    badge: 'Uyumu ilk sen onayla',
    materialOk: 'ASA ile bas.',
    materialBad: 'PLA',
    materialBadReason: 'sıcak kabinde yumuşar.',
    aftermarket: 'Muadil yedek parça, orijinal değildir.',
    download: 'Dosyayı indir',
    order: 'Baskı sipariş et',
  },
  print: {
    headline: 'Basılmadan önce kontrol edilir. Gönderilmeden önce ölçülür.',
    checksTitle: 'Üç otomatik kontrol',
    checks: [
      { title: 'Onaylı parça.', body: 'Güvenlik parçası değil.' },
      { title: 'Yayınlanmış dosya.', body: 'Tüm baskı ayarları dahil.' },
      { title: 'Doğru malzeme.', body: 'Kabin, güneş alıyor → ASA.' },
    ],
    footnote: 'Kontrollerden biri bile geçmezse sipariş bekletilir ve seninle iletişime geçeriz.',
    set: '{n}’lü set',
    hours: 'sa',
    minutes: 'dk',
    pipeline: ['Sıra', 'Dilimleme', 'Baskı', 'Bitirme', 'Kontrol'],
    tolerance: '2,00 mm · tolerans içinde ✓',
  },
  ship: {
    headline: 'Üç gün sonra.',
    qr: 'Tam oturdu mu? Okut beni.',
    label: 'TORINO → İSTANBUL',
    day: 'Gün',
  },
  click: {
    headline: 'Onun bir “evet”i, sıradakinin aramasını kısaltır.',
    scanning: 'QR okunuyor',
    formTitle: '146’na tam oturdu mu?',
    options: ['Oturdu', 'Rötuş gerekti', 'Oturmadı'],
    formNote: 'Her yanıt, parçanın uyum kaydını günceller.',
    badgeOne: 'Uyumu {n} araç sahibi onayladı',
    badgeMany: 'Uyumu {n} araç sahibi onayladı',
    rankingTitle: '146 · klima menfez klipsi',
    ranking: ['Klima menfez klipsi v1 — Luca, Torino', 'Üniversal menfez klipsi, 3 boy', 'Menfez klipsi 145/146 — remiks'],
  },
  home: {
    headline: 'Yazıcın var mı? İlk baskın için gereken her şey dosyanın içinde.',
    caption: 'Bu sırada Ankara’da.',
    downloaded: 'İndirildi',
    fileName: 'klima-menfez-klipsi_146_v1.3mf',
    settingsTitle: 'baskı-ayarları',
    settings: [
      ['katman', '0,16 mm'],
      ['duvar', '4'],
      ['dolgu', '%40 gyroid'],
      ['malzeme', 'ASA 250 °C'],
      ['tabla', '100 °C'],
    ],
    orientation: 'yönlendirme · dik, tırnağın altı destekli',
  },
  library: {
    headline: 'Kütüphane parça parça büyüyor.',
    parts: {
      louvre: 'menfez kanadı',
      visorClip: 'güneşlik klipsi',
      switchLug: 'cam düğmesi tırnağı',
      flapGear: 'klima klape dişlisi',
      handleBezel: 'kapı kolu çerçevesi',
      gloveLatch: 'torpido mandalı',
      tweeterGrille: 'tweeter ızgarası',
      cableClip: 'kalorifer teli klipsi',
    },
    fitCount: '{n} uyum onayı',
    sourcesTitle: 'Dosyalar nereden geliyor',
    sources: [
      { title: 'Sahipler kendi parçasını tarar.', body: 'Bir parça, bir telefon ya da tarayıcı ve bir kumpas.' },
      { title: 'Partner servisler.', body: 'Her hafta aynı yorgun parçaları değiştiriyorlar.' },
      { title: 'Gönder, biz tarayalım.', body: 'Kırık orijinali bize postala. Tarayalım, dosyasını yayınlayalım, seninkini basalım.' },
    ],
    neverTitle: 'Asla basmadıklarımız',
    never: ['Fren', 'Direksiyon', 'Süspansiyon', 'Emniyet kemeri', 'Hava yastığı', 'Yakıt sistemi'],
    neverCaption: 'Hayatını koruyan parça, üreticiden gelir.',
    counters: ['kütüphanedeki parça', 'kapsanan model', 'uyum onayı'],
  },
  cta: {
    headline: 'Yollarda kalsınlar.',
    primary: 'Parçanı bul',
    secondary: 'Parça yükle',
    tertiary: 'Üretici olarak katıl',
  },
  footer: {
    disclaimer: `${B}; Alfa Romeo veya Stellantis ile bağlantılı değildir ve bu markalar tarafından onaylanmamıştır. Marka ve model adları yalnızca uyumluluğu belirtmek için kullanılır. Tüm parçalar muadil yedek parçadır, orijinal değildir.`,
    links: ['Nasıl çalışır', 'Güvenlik ve kapsam', 'Servisler için', 'İletişim'],
    note: 'Çalışma adı. Bir üniversite ders projesi.',
  },
}

export const COPY: Record<Lang, Copy> = { en, tr }

/** Replace `{n}` (and other `{key}` tokens) in a copy string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`))
}

/** Locale-aware number formatting (1,284 / 1.284). */
export function num(n: number, lang: Lang, digits = 0): string {
  return n.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
