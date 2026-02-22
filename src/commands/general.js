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
 * Handle "halo" command — time-based greeting.
 * @returns {string}
 */
function handleHalo() {
    const jam = getJamWIB();

    if (jam >= 4 && jam < 11) {
        return 'Hai! Selamat pagi, semoga harimu produktif!';
    } else if (jam >= 11 && jam < 15) {
        return 'Hai! Selamat siang, mau catat apalagi?';
    } else if (jam >= 15 && jam < 18) {
        return 'Hai! Selamat sore, gimana harimu tadi?';
    } else {
        return "Hai! Selamat malam, How's ur day?";
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
