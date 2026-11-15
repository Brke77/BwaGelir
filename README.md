# KasaFlow

Türkçe kişisel gelir, gider ve bütçe yönetimi. Next.js App Router, React, strict TypeScript ve Supabase/PostgreSQL ile geliştirildi. Arayüz, hesaplama katmanı ve güvenlik testleri bu depoda bulunur.

## Hızlı başlangıç

Node.js 24 LTS kurulu olmalı. Bu bilgisayarda bağımlılıklar kurulmuştur.

```powershell
npm ci
npm run dev
```

Tarayıcı: **http://localhost:3000**. İzole demo: **http://localhost:3000/demo**.

Windows'ta kurulum hazır olduğundan **`BASLAT.cmd` dosyasına çift tıklamak** da yeterlidir. Açılan pencereyi açık tutun; tarayıcıda yukarıdaki adresi açın.

Gerçek hesap girişi için aşağıdaki Supabase kurulumunu yapın. Anahtarlar boşsa uygulama gerçek hesap oluşturmayı/girişi devre dışı bırakır ve demoya yönlendirir; demo kimlik doğrulamasını geçersiz kılmaz.

## Tam olarak hangi bilgiyi nereye yapıştıracağım?

Kök dizindeki **`.env.local` dosyası hazırdır**. Üç satırdaki `=` işaretinin sağına değerleri yazın. Dosya `.gitignore` ile Git'ten hariç tutulur.

GitHub veya kaynak ZIP kopyasında bu dosya güvenlik için yer almaz. Temiz bir kopyada `Copy-Item .env.example .env.local` komutuyla oluşturun.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJE-KODUNUZ.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_BURAYA_KENDI_ANAHTARINIZ
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Değişken                               | Nereden alınır?                                                           | Yerel kullanım          | Vercel'de                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase projesi → **Connect** → **Project URL**                          | `.env.local`            | Proje → Settings → Environment Variables                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Settings → API Keys → Publishable key** (`sb_publishable_…`) | `.env.local`            | Aynı adlı environment variable                            |
| `NEXT_PUBLIC_SITE_URL`                 | Uygulamanın kendi adresi                                                  | `http://localhost:3000` | `https://SIZIN-PROJENIZ.vercel.app` veya özel alan adınız |

Eski Supabase projelerindeki **anon/public** JWT anahtarı da kabul edilir. **`service_role`, `sb_secret_…`, database password veya Vercel token'ını bu dosyaya yapıştırmayın.** Uygulama secret/service-role anahtarıyla çalışmayı reddeder. Vercel API key/token kullanılması gerekmez; web panelinden hesabınızla yayınlayabilirsiniz.

Environment değiştiğinde geliştirme sunucusunu kapatıp yeniden açın. Vercel'de değişiklik sonrası **Redeploy** gerekir; `NEXT_PUBLIC_*` değerleri derleme sırasında bağlanır.

## Supabase: sıfırdan kurulum

1. [Supabase Dashboard](https://supabase.com/dashboard) üzerinde yeni proje açın. Database şifresini güvenli bir yerde saklayın; uygulama bu şifreyi istemez.
2. **SQL Editor → New query** açın.
3. [`supabase/migrations/202611150001_initial.sql`](supabase/migrations/202611150001_initial.sql) dosyasının **tamamını** yapıştırıp **Run** seçin. Bu dosya boş bir projeye bir kez uygulanır. Versiyonlanmış migration bir transaction içinde tabloları, kısıtları, index'leri, RLS politikalarını ve RPC fonksiyonlarını oluşturur.
4. Projenin URL'sini ve publishable key'ini yukarıdaki `.env.local` alanlarına yapıştırın.
5. **Authentication → URL Configuration** altında yerel geliştirme için:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback` ve `http://localhost:3000/auth/callback?next=/reset-password`
   - `127.0.0.1` ile çalışacaksanız bu adresin aynı callback'lerini de ekleyin ve `NEXT_PUBLIC_SITE_URL` değerini onunla eşleştirin. Tarayıcıda aynı host'u kullanın.
6. **Authentication → Providers → Email** etkin olsun. **Confirm email** açık tutulsun. Minimum şifre uzunluğunu **10** yapın. Canlı kullanım için kendi SMTP sağlayıcınızı bağlayın; Supabase'in deneme e-posta hizmeti üretim gönderimi yerine geçmez.
7. Uygulamayı yeniden başlatın, `/register` üzerinden kayıt olun, e-postadaki bağlantıyı açın. Gerçek kullanıcıya yalnızca varsayılan kategoriler ve tercihler eklenir; sahte para veya işlem eklenmez.

Varsayılan e-posta şablonundaki `{{ .ConfirmationURL }}` PKCE callback akışıyla desteklenir. E-postanın başka tarayıcıda açılmasını da desteklemek için Supabase Email Templates alanında şu doğrudan token-hash bağlantılarını kullanabilirsiniz:

```html
<!-- Confirm signup -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email"
  >E-posta adresimi doğrula</a
>

<!-- Reset password -->
<a
  href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password"
  >Şifremi sıfırla</a
>
```

Mevcut bir kullanıcı migration'dan önce yaratılmışsa varsayılan kategori trigger'ı geçmişe dönük çalışmaz. Uygulamadan kendi kategorilerini oluşturabilir; profil/tercihler ilk kayıtta upsert edilir. Tercihen şemayı kullanıcı oluşturmadan önce kurun.

Docker çalışan bir bilgisayarda isteğe bağlı yerel Supabase:

```powershell
npx supabase start
npx supabase db reset
```

`db reset` yalnızca atılabilir **yerel geliştirme veritabanında** kullanılmalıdır. Bu çalışmada Docker daemon aktif değildi; yerel Supabase Auth çalıştırılmadı.

## Vercel: yayınlama

Bu klasör Vercel'in Next.js derlemesine hazırdır. Hesap erişimi sağlanmadığından bir Vercel projesi veya canlı deployment oluşturulmadı.

1. GitHub hesabınızda boş bir **private repository** oluşturun. Bu projenin kaynak dosyalarını gönderin. `node_modules`, `.next`, `.env.local` ve diğer gizli ortam dosyalarını yüklemeyin. `.gitignore` hazırdır.
2. [Vercel](https://vercel.com/new) → **Add New → Project → Import Git Repository**.
3. Framework: **Next.js**; Root Directory: bu `package.json` dosyasının bulunduğu kök; Node.js: **24.x**. Build command `npm run build`, install `npm ci` olarak hazırlanmıştır.
4. **Environment Variables** bölümüne yukarıdaki üç değişkeni **aynı isimlerle** girin. Supabase URL/key için doğru projeyi seçin. Preview ve Development ortamlarında ayrı bir Supabase test projesi kullanın.
5. İlk Preview adresi belli olduğunda `NEXT_PUBLIC_SITE_URL` değerini o **tam HTTPS adresine** ayarlayıp Redeploy edin. Aynı adresin `/auth/callback` ve `/auth/callback?next=/reset-password` URL'lerini ilgili Supabase projesinin Redirect URLs listesine ekleyin.
6. Preview üzerinde kayıt, e-posta doğrulama, giriş, işlem kaydı, sayfa yenileme, şifre sıfırlama ve çıkışı kontrol edin. İki ayrı kullanıcıyla kayıt izolasyonunu canlı Supabase üzerinde de doğrulayın.
7. Production ortamında `NEXT_PUBLIC_SITE_URL=https://CANLI-ADRESINIZ` yapın. Production Supabase'de **Site URL** de bu adres olsun; callback URL'lerini ekleyin. Ardından Production'a yayınlayın/Redeploy edin.

Preview için geniş bir redirect wildcard yerine test edilen adresleri tek tek tanımlamak daha kontrollüdür. Vercel'in Preview deployment koruması açıksa e-posta bağlantısını açan kullanıcı da o Preview'a erişebilmelidir.

## Kullanılabilir özellikler

- Kayıt, giriş, çıkış, e-posta doğrulama callback'i, şifre unuttum/sıfırlama ve korunan uygulama sayfaları.
- Serbest isimli gelir/gider; kuruş hassasiyetinde tutar; açıklama; tarih; hesap ve kategori; düzenleme, onaylı silme, detay ve sayfalama.
- Türkçe sayı girişi: `1.250,50`. Negatif gelir/gider, sıfır, geçersiz/fazla hassas tutar ve gelecek tarihli gerçekleşmiş işlem reddedilir.
- Kategori oluşturma, isim/ikon/renk düzenleme, arşivleme, kullanılmayan kategoriyi silme; doğrudan işlem formundan kategori oluşturma.
- Banka, nakit, birikim ve diğer hesaplar; pozitif/negatif başlangıç bakiyesi; toplam varlığı değiştirmeyen atomik transfer.
- Altı finansal gösterge; dönem filtresi; gelir/gider grafiği; tıklanabilir kategori dağılımı; günlük/aylık/yıllık bakiye trendi; son işlemler.
- Aylık, kategori ve hesap kapsamlı bütçe; kalan/aşılan tutar ve %75/%90/%100 uygulama içi uyarılar.
- Günlük/haftalık/aylık/yıllık düzenli planlar; ay sonu/artık yıl uyarlaması; manuel gerçekleşme; aynı ödeme gününde çift kayıt koruması; geçmişi koruyan plan silme/pasifleştirme.
- Günlük/haftalık/aylık/yıllık gelir-gider raporları; kategori payları; önceki eşit uzunluktaki dönem karşılaştırması; ortalama gider, en yoğun gün ve en büyük giderler.
- Türkçe Excel uyumlu CSV ve tüm kayıtları içeren JSON indirme. CSV formula injection koruması.
- Açık/koyu/sistem teması; profil, bildirim tercihi; şifreyle doğrulanmış finansal veri temizleme.
- Ayrı ve açıkça etiketli demo; gerçek kullanıcılarda ilk hesap onboarding'i.
- Mobil alt navigasyon, mobil form paneli, tablet/masaüstü sidebar; manifest ve uygulama ikonları; ana ekrana ekleme.
- `N`: yeni işlem, `/`: genel arama, `Esc`: pencereyi kapat.

## Finansal kurallar

Tüm tutarlar veritabanında `bigint` **kuruş** alanıdır. Kullanıcı girdisi önce string/BigInt ile parse edilir; hesaplamalar güvenli integer aralığında yapılır. `sumMoney` güvenli sınır aşıldığında sessizce yuvarlamak yerine hata verir. Tek kayıt sınırı 1 milyar TL'dir. Çoklu para birimi/kur dönüşümü uygulanmamıştır; yalnızca TRY desteklenir.

Toplam bakiye, bütün hesapların başlangıç bakiyeleri ve **tüm geçmiş gerçekleşmiş hareketler** üzerinden SQL ile hesaplanır. Seçili dönem net akışı yalnızca o dönemin gelir eksi gideridir. Transfer ikisine de girmez. Gelir sıfırsa tasarruf oranı `null` olur; arayüz açıklama gösterir.

Bütçe her zaman ilgili **tam takvim ayı** üzerinden hesaplanır. “Bugün” gibi kısa bir filtre seçilse bile aylık bütçenin anlamı değişmez. Birden çok/örtüşen bütçenin harcamasını toplayarak çift sayım yapmamak için dashboard “Bütçe kullanımı” göstergesi, seçili aylardaki **en yüksek bireysel bütçe kullanım yüzdesini** gösterir. Her bütçenin kendi harcama/limit/kalan tutarı ayrıca görünür.

Başlangıç bakiyesi, içeri girilen en eski işlemden önceki bakiye olarak ele alınır; ayrı bir açılış tarihi yoktur. Gelecek tarihli gerçek işlem yerine düzenli plan kullanılır. Henüz gerçekleşmeyen planlar hesaptan düşmez. Gerçekleşmiş düzenli işlem sonradan silinse bile aynı ödeme tarihinin ikinci kez gerçekleştirilmesini engelleyen kayıt tutulur; düzeltme için mevcut finansal hareketi düzenlemek tercih edilir.

## Mimari ve güvenlik

```text
src/app/                 Next.js sayfaları, auth callback ve API route'ları
src/components/          Responsive uygulama ve shadcn/Radix tabanlı UI
src/lib/                 Para/tarih kuralları, Zod, raporlar, CSV ve demo
src/lib/supabase/        Resmi @supabase/ssr browser/server istemcileri
src/proxy.ts            Cookie yenileme; finansal yetkilendirme API + RLS'de
supabase/migrations/    Versiyonlanmış PostgreSQL şeması ve RLS
tests/                   İş mantığı, bileşen ve gerçek PostgreSQL SQL testleri
e2e/                     Playwright iş akışları ve responsive kontroller
artifacts/screenshots/   Sadece sahte demo verisi içeren test görüntüleri
docs/                    Test ve teslim raporu
```

Her kullanıcı tablosunda SELECT/INSERT/UPDATE/DELETE için ayrı RLS politikası vardır. `(id, user_id)` ve `(id, user_id, kind)` birleşik foreign key'ler başka kullanıcıya ait hesap/kategori atamalarını ve kategori türü uyuşmazlıklarını veritabanında engeller. Sunucu her API çağrısında Supabase `getUser()` ile kimliği doğrular; istemciden gelen `user_id` kullanılmaz. Mutasyonlar sunucuda Zod ile doğrulanır. Aynı origin kontrolü, güvenli hata metinleri, private/no-store yanıtlar ve kullanıcı başına PostgreSQL üzerinde dakikada 120 yazma isteği sınırı bulunur. Supabase Auth ayrıca kendi rate limit'lerini uygular.

Uygulamanın finansal RPC'leri `security invoker` çalışır. Sınırlı `security definer` kullanımı yalnızca yeni kullanıcı profili/kategori oluşturma trigger'ında ve kullanıcının kendi yazma limiti sayacındadır; sabit boş `search_path` kullanılır. Fonksiyonların varsayılan PUBLIC yetkileri kapatılmıştır. Uygulama `service_role` gerektirmez.

Gerçek finansal kayıtlar localStorage, service worker veya paylaşılabilir önbelleğe yazılmaz. localStorage yalnızca izole sahte demo ve tema tercihi içindir. Service worker yoktur; manifest ile yüklenebilir görünüm sağlanır, çevrimdışı yazma/senkronizasyon iddiası yoktur. Çevrimdışıyken uyarı gösterilir; gerçek kayıt başarılı kaydedilmiş gibi gösterilmez.

## Kontroller

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run test:db` sadece PostgreSQL/RLS testlerini çalıştırır. Bu testler `@electric-sql/pglite` içindeki gerçek PostgreSQL motorunda boş bir veritabanına **üretim migration'ını değiştirmeden** uygular. Test harness'i Supabase'e ait `auth.users`/`auth.uid()` girişini taklit eder; iki ayrı DB rol bağlamında gerçek SELECT/UPDATE/DELETE/FK sorguları çalışır. Bu, gerçek Supabase Auth/e-posta veya Vercel altyapısının uçtan uca testi değildir.

Playwright varsayılan olarak anahtar içermeyen yerel demo ortamına karşı çalışır; gerçek kullanıcı verisine dokunmaz. Tam iş akışları ve yedi boyutta sayfalar/formlar/menüler/taşma/grafikler kontrol edilir. GitHub Actions aynı statik kontrolleri, PostgreSQL testlerini ve Playwright'ı çalıştırır.

Playwright kendi sunucusunu **127.0.0.1:3100** üzerinde açıp kapatır; geliştirme sunucusunu yeniden kullanmaz ve Supabase ortam değerlerini test sunucusunda boşaltır. Bu teslimatta anahtarlar boşken oluşturulmuş **üretim derlemesi** şu komutla da sınandı:

```powershell
$env:E2E_PRODUCTION = '1'
npm run test:e2e
```

Üretim modundaki test için derleme sırasında da Supabase anahtarları boş olmalıdır. Gerçek anahtar içeren bir production build, yayınlama akışının parçasıdır; yerel izole test build'i yerine kullanılmamalıdır. Güncel gerçek test sonuçları [`docs/TEST-RAPORU.md`](docs/TEST-RAPORU.md) dosyasındadır.

Windows kısıtlı sandbox ortamında localhost socket erişimi veya Next.js çıktı klasörü oluşturma engellenebilir. Bu görevde tarayıcı testleri ve production build normal kullanıcı izinleriyle çalıştırılmıştır. Next.js'in desteklenen Webpack seçeneği kullanılır. ESLint, Next.js eklentilerinin peer dependency aralığıyla uyumlu 9.39.5 sürümüne sabitlenmiştir; bağımlılık yükseltmelerinde tüm kontrol zinciri yeniden çalıştırılmalıdır.

## Bilinen sınırlar

- Canlı Supabase URL/key, GitHub/Vercel hesabı erişimi sağlanmadı. Auth/e-posta akışları ve canlı Supabase PostgREST entegrasyonu yazılmıştır; uzak serviste doğrulanmamıştır. Canlı URL yoktur.
- Bir sorgu dönemi en fazla üç yıl; ay sınırlarına genişletilmiş sorguda en fazla 10.000 işlem desteklenir. Sınır aşılırsa daha kısa aralık seçilmesi istenir; kayıtlar sessizce kesilmez. Liste 20'şer satır gösterir. Daha büyük hacim için sunucu tarafında filtreli sayfalama/aggregate mimarisi genişletilmelidir.
- JSON yedeği indirilebilir; otomatik JSON/CSV içe aktarma/geri yükleme yoktur. Yedekler hassas finansal bilgi içerir; kullanıcı tarafından güvenli saklanmalıdır.
- Banka bağlantısı, ödeme gönderme, push/e-posta bütçe bildirimi, çoklu para birimi, native mobil uygulama, çevrimdışı senkronizasyon ve otomatik ödeme gerçekleştirme yoktur.
- Finansal veriler silinebilir; Supabase Auth hesabını kalıcı silme UI'ı yoktur. Gerektiğinde Supabase Dashboard → Authentication → Users üzerinden hesap yöneticisi kullanıcıyı silebilir; ilişkili kayıtlar cascade ile temizlenir.
- Eşzamanlı düzenlemelerde son başarılı kayıt geçerlidir; çok kullanıcılı ortak cüzdan ve denetim günlüğü bu sürümün kapsamında değildir.

## Tasarım araştırması ve resmi başvurular

Hızlı kayıt, kişisel kategoriler, görünür bütçe ilerlemesi ve planlanan ödemelerin ayrılması temel ürün kararlarıdır. Tasarımlar kopyalanmadı; zeytin yeşili, sıcak nötr tonlar, sade hiyerarşi ve mobilde ayrı gezinme kullanıldı.

- [YNAB: hedefler ve raporlar](https://www.ynab.com/features)
- [Spendee: kişisel kategoriler, bütçeler ve cüzdanlar](https://www.spendee.com/)
- [Wallet: planlanan ödemeler ve nakit akışı](https://budgetbakers.com/en/products/wallet/)
- [Actual Budget: schedules](https://actualbudget.org/docs/schedules/)
- [Supabase: güncel Next.js SSR kurulumu](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js: App Router kurulumu](https://nextjs.org/docs/app/getting-started/installation)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)

Marka adı/açıklaması `src/lib/brand.ts`, logo `src/components/logo.tsx` ve `public/icon.svg`, renkler `src/app/globals.css` dosyasından değiştirilebilir.
