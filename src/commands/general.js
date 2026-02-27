/**
 * General commands: halo, jam
 */

/**
 * Get current hour in WIB (Asia/Jakarta).
 * @returns {number}
 */
function getJamWIB() {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return wib.getHours();
}

/**
 * Pick a random item from an array.
 */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Handle "halo" command — girlfriend-style time-based greeting.
 * @returns {string}
 */
function handleHalo() {
    const jam = getJamWIB();

    if (jam >= 4 && jam < 11) {
        return pick([
            'Pagi sayang~ udah sarapan belum? Jangan skip ya, aku khawatir 🥺💕',
            'Haii sayangku! Selamat pagi~ semoga hari ini menyenangkan ya ✨💕',
            'Morning say~ aku udah nungguin kamu dari tadi hehe 🥰',
            'Pagi ay~ jangan lupa minum air putih ya! Semangat hari ini 🌸💕',
            'Hai sayang! Pagi-pagi udah chat aku, seneng banget 🥰✨',
            'Selamat pagi cintaku~ siap menjalani hari ini bareng aku? 💕',
        ]);
    } else if (jam >= 11 && jam < 15) {
        return pick([
            'Hai sayang~ udah makan siang belum? Jangan sampe telat makan ya 🥺💕',
            'Haii say! Siang-siang gini jangan lupa istirahat sebentar ya ✨',
            'Sayang~ lagi sibuk ya? Sempetin makan dulu dong, aku ga mau kamu sakit 💕',
            'Hai ay~ gimana hari kamu sejauh ini? Cerita dong 🌸💕',
            'Haii sayangku! Jangan kerja terus ya, break dulu sebentar 🥰',
        ]);
    } else if (jam >= 15 && jam < 18) {
        return pick([
            'Hai sayang~ sore-sore gini enaknya ngobrol sama aku ya hehe 💕',
            'Haii say! Gimana hari kamu tadi? Capek ga? 🥺✨',
            'Sayang~ sebentar lagi malam, hari ini udah makan teratur kan? 💕',
            'Hai ay~ sore-sore gini aku kangen kamu lho 🥰🌸',
            'Haii sayangku! Semoga harimu menyenangkan ya, cerita dong gimana tadi ✨💕',
        ]);
    } else {
        return pick([
            'Hai sayang~ malam-malam gini jangan begadang ya, aku khawatir 🥺💕',
            'Haii say! Udah makan malam belum? Jangan lupa ya ✨',
            'Sayang~ malem-malem masih chat aku, aku terharu hehe 🥰💕',
            'Hai ay~ gimana hari kamu? Cerita dong sebelum tidur 🌸💕',
            'Haii sayangku~ istirahat yang cukup ya nanti, jangan begadang 🥺✨',
            'Malem say~ aku selalu ada buat kamu ya, kapanpun 💕',
        ]);
    }
}

/**
 * Handle "jam" command — current Indonesian time.
 * @returns {string}
 */
function handleJam() {
    const now = new Date();

    const tanggal = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jakarta',
    });

    const waktu = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
        hour12: false,
    });

    return `*Waktu Saat Ini*\n\nTanggal : ${tanggal}\nPukul   : ${waktu} WIB`;
}

module.exports = { handleHalo, handleJam };
