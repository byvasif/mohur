# Möhür — dizayn sənədi

Tarix: 2026-09-14
Status: təsdiq gözlənilir

## 1. Problem

Avadanlıq müayinəsi aparan adam işi bitirir, sonra axşam oturub sənədi əl ilə
hazırlayır: şablonu açır, adları yazır, nömrə verir, PDF-ə çevirir, qovluğa atır,
müştəriyə göndərir. Hər sertifikat üçün eyni iyirmi dəqiqə.

Əsl problem vaxt deyil, **səhvdir**: əl ilə verilən nömrə təkrarlana bilər,
şablonda bir yer tutucu dolmamış qala bilər, yanlış PDF göndərilə bilər. Sənəd
rəsmi olduğu üçün bu səhvlərin bədəli böyükdür.

Upwork-dakı eyni tələbin sənədləşdirilmiş nümunəsi:
`~/Desktop/Projeler/upwork-proje-arastirma/ham-ilanlar/05-sertifika-uretimi-qr.md`
(Yunanıstan, gəmi test sertifikatları, Google Apps Script, 300 USD).

## 2. Məhsulun bir cümləsi

Cədvələ bir sətir yazılır, arxivlənmiş və nömrələnmiş rəsmi sənəd dəsti çıxır.

## 3. Kimin üçün

- **Birinci istifadəçi:** avadanlıq müayinəsi aparan kiçik firma (vinç, lift,
  yanğın sistemi, təzyiq qabı). İşçi cədvəldən başqa heç nə öyrənmir.
- **İkinci istifadəçi:** sertifikatı alan müştəri — PDF-i açır, QR-ı oxudur.
- **Üçüncü istifadəçi:** portfelə baxan potensial müştəri və YouTube izləyicisi.

## 4. Əhatə

**Daxildir (v1):**
- Dörd sekməli Google Sheet (verilən, şablonlar, eşləmə, jurnal)
- Status hücrəsi dəyişəndə işə düşən quraşdırılan tetikleyici
- 7 simvolluq təkrarsız referans kodu və onun jurnalı
- İki dilli şablon (az / en), dil sütununa görə seçim
- 4 səhifəlik Doc + PDF, 2 səhifəlik qısa versiya Doc + PDF
- QR kodu (düz mətn yükü)
- Sertifikata məxsus Drive qovluğu, dörd fayl içində
- Səhvin cədvəldə görünməsi

**Xaricdir (v1-də yoxdur):**
- QR-dan açılan doğrulama səhifəsi (ikinci mərhələ)
- Menyudan əl ilə işə salma
- E-poçt göndərmə
- Sahibkar paneli, istifadəçi rolları
- Toplu (bulk) generasiya

## 5. Verilənlər modeli

Dörd sekmə. İnsanın yazdığı sütunlarla sistemin yazdıqları qəsdən ayrılıb —
qarışarsa kimin nəyi pozduğu bilinmir.

### `Sertifikatlar` — hər sətir bir sertifikat

| Sütun | Kim yazır |
|---|---|
| Status (`Layihə` / `Hazır` / `Verilib` / `Xəta`) | insan |
| Dil (`az` / `en`) | insan |
| Avadanlıq adı, seriya nömrəsi, istehsalçı | insan |
| Sifarişçi firma | insan |
| Test tarixi, növbəti müayinə tarixi | insan |
| Müayinə edən | insan |
| Nəticə — **kod** yazılır: `PASS` / `FAIL` | insan |
| Referans kodu | **sistem** |
| Qovluq linki, PDF linki | **sistem** |
| Veriliş vaxtı | **sistem** |
| Xəta mesajı | **sistem** |

### `Şablonlar`

| Dil | Şablon Doc ID | Qısa versiya neçənci səhifə sonunda kəsilir |
|---|---|---|
| az | … | 2 |
| en | … | 2 |

Üçüncü sütun bəzək deyil: qısa versiyanın kəsmə nöqtəsini məhz o təyin edir.
Gələcəkdə 3 səhifəlik qısa versiya lazım olsa, kod deyil bu xana dəyişir.

### `Eşləmə` — layihənin ən vacib cədvəli

| Dil | Yer tutucu | Sütun | Format | Dəyər əvəzləmə |
|---|---|---|---|---|
| az | `{{EQUIPMENT}}` | Avadanlıq adı | text | |
| az | `{{SERIAL}}` | Seriya nömrəsi | text | |
| az | `{{COMPANY}}` | Sifarişçi firma | text | |
| az | `{{TEST_DATE}}` | Test tarixi | date | |
| az | `{{NEXT_DATE}}` | Növbəti müayinə | date | |
| az | `{{INSPECTOR}}` | Müayinə edən | text | |
| az | `{{RESULT}}` | Nəticə | enum | `PASS=UYĞUNDUR;FAIL=UYĞUN DEYİL` |
| az | `{{REF}}` | Referans kodu | text | |
| az | `{{QR}}` | — | qr | |
| en | `{{RESULT}}` | Nəticə | enum | `PASS=CONFORMS;FAIL=DOES NOT CONFORM` |
| en | … | … | … | |

**`Dil` sütunu niyə lazımdır.** İki dil seçildiyi üçün bəzi dəyərlər dilə görə
dəyişməlidir. `Nəticə` sütununda insan **kod** yazır (`PASS` / `FAIL`), ekranda
görünən söz isə şablonun dilinə görə `Dəyər əvəzləmə` xanasından oxunur. Belə
olmasa ingilis sertifikatın üzərində azərbaycanca «UYĞUNDUR» yazardı.

Qalan yer tutucular hər iki dildə eyni sütundan oxunur, ona görə `en` sətirləri
yalnız fərqlənənlər üçün yazılır; tapılmayan yer tutucu `az` sətrindən götürülür.

Elanın «yeni şablon və sahə əlavə etmək böyük kod dəyişikliyi tələb etməsin»
maddəsinin cavabı buradadır: yeni sahə = bu cədvələ bir sətir, yeni dil = bir
neçə sətir. Kod dəyişmir.

### `Jurnal` — yalnız əlavə olunan qeyd

| Referans kodu | Sətir nömrəsi | Veriliş vaxtı | Qovluq ID |

Təkrarsızlıq bu cədvələ qarşı yoxlanılır, `Sertifikatlar` sekməsinə qarşı yox.
Səbəb: **sətir silinsə belə kod geri qayıtmamalıdır.** Sertifikat bir dəfə
dünyaya çıxıbsa, nömrəsi ölür.

## 6. Axın

```
Status hücrəsi «Hazır» edilir
        ↓
① doğrulama     məcburi sahələr dolu, növbəti müayinə test tarixindən sonra
        ↓
② kod           7 simvol üretilir, Jurnal ilə toqquşma yoxlanılır
        ↓               (sətirdə kod varsa YENİSİ ÜRETİLMİR)
③ şablon        dilə görə Doc seçilir, KOPYASI çıxarılır
        ↓
④ doldurma      Eşləmə cədvəlinə görə yer tutucular əvəz olunur
        ↓
⑤ QR            mətn yükü hazırlanır, şəkil {{QR}} yerinə qoyulur
        ↓
⑥ PDF           4 səhifəlik PDF alınır
        ↓
⑦ qısa versiya  kopyanın kopyası → 2-ci səhifə sonundan sonrası silinir → Doc + PDF
        ↓
⑧ qovluq        `KOD — Avadanlıq` qovluğu açılır, dörd fayl içəri köçürülür
        ↓
⑨ geri yazma    kod, linklər, tarix sətirə yazılır; Status → «Verilib»
```

Qovluq **ən sonda** açılır. Səbəb: bir addım pozularsa yarımçıq dolu sertifikat
qovluğu qalmasın — yarımçıq qovluq təhlükəlidir, oradan səhv fayl göndərilə bilər.

**Təkrar işə salma qaydası:** sətirdə kod varsa **kod saxlanılır**, fayllar eyni
qovluqda yenilənir. Yazı səhvi düzəldilə bilər, referans nömrəsi dəyişməz.

## 7. Sənədin özü — görünüş

Bu bölmə texniki deyil, amma bu layihədə texniki hissə qədər vacibdir: videonun
təsiri «cədvələ sətir yazdım, **rəsmi sənəd** çıxdı» anındadır. Çıxan sənəd ucuz
görünürsə, maşın da ucuz görünür.

### Səhifə bölgüsü

**Səhifə 1 — sertifikatın üzü**
- Yuxarıda: təşkilat adı və loqo yeri; sağda böyük punto ilə **referans kodu**
- Başlıq: `AVADANLIĞIN TEXNİKİ MÜAYİNƏ SERTİFİKATI` / `EQUIPMENT INSPECTION CERTIFICATE`
- Künyə bloku: avadanlıq, seriya nömrəsi, istehsalçı, sifarişçi firma
- **Nəticə** — tək söz, böyük punto, yeganə vurğu rəngi ilə: `UYĞUNDUR` / `CONFORMS`
- Test tarixi və etibarlılıq (növbəti müayinə tarixi)
- Alt kolontitul: referans kodu + QR

**Səhifə 2 — test nəticələri**
- Cədvəl: aparılan test · tətbiq olunan standart · ölçülən qiymət · hədd · nəticə
- İmza bloku: müayinə edənin adı, imza sahəsi, tarix

**Səhifə 3 — müşahidələr**
- Sərbəst qeydlər və şəkil yerləri

**Səhifə 4 — şərtlər**
- Tətbiq olunan standartların siyahısı, məhdudiyyətlər, sertifikatın əhatəsi

### Niyə qısa versiya məhz 2 səhifədir

Bu təsadüf deyil və müştərinin tələbini izah edir: **1-ci və 2-ci səhifə birlikdə
öz-özünə tam sənəddir** — kimlik, nəticə və imza. Müştəriyə göndərilən budur.
4 səhifəlik versiya isə tam qeyddir, arxivdə qalır.

Yəni qısa versiya «kəsilmiş sənəd» deyil, ayrıca məqsədi olan sənəddir. Bu
anlayış təklifdə yazılsa, müştəri qarşısında fərq yaradır.

### Tipografika və rəng

- Başlıq: serif — rəsmiyyət hissi verir
- Məlumat və cədvəllər: sans-serif
- Referans kodu: monospace — oxunaqlı, səhv oxunmur
- Rəng: mətn qara, incə xətlər boz, **yalnız bir vurğu rəngi** və o da yalnız
  nəticə sətrində. Bəzək yoxdur.

Şriftlər Google Docs-un təklif etdiyi Google Fonts siyahısından seçilir.

## 8. Üç texniki düyün

### Səhifə kəsmə

Google Docs-da «səhifə» quruluşu yoxdur — sənəd düz axındır, səhifələnmə ekranda
hesablanır. Ona görə «ilk iki səhifə» yalnız şablonda **açıq səhifə sonu
işarələri** varsa təyin olunur.

Şablonu biz yazdığımız üçün işarələri əvvəldən qoyuruq; qısa versiya ikinci
işarədən sonrasını silir. Beləliklə məzmun uzanıb ekranda sürüşsə də kəsmə yeri
sabit qalır — səhifəni **vizual deyil, struktur** olaraq təyin edirik.

Bu, Upwork müştərisinə veriləcək ilk texniki sualdır: sizin şablonda o işarələr
varmı?

### QR üretimi

Apps Script-in QR üreteci yoxdur. Kənar xidmətdən şəkil çəkilib yerləşdiriləcək.
**Hansı xidmətin bu gün işlədiyi qurulma zamanı yoxlanılacaq** — əvvəllər hamının
işlətdiyi Google xidməti bağlanıb; indidən ad yazılmır.

Bu kənar asılılıq yaradır və qaydası belədir: **QR alınmasa sertifikat ümumiyyətlə
üretilmir.** QR-sız müayinə sertifikatı, olmayan sertifikatdan təhlükəlidir.

Ehtiyat yol (yalnız xidmət etibarsız çıxarsa): QR matrisi öz kodumuzda hesablanıb
Docs cədvəli kimi çəkilir.

### Tetikleyici səlahiyyəti

Apps Script-in sadə `onEdit` tetikleyicisi məhdud kontekstdə işləyir — Drive-a
yaza bilmir, sənəd aça bilmir, kənara sorğu göndərə bilmir. Bizim axın üçünü də
edir.

Ona görə **quraşdırılan (installable) tetikleyici** lazımdır və o, bir dəfə əl ilə
işə salınan `quraşdır()` funksiyası ilə yaradılır. Bu real quraşdırma addımıdır,
README-də və videoda yerini alacaq.

## 9. Xəta idarəsi

Bir prinsip: **hər nasazlıq cədvəldə görünür, səssizcə udulmur.**

| Nasazlıq | Davranış |
|---|---|
| Məcburi sahə boş | Status → `Xəta`, mesaj yazılır, heç bir fayl üretilmir |
| Dil üçün şablon təyin olunmayıb | `Xəta` |
| Şablonda uyğunlaşmayan yer tutucu qalıb | `Xəta` — üzərində `{{INSPECTOR}}` yazan sertifikat çıxmır |
| QR alınmadı | `Xəta` |
| İkinci səhifə sonu tapılmadı | `Xəta` — səhv yerdən kəsilmiş qısa versiya çıxmır |
| İstənilən addımda pozulma | üretilmiş müvəqqəti fayllar silinir, qovluq açılmır |

Üçüncü sətir asan gözdən qaçır, amma vacibdir: eşləmə cədvəlində qarşılığı olmayan
yer tutucu şablonda qalarsa, sistem onu olduğu kimi buraxıb sertifikatı üretərdi.
Bunun əvəzinə dayanır.

## 10. Arxitektura

Yer: `~/Developer/mohur` (Desktop deyil — [[node-cli-bash-donur]] ölçüsü).

Yazılır TypeScript-də, `esbuild` ilə tək bir `.gs` faylına yığılır, `clasp` ilə
Apps Script layihəsinə göndərilir.

```
src/
  core/              Google API-si YOX — saf funksiyalar, vitest ilə örtülür
    types.ts
    code.ts          7 simvolluq kod + toqquşma yoxlaması
    mapping.ts       sətir + eşləmə → dolu dəyərlər; çatışmayan yer tutucu aşkarı
    naming.ts        qovluq və fayl adları, qadağan simvolların təmizlənməsi
    validate.ts      məcburi sahələr, tarix məntiqi
    qr.ts            QR yük mətninin qurulması (şəkil çəkmək deyil — yalnız mətn)
  gs/                incə adaptörlər — burada məntiq yoxdur
    trigger.ts       quraşdırılan onEdit girişi
    sheet.ts         SpreadsheetApp
    doc.ts           DocumentApp — kopyalama, əvəzləmə, səhifə kəsmə
    drive.ts         DriveApp — qovluq, köçürmə, PDF
    qrImage.ts       UrlFetchApp — QR şəklinin gətirilməsi
    setup.ts         quraşdır() — tetikleyicini yaradır
tests/
  unit.test.ts
  acceptance.test.ts   saxta cədvəl və saxta sənəd adaptörləri ilə tam axın
build/
  bundle.mjs
```

**Sərhəd qaydası:** `src/core/` heç nə import etmir — nə Apps Script tipləri, nə
şəbəkə. Girişi və çıxışı sadə dəyərlərdir. Məhsulun riskli hissələri buradadır və
buna görə Google hesabı olmadan, saniyələr içində test edilir.

`src/gs/` qərar vermir; oxuyur, yazır və `core`-a soruşur.

## 11. Test strategiyası

`npm test` — Google hesabı olmadan:

**`unit.test.ts`**
- kod: 7 simvol, verilmiş dəstlə toqquşmanın rədd edilməsi, enjekte edilmiş
  təsadüfilik ilə deterministik davranış
- eşləmə: tarix formatı, çatışmayan yer tutucunun aşkarlanması, artıq sütunun
  nəzərə alınmaması
- adlandırma: qadağan simvollar, çox uzun avadanlıq adı, boş ad
- doğrulama: məcburi sahələr, növbəti müayinə > test tarixi
- QR yükü: bütün dörd sahənin daxil olması
- dəyər əvəzləmə: `PASS` kodunun `az`-da «UYĞUNDUR», `en`-də «CONFORMS» olması;
  naməlum kodun xəta verməsi

**`acceptance.test.ts`** — saxta adaptörlərlə tam axın, ssenarilər:
1. Düzgün sətir → dörd fayl, qovluq, geri yazılmış kod
2. Məcburi sahə boş → heç bir fayl üretilmir, Status `Xəta`
3. Sətirdə kod var → yeni kod üretilmir, eyni qovluq
4. Eşləmədə olmayan yer tutucu → `Xəta`
5. QR alınmır → `Xəta`, qovluq açılmır
6. Şablon tapılmır → `Xəta`
7. Səhifə sonu tapılmır → `Xəta`
8. Ortada pozulma → müvəqqəti fayllar silinir

**Adaptör qatı əl ilə yoxlanılır**, yazılı kontrol siyahısı ilə. Google API-lərini
saxtalaşdırmaq saxta əminlik verir.

## 12. Uğur meyarları

1. `npm test` Google hesabı olmadan tam keçir.
2. Cədvəldə status dəyişəndə dörd fayl düzgün qovluqda yaranır.
3. Eyni referans kodu iki dəfə verilmir — sətir silinsə belə.
4. Yarımçıq doldurulmuş sertifikat heç vaxt üretilmir.
5. QR telefonla oxunur və dörd sahəni göstərir.
6. İki dil eyni kod yolu ilə işləyir; ikinci şablon əlavə etmək kod dəyişikliyi
   tələb etmir.
7. Çıxan PDF çap edilib imzalansa rəsmi sənəd kimi qəbul ediləcək görkəmdədir.

## 13. Portfel məhdudiyyəti

Digər layihələrdən fərqli olaraq **bunun tıklanabilən canlı linki ola bilməz.**
Apps Script bir Google hesabının içində işləyir; ziyarətçi sınamaq üçün cədvəli
öz Drive-ına kopyalayıb skriptə səlahiyyət verməlidir. Heç kim bunu etməz.

Həll: maşını yox, **çıxışını** paylaşmaq.

- **Video** — əsas portfel parçası
- **GitHub reposu** — kod açıq ([[portfolio-sitesi]] qaydası)
- **Paylaşılan Drive qovluğu** — içində həqiqətən üretilmiş 3-4 sertifikat.
  Müştəri PDF-i açıb **QR-ı öz telefonu ilə oxuda bilər.**

Üçüncüsü tıklanabilən demodan daha somutdur, çünki əllə tutulur.

## 14. Xarici asılılıqlar

| Asılılıq | Status | Bloklayır |
|---|---|---|
| Google hesabı | var | — |
| `clasp` CLI | **qurulmayıb** | Apps Script-ə göndərməni |
| QR şəkil xidməti | seçilməyib | yalnız QR addımını |
| API açarı, ödəniş | **lazım deyil** | — |

`clasp` qurulması plana daxildir. Bu, istifadəçinin ilk Apps Script layihəsidir.

## 15. Sonraya

- QR-dan açılan doğrulama səhifəsi («bu sertifikat etibarlıdır»)
- Menyudan əl ilə təkrar üretim
- Sertifikatın müştəriyə e-poçtla göndərilməsi
- Üçüncü dil / üçüncü şablon (arxitektura hazırdır)

## 16. Əlaqəli sənədlər

- Tələb dəlili: `~/Desktop/Projeler/upwork-proje-arastirma/ham-ilanlar/05-sertifika-uretimi-qr.md`
- Qardaş layihələr: [[cavabsiz-sual-project]] (eyni saf-nüvə kalıbı),
  [[bos-kreslo-project]]
- Portfel: [[portfolio-sitesi]]
