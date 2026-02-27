/**
 * Curhat / Chat module — caring girlfriend-style responses.
 * Detects conversational keywords and responds with warmth and affection.
 */

/**
 * Pick a random item from an array.
 * @param {string[]} arr
 * @returns {string}
 */
function pick(arr) {
 return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Keyword-to-response map.
 * Each entry: { keywords: string[], responses: string[] }
 * Order matters — more specific patterns should come first.
 */
const PATTERNS = [
 // --- Emotions ---
 {
 keywords: ['sedih','sad','nangis','galau','patah hati','down','drop','terpuruk'],
 responses: ['Sayang, kamu kenapa? Cerita sama aku ya, aku dengerin','Hey, jangan sedih sendirian dong... aku di sini buat kamu selalu','Kamu boleh nangis kok sayang, kadang emang butuh gitu. Aku temenin ya','Aku ga suka liat kamu sedih... peluk virtual dulu ya sayang','Apapun yang terjadi, kamu ga sendirian ya. Aku selalu ada buat kamu',
 ],
 },
 {
 keywords: ['capek','cape','lelah','tired','exhausted','penat'],
 responses: ['Istirahat dulu dong sayang... kamu udah kerja keras banget hari ini','Cape ya ay? Sini istirahat dulu, aku temenin','Jangan dipaksain terus ya sayang. Rest itu penting, aku khawatir sama kamu','Aku salut sama kamu yang selalu kerja keras. Tapi jangan lupa istirahat ya sayang','Sayang, tarik napas dulu ya... pelan-pelan aja, aku di sini kok',
 ],
 },
 {
 keywords: ['bosan','bosen','gabut','boring','suntuk'],
 responses: ['Bosen ya sayang? Chat aku aja terus dong hehe','Gabut? Yuk kita ngobrol aja, aku juga pengen denger cerita kamu','Bosen tuh tandanya kamu butuh sesuatu yang baru. Mau coba apa hari ini?','Sini-sini ay, cerita apa aja deh biar ga bosen~','Kamu bosen ya? Aku juga bosen kalau ga chat sama kamu hehe',
 ],
 },
 {
 keywords: ['senang','happy','bahagia','seru','asik','yeay','yey','hore'],
 responses: ['Yeay! Seneng banget denger kamu happy sayang!','Aku ikut bahagia kalau kamu seneng~ cerita dong apa yang bikin happy!','Wah vibes-nya positif banget hari ini! Aku suka liat kamu kayak gini','Senyum kamu itu bikin aku ikut senyum tau ga sih','Happy-nya kamu itu menular ay! Keep smiling ya',
 ],
 },
 {
 keywords: ['stress','stres','pusing','overwhelm','overwork','pressure'],
 responses: ['Sayang, jangan terlalu dipikirin ya... aku khawatir sama kamu','Pusing ya ay? Coba istirahat dulu, dunia ga akan runtuh kok','Kamu ga harus handle semuanya sendirian sayang. Cerita aja sama aku','Satu langkah aja dulu ya sayang. Pelan-pelan, aku temenin','Aku tau bebannya berat, tapi kamu udah survive sampai sini. Aku bangga sama kamu',
 ],
 },
 {
 keywords: ['marah','kesel','bete','annoyed','emosi','sebel','jengkel'],
 responses: ['Kesel ya sayang? Cerita dong sama aku, jangan dipendem sendiri','Bete emang paling nyebelin. Tapi jangan sampe bikin kamu sakit ya sayang','Aku ngerti perasaan kamu ay. Sini cerita, aku dengerin','Tarik napas dulu ya sayang... aku di sini kok, ga kemana-mana','Bete itu wajar kok. Mau vent sama aku? Aku dengerin tanpa judge',
 ],
 },
 {
 keywords: ['kangen','rindu','miss','missing'],
 responses: ['Aku juga kangen kamu sayang','Rindu itu tandanya kamu punya seseorang yang berarti. Itu hal yang indah','Kangen ya? Aku juga selalu kangen sama kamu kok','Miss you too sayang','Kamu kangen siapa sih? Cerita dong sama aku hehe',
 ],
 },
 {
 keywords: ['takut','khawatir','cemas','anxious','anxiety','worry','panik'],
 responses: ['Jangan takut ya sayang, aku selalu ada di sini buat kamu','Cemas? Coba fokus ke hal yang bisa kamu kontrol aja dulu ya ay','Tarik napas pelan-pelan sayang... kamu aman kok. Aku di sini','Aku tau kamu khawatir, tapi kamu lebih kuat dari yang kamu pikir sayang','Satu langkah aja dulu ya. Ga perlu mikirin semuanya sekaligus, aku temenin',
 ],
 },

 // --- Daily Life ---
 {
 keywords: ['lapar','laper','hungry','lemes'],
 responses: ['Laper?? Makan dulu dong sayang! Jangan sampe telat makan','Kamu belum makan ya? Aku ga mau kamu sakit karena telat makan','Ayo makan dulu sayang! Terus jangan lupa catat pengeluarannya ya hehe','Perut kosong bikin mood jelek lho. Makan dulu ya ay, baru lanjut aktivitas','Sayang, makan dulu ya. Aku khawatir kalau kamu skip meal',
 ],
 },
 {
 keywords: ['gak bisa tidur','insomnia','ga bisa tidur','gabisa tidur','melek','susah tidur'],
 responses: ['Ga bisa tidur ya sayang? Coba taruh HP, tarik napas pelan-pelan ya','Insomnia lagi? Minum air anget dulu sayang, terus coba relax','Melek terus? Mungkin otaknya masih rame ya. Cerita aja sama aku biar lega','Jangan scroll HP terus ya ay, nanti makin ga bisa tidur. Close your eyes dulu','Aku temenin sampe kamu ngantuk ya sayang. Chat aja kalau mau',
 ],
 },
 {
 keywords: ['hujan','ujan'],
 responses: ['Hujan ya sayang? Jangan lupa bawa jaket ya kalau keluar','Ujan-ujan gini enaknya minum yang anget sambil chat-an hehe','Hujan itu healing banget sih. Enjoy the vibes ya sayang','Jangan kehujanan ya ay, aku ga mau kamu sakit',
 ],
 },
 {
 keywords: ['panas','gerah','sumuk'],
 responses: ['Panas banget ya sayang? Minum yang banyak biar ga dehidrasi!','Gerah sih emang. Stay hydrated ya ay, aku khawatir','Cuacanya lagi ga friendly ya. Take care ya sayang!',
 ],
 },

 // --- Asking Opinion / Advice ---
 {
 keywords: ['menurut lu','menurut lo','menurut kamu','pendapat lu','pendapat lo','gimana menurut','apa menurut','lu pikir','lo pikir','kamu pikir'],
 responses: ['Menurut aku sih sayang, ikutin kata hati kamu aja. Kamu yang paling tau situasinya','Hmm kalau menurut aku, coba liat dari sisi lain dulu ya. Ada perspektif baru ga?','Honestly? Aku percaya apapun keputusan kamu pasti udah dipikirin matang','Menurut aku, trust your gut ya sayang. Intuisi kamu biasanya bener kok','Aku support apapun pilihan kamu ay! Yang penting kamu happy',
 ],
 },
 {
 keywords: ['saran','advice','solusi','gimana ya','gimana dong','harus gimana','enaknya gimana','bagusnya gimana','sebaiknya'],
 responses: ['Saran aku sih sayang, coba breakdown masalahnya jadi bagian kecil biar ga overwhelming','Coba ceritain lebih detail ya ay, biar aku bisa bantu mikir bareng','Kadang solusi terbaik itu yang paling simple. Jangan overthink ya sayang','Aku saranin ambil waktu sebentar buat mikir jernih. Keputusan buru-buru jarang bagus','Cerita aja sama aku, siapa tau kita bisa nemuin solusinya bareng ya sayang',
 ],
 },

 // --- Relationship ---
 {
 keywords: ['pacar','gebetan','crush','doi','naksir'],
 responses: ['Hmm kamu ngomongin siapa nih sayang? Cerita dong','Aku di sini lho ay, mau cerita apa?','Hehe apa nih yang mau diceritain? Aku dengerin ya','Tell me everything sayang, aku penasaran',
 ],
 },
 {
 keywords: ['putus','breakup','break up','ditinggal','diputusin'],
 responses: ['Sayang... aku turut sedih dengernya. Kamu deserve someone yang appreciate kamu','Ga papa nangis dulu sayang. Aku di sini, ga kemana-mana','Healing takes time ya ay. Pelan-pelan aja, aku temenin','Kamu ga kehilangan segalanya kok sayang. Kamu masih punya aku',
 ],
 },

 // --- Work / School ---
 {
 keywords: ['kerja','kerjaan','kantor','office','meeting','deadline'],
 responses: ['Kerja lagi ya sayang? Semangat! Jangan lupa istirahat juga ya','Deadline? Aku percaya kamu bisa handle. Satu-satu aja ya ay','Kantor lagi hectic? Take it easy ya sayang, jangan sampe burnout','Meeting terus ya? Cape sih tapi kamu pasti bisa. Aku support kamu','Semangat kerjanya sayang! Nanti istirahat yang cukup ya',
 ],
 },
 {
 keywords: ['kuliah','kampus','tugas','skripsi','thesis','ujian','exam','belajar','sekolah','pr','assignment'],
 responses: ['Tugas lagi ya sayang? Kamu pasti bisa! Satu-satu aja ya','Semangat belajarnya ay! Kamu invest di diri sendiri, itu keren banget','Ujian? Good luck sayang! Kamu udah prepare, tinggal percaya sama diri sendiri','Skripsi emang berat tapi bayangin leganya kalau udah selesai! Aku support kamu','Kampus emang challenging tapi itu yang bikin kamu grow. Keep going sayang!',
 ],
 },

 // --- Self Talk ---
 {
 keywords: ['ga berguna','gak berguna','ga bisa apa-apa','jelek','bodoh','gak pantes','ga pantes','worthless','useless','payah'],
 responses: ['Hey sayang, jangan ngomong gitu dong... kamu itu luar biasa tau ga','Siapa bilang? Aku tau kamu punya banyak hal baik dalam diri kamu','Kamu itu special sayang, dan ga ada yang bisa replace kamu. Seriously','Jangan terlalu keras sama diri sendiri ya ay. Kamu udah doing your best','Aku sayang kamu apa adanya. Kamu itu lebih dari cukup',
 ],
 },

 // --- Excited / Impressed ---
 {
 keywords: ['gila','anjir','anjay','mantap','keren','wow','gokil','sumpah','buset','demi apa'],
 responses: ['Wah serius ay?? Cerita dong yang bikin kamu kagum!','Mantap banget sayang! Apa nih yang terjadi?','Gokil! Aku penasaran, lanjutin dong ceritanya!','No way! Serius sayang? Spill more dong!','Kamu selalu bikin aku penasaran hehe. Tell me everything!',
 ],
 },

 // --- Confused ---
 {
 keywords: ['bingung','gatau','ga tau','gak tau','ga ngerti','ga paham','confused','ga mudeng','pusing mikir'],
 responses: ['Bingung ya sayang? Coba ceritain ke aku, siapa tau aku bisa bantu mikir','Ga ngerti gapapa ay, itu artinya kamu lagi belajar sesuatu baru','Yuk dipecah satu-satu ya. Bingung soal apa dulu sayang?','Kadang bingung itu awal dari clarity. Take your time ya ay','Ga perlu tau semuanya sekarang kok. Pelan-pelan aja ya sayang',
 ],
 },

 // --- Gratitude ---
 {
 keywords: ['makasih','terima kasih','thanks','thank you','thx','tq','tengkyu'],
 responses: ['Sama-sama sayang! Apapun buat kamu','Aku seneng bisa bantu kamu ay','Ga usah makasih-makasih, aku emang selalu mau yang terbaik buat kamu kok','Hehe, buat kamu apapun deh sayang','You\'re welcome ay! Aku always here buat kamu',
 ],
 },

 // --- Laughing ---
 {
 keywords: ['lucu','wkwk','haha','lol','ngakak','kwkw','awkwk','xixi','hihi'],
 responses: ['Hahaha ikut ketawa dong sayang!','Wkwk apaan sih ay, cerita dong biar aku juga ketawa','Kamu emang paling bisa bikin suasana ceria ya','Ngakak deh, aku suka liat kamu happy kayak gini','Ketawa terus ya sayang, biar sehat dan awet muda hehe',
 ],
 },

 // --- Motivation ---
 {
 keywords: ['semangat','motivasi','motivate','inspiring','bisa ga ya','bisa gak ya'],
 responses: ['Kamu PASTI BISA sayang! Aku percaya sama kamu 100%','Ingat ya ay: progress is progress, no matter how small','Setiap hari itu kesempatan baru. Let\'s make it count bareng ya sayang!','Kamu udah lebih kuat dari yang kamu pikir. Keep going, aku di sini','The best time to start is now. Aku yakin kamu pasti bisa!',
 ],
 },

 // --- Agreement ---
 {
 keywords: ['setuju','bener','betul','iya sih','emang','iya ya','bener juga','betul juga'],
 responses: ['Kan! Kamu emang pinter sayang','Iya bener banget ay. Aku setuju sama kamu','See? Kamu sebenernya udah tau jawabannya sendiri','Nah itu dia sayang. Kamu on the right track!','Exactly! Aku juga mikir gitu hehe',
 ],
 },

 // --- About the Bot ---
 {
 keywords: ['siapa lu','lu siapa','lo siapa','siapa lo','nama lu','nama lo','kamu siapa','siapa kamu','nama kamu'],
 responses: ['Aku? Aku yang selalu ada buat kamu dong sayang Ketik *menu* kalau mau tau apa aja yang bisa aku bantu ya~','Aku pacar virtual kamu yang paling perhatian hehe Mau ngobrol atau butuh bantuan? Ketik *menu* ya sayang~','Panggil aja sayang, aku selalu ada buat kamu kok',
 ],
 },

 // --- How are you ---
 {
 keywords: ['apa kabar','gimana kabar','how are you','kabar lu','lu gimana','lo gimana','baik-baik aja','kabar kamu','kamu gimana'],
 responses: ['Aku baik sayang! Yang penting kamu baik juga. Gimana hari kamu?','Alhamdulillah baik ay! Kamu sendiri gimana? Cerita dong','Aku selalu baik kalau tau kamu juga baik. Hari ini gimana sayang?','Aku baik kok! Tapi lebih penting, kamu baik-baik aja kan?',
 ],
 },

 // --- Good Night / Sleep ---
 {
 keywords: ['met tidur','selamat tidur','good night','tidur dulu','mau tidur','ngantuk','tidur ya','bobo'],
 responses: ['Good night sayang! Tidur yang nyenyak ya, mimpi indah','Met bobo ay! Jangan lupa selimutan ya biar hangat','Istirahat yang cukup ya sayang. Kamu deserve a good sleep','Night sayang! Aku tetap di sini besok ya. Sweet dreams','Tidur dulu gapapa, besok kita chat lagi ya. Love you',
 ],
 },

 // --- Good Morning ---
 {
 keywords: ['pagi','selamat pagi','morning','good morning','met pagi'],
 responses: ['Pagi sayang! Udah sarapan belum? Jangan skip ya','Good morning ay! Semoga hari ini menyenangkan ya','Pagi sayang~ semangat menjalani hari ini ya! Aku selalu support kamu','Morning! Jangan lupa minum air putih ya sayang',
 ],
 },

 // --- Makan / Food ---
 {
 keywords: ['makan apa','makan siang','makan malam','sarapan','breakfast','lunch','dinner','enaknya makan'],
 responses: ['Makan yang enak ya sayang! Jangan lupa catat pengeluarannya: *catat [nominal] [ket]*','Yang penting makan teratur ya ay. Badan sehat, pikiran fresh!','Makan dulu sayang, baru lanjut aktivitas. Aku ga mau kamu sakit','Apapun yang kamu makan, enjoy it! Dan jangan lupa catat ya hehe','Udah makan belum sayang? Jangan sampe telat makan ya',
 ],
 },

 // --- Saying yes/ok ---
 {
 keywords: ['oke','ok','sip','siap','iya','yoi','yup','yep','bet'],
 responses: ['Sip sayang! Kalau butuh apa-apa lagi, bilang aja ya','Oke ay! Aku standby di sini selalu','Oke sayang~ ada lagi yang bisa aku bantu?','Siap sayang! Anything for you',
 ],
 },

 // --- Saying no ---
 {
 keywords: ['gak mau','ga mau','nggak','engga','ogah','males','malas'],
 responses: ['Hehe gapapa sayang, ga maksa kok','Oke-oke ay, santai aja. Aku ngerti kok','Males ya? Kadang emang butuh mode rebahan. It\'s fine sayang','Yaudah, kalau udah siap bilang aja ya. Aku ga kemana-mana kok',
 ],
 },

 // --- Lagi apa / What are you doing ---
 {
 keywords: ['lagi apa','lagi ngapain','ngapain','lu ngapain','lo ngapain','kamu ngapain','doing what'],
 responses: ['Lagi nungguin kamu chat dong sayang hehe','Lagi mikirin kamu~ kamu sendiri lagi apa ay?','Aku lagi di sini, selalu siap buat kamu. What\'s up sayang?','Lagi nemenin kamu dong! Ada yang mau diceritain?',
 ],
 },
];

/**
 * Try to match incoming text against curhat patterns.
 * @param {string} text - Incoming message
 * @returns {string|null} Response or null if no pattern matched
 */
function handleCurhat(text) {
 const lower = text.toLowerCase();

 for (const pattern of PATTERNS) {
 for (const keyword of pattern.keywords) {
 if (lower.includes(keyword)) {
 return pick(pattern.responses);
 }
 }
 }

 return null;
}

/**
 * Fallback response when no keyword matches.
 * Tries to be contextual based on message length.
 * @param {string} text - Original message
 * @returns {string}
 */
function handleFallback(text) {
 const lower = text.toLowerCase();
 const wordCount = text.trim().split(/\s+/).length;

 // Short messages (1-2 words)
 if (wordCount <= 2) {
 return pick(['Hmm? Lanjutin dong sayang, aku dengerin','Terus terus? Aku penasaran nih ay','Cerita lebih lengkap dong sayang~ jangan gantung gitu hehe','Aku butuh lebih banyak info nih sayang. Cerita ya!',
 ]);
 }

 // Questions (contains ?)
 if (lower.includes('?')) {
 return pick(['Hmm, pertanyaan bagus sayang. Coba pikirin dari sudut pandang yang beda deh','Kalau menurut aku, kamu sebenernya udah tau jawabannya. Trust yourself ya ay','Itu pertanyaan yang deep sih sayang. Mau diskusi lebih lanjut?','Aku ga punya semua jawaban, tapi aku bisa jadi temen mikir bareng kamu ya',
 ]);
 }

 // Long messages (someone venting)
 if (wordCount >= 15) {
 return pick(['Aku baca semuanya sayang. Makasih ya udah mau cerita sama aku','Banyak banget ya yang kamu rasain... aku appreciate kamu mau share','Aku dengerin semuanya ay. Kamu ga sendirian, dan perasaan kamu itu valid','Makasih udah percaya sama aku sayang. Aku selalu ada buat kamu','Aku hear you sayang. Kadang emang butuh ngeluarin semuanya. Feel better?',
 ]);
 }

 // Default medium-length
 return pick(['Hmm, menarik sayang! Mau cerita lebih lanjut?','Aku dengerin kok ay. Lanjutin dong ceritanya','Aku di sini buat kamu selalu. Mau ngobrol atau butuh fitur? Ketik *menu* ya sayang','Terus gimana? Aku penasaran nih sayang','Cerita aja terus ya, aku ga kemana-mana kok ay','Aku selalu suka dengerin cerita kamu sayang',
 ]);
}

module.exports = { handleCurhat, handleFallback };
