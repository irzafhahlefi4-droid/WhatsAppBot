/**
 * General commands: halo, jam
 */

function getJamWIB() {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return wib.getHours();
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Handle "halo" command — mature bilingual girlfriend greeting.
 */
function handleHalo() {
    const jam = getJamWIB();

    if (jam >= 4 && jam < 11) {
        return pick([
            'Morning sayang. Udah sarapan?',
            'Morning ay! hope u slept well',
            'Pagi! I\'ve been waiting for u to text hehe',
            'Morning ay. Don\'t forget to hydrate ya',
            'Hai sayang, start ur day right ok?',
        ]);
    } else if (jam >= 11 && jam < 15) {
        return pick([
            'Hey sayang, have u eaten yet?',
            'Hai ay! don\'t forget to take a break tbh',
            'Lagi sibuk ya? make sure u eat ok?',
            'Hey ay, how\'s ur day so far?',
            'Hai sayang, don\'t overwork urself ya',
        ]);
    } else if (jam >= 15 && jam < 18) {
        return pick([
            'Hey sayang, how was ur day?',
            'Hai ay! tell me about ur day',
            'Sore sayang. U doing ok?',
            'Hey ay, lagi mikirin kamu hm',
            'Hai sayang, almost evening. How\'s everything?',
        ]);
    } else {
        return pick([
            'Hey sayang, don\'t stay up too late ok?',
            'Hai ay! have u had dinner?',
            'U still up hm? I appreciate the company',
            'Hey ay, how was ur day? tell me',
            'Night sayang. Take care of urself',
            'Hai ay, I\'m always here whenever u need me tbh',
        ]);
    }
}

/**
 * Handle "jam" command.
 */
function handleJam() {
    const now = new Date();

    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'Asia/Jakarta',
    });

    const waktu = now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta', hour12: false,
    });

    return `It's ${tanggal}, ${waktu} WIB right now, sayang`;
}

module.exports = { handleHalo, handleJam };
