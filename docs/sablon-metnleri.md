# Şablon mətnləri

İki Google Docs sənədi yaradılır: biri azərbaycanca, biri ingiliscə. Hər ikisi
**4 səhifədir** və səhifələr arasında **açıq səhifə sonu** olmalıdır.

## Ən vacib qayda

Səhifələr arasına `Insert → Break → Page break` qoyulur. Enter basaraq boşluq
buraxmaq **işləmir** — Google Docs-da «səhifə» quruluşu yoxdur, sistem yalnız
açıq işarəni görür. İşarə olmasa qısa versiya kəsilmir və sistem dayanır.

Toplam **3 səhifə sonu** olacaq (1→2, 2→3, 3→4). Qısa versiya **2-ci** işarədən
sonrasını silir, yəni 1-ci və 2-ci səhifə qalır.

## Yer tutucular

Hamısı iki qıvrım mötərizə içində, böyük hərflə. Şablonda olan hər yer tutucunun
`Eşləmə` sekməsində qarşılığı olmalıdır — olmasa sistem sertifikat üretmir.

| Yer tutucu | Nə gəlir |
|---|---|
| `{{REF}}` | 7 simvolluq referans kodu |
| `{{EQUIPMENT}}` | Avadanlığın adı |
| `{{SERIAL}}` | Seriya nömrəsi |
| `{{MANUFACTURER}}` | İstehsalçı |
| `{{COMPANY}}` | Sifarişçi firma |
| `{{TEST_DATE}}` | Müayinə tarixi |
| `{{NEXT_DATE}}` | Növbəti müayinə tarixi |
| `{{INSPECTOR}}` | Müayinə edən şəxs |
| `{{RESULT}}` | UYĞUNDUR / UYĞUN DEYİL (dilə görə) |
| `{{QR}}` | QR şəkli buraya qoyulur |

`{{QR}}` yer tutucusu **öz abzasında tək** dursun. Sistem o abzasın mətnini
silib yerinə şəkil qoyur; yanında başqa mətn olsa o da silinər.

## Tipografika

- Başlıqlar: serif (məsələn **Playfair Display** və ya **Lora**)
- Məlumat və cədvəllər: sans-serif (**Inter**, **Roboto**)
- `{{REF}}`: monospace (**Roboto Mono**) — səhv oxunmasın
- Rəng: mətn qara, xətlər boz, **yalnız `{{RESULT}}` sətri vurğu rəngində**

---

# AZƏRBAYCANCA ŞABLON

## Səhifə 1 — sertifikatın üzü

```
[LOQO]                                      SERTİFİKAT №
                                            {{REF}}
────────────────────────────────────────────────────────

        AVADANLIĞIN TEXNİKİ MÜAYİNƏ SERTİFİKATI


Avadanlıq              {{EQUIPMENT}}
Seriya nömrəsi         {{SERIAL}}
İstehsalçı             {{MANUFACTURER}}
Sifarişçi              {{COMPANY}}


                      {{RESULT}}


Müayinə tarixi         {{TEST_DATE}}
Növbəti müayinə        {{NEXT_DATE}}

────────────────────────────────────────────────────────
Sertifikat nömrəsi: {{REF}}

{{QR}}

Bu sənəd elektron üsulla üredilib. QR kodu oxudaraq
məlumatları yoxlaya bilərsiniz.
```

→ **SƏHİFƏ SONU**

## Səhifə 2 — müayinə nəticələri

```
MÜAYİNƏ NƏTİCƏLƏRİ                          {{REF}}
────────────────────────────────────────────────────────

| Yoxlanılan | Tətbiq olunan standart | Ölçülən | Hədd | Nəticə |
|---|---|---|---|---|
| Yük qaldırma qabiliyyəti |  |  |  |  |
| Əyləc sistemi |  |  |  |  |
| Polad kanat və qarmaq |  |  |  |  |
| Elektrik təchizatı |  |  |  |  |
| Qoruyucu qurğular |  |  |  |  |

Ümumi nəticə: {{RESULT}}


────────────────────────────────────────────────────────

Müayinəni apardı


{{INSPECTOR}}
İmza: ______________________      Tarix: {{TEST_DATE}}

                                  [MÖHÜR YERİ]
```

→ **SƏHİFƏ SONU**

## Səhifə 3 — müşahidələr

```
MÜŞAHİDƏLƏR VƏ QEYDLƏR                      {{REF}}
────────────────────────────────────────────────────────

Avadanlıq: {{EQUIPMENT}} ({{SERIAL}})


Müşahidələr:




Şəkillər:

[şəkil sahəsi]          [şəkil sahəsi]


Tövsiyələr:
```

→ **SƏHİFƏ SONU**

## Səhifə 4 — şərtlər

```
TƏTBİQ OLUNAN STANDARTLAR VƏ ŞƏRTLƏR        {{REF}}
────────────────────────────────────────────────────────

Tətbiq olunan standartlar:
•
•
•

Müayinənin əhatəsi:
Bu sertifikat yalnız {{TEST_DATE}} tarixində, müayinə anındakı
vəziyyəti əks etdirir.

Məhdudiyyətlər:
• Sertifikat yalnız {{NEXT_DATE}} tarixinə qədər etibarlıdır.
• Avadanlıqda konstruktiv dəyişiklik edilərsə sertifikat qüvvədən düşür.
• Sertifikat avadanlığın istismar qaydalarına riayət olunmasını zəmanət etmir.

Sifarişçi: {{COMPANY}}
Sertifikat nömrəsi: {{REF}}
```

---

# İNGİLİSCƏ ŞABLON

Quruluş eynidir, yalnız mətn ingiliscədir. Yer tutucular **dəyişmir** —
eyni adlar işlənir, sistem dəyəri dilə görə həll edir.

## Page 1

```
[LOGO]                                      CERTIFICATE No.
                                            {{REF}}
────────────────────────────────────────────────────────

        EQUIPMENT INSPECTION CERTIFICATE


Equipment              {{EQUIPMENT}}
Serial number          {{SERIAL}}
Manufacturer           {{MANUFACTURER}}
Client                 {{COMPANY}}


                      {{RESULT}}


Date of inspection     {{TEST_DATE}}
Next inspection due    {{NEXT_DATE}}

────────────────────────────────────────────────────────
Certificate number: {{REF}}

{{QR}}

This document was generated electronically. Scan the QR
code to verify its details.
```

→ **PAGE BREAK**

## Page 2

```
INSPECTION RESULTS                          {{REF}}
────────────────────────────────────────────────────────

| Item checked | Standard applied | Measured | Limit | Result |
|---|---|---|---|---|
| Lifting capacity |  |  |  |  |
| Braking system |  |  |  |  |
| Wire rope and hook |  |  |  |  |
| Electrical supply |  |  |  |  |
| Safety devices |  |  |  |  |

Overall result: {{RESULT}}


────────────────────────────────────────────────────────

Inspection carried out by


{{INSPECTOR}}
Signature: ______________________   Date: {{TEST_DATE}}

                                  [STAMP]
```

→ **PAGE BREAK**

## Page 3

```
OBSERVATIONS AND NOTES                      {{REF}}
────────────────────────────────────────────────────────

Equipment: {{EQUIPMENT}} ({{SERIAL}})


Observations:




Photographs:

[image area]            [image area]


Recommendations:
```

→ **PAGE BREAK**

## Page 4

```
STANDARDS APPLIED AND CONDITIONS            {{REF}}
────────────────────────────────────────────────────────

Standards applied:
•
•
•

Scope of inspection:
This certificate reflects the condition of the equipment as
observed on {{TEST_DATE}} only.

Limitations:
• This certificate is valid until {{NEXT_DATE}}.
• Any structural modification to the equipment voids this certificate.
• This certificate does not warrant compliance with operating procedures.

Client: {{COMPANY}}
Certificate number: {{REF}}
```

---

## Şablon hazır olanda

1. Hər iki sənədin URL-indən ID-ni götür:
   `docs.google.com/document/d/`**`BU HİSSƏ`**`/edit`
2. `Şablonlar` sekməsinə yaz: `az` sətrinə azərbaycanca ID, `en` sətrinə ingiliscə ID
3. `Sertifikatlar` sekməsində nümunə sətrin Status sütununu «Hazır» et

Nə gözlənilir: Drive-da `Möhür — sertifikatlar` qovluğu içində
`KOD — Qüllə kran KB-403` adlı qovluq, içində dörd fayl.
