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
 * Handle "halo" command — natural girlfriend-style greeting.
 */
function handleHalo() {
    const jam = getJamWIB();

    if (jam >= 4 && jam < 11) {
        return pick([
            'Pagi sayang~ udah sarapan belum?',
            'Hai say! selamat pagi, semoga hari ini menyenangkan ya',
            'Morning! aku udah nungguin kamu dari tadi hehe',
            'Pagi ay~ jangan lupa minum air putih ya',
            'Pagi sayang! seneng deh kamu chat aku pagi-pagi',
        ]);
    } else if (jam >= 11 && jam < 15) {
        return pick([
            'Hai sayang~ udah makan siang belum?',
            'Hai say! siang-siang gini jangan lupa istirahat ya',
            'Sayang, lagi sibuk ya? sempetin makan dulu dong',
            'Hai ay~ gimana hari kamu sejauh ini?',
            'Hai sayang! jangan kerja terus ya, break dulu',
        ]);
    } else if (jam >= 15 && jam < 18) {
        return pick([
            'Hai sayang~ sore-sore gini enaknya ngobrol',
            'Hai say! gimana hari kamu tadi?',
            'Sayang, hari ini udah makan teratur kan?',
            'Hai ay~ aku kangen kamu lho',
            'Hai sayang! cerita dong gimana tadi',
        ]);
    } else {
        return pick([
            'Hai sayang~ jangan begadang ya',
            'Hai say! udah makan malam belum?',
            'Sayang, malem-malem masih chat aku, terharu nih',
            'Hai ay~ gimana hari kamu? cerita dong',
            'Hai sayang~ istirahat yang cukup ya nanti',
            'Malem say, aku selalu ada buat kamu',
        ]);
    }
}

/**
 * Handle "jam" command — current Indonesian time.
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

    return `Sekarang ${tanggal}, pukul ${waktu} WIB`;
}

module.exports = { handleHalo, handleJam };
