import type { Locale } from '@/i18n';

// Isi halaman Kebijakan Privasi & Syarat Layanan (dua bahasa).
//
// Tulis sesuai yang benar-benar terjadi di website: form kontak menyimpan IP &
// jenis browser (lib/leads.ts), klik WhatsApp dicatat tanpa IP (lib/tracking.ts),
// tidak ada cookie/analytics untuk pengunjung. Kalau itu berubah, ubah juga di sini
// dan perbarui LEGAL_UPDATED. Ketentuan proyek (harga, garansi, kepemilikan kode)
// sengaja merujuk ke penawaran tertulis, jangan dikarang di sini.

// Blok isi: string = paragraf, string[] = daftar berpoin.
export type LegalBlock = string | string[];
export type LegalSection = { id: string; title: string; body: LegalBlock[] };
export type LegalDoc = { title: string; description: string; lead: string; sections: LegalSection[] };
export type LegalKind = 'privacy' | 'terms';

type LegalCopy = {
  labels: {
    updated: string;
    contents: string;
    contactTitle: string;
    contactLead: Record<LegalKind, string>;
    address: string;
    seeAlso: string;
  };
} & Record<LegalKind, LegalDoc>;

export const LEGAL_UPDATED = '2026-10-16';

const id: LegalCopy = {
  labels: {
    updated: 'Terakhir diperbarui',
    contents: 'Di halaman ini',
    contactTitle: 'Kontak',
    contactLead: {
      privacy: 'Untuk pertanyaan tentang kebijakan ini atau permintaan terkait data Anda.',
      terms: 'Untuk pertanyaan tentang syarat layanan ini.',
    },
    address: 'Alamat',
    seeAlso: 'Baca juga',
  },

  privacy: {
    title: 'Kebijakan Privasi',
    description: 'Data apa yang dikumpulkan dazytech.web.id, untuk apa dipakai, berapa lama disimpan, dan cara meminta penghapusannya.',
    lead: 'Data apa yang kami kumpulkan lewat dazytech.web.id dan selama bekerja sama dengan Anda, untuk apa data itu dipakai, dan apa saja hak Anda.',
    sections: [
      {
        id: 'data',
        title: 'Data yang kami kumpulkan',
        body: [
          [
            'Form kontak: nama, nomor WhatsApp atau email, layanan yang diminati, dan pesan Anda. Bersama isian ini kami menyimpan alamat IP dan jenis browser untuk mencegah spam.',
            'Klik tombol WhatsApp: tombol mana yang diklik, bahasa halaman, dan waktunya. Catatan ini tidak berisi alamat IP atau data lain yang bisa mengenali Anda.',
            'Chat dan email: isi percakapan yang Anda kirim ke WhatsApp atau email kami.',
            'Selama proyek: data perusahaan dan data kerja yang Anda serahkan untuk membangun atau menguji aplikasi.',
          ],
          'Kami tidak meminta data sensitif seperti nomor KTP, data kesehatan, atau data keuangan pribadi lewat website ini.',
        ],
      },
      {
        id: 'cookie',
        title: 'Cookie dan pelacakan',
        body: [
          'Website ini tidak memasang cookie untuk pengunjung dan tidak memakai Google Analytics, Meta Pixel, atau iklan pihak ketiga. Cookie hanya dipakai di halaman login internal tim Dazytech.',
        ],
      },
      {
        id: 'penggunaan',
        title: 'Untuk apa data dipakai',
        body: [
          [
            'Menghubungi Anda kembali dan menyiapkan penawaran.',
            'Menjalankan proyek yang sudah disepakati, termasuk dukungan setelah aplikasi dipakai.',
            'Mencegah spam dan penyalahgunaan form.',
            'Mengetahui layanan mana yang paling banyak ditanyakan, dari jumlah klik yang tidak mengenali siapa pun.',
          ],
          'Kami tidak menjual atau menyewakan data Anda, dan tidak mengirim promosi tanpa persetujuan Anda.',
        ],
      },
      {
        id: 'akses',
        title: 'Siapa yang bisa melihat data',
        body: [
          [
            'Isian form dan chat hanya dibuka oleh tim Dazytech yang menangani pertanyaan atau proyek Anda.',
            'Data website disimpan di server cloud yang kami kelola sendiri. Penyedia server hanya menyediakan infrastrukturnya.',
            'Percakapan di WhatsApp dan email juga tunduk pada kebijakan privasi penyedia layanan tersebut.',
            'Kami membuka data kepada pihak lain hanya jika diwajibkan hukum atau dengan persetujuan Anda.',
          ],
        ],
      },
      {
        id: 'data-proyek',
        title: 'Data proyek',
        body: [
          'Data bisnis yang Anda serahkan selama proyek, misalnya daftar barang, pelanggan, atau transaksi, hanya dipakai untuk proyek itu. Data tersebut tidak kami tampilkan di portofolio atau materi promosi.',
        ],
      },
      {
        id: 'penyimpanan',
        title: 'Berapa lama data disimpan',
        body: [
          'Isian form dan chat kami simpan selama masih diperlukan untuk menindaklanjuti pertanyaan Anda atau menjalankan proyek. Data proyek dikembalikan atau dihapus setelah proyek selesai, sesuai kesepakatan. Anda bisa meminta penghapusan lebih cepat kapan saja.',
        ],
      },
      {
        id: 'keamanan',
        title: 'Keamanan',
        body: [
          'Website memakai koneksi terenkripsi (HTTPS). Data hanya bisa dibuka tim Dazytech lewat login, dan setiap akun hanya bisa membuka bagian yang menjadi tugasnya. Jika terjadi kebocoran yang menyangkut data Anda, kami akan memberi tahu Anda.',
        ],
      },
      {
        id: 'hak',
        title: 'Hak Anda',
        body: [
          'Sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda berhak:',
          [
            'meminta salinan data Anda yang kami simpan;',
            'memperbaiki data yang salah atau tidak lengkap;',
            'meminta data Anda dihapus;',
            'menarik persetujuan yang pernah Anda berikan.',
          ],
          'Kirim permintaan lewat WhatsApp atau email di bawah. Kami akan mengabari Anda setelah permintaan selesai diproses.',
        ],
      },
      {
        id: 'perubahan',
        title: 'Perubahan kebijakan',
        body: ['Jika cara kami mengelola data berubah, halaman ini akan diperbarui dan tanggal di atas ikut berubah.'],
      },
    ],
  },

  terms: {
    title: 'Syarat Layanan',
    description: 'Ketentuan penggunaan dazytech.web.id dan dasar kerja sama proyek ERP, aplikasi bisnis, dan website dengan Dazytech Solutions.',
    lead: 'Syarat ini berlaku saat Anda memakai dazytech.web.id dan menjadi dasar kerja sama proyek dengan Dazytech Solutions. Rincian setiap proyek ditulis di penawaran yang kita sepakati bersama.',
    sections: [
      {
        id: 'layanan',
        title: 'Layanan kami',
        body: [
          'Dazytech Solutions mengembangkan ERP dan aplikasi bisnis custom, integrasi sistem, serta website company profile.',
          'Informasi dan contoh tampilan di website ini adalah gambaran umum, bukan penawaran yang mengikat. Harga “mulai” adalah harga awal; harga akhir mengikuti cakupan yang disepakati.',
        ],
      },
      {
        id: 'penawaran',
        title: 'Penawaran proyek',
        body: [
          'Setiap proyek dimulai dengan penawaran tertulis yang memuat:',
          [
            'cakupan pekerjaan dan modul;',
            'biaya dan termin pembayaran;',
            'perkiraan waktu pengerjaan;',
            'masa garansi dan dukungan setelah aplikasi dipakai;',
            'kepemilikan kode dan hasil kerja.',
          ],
          'Jika ada perbedaan antara syarat ini dan penawaran atau perjanjian proyek, yang berlaku adalah penawaran atau perjanjian proyek.',
        ],
      },
      {
        id: 'cakupan',
        title: 'Perubahan cakupan',
        body: ['Permintaan di luar cakupan yang disepakati kami catat dan perkirakan dulu biaya serta waktunya. Pekerjaan tambahan dimulai setelah Anda setuju.'],
      },
      {
        id: 'pembayaran',
        title: 'Pembayaran',
        body: ['Harga dalam Rupiah. Jumlah dan jadwal pembayaran tertulis di penawaran. Jika pembayaran terlambat, pekerjaan dapat kami tunda sampai pembayaran diterima.'],
      },
      {
        id: 'kewajiban',
        title: 'Kewajiban kedua pihak',
        body: [
          'Kami mengerjakan proyek secara profesional, memberi kabar progres, dan memberi tahu lebih awal jika ada kendala jadwal.',
          'Anda menyiapkan materi, data, dan akses yang dibutuhkan (misalnya logo, teks, contoh dokumen, atau akses server), serta memberi masukan dan persetujuan tepat waktu. Keterlambatan materi atau persetujuan dapat menggeser jadwal.',
        ],
      },
      {
        id: 'hak-cipta',
        title: 'Hak atas materi dan hasil kerja',
        body: [
          [
            'Materi yang Anda serahkan (logo, teks, foto, data) tetap milik Anda dan hanya kami pakai untuk proyek Anda.',
            'Kepemilikan kode dan hasil kerja diatur di penawaran atau perjanjian proyek. Library open source tetap mengikuti lisensinya masing-masing.',
            'Kami menyebut nama atau menampilkan proyek Anda di portofolio hanya dengan izin Anda.',
            'Isi website ini, termasuk teks, ilustrasi, logo, dan maskot, milik Dazytech Solutions.',
          ],
        ],
      },
      {
        id: 'kerahasiaan',
        title: 'Kerahasiaan',
        body: [
          'Informasi bisnis yang kami terima selama proyek kami jaga kerahasiaannya dan hanya dipakai untuk proyek tersebut. Kami bersedia menandatangani perjanjian kerahasiaan (NDA) jika Anda membutuhkannya. Pengelolaan data pribadi dijelaskan di Kebijakan Privasi.',
        ],
      },
      {
        id: 'tanggung-jawab',
        title: 'Garansi dan batas tanggung jawab',
        body: [
          'Masa garansi perbaikan bug dan dukungan setelah aplikasi dipakai mengikuti penawaran proyek.',
          'Gangguan dari pihak di luar kendali kami, seperti penyedia hosting, domain, koneksi internet, atau layanan pihak ketiga yang terhubung ke aplikasi, bukan tanggung jawab kami. Meski begitu, selama masa dukungan proyek kami tetap membantu mencari penyebabnya dan berkoordinasi dengan penyedia terkait.',
          'Tanggung jawab kami atas sebuah proyek paling besar senilai biaya yang sudah dibayarkan untuk proyek tersebut.',
        ],
      },
      {
        id: 'penghentian',
        title: 'Penghentian kerja sama',
        body: [
          'Kedua pihak dapat menghentikan proyek dengan pemberitahuan tertulis. Setelah itu:',
          [
            'pekerjaan yang sudah selesai sampai tanggal penghentian ditagihkan sesuai penawaran;',
            'akses yang Anda berikan, seperti akun server, hosting, atau email, kami kembalikan dan tidak kami pakai lagi;',
            'data yang Anda serahkan kami kembalikan atau hapus;',
            'penyerahan hasil kerja yang sudah dibayar mengikuti penawaran proyek.',
          ],
        ],
      },
      {
        id: 'keadaan-kahar',
        title: 'Keadaan kahar',
        body: ['Kedua pihak tidak dianggap lalai jika terlambat karena keadaan di luar kendali, seperti bencana alam, gangguan listrik atau internet skala luas, atau kebijakan pemerintah. Jadwal disesuaikan bersama.'],
      },
      {
        id: 'hukum',
        title: 'Hukum yang berlaku',
        body: ['Syarat ini tunduk pada hukum Republik Indonesia. Perselisihan diselesaikan lebih dulu secara musyawarah. Jika tidak tercapai kesepakatan, penyelesaian dilakukan melalui pengadilan di Jakarta.'],
      },
      {
        id: 'perubahan',
        title: 'Perubahan syarat',
        body: ['Kami dapat memperbarui syarat ini dan versi terbaru selalu ada di halaman ini. Proyek yang sudah berjalan tetap mengikuti penawaran atau perjanjian yang sudah disepakati.'],
      },
    ],
  },
};

const en: LegalCopy = {
  labels: {
    updated: 'Last updated',
    contents: 'On this page',
    contactTitle: 'Contact',
    contactLead: {
      privacy: 'For questions about this policy or requests about your data.',
      terms: 'For questions about these terms.',
    },
    address: 'Address',
    seeAlso: 'See also',
  },

  privacy: {
    title: 'Privacy Policy',
    description: 'What data dazytech.web.id collects, what it is used for, how long it is kept, and how to ask for it to be deleted.',
    lead: 'What data we collect through dazytech.web.id and while working with you, what we use it for, and what your rights are.',
    sections: [
      {
        id: 'data',
        title: 'Data we collect',
        body: [
          [
            'Contact form: your name, WhatsApp number or email, the service you are interested in, and your message. With each submission we store the IP address and browser type to prevent spam.',
            'WhatsApp button clicks: which button was clicked, the page language, and the time. These records contain no IP address or anything else that identifies you.',
            'Chat and email: the messages you send to our WhatsApp or email.',
            'During a project: company and operational data you hand over so we can build or test the application.',
          ],
          'We do not ask for sensitive data such as ID card numbers, health data, or personal financial data through this website.',
        ],
      },
      {
        id: 'cookie',
        title: 'Cookies and tracking',
        body: [
          'This website sets no cookies for visitors and does not use Google Analytics, Meta Pixel, or third-party ads. Cookies are only used on the internal login pages for the Dazytech team.',
        ],
      },
      {
        id: 'penggunaan',
        title: 'How we use data',
        body: [
          [
            'To get back to you and prepare a quotation.',
            'To run the project we agreed on, including support after the application goes live.',
            'To prevent spam and abuse of the form.',
            'To see which services people ask about most, using click counts that identify no one.',
          ],
          'We do not sell or rent your data, and we do not send promotions without your consent.',
        ],
      },
      {
        id: 'akses',
        title: 'Who can see your data',
        body: [
          [
            'Form submissions and chats are only opened by the Dazytech team handling your question or project.',
            'Website data is stored on a cloud server we manage ourselves. The server provider only supplies the infrastructure.',
            'Conversations on WhatsApp and email are also subject to those providers’ privacy policies.',
            'We only disclose data to others when required by law or with your consent.',
          ],
        ],
      },
      {
        id: 'data-proyek',
        title: 'Project data',
        body: [
          'Business data you hand over during a project, such as product lists, customers, or transactions, is used for that project only. We do not show it in our portfolio or promotional material.',
        ],
      },
      {
        id: 'penyimpanan',
        title: 'How long we keep data',
        body: [
          'Form submissions and chats are kept for as long as we need them to follow up on your question or run the project. Project data is returned or deleted after the project ends, as agreed. You can ask for earlier deletion at any time.',
        ],
      },
      {
        id: 'keamanan',
        title: 'Security',
        body: [
          'The website uses an encrypted connection (HTTPS). Data can only be opened by the Dazytech team through a login, and each account can only open the parts it is responsible for. If a breach affects your data, we will let you know.',
        ],
      },
      {
        id: 'hak',
        title: 'Your rights',
        body: [
          'Under Indonesia’s Personal Data Protection Law (Law No. 27 of 2022), you have the right to:',
          [
            'request a copy of the data we hold about you;',
            'correct data that is wrong or incomplete;',
            'ask for your data to be deleted;',
            'withdraw consent you have given.',
          ],
          'Send your request via WhatsApp or email below. We will let you know once it has been handled.',
        ],
      },
      {
        id: 'perubahan',
        title: 'Changes to this policy',
        body: ['If the way we handle data changes, this page will be updated along with the date above.'],
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    description: 'Terms for using dazytech.web.id and the basis for ERP, business application, and website projects with Dazytech Solutions.',
    lead: 'These terms apply when you use dazytech.web.id and form the basis of any project with Dazytech Solutions. The details of each project are written in the quotation we agree on.',
    sections: [
      {
        id: 'layanan',
        title: 'Our services',
        body: [
          'Dazytech Solutions builds custom ERP and business applications, system integrations, and company profile websites.',
          'Information and sample screens on this website are a general overview, not a binding offer. “From” prices are starting prices; the final price follows the agreed scope.',
        ],
      },
      {
        id: 'penawaran',
        title: 'Project quotations',
        body: [
          'Every project starts with a written quotation that covers:',
          [
            'scope of work and modules;',
            'fees and payment terms;',
            'estimated timeline;',
            'warranty period and support after go-live;',
            'ownership of the code and deliverables.',
          ],
          'Where these terms differ from a project quotation or agreement, the quotation or agreement prevails.',
        ],
      },
      {
        id: 'cakupan',
        title: 'Scope changes',
        body: ['Requests outside the agreed scope are noted and estimated for cost and time first. Additional work starts once you approve it.'],
      },
      {
        id: 'pembayaran',
        title: 'Payment',
        body: ['Prices are in Indonesian Rupiah. Amounts and payment schedule are set out in the quotation. If a payment is late, we may pause work until it is received.'],
      },
      {
        id: 'kewajiban',
        title: 'Responsibilities of both parties',
        body: [
          'We carry out the project professionally, report progress, and flag schedule issues early.',
          'You provide the materials, data, and access needed (such as logos, copy, sample documents, or server access) and give feedback and approvals on time. Late materials or approvals may shift the schedule.',
        ],
      },
      {
        id: 'hak-cipta',
        title: 'Rights to materials and deliverables',
        body: [
          [
            'Materials you provide (logos, copy, photos, data) remain yours and are used only for your project.',
            'Ownership of the code and deliverables is set out in the project quotation or agreement. Open source libraries remain under their own licences.',
            'We only name your company or show your project in our portfolio with your permission.',
            'The content of this website, including copy, illustrations, logo, and mascot, belongs to Dazytech Solutions.',
          ],
        ],
      },
      {
        id: 'kerahasiaan',
        title: 'Confidentiality',
        body: [
          'Business information we receive during a project is kept confidential and used only for that project. We are happy to sign a non-disclosure agreement (NDA) if you need one. Personal data handling is described in the Privacy Policy.',
        ],
      },
      {
        id: 'tanggung-jawab',
        title: 'Warranty and limitation of liability',
        body: [
          'The bug-fix warranty period and support after go-live follow the project quotation.',
          'Disruptions caused by parties outside our control, such as hosting or domain providers, internet connectivity, or third-party services connected to the application, are not our responsibility. Even so, during the project support period we help find the cause and coordinate with the provider concerned.',
          'Our liability for a project is limited to the fees paid for that project.',
        ],
      },
      {
        id: 'penghentian',
        title: 'Termination',
        body: [
          'Either party may end a project with written notice. After that:',
          [
            'work completed up to the termination date is invoiced according to the quotation;',
            'access you gave us, such as server, hosting, or email accounts, is handed back and no longer used;',
            'data you provided is returned or deleted;',
            'handover of paid deliverables follows the project quotation.',
          ],
        ],
      },
      {
        id: 'keadaan-kahar',
        title: 'Force majeure',
        body: ['Neither party is in breach for delays caused by events beyond its control, such as natural disasters, widespread power or internet outages, or government action. Timelines are adjusted together.'],
      },
      {
        id: 'hukum',
        title: 'Governing law',
        body: ['These terms are governed by the laws of the Republic of Indonesia. Disputes are first settled by discussion. If no agreement is reached, they are resolved through the courts in Jakarta.'],
      },
      {
        id: 'perubahan',
        title: 'Changes to these terms',
        body: ['We may update these terms and the latest version is always on this page. Projects already underway continue to follow the quotation or agreement already in place.'],
      },
    ],
  },
};

export const LEGAL: Record<Locale, LegalCopy> = { id, en };

const PATHS: Record<LegalKind, string> = { privacy: 'privacy-policy/', terms: 'terms-of-service/' };

export function legalHref(locale: Locale, kind: LegalKind): string {
  return `${locale === 'en' ? '/en/' : '/'}${PATHS[kind]}`;
}
