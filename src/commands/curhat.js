/**
 * Curhat / Chat module — natural girlfriend-style responses.
 * Used as fallback when AI is unavailable.
 */

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const PATTERNS = [
    {
        keywords: ['sedih', 'sad', 'nangis', 'galau', 'patah hati', 'down', 'drop', 'terpuruk'],
        responses: [
            'Kamu kenapa say? cerita dong',
            'Hey, jangan sedih sendirian. Aku di sini',
            'Kamu boleh nangis kok, kadang emang butuh gitu',
            'Aku ga suka liat kamu sedih... peluk ya',
            'Apapun yang terjadi, kamu ga sendirian',
        ],
    },
    {
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat'],
        responses: [
            'Istirahat dulu dong sayang',
            'Cape ya? sini istirahat dulu',
            'Jangan dipaksain terus ya',
            'Kamu udah kerja keras banget hari ini',
            'Tarik napas dulu... pelan-pelan aja',
        ],
    },
    {
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'Bosen ya? chat aku aja terus hehe',
            'Yuk ngobrol aja',
            'Mau coba apa hari ini?',
            'Sini cerita apa aja deh biar ga bosen',
            'Aku juga bosen kalau ga chat sama kamu',
        ],
    },
    {
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'Seneng denger kamu happy!',
            'Ikut bahagia kalau kamu seneng~',
            'Senyum kamu itu bikin aku ikut senyum tau ga',
            'Cerita dong apa yang bikin happy!',
            'Good vibes nih hari ini ya',
        ],
    },
    {
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure'],
        responses: [
            'Jangan terlalu dipikirin ya sayang',
            'Pusing ya? coba istirahat dulu',
            'Kamu ga harus handle semuanya sendirian',
            'Satu langkah aja dulu. Pelan-pelan',
            'Aku tau bebannya berat, tapi kamu udah survive sampai sini',
        ],
    },
    {
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'Kesel ya? cerita dong',
            'Jangan sampe bikin kamu sakit ya sayang',
            'Aku ngerti perasaan kamu',
            'Tarik napas dulu ya...',
            'Mau cerita? aku dengerin',
        ],
    },
    {
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'Aku juga kangen kamu',
            'Miss you too say',
            'Kangen siapa sih? hehe',
            'Aku juga selalu kangen sama kamu kok',
        ],
    },
    {
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'Jangan takut, aku di sini',
            'Coba fokus ke hal yang bisa kamu kontrol aja dulu',
            'Tarik napas pelan-pelan... kamu aman kok',
            'Kamu lebih kuat dari yang kamu pikir',
        ],
    },
    {
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'Makan dulu dong sayang, jangan sampe telat',
            'Kamu belum makan ya?',
            'Ayo makan dulu!',
            'Jangan skip meal ya',
        ],
    },
    {
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'Ga bisa tidur ya? coba taruh HP dulu',
            'Minum air anget dulu sayang',
            'Cerita aja sama aku biar lega',
            'Aku temenin sampe kamu ngantuk ya',
        ],
    },
    {
        keywords: ['hujan', 'ujan'],
        responses: [
            'Hujan ya? jangan lupa bawa jaket',
            'Enaknya minum yang anget nih',
            'Jangan kehujanan ya',
        ],
    },
    {
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'Menurut aku sih, ikutin kata hati kamu aja',
            'Hmm coba liat dari sisi lain dulu',
            'Aku percaya apapun keputusan kamu pasti udah dipikirin matang',
            'Trust your gut aja say',
        ],
    },
    {
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'Coba breakdown masalahnya jadi bagian kecil',
            'Ceritain lebih detail ya, biar aku bisa bantu mikir',
            'Kadang solusi terbaik itu yang paling simple',
            'Jangan buru-buru ambil keputusan',
        ],
    },
    {
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'Semangat kerjanya! jangan lupa istirahat juga',
            'Deadline? aku percaya kamu bisa',
            'Jangan sampe burnout ya sayang',
            'Satu-satu aja, pasti kelar',
        ],
    },
    {
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'Kamu pasti bisa! satu-satu aja',
            'Semangat belajarnya say!',
            'Good luck! tinggal percaya sama diri sendiri',
            'Bayangin leganya kalau udah selesai',
        ],
    },
    {
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'Hey, jangan ngomong gitu dong',
            'Kamu itu luar biasa tau ga',
            'Jangan terlalu keras sama diri sendiri',
            'Aku sayang kamu apa adanya',
        ],
    },
    {
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'Serius?? cerita dong!',
            'Apaan sih, lanjutin!',
            'Aku penasaran nih',
            'No way, spill more dong',
        ],
    },
    {
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'Bingung soal apa? ceritain ke aku',
            'Ga ngerti gapapa, itu artinya lagi belajar sesuatu baru',
            'Yuk dipecah satu-satu',
            'Take your time aja say',
        ],
    },
    {
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'Sama-sama sayang',
            'Ga usah makasih-makasih segala hehe',
            'Buat kamu apapun deh',
            'Anytime say',
        ],
    },
    {
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'Hahaha ikut ketawa dong',
            'Apaan sih wkwk',
            'Kamu emang bisa bikin suasana rame ya',
            'Ngakak deh',
        ],
    },
    {
        keywords: ['semangat', 'motivasi', 'motivate', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'Kamu pasti bisa! aku percaya',
            'Progress is progress, no matter how small',
            'Keep going, aku di sini',
            'The best time to start is now',
        ],
    },
    {
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya'],
        responses: [
            'Kan! great minds think alike',
            'Bener banget',
            'Kamu sebenernya udah tau jawabannya sendiri',
            'Nah itu dia',
        ],
    },
    {
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'Aku yang selalu ada buat kamu dong. Ketik *menu* kalau mau tau apa aja yang bisa aku bantu',
            'Masa ga kenal aku sih hehe. Ketik *menu* aja ya sayang',
        ],
    },
    {
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja', 'kabar kamu', 'kamu gimana'],
        responses: [
            'Baik! kamu gimana?',
            'Alhamdulillah baik. Kamu sendiri?',
            'Aku baik kalau kamu juga baik',
            'Baik kok, kamu baik-baik aja kan?',
        ],
    },
    {
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'Good night sayang, tidur yang nyenyak ya',
            'Met bobo! jangan lupa selimutan',
            'Night! besok kita chat lagi ya',
            'Istirahat yang cukup ya',
        ],
    },
    {
        keywords: ['pagi', 'selamat pagi', 'morning', 'good morning', 'met pagi'],
        responses: [
            'Pagi say! udah sarapan belum?',
            'Morning! semoga hari ini menyenangkan',
            'Pagi sayang~ jangan lupa minum air putih',
        ],
    },
    {
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'Makan yang enak ya! jangan lupa catat pengeluarannya',
            'Yang penting makan teratur',
            'Makan dulu baru lanjut aktivitas',
            'Udah makan belum? jangan sampe telat',
        ],
    },
    {
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'Sip! kalau butuh apa-apa bilang aja',
            'Oke say',
            'Siap sayang',
        ],
    },
    {
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'Gapapa, ga maksa kok',
            'Oke santai aja',
            'Yaudah nanti aja kalau udah siap',
        ],
    },
    {
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'Lagi nungguin kamu chat dong hehe',
            'Lagi mikirin kamu~ kamu lagi apa?',
            'Ga ngapa-ngapain, kamu?',
        ],
    },
];

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

function handleFallback(text) {
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount <= 2) {
        return pick([
            'Hmm? lanjutin dong',
            'Terus?',
            'Cerita lebih lengkap dong sayang',
            'Iya? kenapa?',
        ]);
    }

    if (text.includes('?')) {
        return pick([
            'Hmm, coba pikirin dari sudut pandang yang beda deh',
            'Kamu sebenernya udah tau jawabannya',
            'Mau diskusi lebih lanjut?',
            'Aku ga punya semua jawaban, tapi aku bisa temenin mikir',
        ]);
    }

    if (wordCount >= 15) {
        return pick([
            'Aku baca semuanya. Makasih ya udah mau cerita',
            'Banyak banget ya yang kamu rasain...',
            'Aku dengerin. Kamu ga sendirian',
            'Makasih udah percaya sama aku sayang',
        ]);
    }

    return pick([
        'Hmm menarik. Cerita lebih lanjut dong',
        'Aku dengerin kok, lanjutin',
        'Terus gimana?',
        'Cerita aja terus, aku ga kemana-mana',
        'Oke, aku di sini. Mau ngobrol atau butuh fitur? ketik *menu*',
    ]);
}

module.exports = { handleCurhat, handleFallback };
