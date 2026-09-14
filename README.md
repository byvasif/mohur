# Möhür

Avadanlıq müayinə sertifikatlarını Google Sheet sətrindən üredən sistem.

Cədvəldə **Status** sütunu «Hazır» edilir. Sistem özü:

1. təkrarsız 7 simvolluq referans kodu verir
2. dilə uyğun şablonun kopyasını doldurur
3. QR kodu yerləşdirir
4. 4 səhifəlik Doc + PDF, 2 səhifəlik qısa versiya Doc + PDF üredir
5. sertifikata məxsus Drive qovluğu açıb dörd faylı içinə yığır
6. linkləri cədvələ geri yazır

## Fərqi nədir

**Yarımçıq sənəd üretilmir.** Hər hansı addım pozularsa — QR alınmasa, şablonda
eşlənməmiş yer tutucu qalsa, səhifə sonu tapılmasa — o ana qədər yaradılmış
fayllar silinir, qovluq heç açılmır və səbəb cədvəldə görünür.

**Nömrə ölümsüzdür.** Verilmiş kodlar ayrıca jurnalda saxlanılır. Cədvəldən sətir
silinsə belə o nömrə ikinci dəfə verilmir.

**Kod dəyişmədən genişlənir.** Hansı yer tutucunun hansı sütundan dolduğu
`Eşləmə` sekməsindədir. Yeni sahə = bir sətir. Yeni dil = bir neçə sətir.

## Sürətli başlanğıc

```bash
npm install
npm test        # 58 test — Google hesabı LAZIM DEYİL
npm run typecheck
npm run build   # dist/Code.gs üredir
```

Məntiqin hamısı `src/core/` altındadır və Google API-si görmür. Ona görə bütün
riskli hissələr — kod təkrarsızlığı, eşləmə, doğrulama, təmizləmə — hesabsız,
saniyələr içində yoxlanılır.

## Quraşdırma

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Möhür" --rootDir dist
npm run push
```

Sonra cədvəldə:

1. Dörd sekmə yaradılır: `Sertifikatlar`, `Şablonlar`, `Eşləmə`, `Jurnal`
2. İki Google Docs şablonu hazırlanır (az və en), ID-ləri `Şablonlar` sekməsinə yazılır
3. Apps Script redaktorunda **`setup`** funksiyası bir dəfə işə salınır

`setup` quraşdırılan tetikleyicini yaradır. Bu addım məcburidir: Apps Script-in
sadə `onEdit` tetikleyicisi məhdud kontekstdə işləyir — Drive-a yaza bilmir,
sənəd aça bilmir, kənara sorğu göndərə bilmir. Üçü də bu sistemə lazımdır.

## Şablon qaydası

Şablonda **açıq səhifə sonu işarələri** olmalıdır. Google Docs-da «səhifə»
quruluşu yoxdur — sənəd düz axındır, səhifələnmə ekranda hesablanır. Qısa
versiya məhz bu işarələrə görə kəsilir; işarə yoxdursa sistem dayanır və səhv
yerdən kəsilmiş sənəd üretmir.

Səhifə bölgüsü:

| Səhifə | Məzmun |
|---|---|
| 1 | Sertifikatın üzü: künyə, nəticə, tarixlər, referans kodu, QR |
| 2 | Test nəticələri cədvəli və imza bloku |
| 3 | Müşahidələr və şəkillər |
| 4 | Tətbiq olunan standartlar və şərtlər |

**Qısa versiya niyə 2 səhifədir:** 1-ci və 2-ci səhifə birlikdə öz-özünə tam
sənəddir — kimlik, nəticə, imza. Müştəriyə göndərilən budur; 4 səhifəlik
versiya arxivdə qalır.

## Əl ilə yoxlama siyahısı

`src/gs/` altındakı adaptörlər avtomatik test edilmir — Google API-lərini
saxtalaşdırmaq saxta əminlik verir. Onların yerinə bu siyahı:

- [ ] `setup` işə salındı, tetikleyici siyahıda göründü
- [ ] Status «Hazır» ediləndə dörd fayl yarandı
- [ ] Dörd fayl `KOD — Avadanlıq` qovluğunun içindədir, kökdə qalan yoxdur
- [ ] Referans kodu sətirə geri yazıldı və `Jurnal` sekməsinə düşdü
- [ ] Qısa versiya **2 səhifədir** və sonunda boş səhifə yoxdur
- [ ] PDF-dəki QR telefonla oxunur və dörd sahəni göstərir
- [ ] Alt kolontituldakı referans kodu doğru yazılıb
- [ ] Eyni sətir ikinci dəfə «Hazır» ediləndə **kod dəyişmir**
- [ ] Dil `en` ediləndə ingilis şablonu işlənir və nəticə `CONFORMS` yazılır
- [ ] Məcburi sahə boş olanda heç bir fayl yaranmır, səbəb `Xəta` sütununda görünür
- [ ] Şablona uydurma `{{YOXDUR}}` əlavə ediləndə sistem dayanır

## Məhdudiyyətlər

**Tıklanabilən canlı demo ola bilməz.** Apps Script bir Google hesabının
içində işləyir; ziyarətçi sınamaq üçün cədvəli öz Drive-ına kopyalayıb skriptə
səlahiyyət verməlidir. Portfel üçün paylaşılan şey maşın deyil, **çıxışıdır**:
üretilmiş sertifikatların olduğu Drive qovluğu.

**QR kənar xidmətdən gəlir** (quickchart.io, 2026-09-14-də yoxlanılıb). Xidmət
cavab verməsə sertifikat üretilmir — QR-sız müayinə sertifikatı, olmayan
sertifikatdan təhlükəlidir. Ehtiyat xidmət koda şərh kimi yazılıb.

## Sənədlər

- Dizayn: `docs/superpowers/specs/2026-09-14-mohur-design.md`
