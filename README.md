# Biliyard160

Biliard xonasi uchun taymer, bar/oshxona savdosi va tushum hisobi tizimi.
Statik sayt (HTML, CSS, JavaScript) + Supabase (baza va login) + Vercel (hosting). Hammasi bepul tarifda ishlaydi.

## Imkoniyatlar
- Login va parol bilan kirish (bitta admin)
- 3 ta stol: Boshlash, Mahsulot qo'shish, Tugatish va chek
- Tarif: 1 soat = 40 000 so'm (Menyu sahifasidan o'zgartiriladi), summa 100 so'mgacha yaxlitlanadi
- Vaqt serverda hisoblanadi: sahifa yangilansa yoki kompyuter o'chsa ham taymer to'xtamaydi
- Tayyor menyu (qo'shish, tahrirlash, o'chirish), stolga mahsulot qo'shish, miqdorni o'zgartirish
- Ekranda chek: brend, stol, davomiylik, vaqt puli, mahsulotlar, jami
- Hisobot: bugungi tushum, shu oy tushumi, bugungi cheklar tarixi
- Dark/Light rejim (quyosh/oy tugmasi), o'zbek tili, telefon va planshetga moslashgan

## Tuzilma
```
index.html           sahifa (login, stollar, menyu, hisobot)
css/style.css        dizayn, ranglar, dark/light rejim
js/config.js         Supabase URL va kalit (o'zingiz to'ldirasiz)
js/app.js            butun mantiq
supabase/schema.sql  jadvallar, xavfsizlik (RLS), start_table va close_table funksiyalari
vercel.json          hosting sozlamasi
```

## 1. Supabase'ni sozlash
1. supabase.com da bepul akkaunt va yangi loyiha oching.
2. **SQL Editor** > New query, `supabase/schema.sql` faylining hammasini qo'yib **Run** bosing.
3. **Authentication > Users > Add user > Create new user**:
   - Email: `admin@biliyard160.uz`
   - Password: o'zingiz tanlagan kuchli parol
   - **Auto Confirm User** belgisini yoqing.
4. **Authentication > Sign In / Providers > Email** bo'limida "Allow new users to sign up" ni **o'chiring**.
5. **Project Settings > API** dan **Project URL** va **anon public** kalitni `js/config.js` ga yozing.

Saytda login qismiga faqat `admin` yoziladi (tizim o'zi `admin@biliyard160.uz` ga aylantiradi), parol Supabase'da qo'ygan parolingiz.
Boshqa login xohlasangiz, Supabase'da email'ni `nom@biliyard160.uz` shaklida yarating va saytda `nom` deb kiring.

## 2. GitHub va Vercel
1. Loyihani GitHub repo'ga yuklang (`js/config.js` dagi anon kalit ochiq bo'lishi xavfsiz).
2. vercel.com > Add New > Project > repo'ni tanlang. Framework: **Other**, Build command va Output directory bo'sh qoldiriladi. **Deploy** bosing.
3. Tayyor manzilda login qilib sinab ko'ring.

## Xavfsizlik
- Hamma jadvalda Row Level Security yoqilgan: faqat login qilgan foydalanuvchi o'qiy va yoza oladi.
- Ro'yxatdan o'tish o'chirilgan, shuning uchun begona odam akkaunt ocha olmaydi.
- `service_role` kalitini hech qachon kodga yozmang.

## Eslatmalar
- Internet kerak. Uzilsa, tizim ma'lumotni yangilay olmaydi.
- Supabase bepul tarifi 1 hafta umuman ishlatilmasa loyihani vaqtincha to'xtatadi. Har kuni ishlatilsa muammo yo'q.
- Yopilgan cheklarni tahrirlash yoki o'chirish yo'q (xodim firibgarligidan himoya).
