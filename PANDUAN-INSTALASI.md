# Panduan Instalasi — Anecdote to Character

Aplikasi pencatatan anekdot siswa → deskripsi karakter → rapor karakter (unduh PDF/Word).

- **Backend:** Google Apps Script + Google Sheets (gratis, memakai akun Google sekolah/pribadi)
- **Frontend:** GitHub Pages (gratis, alamat `https://USERNAME.github.io/NAMA-REPO/`)

Perkiraan waktu: 30–45 menit untuk pertama kali.

> **Sudah memasang versi sebelumnya?** Langsung ke **bagian 5A — Memperbarui ke versi 1.2** (impor siswa, unit MS/HS, pilihan Time/Location, daftar siswa bersama untuk semua guru, pindah wali kelas massal). Data yang sudah ada tetap aman.

---

## 0. Isi paket

| Berkas | Dipakai di | Keterangan |
|---|---|---|
| `Kode.gs` | Apps Script | Seluruh backend. Disalin-tempel ke editor Apps Script |
| `appsscript.json` | Apps Script | Pengaturan proyek (zona waktu, akses web app) |
| `anecdote-character.zip` | GitHub Pages | Frontend. Isinya: `index.html`, `css/`, `js/`, `README.md`, panduan ini |

> ⚠️ `Kode.gs` dan `appsscript.json` **tidak** dimasukkan ke GitHub. Keduanya hanya untuk Apps Script.

**Coba dulu tanpa server (opsional):** ekstrak ZIP, lalu buka `index.html` dengan dobel-klik. Selama `js/config.js` belum diisi, aplikasi berjalan dalam **mode demo** (tanpa login, data tersimpan di browser). Fitur unduh PDF/Word perlu koneksi internet.

---

## 1. Backend — Google Apps Script

### 1.1 Buat proyek
1. Buka **https://script.google.com** → **New project** (Proyek baru).
2. Klik judul "Untitled project" → beri nama **Anecdote to Character**.
3. Di berkas `Code.gs`, hapus semua isinya → tempel **seluruh isi `Kode.gs`** → tekan **Ctrl+S**.

### 1.2 Pasang `appsscript.json`
1. Klik ⚙️ **Project Settings** (Setelan proyek) di sidebar kiri.
2. Centang **Show "appsscript.json" manifest file in editor**.
3. Kembali ke **Editor** (ikon `< >`), buka `appsscript.json`, ganti seluruh isinya dengan isi berkas `appsscript.json` dari paket → **Ctrl+S**.

### 1.3 Jalankan setup (SEKALI)
1. Di toolbar atas, pilih fungsi **`setupAppEnvironment`** → klik **▶ Run**.
2. Muncul "Authorization required" → **Review permissions** → pilih akun Google Anda.
3. Muncul layar "Google hasn't verified this app" → klik **Advanced** → **Go to Anecdote to Character (unsafe)** → **Allow**.
   Ini normal untuk skrip buatan sendiri; skrip hanya mengakses Drive & Sheets milik akun Anda.
4. Buka **Execution log** di bagian bawah. Anda akan melihat:

   ```
   🔐 AKUN ADMIN AWAL (catat sekarang — hanya tampil sekali)
      Email      : admin
      Kata sandi : XXXXXXXXXXXX
   ✅ Setup selesai.
      Spreadsheet : https://docs.google.com/spreadsheets/d/...
   ```

5. **Catat kata sandi admin sekarang.** Kata sandi ini tidak bisa dilihat lagi (yang tersimpan hanya hash-nya).

Setup otomatis membuat:
- Folder Drive **📁 Anecdote to Character**
- Spreadsheet **🗃️ Database — Anecdote to Character** berisi sheet `AppConfig`, `Teachers`, `Students`, `Records`, `Reports`, `AuditLog`
- Rahasia di **Script Properties** (lihat bagian 6)

> Setup aman dijalankan ulang: tidak membuat duplikat dan tidak mengganti kata sandi admin.

### 1.4 Deploy sebagai Web App
1. Klik **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description:** `v1`
   - **Execute as:** **Me** (akun Anda)
   - **Who has access:** **Anyone**
4. Klik **Deploy** → salin **Web app URL** (berakhiran `/exec`).

**Uji:** buka URL tersebut di tab baru. Harus muncul teks seperti:
```json
{"success":true,"message":"API is running.","data":{"app":"Anecdote to Character","version":"1.0.0","ready":true}}
```

---

## 2. Frontend — siapkan berkas

1. Ekstrak `anecdote-character.zip`. Hasilnya folder **`anecdote-character`** berisi:
   ```
   anecdote-character/
   ├── index.html        ← harus ada di sini (paling atas)
   ├── README.md
   ├── PANDUAN-INSTALASI.md
   ├── css/
   │   └── style.css
   └── js/
       ├── config.js
       ├── framework.js
       ├── api.js
       ├── export.js
       ├── importer.js
       └── app.js
   ```
2. Buka `js/config.js` dengan Notepad / VS Code, lalu isi:
   ```js
   window.APP_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfy.....ID-ANDA...../exec',
     SCHOOL_NAME: 'Nama Sekolah Anda'   // opsional, tampil di kop PDF/Word
   };
   ```
3. Simpan.

> URL `/exec` bukan rahasia. Keamanan data dijaga oleh login guru di server.

---

## 3. Unggah ke GitHub Pages (lewat terminal)

> Jangan memakai tombol "Upload files" di situs GitHub. Cara itu sering merusak struktur folder `css/` dan `js/` sehingga tampilan berantakan.

### 3.1 Pasang Git
- **Windows:** unduh dari https://git-scm.com/download/win → instal dengan pilihan bawaan → buka **PowerShell**.
- **Mac:** buka Terminal, ketik `git --version` (macOS akan menawarkan instalasi bila belum ada).

Cek: `git --version` → muncul nomor versi.

### 3.2 Akun & identitas (sekali saja per komputer)
1. Daftar di https://github.com (username akan menjadi bagian alamat situs).
2. Di terminal:
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```

### 3.3 Buat repository
Di github.com: **+** → **New repository** → nama mis. `anecdote-character` → pilih **Public** → **jangan** centang README / .gitignore / license → **Create repository**.

### 3.4 Masuk ke folder yang BENAR
Folder kerja adalah **`anecdote-character`** (hasil ekstrak ZIP) — folder yang langsung berisi `index.html`.

Cara cepat di Windows: buka folder `anecdote-character` di File Explorer → klik address bar → ketik `powershell` → Enter.

Periksa isinya:
```powershell
dir
```
✅ Harus terlihat `index.html`, `css`, `js`. Kalau yang terlihat justru satu folder `anecdote-character`, masuk dulu: `cd anecdote-character`.

### 3.5 Kirim ke GitHub (satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/anecdote-character.git
git push -u origin main
```
- Perhatikan **titik** di `git add .`
- Saat diminta **Password**, tempel **Personal Access Token**, bukan kata sandi GitHub. Layar memang tidak menampilkan apa pun saat Anda menempel — itu normal, tekan Enter.

**Membuat token:** https://github.com/settings/tokens → **Generate new token (classic)** → Note: `git-push` → Expiration: 90 days → centang **repo** → **Generate token** → salin `ghp_...` (hanya tampil sekali).

Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### 3.6 Aktifkan Pages
Repo di GitHub → **Settings** → **Pages**:
- Source: **Deploy from a branch**
- Branch: **main** / **(root)** → **Save**
- Centang **Enforce HTTPS**

Tunggu 1–2 menit → muncul *"Your site is live at https://USERNAME.github.io/anecdote-character/"*.

---

## 4. Penggunaan pertama

1. Buka alamat situs → login dengan **Email: `admin`** dan kata sandi dari log setup.
2. Aplikasi meminta Anda **mengganti kata sandi** (min. 8 karakter, huruf + angka).
3. Buka tab **Teachers** → tambahkan akun guru (email, nama, peran). Aplikasi menampilkan **kata sandi sementara** satu kali → berikan ke guru yang bersangkutan.
4. Guru login → wajib mengganti kata sandi → mulai menambah siswa dan catatan.

**Mengisi daftar siswa sekaligus (impor):**
1. Tab **Anecdotal records** → klik **Import students** → **Download Excel template**.
2. Isi satu siswa per baris: Student ID, Student Name, Grade / Class, Unit (MS/HS), Gender (M/F). Admin juga punya kolom **Teacher Email** untuk menentukan wali kelas tiap siswa.
   Admin **wajib** memilih **Homeroom teacher** di atas pratinjau, atau mengisi kolom Teacher Email. Tanpa itu, siswa baru tidak bisa diimpor (supaya siswa tidak tercatat milik admin).
3. Unggah berkasnya (.xlsx, .xls, atau .csv), atau salin baris dari Excel/Google Sheets (termasuk baris judul) lalu tempel di kotak yang tersedia.
4. Periksa pratinjau: **New** = siswa baru, **Update** = siswa yang sudah ada akan diperbarui, **Skipped** = baris bermasalah beserta alasannya.
5. Klik **Import N students**.

Catatan impor:
- Maksimal 500 siswa per impor. Daftar yang lebih besar bisa dipecah menjadi beberapa berkas.
- Siswa dicocokkan lewat **Student ID**, atau lewat **nama + kelas** bila ID kosong, jadi mengimpor ulang berkas yang sama tidak membuat data ganda.
- Bila kolom Unit kosong, unit ditebak dari kelas: 7–9 → **MS**, 10–12 → **HS** (angka Romawi VII–XII juga dikenali).
- Judul kolom berbahasa Indonesia juga dikenali, misalnya NIS, Nama Siswa, Kelas, Jenjang (SMP/SMA), dan JK (L/P).
- Guru yang mengimpor otomatis menjadi wali kelas siswa baru tersebut. Siswa yang sudah dimiliki wali kelas lain tidak bisa ditimpa oleh guru (baris dilewati).

Setelah ada banyak siswa, gunakan filter **Unit**, **Class**, dan **Homeroom teacher** di atas pilihan siswa. Pilih **My homeroom students** untuk melihat siswa perwalian Anda saja.

**Memindahkan wali kelas (admin):** atur filter Unit/Class/Homeroom teacher sampai daftar siswa berisi siswa yang ingin dipindah → klik **Move students** → pilih wali kelas baru → klik tombol **Move** dua kali (konfirmasi). Catatan anekdot dan rapor ikut bersama siswa. Cara ini juga untuk membetulkan siswa hasil impor lama yang tercatat milik Administrator.

**Time dan Location:** pilih dari daftar, atau pilih **Other (type your own)…** untuk menulis sendiri. Isian sendiri diingat di perangkat itu dan muncul di bagian **Your entries**.

Hak akses (versi 1.2):

| Kegiatan | Guru | Wali kelas siswa itu | Admin |
|---|---|---|---|
| Melihat & memilih semua siswa | ✅ | ✅ | ✅ |
| Menulis catatan anekdot untuk siswa mana pun | ✅ | ✅ | ✅ |
| Mengubah / menghapus catatan | hanya catatannya sendiri | hanya catatannya sendiri | semua |
| Melihat deskripsi & rapor, unduh PDF/Word | ✅ | ✅ | ✅ |
| Menyusun & mengedit deskripsi dan rapor | ❌ (lihat saja) | ✅ | ✅ |
| Mengubah data siswa | ❌ | ✅ | ✅ |
| Menambah / mengimpor siswa | ✅ (menjadi wali kelasnya) | ✅ | ✅ |
| Menghapus siswa, memindah wali kelas, kelola akun guru | ❌ | ❌ | ✅ |

Catatan dari semua guru untuk satu siswa digabung: semua terlihat di Langkah 1 dan Langkah 2 (dengan nama penulisnya) dan dipakai saat menyusun narasi rapor.

---

## 5A. Memperbarui ke versi 1.2

Versi 1.1–1.2 menambahkan impor siswa, kolom Unit (MS/HS), filter Unit/Class/Homeroom teacher, isian sendiri untuk Time/Location, daftar siswa bersama untuk semua guru, dan pindah wali kelas massal.

1. **Backend:** buka proyek Apps Script → `Kode.gs` → hapus semua isinya → tempel `Kode.gs` versi baru → **Ctrl+S**.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** URL `/exec` tetap sama.
3. **Frontend:** ekstrak ZIP baru, lalu salin isinya ke folder `anecdote-character` milik Anda **kecuali `js/config.js`** (supaya URL server Anda tidak tertimpa). Berkas baru di versi ini: `js/importer.js`.
4. Dari folder `anecdote-character`:
   ```bash
   git add .
   git commit -m "Versi 1.2: siswa bersama dan pindah wali kelas"
   git push
   ```
5. Buka situs dengan **Ctrl+Shift+R**.

Setelah update, siswa yang dulu tercatat milik Administrator bisa dipindah ke wali kelas yang benar lewat **Move students** (lihat bagian 4).

Database lama tidak perlu diubah manual. Kolom `unit` ditambahkan otomatis di sheet `Students` saat aplikasi pertama kali dipakai. Untuk mengisi unit siswa lama, impor ulang daftar siswa dengan Student ID yang sama, atau ubah satu per satu lewat **Edit**.

## 5. Memperbarui aplikasi

**Backend (setelah `Kode.gs` diubah):**
Deploy → **Manage deployments** → ✏️ **Edit** → Version: **New version** → **Deploy**.
Dengan cara ini **URL `/exec` tetap sama**, jadi frontend tidak perlu diubah. (Jangan memakai "New deployment", karena akan menghasilkan URL baru.)

**Frontend (setelah berkas di folder `anecdote-character` diubah):**
```bash
git add .
git commit -m "Pembaruan"
git push
```
Tunggu 1–2 menit, lalu buka situs dengan **Ctrl+Shift+R**.

---

## 6. Keamanan & rahasia

Semua rahasia tersimpan di **Script Properties** (Apps Script → ⚙️ Project Settings → Script Properties), **tidak** di kode, Sheets, atau GitHub:

| Kunci | Isi | Diisi oleh |
|---|---|---|
| `SPREADSHEET_ID`, `ROOT_FOLDER_ID` | ID database & folder | Otomatis (setup) |
| `SESSION_SECRET` | Kunci penanda tangan sesi login | Otomatis (setup) |
| `PW_<email>` | Hash + salt kata sandi tiap akun | Otomatis |
| `MUSTCHANGE_<email>`, `REV_<email>`, `VER_*` | Status wajib ganti sandi, pencabutan sesi, versi cache | Otomatis |

Fungsi pemeliharaan (jalankan dari editor Apps Script, pilih fungsi → ▶ Run):

| Fungsi | Kapan dipakai |
|---|---|
| `resetAdminPassword()` | Lupa kata sandi admin. Sandi baru muncul di Execution log |
| `rotasiSecretSesi()` | Curiga ada sesi bocor. Semua pengguna harus login ulang |

Aturan penting:
- **Jangan bagikan spreadsheet database** ke guru. Guru cukup memakai aplikasi.
- **Jangan menambah editor** proyek Apps Script sembarangan — editor bisa melihat Script Properties.
- Data siswa adalah data pribadi anak: gunakan akun Google milik sekolah bila memungkinkan.
- Login dikunci 15 menit setelah 5 kali salah. Sesi berlaku 12 jam.

---

## 7. Struktur database (Google Sheets)

| Sheet | Kolom |
|---|---|
| `Teachers` | email, name, role, active, createdAt, updatedAt |
| `Students` | id, studentId, name, grade, gender, teacherEmail, createdAt, updatedAt, unit (MS / HS) |
| `Records` | id, studentKey, date, time, location, what, ending, subValue, value, type (k = strength, p = area for development), teacherEmail, createdAt |
| `Reports` | studentKey, academicYear, semester, term, place, reportDate, grades (JSON), social, spiritual, strengths, weaknesses, recommendations, updatedAt, updatedBy |
| `AuditLog` | timestamp, email, action, entity, detail |
| `AppConfig` | Catatan ID (bukan rahasia) |

Sheet ini bisa dipakai untuk rekap (filter, pivot) tanpa mengubah aplikasi. Hindari mengubah judul kolom.

---

## 8. Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Muncul "Demo mode" padahal sudah online | `GAS_URL` di `js/config.js` belum diisi / masih `GANTI_...` | Isi URL `/exec`, lalu `git add .` → `git commit -m "config"` → `git push` |
| "The server returned an unexpected response" | URL salah, bukan `/exec`, atau akses bukan "Anyone" | Cek ulang bagian 1.4. Buka URL `/exec` di browser harus muncul JSON |
| "The backend has not been set up" | `setupAppEnvironment()` belum dijalankan | Jalankan bagian 1.3 |
| Perubahan `Kode.gs` tidak berpengaruh | Deployment belum diperbarui | Bagian 5: Manage deployments → Edit → New version |
| Situs GitHub 404 | `index.html` tidak berada di root repo | Pastikan `git init` dijalankan di folder yang langsung berisi `index.html` |
| Tampilan tanpa warna/layout | Folder `css/` dan `js/` hilang (upload lewat web) | Unggah ulang lewat terminal (bagian 3) |
| `Password authentication is not supported` | GitHub menolak kata sandi biasa | Gunakan Personal Access Token |
| Tombol unduh PDF/Word gagal | Tidak ada internet / CDN diblokir jaringan sekolah | Coba jaringan lain; pustaka dimuat dari cdn.jsdelivr.net |
| Situs masih versi lama | Cache browser | Ctrl+Shift+R atau jendela Incognito |
| Lupa kata sandi guru | — | Admin → tab Teachers → **Reset password** |
| Lupa kata sandi admin | — | Jalankan `resetAdminPassword()` di Apps Script |
| Tombol **Import students** tidak muncul | Frontend belum diperbarui atau cache browser | Pastikan `js/importer.js` ikut di-push, lalu Ctrl+Shift+R |
| Impor gagal: "Unknown action: student.import" / tombol Move gagal | Backend belum diperbarui ke 1.2 | Bagian 5A langkah 1–2 (New version) |
| Guru tidak melihat siswa guru lain | Backend masih versi lama | Bagian 5A langkah 1–2 |
| "Only the homeroom teacher … can edit the report" | Anda bukan wali kelas siswa itu | Minta admin memindahkan siswa ke Anda bila memang wali kelasnya |
| Student ID 00123 menjadi 123 | Kolom ID di Excel berformat angka | Pakai templat dari aplikasi (kolom ID sudah berformat teks), atau ketik `'00123` |
| Berkas CSV terbaca satu kolom | Pemisah kolom tidak umum | Aplikasi mengenali koma, titik koma, dan tab. Bila masih gagal, simpan sebagai .xlsx |
