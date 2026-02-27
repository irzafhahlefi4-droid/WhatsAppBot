/**
 * Menu command — displays available bot features.
 */

/**
 * Handle "menu" command.
 * @returns {string}
 */
function handleMenu() {
 const now = new Date();
 const jam = now.toLocaleTimeString('id-ID', {
 hour:'2-digit',
 minute:'2-digit',
 timeZone:'Asia/Jakarta',
 hour12: false,
 });
 const tanggal = now.toLocaleDateString('id-ID', {
 day:'numeric',
 month:'long',
 year:'numeric',
 timeZone:'Asia/Jakarta',
 });

 return`*MENU ASSISTANT* 
${tanggal} | ${jam} WIB
━━━━━━━━━━━━━━━━━━━━━━━━

*1. Umum*
> *halo* — Sapaan
> *menu* — Menu ini
> *jam* — Waktu saat ini

*2. Todo List*
> *todo* — Lihat tugas
> *todo* _[isi]_ — Tambah tugas
> *done* _[no]_ — Selesaikan tugas

*3. Keuangan *
> *catat* _[nominal] [ket]_
 _cth: catat 25000 makan siang_
> *total* — Rekap pengeluaran
> *hapus* _[no]_ — Hapus pengeluaran
> *edit* _[no] [nominal] [ket]_
 _cth: edit 1 30000 makan malam_
> *batas* _[nominal]_ — Set batas harian
 _cth: batas 100000 / batas off_

*4. Export Data *
> *export todo* — Excel todo
> *export keuangan* — Excel keuangan
> *export pdf keuangan* — PDF keuangan

*5. Reset Data*
> *reset todo* — Hapus semua tugas
> *reset keuangan* — Hapus semua keuangan

*6. Curhat / Ngobrol *
> _Kirim apa aja, aku dengerin~_
> _Cerita aja, aku selalu ada buat kamu _

━━━━━━━━━━━━━━━━━━━━━━━━
_Ketik command atau langsung curhat aja ya sayang~_`;
}

module.exports = { handleMenu };
