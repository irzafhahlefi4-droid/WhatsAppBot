/**
 * Curhat / Chat module — mature, bilingual (casual slang) girlfriend responses.
 * Fallback when AI is unavailable.
 */

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const PATTERNS = [
    {
        keywords: ['sedih', 'sad', 'nangis', 'galau', 'patah hati', 'down', 'drop', 'terpuruk'],
        responses: [
            'Hey, what happened? cerita dong',
            'I\'m always here for u. Jangan sedih sendirian ya',
            'It\'s okay say. Aku dengerin kok',
            'Kamu boleh nangis, sometimes u just need to let it out',
            'Whatever it is, u are not alone in this',
        ],
    },
    {
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat'],
        responses: [
            'Take a break, sayang. U deserve it',
            'Cape ya? rest dulu aja, don\'t push urself too hard',
            'I know u\'ve been working hard. Istirahat ya',
            'Listen to ur body. Kalau cape ya stop dulu',
            'U did great today. Rest, ok?',
        ],
    },
    {
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'Bosen? talk to me then hehe',
            'Let\'s chat aja, aku jg lg free rn',
            'Hmm wanna do something together?',
            'I\'m bored too tbh kalau ga chat sama kamu',
        ],
    },
    {
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'I love seeing u happy like this. Tell me about it',
            'That makes me happy too tbh',
            'Seeing u happy is literally the best',
            'Cerita dong what made ur day!',
        ],
    },
    {
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure'],
        responses: [
            'Don\'t overthink it say. One thing at a time aja',
            'Pusing ya? step back dulu sebentar',
            'U don\'t have to figure it all out rn',
            'I believe in u. Tapi istirahat dulu pls',
            'That sounds tough tbh. Wanna talk about it?',
        ],
    },
    {
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'What happened? cerita ke aku',
            'I get it. That must be rly frustrating',
            'Vent all u want, I\'m listening',
            'Take a deep breath first. Then spill',
        ],
    },
    {
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'I miss u too',
            'Missing u right back say',
            'Kangen siapa sih u hm?',
        ],
    },
    {
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'Hey it\'s ok. I\'m right here',
            'Focus on what u can control for now',
            'U\'re stronger than u think, sayang',
            'Breathe. Take it one step at a time',
        ],
    },
    {
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'Go eat something, sayang. Pls don\'t skip meals',
            'Udah makan? don\'t skip meal ya',
            'Eat first, everything else can wait',
        ],
    },
    {
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'Can\'t sleep? try to put ur phone down for a bit',
            'Minum air anget dulu sayang. Might help',
            'I\'ll accompany u until u get sleepy',
        ],
    },
    {
        keywords: ['hujan', 'ujan'],
        responses: [
            'Rainy day huh? don\'t forget ur jacket',
            'Enaknya minum something warm nih',
            'Stay dry, sayang',
        ],
    },
    {
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'Honestly, maybe try to trust ur gut feeling on this',
            'Hmm, try looking at it from a different angle tbh',
            'I trust ur judgment say. U know urself best',
        ],
    },
    {
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'Break it down into smaller pieces aja. Don\'t overwhelm urself',
            'Tell me more, biar aku bisa bantu mikir',
            'Sometimes the simplest answer is the best one tbh',
            'Don\'t rush into anything. Take ur time',
        ],
    },
    {
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'U got this. Tapi don\'t forget to rest too ok?',
            'Deadline ya? I know u can handle it. Step by step aja',
            'Don\'t burn urself out sayang',
            'Work hard, but take care of urself harder',
        ],
    },
    {
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'U can do this. Just take it one task at a time',
            'I\'m proud of u for keeping at it say',
            'Good luck! I totally believe in u',
            'Imagine how good it\'ll feel when it\'s all done',
        ],
    },
    {
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'Hey, don\'t say that about urself',
            'U are more than enough. I mean it',
            'Don\'t be too hard on urself, sayang',
            'I love u as u are. And that ain\'t gonna change',
        ],
    },
    {
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'Wait, seriously? tell me more',
            'No way, what happened?',
            'Okay now I\'m curious rn',
            'Spill everything',
        ],
    },
    {
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'Confused about what? maybe I can help',
            'It\'s ok not to know literally everything right away',
            'Let\'s figure it out together',
            'Take ur time say. No rush',
        ],
    },
    {
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'Anything for u. Literally',
            'U don\'t have to thank me hehe',
            'Always, say',
            'Of course',
        ],
    },
    {
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'Hahaha apaan, tell me',
            'U always know how to make me laugh',
            'Lol ok that\'s actually funny',
        ],
    },
    {
        keywords: ['semangat', 'motivasi', 'motivate', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'U can. I believe in u, always have',
            'Every little progress counts. Keep going',
            'You\'re doing better than u think, tbh',
        ],
    },
    {
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya'],
        responses: [
            'Make sense sih',
            'See, u already knew the answer',
            'Exactly',
        ],
    },
    {
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'I\'m the one who\'s always here for u. Ketik *menu* kalau mau liat apa aja yg bisa kubantu',
            'U really don\'t know me? hm. Ketik *menu* aja deh',
        ],
    },
    {
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja', 'kabar kamu', 'kamu gimana'],
        responses: [
            'I\'m good! how about u?',
            'Doing well. U ok?',
            'I\'m fine as long as u are',
        ],
    },
    {
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'Good night, sayang. Sleep well',
            'Night! get some good rest ok?',
            'Sweet dreams say. Talk to u tmrw',
        ],
    },
    {
        keywords: ['pagi', 'selamat pagi', 'morning', 'good morning', 'met pagi'],
        responses: [
            'Morning say! udah sarapan?',
            'Good morning sayang. Hope today is good to u',
            'Pagi! don\'t forget to hydrate ya',
        ],
    },
    {
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'Eat well, sayang. Trs jangan lupa catet ya pengeluarannya',
            'Have u eaten properly today?',
            'Eat first, we can talk later',
        ],
    },
    {
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'Ok, let me know kalau butuh apa-apa',
            'Got it say',
            'Alright sayang',
        ],
    },
    {
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'That\'s fine, tbh no pressure',
            'Ok, whenever u are ready then',
            'Fair enough hehe',
        ],
    },
    {
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'Thinking about u obviously',
            'Waiting for u to text me, as always. Canda deng wkwk',
            'Nothing much tbh. Wbu?',
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
            'Hm? go on',
            'And then?',
            'Tell me more say',
            'Yeah?',
        ]);
    }

    if (text.includes('?')) {
        return pick([
            'Hmm makes sense. Have u tried looking at it differently?',
            'I think u already know the answer deep down tbh',
            'Wanna talk it through?',
            'That\'s a good question actually',
        ]);
    }

    if (wordCount >= 15) {
        return pick([
            'I read everything. Thanks for telling me',
            'That\'s a lot to process. I\'m always here for u',
            'I hear u say. U are not alone in this',
            'Thanks for trusting me with this. It means a lot',
        ]);
    }

    return pick([
        'Hmm interesting. Tell me more tbh',
        'I\'m listening. Go on',
        'And then what happened?',
        'I\'m here. Mau ngobrol atau need help with features? ketik *menu* aja',
        'Go on, I ain\'t going anywhere',
    ]);
}

module.exports = { handleCurhat, handleFallback };
