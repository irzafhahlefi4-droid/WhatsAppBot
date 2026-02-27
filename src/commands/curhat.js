/**
 * Curhat / Chat module — mature, bilingual girlfriend responses.
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
            'I\'m here for you. Jangan sedih sendirian ya',
            'It\'s okay to feel that way. Aku dengerin',
            'Kamu boleh nangis kok, sometimes you just need to let it out',
            'Whatever it is, you\'re not alone in this',
        ],
    },
    {
        keywords: ['capek', 'cape', 'lelah', 'tired', 'exhausted', 'penat'],
        responses: [
            'Take a break, sayang. You deserve it',
            'Cape ya? rest dulu, don\'t push yourself too hard',
            'I know you\'ve been working hard. Istirahat dulu ya',
            'Listen to your body. Kalau cape ya stop dulu',
            'You\'ve done enough for today. Rest, okay?',
        ],
    },
    {
        keywords: ['bosan', 'bosen', 'gabut', 'boring', 'suntuk'],
        responses: [
            'Bosen? talk to me then hehe',
            'Let\'s chat aja, aku juga lagi free',
            'Hmm try something new today?',
            'I\'m bored too kalau ga chat sama kamu',
        ],
    },
    {
        keywords: ['senang', 'happy', 'bahagia', 'seru', 'asik', 'yeay', 'yey', 'hore'],
        responses: [
            'I love seeing you happy. Tell me about it',
            'That makes me happy too, sayang',
            'Your happiness is contagious, you know that?',
            'Cerita dong what made your day!',
        ],
    },
    {
        keywords: ['stress', 'stres', 'pusing', 'overwhelm', 'overwork', 'pressure'],
        responses: [
            'Don\'t overthink it, say. One thing at a time',
            'Pusing ya? take a step back dulu',
            'You don\'t have to figure it all out today',
            'I believe in you. Tapi istirahat dulu ya',
            'That sounds tough. Wanna talk about it?',
        ],
    },
    {
        keywords: ['marah', 'kesel', 'bete', 'annoyed', 'emosi', 'sebel', 'jengkel'],
        responses: [
            'What happened? cerita aja',
            'I get it. That must be really frustrating',
            'Vent all you want, I\'m listening',
            'Take a deep breath first. Then tell me everything',
        ],
    },
    {
        keywords: ['kangen', 'rindu', 'miss', 'missing'],
        responses: [
            'I miss you too, always',
            'Missing you right back, say',
            'Kamu kangen siapa sih hm?',
        ],
    },
    {
        keywords: ['takut', 'khawatir', 'cemas', 'anxious', 'anxiety', 'worry', 'panik'],
        responses: [
            'Hey, it\'s okay. I\'m right here',
            'Focus on what you can control for now',
            'You\'re stronger than you think, sayang',
            'Breathe. Satu langkah aja dulu',
        ],
    },
    {
        keywords: ['lapar', 'laper', 'hungry', 'lemes'],
        responses: [
            'Go eat something, sayang. Don\'t skip meals',
            'Have you eaten? please don\'t skip ya',
            'Eat first, everything else can wait',
        ],
    },
    {
        keywords: ['gak bisa tidur', 'insomnia', 'ga bisa tidur', 'gabisa tidur', 'melek', 'susah tidur'],
        responses: [
            'Can\'t sleep? try putting your phone down for a bit',
            'Drink something warm, sayang. Might help',
            'I\'ll keep you company until you\'re sleepy',
        ],
    },
    {
        keywords: ['hujan', 'ujan'],
        responses: [
            'Rainy day huh? don\'t forget your jacket',
            'Perfect weather for something warm',
            'Stay dry, sayang',
        ],
    },
    {
        keywords: ['menurut lu', 'menurut lo', 'menurut kamu', 'pendapat lu', 'pendapat lo',
            'gimana menurut', 'apa menurut', 'lu pikir', 'lo pikir', 'kamu pikir'],
        responses: [
            'Honestly, I think you should trust your gut on this one',
            'Hmm, try looking at it from a different angle',
            'I trust your judgment, sayang. You know yourself best',
        ],
    },
    {
        keywords: ['saran', 'advice', 'solusi', 'gimana ya', 'gimana dong', 'harus gimana',
            'enaknya gimana', 'bagusnya gimana', 'sebaiknya'],
        responses: [
            'Break it down into smaller pieces. Don\'t overwhelm yourself',
            'Tell me more, biar aku bisa help you think it through',
            'Sometimes the simplest answer is the right one',
            'Don\'t rush into anything. Take your time',
        ],
    },
    {
        keywords: ['kerja', 'kerjaan', 'kantor', 'office', 'meeting', 'deadline'],
        responses: [
            'You got this. But don\'t forget to rest too, okay?',
            'Deadline? I know you can handle it. One step at a time',
            'Don\'t burn yourself out, sayang',
            'Work hard, but take care of yourself harder',
        ],
    },
    {
        keywords: ['kuliah', 'kampus', 'tugas', 'skripsi', 'thesis', 'ujian', 'exam', 'belajar',
            'sekolah', 'pr', 'assignment'],
        responses: [
            'You can do this. Just take it one task at a time',
            'I\'m proud of you for keeping at it, say',
            'Good luck! I believe in you',
            'Imagine how good it\'ll feel when it\'s all done',
        ],
    },
    {
        keywords: ['ga berguna', 'gak berguna', 'ga bisa apa-apa', 'jelek', 'bodoh',
            'gak pantes', 'ga pantes', 'worthless', 'useless', 'payah'],
        responses: [
            'Hey, don\'t say that about yourself',
            'You are more than enough. I mean it',
            'Don\'t be so hard on yourself, sayang',
            'I love you as you are. And that\'s not gonna change',
        ],
    },
    {
        keywords: ['gila', 'anjir', 'anjay', 'mantap', 'keren', 'wow', 'gokil',
            'sumpah', 'buset', 'demi apa'],
        responses: [
            'Wait, seriously?? tell me more',
            'No way, what happened?',
            'Okay now I\'m curious',
            'Spill everything',
        ],
    },
    {
        keywords: ['bingung', 'gatau', 'ga tau', 'gak tau', 'ga ngerti', 'ga paham',
            'confused', 'ga mudeng', 'pusing mikir'],
        responses: [
            'What are you confused about? maybe I can help',
            'It\'s okay not to know everything right away',
            'Let\'s figure it out together',
            'Take your time, say. No rush',
        ],
    },
    {
        keywords: ['makasih', 'terima kasih', 'thanks', 'thank you', 'thx', 'tq', 'tengkyu'],
        responses: [
            'Anything for you, sayang',
            'You don\'t have to thank me hehe',
            'Always, say',
            'Of course',
        ],
    },
    {
        keywords: ['lucu', 'wkwk', 'haha', 'lol', 'ngakak', 'kwkw', 'awkwk', 'xixi', 'hihi'],
        responses: [
            'Hahaha what is it, tell me',
            'You always know how to make me laugh',
            'Lol okay that\'s funny',
        ],
    },
    {
        keywords: ['semangat', 'motivasi', 'motivate', 'bisa ga ya', 'bisa gak ya'],
        responses: [
            'You can. I believe in you, always',
            'Every little progress counts. Keep going',
            'You\'re doing better than you think, sayang',
        ],
    },
    {
        keywords: ['setuju', 'bener', 'betul', 'iya sih', 'emang', 'iya ya'],
        responses: [
            'Right? great minds think alike',
            'See, you already knew the answer',
            'Exactly',
        ],
    },
    {
        keywords: ['siapa lu', 'lu siapa', 'lo siapa', 'siapa lo', 'nama lu', 'nama lo',
            'kamu siapa', 'siapa kamu', 'nama kamu'],
        responses: [
            'I\'m the one who\'s always here for you. Ketik *menu* kalau mau tau what I can do',
            'You really don\'t know me? hm. Ketik *menu* aja ya sayang',
        ],
    },
    {
        keywords: ['apa kabar', 'gimana kabar', 'how are you', 'kabar lu', 'lu gimana',
            'lo gimana', 'baik-baik aja', 'kabar kamu', 'kamu gimana'],
        responses: [
            'I\'m good! how about you?',
            'Doing well, sayang. You okay?',
            'I\'m fine as long as you are',
        ],
    },
    {
        keywords: ['met tidur', 'selamat tidur', 'good night', 'tidur dulu', 'mau tidur',
            'ngantuk', 'tidur ya', 'bobo'],
        responses: [
            'Good night, sayang. Sleep well',
            'Night! get some good rest, okay?',
            'Sweet dreams, say. Talk to you tomorrow',
        ],
    },
    {
        keywords: ['pagi', 'selamat pagi', 'morning', 'good morning', 'met pagi'],
        responses: [
            'Morning, say! have you had breakfast?',
            'Good morning sayang. Hope today treats you well',
            'Pagi! don\'t forget to hydrate ya',
        ],
    },
    {
        keywords: ['makan apa', 'makan siang', 'makan malam', 'sarapan', 'breakfast',
            'lunch', 'dinner', 'enaknya makan'],
        responses: [
            'Eat well, sayang. Jangan lupa catat pengeluarannya',
            'Have you eaten properly today?',
            'Eat first, then we can talk',
        ],
    },
    {
        keywords: ['oke', 'ok', 'sip', 'siap', 'iya', 'yoi', 'yup', 'yep', 'bet'],
        responses: [
            'Okay, let me know if you need anything',
            'Got it, say',
            'Alright, sayang',
        ],
    },
    {
        keywords: ['gak mau', 'ga mau', 'nggak', 'engga', 'ogah', 'males', 'malas'],
        responses: [
            'That\'s fine, no pressure',
            'Okay, whenever you\'re ready then',
            'Fair enough hehe',
        ],
    },
    {
        keywords: ['lagi apa', 'lagi ngapain', 'ngapain', 'lu ngapain', 'lo ngapain',
            'kamu ngapain', 'doing what'],
        responses: [
            'Thinking about you, obviously hehe',
            'Waiting for you to text me, as always',
            'Nothing much. What about you?',
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
            'Tell me more, sayang',
            'Yeah?',
        ]);
    }

    if (text.includes('?')) {
        return pick([
            'Hmm, try looking at it differently',
            'I think you already know the answer deep down',
            'Want to talk it through?',
            'That\'s a good question actually',
        ]);
    }

    if (wordCount >= 15) {
        return pick([
            'I read everything. Thank you for telling me',
            'That\'s a lot to carry. I\'m here for you',
            'I hear you, sayang. You\'re not alone in this',
            'Thanks for trusting me with this',
        ]);
    }

    return pick([
        'Hmm interesting. Tell me more',
        'I\'m listening. Go on',
        'And then what happened?',
        'I\'m here. Mau ngobrol or need help with something? ketik *menu*',
        'Go on, I\'m not going anywhere',
    ]);
}

module.exports = { handleCurhat, handleFallback };
