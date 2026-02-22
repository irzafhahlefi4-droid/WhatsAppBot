/**
 * Curhat / Chat module — casual Gen Z Indonesian friend responses.
 * Detects conversational keywords and responds naturally.
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
        keywords: ['sedih', 'sad', 'nangis', 'galau', 'patah hati', 'down', 'drop', 'terpuruk'],
        responses: [
            'Eh, kamu gapapa? Cerita aja sini, gue dengerin.',
            'Sedih boleh kok, tapi jangan lama-lama ya. Lu kuat, gue tau itu.',
            'It\'s okay to not be okay. Kadang emang butuh nangis dulu baru lega.',
            'Gue di sini buat lu. Mau cerita apa? No judgment.',
            'Peluk virtual dulu ya. Apapun yang terjadi, lu ga sendirian.',
        ],
    },
    {
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat'],
        responses: [
            'Istirahat dulu gak sih? Lu udah kerja keras banget hari ini.',
            'Cape ya? Take a break, minum dulu. Lu deserve it.',
            'Jangan dipaksain terus ya. Rest itu bukan kelemahan, itu self-care.',
            'Gue salut sama lu yang tetep jalan walau cape. Tapi istirahat juga penting!',
            'Tarik napas dulu... tahan... buang. Feel better? Sedikit aja gapapa.',
        ],
    },
    {
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'Gabut ya? Coba dengerin musik atau scroll meme deh, pasti mood naik.',
            'Bosen? Yuk coba sesuatu yang baru. Masak? Gambar? Atau jalan-jalan aja.',
            'Gabut tuh tandanya lu butuh adventure baru. Let\'s go!',
            'Mau main tebak-tebakan? Atau mending coba todo baru aja, biar produktif hehe.',
            'Bosen itu normal kok. Tapi jangan lupa, lu punya banyak hal seru yang bisa dilakuin.',
        ],
    },
    {
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'LET\'S GOOO! Seneng denger lu happy!',
            'Wah vibes-nya positif banget hari ini! Keep it up!',
            'Ikut seneng gue! Apa nih yang bikin happy?',
            'Good vibes only! Semoga happy-nya awet ya.',
            'Senyum lu itu menular tau ga. Love to see it!',
        ],
    },
    {
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure'],
        responses: [
            'Stres ya? Ambil jeda dulu, dunia ga akan runtuh kok kalo lu istirahat bentar.',
            'Pusing? Coba tulis semua yang bikin stres, kadang nulis itu terapi juga.',
            'Lu ga harus handle semuanya sendirian. It\'s okay to ask for help.',
            'One step at a time ya. Ga perlu buru-buru, yang penting konsisten.',
            'Gue paham pressure-nya berat. Tapi lu udah survive sampai sini, dan itu keren.',
        ],
    },
    {
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'Kesel ya? Wajar kok. Mau cerita kenapa?',
            'Bete emang paling nyebelin. Tapi jangan sampe bikin lu sakit ya.',
            'Gue ngerti perasaan lu. Kadang orang emang bikin emosi.',
            'Take a deep breath. Lu boleh marah, tapi jangan sampe nyakitin diri sendiri.',
            'Bete itu valid. Mau vent? Sini, gue dengerin tanpa judge.',
        ],
    },
    {
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'Kangen siapa nih? Udah coba hubungin belum?',
            'Rindu itu tanda lu punya seseorang yang berarti. Itu hal yang indah.',
            'Kangen emang nyesek ya. Tapi percaya aja, kalo jodoh pasti ketemu lagi.',
            'Miss someone? Sometimes the best thing is just to reach out.',
            'Kangen itu bukti lu punya hati yang baik. Jangan ditahan, rasain aja.',
        ],
    },
    {
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'Takut itu wajar. Tapi jangan sampe fear itu ngehambat lu ya.',
            'Cemas? Coba fokus ke hal yang bisa lu kontrol aja dulu.',
            'Breathe in... breathe out. Lu aman kok. Gue di sini.',
            'Anxiety emang berat, tapi lu lebih kuat dari yang lu pikir.',
            'Satu langkah aja dulu. Ga perlu mikirin semuanya sekaligus.',
        ],
    },

    // --- Daily Life ---
    {
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'Laper? Makan dulu dong! Jangan lupa catat pengeluarannya pake: catat [nominal] [ket]',
            'Perut kosong, mood ancur. Makan dulu baru lanjut!',
            'Lu udah makan belum hari ini? Jangan skip meal ya.',
            'Yuk makan! Terus jangan lupa catat biar tau pengeluarannya hehe.',
            'Makan dulu, masalah nanti. Priorities!',
        ],
    },
    {
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'Ga bisa tidur? Coba taruh HP, tarik napas pelan-pelan, dan pikirin hal yang bikin tenang.',
            'Insomnia ya? Minum air anget, terus coba relax. Lu butuh rest.',
            'Melek terus? Mungkin otak lu masih rame. Coba tulis apa yang dipikirin.',
            'Jangan scroll HP terus ya, nanti makin ga bisa tidur. Close your eyes dulu.',
            'Gue temenin sampe ngantuk deh. Cerita aja kalo mau.',
        ],
    },
    {
        keywords: ['hujan', 'ujan'],
        responses: [
            'Hujan ya? Vibes-nya enak banget buat rebahan sambil dengerin lo-fi.',
            'Ujan-ujan gini enaknya minum yang anget. Stay cozy!',
            'Hujan itu healing banget sih. Enjoy the sound.',
            'Jangan lupa bawa payung ya kalo mau keluar!',
        ],
    },
    {
        keywords: ['panas', 'gerah', 'sumuk'],
        responses: [
            'Panas banget ya? Minum yang banyak biar ga dehidrasi!',
            'Gerah sih emang. AC atau kipas angin bisa jadi bestfriend sekarang.',
            'Cuaca lagi ga friendly emang. Take care ya!',
        ],
    },

    // --- Asking Opinion / Advice ---
    {
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'Menurut gue sih, ikutin kata hati lu aja. Lu yang paling tau situasinya.',
            'Hmm kalo menurut gue, coba liat dari sisi lain dulu. Ada perspektif baru ga?',
            'Honestly? Gue percaya apapun keputusan lu pasti udah dipikirin matang.',
            'Menurut gue, trust your gut. Intuisi lu biasanya bener kok.',
            'Gue ga bisa decide buat lu, tapi gue support apapun pilihan lu!',
        ],
    },
    {
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'Saran gue sih, coba breakdown masalahnya jadi bagian kecil. Biar ga overwhelming.',
            'Coba deh ceritain lebih detail, biar gue bisa kasih perspektif yang lebih pas.',
            'Kadang solusi terbaik itu yang paling simple. Don\'t overthink it.',
            'Gue saranin ambil waktu sebentar buat mikir jernih. Keputusan buru-buru jarang bagus.',
            'Talk to someone you trust about this. Sometimes outside perspective helps banget.',
        ],
    },

    // --- Relationship ---
    {
        keywords: ['pacar', 'gebetan', 'crush', 'doi', 'naksir'],
        responses: [
            'Wah ada yang lagi kasmaran nih! Cerita dong gimana?',
            'Pacar/gebetan ya? Spill the tea dong!',
            'Ciee yang lagi ngomongin doi. Semangat ya!',
            'Relationship emang seru sekaligus challenging. What\'s up?',
            'Gue all ears nih. Mau cerita soal doi?',
        ],
    },
    {
        keywords: ['putus', 'breakup', 'break up', 'ditinggal', 'diputusin'],
        responses: [
            'Putus emang sakit. Tapi percaya deh, waktu bakal heal everything.',
            'Sorry to hear that. Lu deserve someone better, dan itu pasti dateng.',
            'Healing takes time. Ga perlu buru-buru move on, rasain dulu perasaannya.',
            'Lu ga kehilangan segalanya kok. Lu masih punya lu, dan itu udah cukup.',
            'It\'s their loss. Lu amazing, dan someday someone will see that.',
        ],
    },
    {
        keywords: ['pdkt', 'pendekatan', 'jadian', 'nembak', 'confess'],
        responses: [
            'Go for it! Mending nyesel karena udah coba daripada ga pernah tau.',
            'PDKT itu seni sih. Be yourself aja, yang genuine itu paling menarik.',
            'Shoot your shot! Worst case dapet jawaban, best case dapet pacar.',
            'Jadian? Semoga lancar ya! Gue doain yang terbaik buat lu.',
            'Be confident tapi jangan maksa. Kalo emang jodoh, pasti nyambung kok.',
        ],
    },

    // --- Work / School ---
    {
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'Kerja lagi ya? Semangat! Jangan lupa istirahat juga.',
            'Deadline? Gue percaya lu bisa handle. One task at a time.',
            'Kantor lagi hectic? Take it easy, don\'t burn yourself out.',
            'Meeting mulu ya? Capek sih tapi lu pasti bisa through this.',
            'Work hard tapi jangan lupa play hard juga ya!',
        ],
    },
    {
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'Tugas lagi ya? Lu pasti bisa! Break it down, satu-satu aja.',
            'Skripsi/tugas emang stressful, tapi bayangin leganya kalo udah selesai!',
            'Semangat belajarnya! Lu invest di diri sendiri, itu keren banget.',
            'Ujian? Good luck! Lu udah prepare, tinggal percaya sama diri sendiri.',
            'Kampus emang challenging tapi itu yang bikin lu grow. Keep going!',
        ],
    },

    // --- Self Talk ---
    {
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'Hey, jangan gitu dong. Lu lebih berharga dari yang lu pikir.',
            'Siapa bilang? Gue tau lu punya banyak hal baik dalam diri lu.',
            'The fact that you\'re here, trying — itu udah proof lu kuat.',
            'Jangan terlalu keras sama diri sendiri. Lu udah doing your best.',
            'Lu itu special, dan ga ada yang bisa replace lu. Seriously.',
        ],
    },

    // --- Excited / Impressed ---
    {
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'WKWK apaan sih, cerita dong yang bikin lu kagum!',
            'Mantap banget! What happened?',
            'Gokil! Gue penasaran, lanjutin dong!',
            'No way! Serius? Spill more!',
            'Lu selalu bikin gue penasaran. Tell me everything!',
        ],
    },

    // --- Confused ---
    {
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'Bingung? Coba ceritain ke gue, siapa tau gue bisa bantu mikir.',
            'Ga ngerti gapapa, itu artinya lu lagi belajar sesuatu baru.',
            'Kadang bingung itu awal dari clarity. Take your time.',
            'Yuk dipecah satu-satu. Bingung soal apa dulu?',
            'It\'s okay to not have all the answers. Lu ga harus tau semuanya sekarang.',
        ],
    },

    // --- Gratitude ---
    {
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'Sama-sama! Seneng bisa bantu lu.',
            'No worries! Gue always here buat lu.',
            'Anytime! Lu juga udah keren hari ini.',
            'You\'re welcome! Jangan sungkan ya.',
            'Hehe, itu gunanya temen. Kapan aja butuh, gue di sini.',
        ],
    },

    // --- Laughing ---
    {
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'WKWKWK ikut ketawa dong!',
            'Hahaha apaan sih, share dong biar gue ikut ngakak.',
            'Lu emang paling bisa bikin suasana rame ya.',
            'LMAO gue bisa bayangin.',
            'Ngakak-ngakak aja terus, biar sehat!',
        ],
    },

    // --- Motivation ---
    {
        keywords: ['semangat', 'motivasi', 'motivate', 'inspiring', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'LU BISA! Gue percaya sama lu 100%.',
            'Remember: progress is progress, no matter how small.',
            'Setiap hari itu kesempatan baru. Let\'s make it count!',
            'Lu udah lebih kuat dari yang lu pikir. Keep going!',
            'The best time to start is now. Lu pasti bisa!',
        ],
    },

    // --- Agreement ---
    {
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya',
            'bener juga', 'betul juga'],
        responses: [
            'Kan! Great minds think alike.',
            'Iya bener banget. Lu emang pinter.',
            'See? Lu tau jawabannya sendiri sebenernya.',
            'Exactly! Gue juga mikir gitu.',
            'Nah itu dia. Lu on the right track.',
        ],
    },

    // --- About the Bot ---
    {
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'Gue bot assistant lu! Bisa bantu catat todo, pengeluaran, dan temen curhat juga.',
            'Nama gue? Panggil aja Assistant. Gue di sini buat bantu lu sehari-hari.',
            'Gue temen digital lu. Bisa diajak ngobrol, bisa juga bantu productivity. Ketik "menu" buat detail.',
            'I\'m your daily assistant bot! Multitalent — bisa catat, bisa curhat, bisa ngobrol.',
        ],
    },

    // --- How are you ---
    {
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja'],
        responses: [
            'Gue baik! Yang penting lu baik juga. Gimana hari lu?',
            'Alhamdulillah baik! Lu sendiri gimana? Cerita dong.',
            'Gue selalu ready buat lu! Gimana kabar lu hari ini?',
            'I\'m good! More importantly, how are YOU? Lagi seneng atau lagi banyak pikiran?',
        ],
    },

    // --- Good Night / Sleep ---
    {
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'Good night! Tidur yang nyenyak ya. Besok hari baru lagi.',
            'Met bobo! Semoga mimpi indah. See you tomorrow!',
            'Istirahat yang cukup ya. Lu deserve a good sleep.',
            'Night! Jangan lupa charge HP dan charge diri lu juga. Rest well!',
            'Tidur dulu gapapa, gue masih di sini besok. Good night!',
        ],
    },

    // --- Makan / Food ---
    {
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'Makan yang enak ya! Jangan lupa catat pengeluarannya: catat [nominal] [ket]',
            'Gue sih team nasi padang. Lu mau makan apa?',
            'Yang penting makan teratur ya. Badan sehat, pikiran fresh!',
            'Makan dulu baru mikir. Empty stomach = bad decisions hehe.',
            'Apapun yang lu makan, enjoy it! Dan jangan lupa catat ya.',
        ],
    },

    // --- Saying yes/ok ---
    {
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'Sip! Kalo butuh apa-apa lagi, bilang aja.',
            'Oke noted! Gue standby di sini.',
            'Roger that! Ada lagi yang bisa gue bantu?',
            'Mantap! Lanjutkan.',
            'Siap bos! Anything else?',
        ],
    },

    // --- Saying no ---
    {
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'Haha gapapa, no pressure! Lu yang atur.',
            'Oke-oke, ga maksa kok. Santai aja.',
            'Males ya? Kadang emang butuh mode rebahan. It\'s fine.',
            'Yaudah, another time aja. Gue ga kemana-mana kok.',
        ],
    },

    // --- Lagi apa / What are you doing ---
    {
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'Lagi nunggu lu chat gue dong, hehe. Lu sendiri lagi apa?',
            'Lagi standby buat lu! Mau ngobrol atau butuh bantuan?',
            'Gue lagi di sini, siap bantu kapanpun. What\'s up?',
            'Nothing much, just waiting for you! Ada yang mau diceritain?',
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
        return pick([
            'Hmm? Lanjutin dong, gue dengerin.',
            'Terus terus? Gue curious nih.',
            'Tell me more! Jangan gantung gitu dong.',
            'Gue butuh lebih banyak info nih. Cerita lebih lengkap dong!',
        ]);
    }

    // Questions (contains ?)
    if (lower.includes('?')) {
        return pick([
            'Hmm, pertanyaan bagus. Coba pikirin dari sudut pandang yang beda deh.',
            'Kalo menurut gue, lu sebenernya udah tau jawabannya. Trust yourself.',
            'Itu pertanyaan yang deep sih. Mau diskusi lebih lanjut?',
            'Gue ga punya semua jawaban, tapi gue bisa jadi temen mikir bareng.',
            'Wah, bikin mikir nih. Coba elaborasi lebih, biar gue bisa kasih perspektif.',
        ]);
    }

    // Long messages (someone venting)
    if (wordCount >= 15) {
        return pick([
            'Gue dengerin semuanya. Lu udah brave banget mau cerita. Thank you.',
            'Wow, banyak banget ya yang lu rasain. Gue appreciate lu mau share.',
            'Gue baca semuanya. Lu ga sendirian, dan perasaan lu itu valid.',
            'Thanks for trusting me with this. Lu mau gue kasih perspektif atau lu cuma butuh didengerin?',
            'I hear you. Kadang emang butuh ngeluarin semuanya. Feel better?',
        ]);
    }

    // Default medium-length
    return pick([
        'Hmm, menarik! Mau cerita lebih lanjut?',
        'Gue dengerin kok. Lanjutin dong ceritanya.',
        'Gue di sini buat lu. Mau ngobrol atau butuh fitur? Ketik "menu" ya.',
        'Interesting. Tell me more about that.',
        'Keep talking, gue all ears. Atau ketik "menu" kalo butuh bantuan.',
        'Cerita aja terus, gue ga kemana-mana kok.',
    ]);
}

module.exports = { handleCurhat, handleFallback };
