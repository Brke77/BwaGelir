# MASTER PROMPT — PREMIUM GELİR-GİDER VE KİŞİSEL FİNANS YÖNETİM UYGULAMASI

## 1. ROLÜN VE GÖREVİN

Sen kıdemli bir Full-Stack Software Engineer, SaaS Architect, UI/UX Designer, Database Engineer, QA Automation Engineer, Security Engineer ve DevOps uzmanısın.

Görevin, sıfırdan başlayarak modern, güvenli, yüksek performanslı ve production-ready bir kişisel finans yönetim uygulaması geliştirmektir.

Uygulamanın geçici adı **KasaFlow** olsun. İsim, logo ve marka kimliği ileride kolayca değiştirilebilmeli.

Bu proje gerçek bir ürün olacak. Sadece tasarım, demo, statik dashboard veya çalışmayan butonlardan oluşan bir prototip istemiyorum.

**Temel beklentilerim:**

- Masaüstü, tablet ve mobil cihazlarda mükemmel çalışmalı.
- Vercel üzerinde yayınlanabilmeli.
- Supabase kullanarak gerçek verileri saklayabilmeli.
- Türkçe ve Türkiye kullanımına uygun olmalı.
- Kullanıcı kendi gelir ve gider isimlerini özgürce yazabilmeli.
- Kategoriler tamamen özelleştirilebilmeli.
- Kullanıcı gelirlerini, giderlerini ve net bakiyesini takip edebilmeli.
- Bütçeler, raporlar ve finansal grafikler bulunmalı.
- Arayüz premium bir fintech uygulaması kalitesinde olmalı.
- Tüm kritik özellikler otomatik test edilmeli.
- Tespit ettiğin hataları düzeltip testleri tekrar çalıştırmalısın.

Tek bir kod tabanından hem masaüstüne hem mobil cihazlara hizmet veren responsive bir web uygulaması oluştur.

Açık bir teknik engel olmadıkça benden sürekli onay isteme. Mantıklı teknik kararları kendin al, uygula, test et ve belgele.

Ancak hesap oluşturma, gizli anahtar sağlama, dış servis bağlantısı veya özel erişim gerektiren işlemler için gerçek erişime ihtiyacın varsa bunu açıkça belirt. Erişimin olmadığı işlemleri gerçekleştirmiş gibi davranma.

---

## 2. ARAŞTIRMA VE ÜRÜN STRATEJİSİ

Kod yazmadan önce mümkünse güncel resmi belgeleri ve başarılı finans uygulamalarını araştır.

İncelemen gereken ürünler:

- YNAB
- Spendee
- Wallet by BudgetBakers
- Actual Budget
- Diğer başarılı kişisel gelir-gider takip uygulamaları

Bu uygulamaların özellikle şu özelliklerini değerlendir:

1. Kullanıcı deneyimi
2. Hızlı gelir-gider ekleme
3. İşlem yönetimi
4. Özelleştirilebilir kategoriler
5. Bütçe takibi
6. Dashboard ve finansal grafikler
7. Mobil navigasyon
8. Finansal raporlama
9. Kullanıcıya verilen görsel geri bildirimler
10. Veri güvenliği

Doğrudan tasarımlarını kopyalama. Güçlü özellikleri inceleyerek özgün bir ürün tasarla.

Gereksiz karmaşıklık ekleme. Uygulama ilk kez kullanan biri için de kolay anlaşılabilmeli.

Öncelik sırası:

**P0 — Mutlaka tamamlanacak özellikler:** Kimlik doğrulama, gelir-gider işlemleri, özel gider isimleri, kategoriler, hesaplar, dashboard, filtreleme, temel raporlar, güvenlik ve responsive tasarım.

**P1 — P0 tamamlandıktan sonra:** Bütçe limitleri, tekrarlayan işlemler, veri aktarımı, PWA, gelişmiş raporlar ve kullanıcı deneyimi iyileştirmeleri.

P0 eksikken P1 özellikleri için temel işlevselliği riske atma.

---

## 3. TEKNOLOJİ MİMARİSİ

Tercih edilen teknoloji yığını:

Frontend ve backend:
- Next.js (güncel kararlı sürüm, App Router)
- React
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts
- React Hook Form
- Zod

Veritabanı ve kullanıcı yönetimi:
- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- Güncel resmi Supabase SSR entegrasyonu

Deployment:
- Vercel
- GitHub
- Production / Preview / Development ortamları

Test:
- Vitest
- React Testing Library
- Playwright
- ESLint
- TypeScript type checking

Paketlerin güncel ve birbirleriyle uyumlu kararlı sürümlerini kullan.

Deprecated API'lerden kaçın.

Gereksiz bağımlılık ekleme. Kullanılmayan paketleri kaldır.

İş mantığını React bileşenlerine dağıtmak yerine uygun servis, validasyon ve veri erişim katmanlarında düzenle.

Supabase bağlantı bilgileri environment variables üzerinden yönetilsin.

Hiçbir gizli anahtar source code içine yazılmasın.

---

## 4. ÜRÜN TASARIMI VE UI/UX

Uygulamanın görsel kalitesi üst düzey olmalı.

Hedef tasarım dili:
- Modern fintech dashboard
- Minimal ve profesyonel
- Premium SaaS görünümü
- Dengeli boşluklar
- Net tipografik hiyerarşi
- Yumuşak köşeler
- Tutarlı ikonlar
- Okunabilir finansal veriler
- Kaliteli ve işlevsel grafikler

### Renk sistemi

Açık tema:
- Hafif kırık beyaz arka plan
- Beyaz yüzeyler
- Koyu antrasit yazılar
- Yeşil gelir göstergeleri
- Kırmızı veya mercan gider göstergeleri
- İndigo veya zümrüt vurgu rengi

Koyu tema:
- Koyu lacivert/antrasit yüzeyler
- Erişilebilir kontrast
- Dengeli vurgu renkleri

Gelir ve gideri sadece renklerle ayırt etme; işaret, metin ve ikon kullan.

Light Mode ve Dark Mode desteği ekle.

### Masaüstü tasarımı

Sol tarafta modern sidebar olsun.

Sidebar menüsü:
- Genel Bakış
- İşlemler
- Hesaplarım
- Kategoriler
- Bütçeler
- Düzenli Ödemeler
- Raporlar
- Ayarlar

Üst bölümde:
- Sayfa başlığı
- Tarih filtresi
- Arama
- Tema değiştirme
- Kullanıcı menüsü
- Yeni işlem butonu

Büyük ekranlarda uygun grid düzeni kullan.

### Mobil tasarım

Mobil arayüz masaüstünün küçültülmüş hali olmamalı.

Mobil cihazlar için yeniden optimize edilmiş yerleşim oluştur.

- Ekranın altında sabit navigasyon.
- Önemli sayfalara hızlı erişim.
- Tek elle rahat kullanılabilen arayüz.
- Kolay erişilebilir gelir/gider ekleme butonu.
- Formlar için mobil uyumlu bottom sheet veya uygun tam ekran düzeni.
- Büyük dokunma alanları.
- Yatay taşma olmaması.
- Safe area desteği.
- Mobil klavyenin formu kapatmaması.
- Finansal kartların küçük ekranlara uyarlanması.
- Tablo yerine uygun işlem kartları.
- Grafiklerin küçük ekranlarda okunabilir olması.

360px, 375px, 390px, 430px, tablet ve büyük masaüstü boyutlarını dikkate al.

Masaüstü ve mobil kullanım deneyimini ayrı ayrı test et.

### Tasarım kalitesi

Loading skeleton, empty state, toast, confirmation dialog, yardımcı metinler ve anlaşılır hata mesajları kullan.

Bütün etkileşimli elemanların gerçek bir işlevi olmalı.

Erişilebilirlik için klavye navigasyonu, görünür focus state, semantik HTML ve uygun ARIA etiketleri ekle.

---

## 5. DASHBOARD — GENEL BAKIŞ

Kullanıcı giriş yaptığında finansal durumunu tek ekranda anlayabilmeli.

Dashboard üzerinde şu KPI kartları bulunsun:

1. Toplam Bakiye
2. Seçili Dönem Geliri
3. Seçili Dönem Gideri
4. Net Nakit Akışı
5. Tasarruf Oranı
6. Kullanılan Bütçe

Tasarruf oranı, dönem geliri pozitif olduğunda:

(Gelir - Gider) / Gelir × 100

Gelir sıfır olduğunda sonsuz veya NaN göstermek yerine uygun açıklama göster.

Dashboard grafikleri:

**Gelir-Gider Karşılaştırması**
- Aylık karşılaştırmalı sütun grafiği.
- Ay bazında gelir ve gider.
- Dönemler arası kıyaslama.

**Harcama Dağılımı**
- Kategori bazında donut chart.
- Toplam harcama ve yüzdesi.
- Kategorilere tıklayarak ilgili işlemleri görüntüleme.

**Bakiye Trendi**
- Zaman içindeki bakiye değişimi.
- Günlük, aylık ve yıllık görünüm.

**En Yüksek Giderler**
- En fazla harcama yapılan kategoriler.
- En yüksek tutarlı işlemler.

**Son İşlemler**
- Son eklenen gelir ve giderler.
- İşlem adı, tarihi, kategori, tutar ve hesap bilgisi.

Dashboard filtreleri:
- Bugün
- Bu hafta
- Bu ay
- Geçen ay
- Son 3 ay
- Bu yıl
- Özel tarih aralığı

Filtreler seçili dönem KPI ve grafiklerini tutarlı biçimde değiştirmeli.

Toplam bakiye ile dönem net nakit akışını birbirine karıştırma.

Başlangıç bakiyeleri ve geçmiş işlemler doğru hesaba katılmalı.

---

## 6. GELİR VE GİDER YÖNETİMİ — EN ÖNEMLİ MODÜL

Bu modül uygulamanın merkezidir.

### Yeni gider ekleme

Kullanıcı şu alanlarla gider oluşturabilsin:

- Gider adı
- Tutar
- Tarih
- Kategori
- Ödeme yapılan hesap
- Açıklama (isteğe bağlı)

**KRİTİK ŞART: GİDER ADI SERBEST METİN OLACAK.**

Kullanıcı gider ismini kendi yazabilmeli.

Örnekler:
- Market alışverişi
- Ev kirası
- Netflix üyeliği
- Araba tamiri
- Arkadaşlarla akşam yemeği
- Telefon faturası
- Bilgisayar ekipmanı
- Tatil harcaması

Hiçbir gider ismi sabit bir dropdown ile sınırlandırılmamalı.

İsteğe bağlı olarak önceki işlem isimleri autocomplete şeklinde önerilebilir. Ancak kullanıcı her zaman yeni isim yazabilmeli.

### Yeni gelir ekleme

Kullanıcı gelir için şu alanları doldurabilsin:

- Gelir adı
- Tutar
- Tarih
- Kategori
- Gelirin yatırıldığı hesap
- Açıklama

Örnek gelirler:
- Maaş
- Freelance kazancı
- Ek gelir
- Kira geliri
- Satış geliri

Gelir isimleri de serbest metin olmalı.

### İşlem davranışları

- İşlem ekleme
- İşlem düzenleme
- İşlem silme
- Silme öncesinde onay
- İşlem detayını görüntüleme
- Arama ve filtreleme
- Tarihe göre sıralama
- Tutar aralığına göre filtreleme
- Kategoriye göre filtreleme
- Hesaba göre filtreleme
- İşlem türüne göre filtreleme
- Sayfalama veya verimli listeleme

Bir işlem değiştirildiğinde tüm ilgili finansal özetler güncellenmeli.

İşlem iki kez kaydedilmemeli.

Kaydet butonu işlem sırasında uygun şekilde devre dışı bırakılmalı.

Negatif tutar kullanımına izin verme. İşlemin gelir veya gider oluşu tür alanından belirlenmeli.

Sıfır tutarlı işlemler ve geçersiz tarihler reddedilmeli.

Türkçe sayı formatı desteklenmeli:
- 1.250,50 TL
- 25.000,00 TL

İçeride güvenilir parasal hesaplama yapılmalı. JavaScript floating-point hataları finansal tutarlara yansımamalı.

---

## 7. KATEGORİ YÖNETİMİ

Kategoriler tamamen kullanıcı tarafından yönetilebilmeli.

Başlangıçta kullanışlı varsayılan kategoriler sağlanabilir.

Örnek gider kategorileri:
- Market
- Kira
- Faturalar
- Ulaşım
- Sağlık
- Eğitim
- Eğlence
- Alışveriş
- Yemek
- Seyahat
- Diğer

Ancak bu kategoriler sabit olmamalı.

Kullanıcı:
- Kategori oluşturabilmeli.
- Kategori adını değiştirebilmeli.
- Kategoriye ikon seçebilmeli.
- Kategori rengi belirleyebilmeli.
- Kategori arşivleyebilmeli.
- Kategori silebilmeli.
- Gelir ve gider kategorilerini ayrı yönetebilmeli.

Kategori oluşturma özelliği doğrudan yeni işlem formundan da erişilebilir olmalı.

Örneğin kullanıcı "Evcil Hayvan" kategorisi oluşturduğunda anında yeni giderine atayabilmeli.

Bir kategoriye bağlı geçmiş işlemler varsa kategori silme işlemi verileri bozmamalı. Yeniden kategorilendirme veya arşivleme seçeneği sun.

Tüm kategoriler ilgili kullanıcıya ait olmalı.

---

## 8. HESAPLAR VE CÜZDANLAR

Birden fazla finansal hesap yönetimi destekle.

Kullanıcı aşağıdaki türlerde hesap oluşturabilsin:

- Nakit
- Banka hesabı
- Birikim hesabı
- Diğer

Her hesabın:
- Adı
- Türü
- Başlangıç bakiyesi
- Güncel bakiyesi
- Para birimi
- Açıklaması

bulunsun.

İlk sürümde varsayılan para birimi TRY olsun.

Farklı para birimlerinin dönüşümü güvenilir şekilde uygulanmadıkça farklı para birimlerini tek bir toplamda toplama. Çoklu para birimi özelliğini gerekiyorsa sonraki sürüme bırak.

Kullanıcı hesaplar arasında para transferi yapabilmeli.

Örnek:
Nakit hesabından Banka hesabına 2.000 TL transfer.

Bu işlem:
- Kaynak hesabı 2.000 TL azaltmalı.
- Hedef hesabı 2.000 TL artırmalı.
- Toplam varlığı değiştirmemeli.
- Gelir veya gider raporlarını etkilememeli.

Transferin iki tarafı tek bir tutarlı veritabanı işlemi olarak kaydedilmeli.

Bakiye hesaplaması tüm geçmiş işlemlerle tutarlı olmalı.

---

## 9. BÜTÇE YÖNETİMİ

Kullanıcı aylık veya kategori bazlı bütçe belirleyebilmeli.

Örnek:

Market bütçesi: 8.000 TL

Gerçekleşen harcama: 5.000 TL

Kalan bütçe: 3.000 TL

Kullanım oranı: %62,5

Bütçe görünümünde:
- Belirlenen limit
- Kullanılan tutar
- Kalan tutar
- Kullanım yüzdesi
- Progress bar
- Aşılan bütçeler

görüntülenmeli.

Bütçe uyarı eşikleri:
- %75
- %90
- %100

Bu eşiklerde uygulama içi uyarılar göster.

Bütçeler dönem, kategori ve ilgili hesap filtresiyle tutarlı çalışmalı.

Gelir ve hesaplar arası transferler gider bütçesini tüketmemeli.

---

## 10. DÜZENLİ ÖDEMELER VE TEKRARLAYAN İŞLEMLER

Kullanıcı düzenli gelir ve giderleri tanımlayabilmeli.

Örnekler:
- Aylık kira
- İnternet faturası
- Maaş
- Dijital abonelik
- Sigorta ödemesi

Tekrarlama seçenekleri:
- Günlük
- Haftalık
- Aylık
- Yıllık

Her düzenli işlem için:
- İşlem adı
- Tutar
- Kategori
- Hesap
- Başlangıç tarihi
- Tekrarlama sıklığı
- Bitiş tarihi (isteğe bağlı)
- Aktif / pasif durumu

bulunsun.

Yaklaşan işlemleri gösteren bir ekran oluştur.

**Planlanan işlem ile gerçekleşmiş işlem birbirinden ayrılmalı.**

Henüz gerçekleşmemiş ödeme, gerçek hesaptan düşülmemeli.

Kullanıcı işlemi gerçekleşmiş olarak işaretlediğinde gerçek finansal harekete dönüşebilmeli.

Aynı planlanan işlem birden fazla kez gerçekleşmiş olarak kaydedilememeli.

Tekrarlayan işlem silindiğinde veya devre dışı bırakıldığında geçmişte gerçekleşmiş finansal işlemler korunmalı.

Tarih hesaplamalarında ay sonu, şubat ve artık yıl gibi durumları güvenli yönet.

---

## 11. RAPORLAR VE ANALİTİK

Kapsamlı rapor ekranı oluştur.

Raporlar:

**Gelir-Gider Analizi**
- Günlük
- Haftalık
- Aylık
- Yıllık

**Kategori Analizi**
- En yüksek harcama kategorileri
- Kategorilerin toplam gider içindeki payları
- Önceki dönem karşılaştırmaları

**Nakit Akışı**
- Gelir
- Gider
- Net değişim
- Dönemsel eğilim

**Bütçe Performansı**
- Planlanan bütçe
- Gerçekleşen gider
- Sapma
- Kullanım yüzdesi

**İşlem Analizi**
- En büyük giderler
- İşlem sıklığı
- Ortalama gider tutarı
- En yoğun harcama dönemleri

Raporların tamamı veritabanından gelen gerçek kayıtlardan hesaplanmalı.

Grafiklerde tooltip, tarih ve tutar formatları doğru çalışmalı.

Grafikler hiçbir veri yokken bozulmamalı.

Raporlarda filtreleme ve gerektiğinde CSV dışa aktarma özelliği sağla.

Türkçe Excel kullanımına uygun CSV biçimini ve UTF-8 karakter desteğini dikkate al.

---

## 12. KULLANICI HESABI VE AYARLAR

Supabase Auth ile kullanıcı sistemi oluştur.

- Kayıt ol
- Giriş yap
- Çıkış yap
- Şifremi unuttum
- Şifre sıfırlama
- Oturum koruması

Kimlik doğrulama akışları gerçekten çalışmalı.

Dashboard'a giriş yapmamış bir kullanıcı erişememeli.

Ayarlar bölümünde:
- Profil bilgileri
- Tema tercihi
- Para birimi tercihi (desteklenen seçeneklerle sınırlı)
- Dil
- Veri dışa aktarma
- Bildirim tercihleri
- Hesap silme veya veri silme için güvenli akış

bulunsun.

Varsayılan dil Türkçe, bölge Türkiye ve zaman dilimi Europe/Istanbul olsun.

Başka bir kullanıcının finansal verileri hiçbir koşulda görüntülenememeli veya değiştirilememeli.

Gerçek kullanıcı verilerinin gizliliğini birincil öncelik olarak ele al.

---

## 13. SUPABASE VERİTABANI TASARIMI

İlişkisel, ölçeklenebilir ve tutarlı bir veritabanı mimarisi tasarla.

En azından aşağıdaki mantıksal yapıları değerlendir:

- profiles
- accounts
- categories
- transactions
- budgets
- recurring_rules
- recurring_occurrences
- user_preferences

Gerekirse ek tablolar oluştur.

Tablolarda uygun şekilde:
- UUID primary key
- user_id
- created_at
- updated_at
- foreign key
- check constraint
- unique constraint
- index

kullan.

Finansal tutarlar için floating-point veritabanı türü kullanma. TRY tutarlarını integer minor units (kuruş) olarak güvenli şekilde saklamayı tercih et.

Gelir, gider ve transfer türleri açık biçimde modellenmeli.

Transfer tek bir mantıksal işlem olarak temsil edilmeli; kaynak ve hedef hesap ilişkileri tutarlı olmalı.

İşlemlerin hesap ve kategorileri mutlaka aynı kullanıcıya ait olmalı.

Bu güvenlik yalnızca frontend üzerinden sağlanmamalı. Veritabanı seviyesinde de zorunlu kılınmalı.

### Row Level Security

Kullanıcıya özel tablolarda RLS etkinleştir.

SELECT, INSERT, UPDATE ve DELETE politikalarını ihtiyaçlara göre ayrı tanımla.

Kullanıcı yalnızca kendi kayıtlarını okuyabilmeli ve yönetebilmeli.

Client tarafından gönderilen user_id değerine güvenme.

Foreign key aracılığıyla başka kullanıcı kayıtlarına bağlanma saldırılarını engelle.

Service role veya secret key frontend'e kesinlikle gönderilmemeli.

Supabase'in güncel resmi güvenlik önerilerini uygula.

### Migration

Veritabanı şemasını tekrarlanabilir SQL migration dosyaları halinde oluştur.

- Migration dosyaları versiyonlanmalı.
- Şema sıfırdan kurulabilmeli.
- Gerekli index ve constraint'ler tanımlanmalı.
- RLS politikaları migration içerisinde bulunmalı.
- Demo verileri gerçek kullanıcı verilerinden ayrılmalı.

Örnek veri için seed sistemi oluştur.

Ayrıca en az iki ayrı test kullanıcısı üzerinden veri izolasyonunu doğrula.

---

## 14. PWA VE MOBİL DENEYİM

Uygulama mobil tarayıcıda kusursuz çalışmalı.

Mümkünse Progressive Web App desteği ekle:

- Web app manifest
- Uygulama ikonları
- Ana ekrana ekleme
- Standalone görünüm
- Mobile viewport desteği
- Uygun splash/theme ayarları
- Güvenli cache stratejisi

PWA kullanıcının telefonunda yerel uygulamaya yakın bir deneyim sağlamalı.

Ancak hassas finansal bilgileri paylaşılan veya güvensiz cache alanlarında tutma.

İnternet bağlantısı yokken desteklenmeyen işlemleri başarılı olmuş gibi gösterme.

Offline veri yazma ve senkronizasyon güvenli şekilde tamamlanmadıysa offline read-only/uyarı deneyimi sun.

Native iOS veya Android uygulaması geliştirmek bu sürümün zorunlu kapsamı değildir.

---

## 15. GÜVENLİK VE VERİ DOĞRULAMA

Finansal veriler hassas kabul edilmeli.

Uygula:

- Server-side input validation
- Zod schema validation
- RLS
- Güvenli authentication
- Güvenli oturum yönetimi
- Yetkisiz erişim kontrolleri
- XSS'e karşı güvenli render
- Güvenli hata mesajları
- Secret key koruması
- Uygun mutation authorization
- Kritik işlemler için tekrar gönderim kontrolü
- Gereken yerde rate limiting
- Veri bütünlüğü kısıtları

Kullanıcıdan banka şifresi, kart PIN'i veya benzeri hassas bilgileri talep etme.

İlk sürümde gerçek banka entegrasyonu veya ödeme işlemi gerçekleştirme.

Hata loglarına kullanıcı parolası, token veya gereksiz hassas finans verileri yazma.

Demo veya test ortamında kullandığın sahte kullanıcı bilgilerini production ortamına taşıma.

---

## 16. PERFORMANS VE KOD KALİTESİ

Uygulama hızlı, düzenli ve kolay geliştirilebilir olmalı.

Teknik beklentiler:
- TypeScript strict
- Yeniden kullanılabilir UI bileşenleri
- Düzenli klasör yapısı
- Tekrarlanan iş mantığının azaltılması
- Uygun server/client component ayrımı
- Verimli veritabanı sorguları
- Gereksiz network isteklerinden kaçınma
- Büyük işlem listeleri için sayfalama
- Loading ve error state yönetimi
- Kullanıcı dostu hata mesajları
- React console warning'lerinin giderilmesi

Tüm ekranlar sadece güzel görünmekle kalmamalı, gerçek verilerle çalışmalı.

Üretim kodunda `any`, geçici hack, TODO, placeholder işlev veya göstermelik buton bırakma.

İşlevi olmayan özellikleri tamamla veya açıkça kapsam dışı bırak.

---

## 17. OTOMATİK TEST VE HATA DÜZELTME — KRİTİK TALİMAT

Bu bölüm zorunludur.

Kod yazmayı bitirdiğinde projeyi tamamlanmış kabul etme.

Bağımsız bir QA süreci başlat.

Sen hem geliştirici hem test mühendisi olarak çalışacaksın.

### Aşama A — Statik kontroller

Şunları çalıştır:

- TypeScript typecheck
- ESLint
- Unit testler
- Component testleri
- Production build

Hata çıkarsa sebebini araştır, düzelt ve tekrar çalıştır.

### Aşama B — İş mantığı testleri

Aşağıdaki senaryolar için otomatik testler yaz:

1. 10.000 TL gelir eklenince dönem geliri 10.000 TL olmalı.
2. 2.500 TL gider eklenince dönem gideri 2.500 TL olmalı.
3. Başlangıç bakiyesi sıfırsa net bakiye 7.500 TL olmalı.
4. 500 TL gider silinince ilgili toplam 500 TL azalmalı.
5. Gider tutarı düzenlenince tüm raporlar güncellenmeli.
6. Kullanıcı yeni bir gider ismini serbestçe yazabilmeli.
7. Yeni kategori oluşturulup işleme atanabilmeli.
8. Bir hesabından diğerine 1.000 TL transfer toplam varlığı değiştirmemeli.
9. Farklı kullanıcılar birbirinin verisini görememeli.
10. Sıfır ve geçersiz tutarlar reddedilmeli.
11. Tarih filtresi doğru sonuç vermeli.
12. Bütçe yüzdeleri doğru hesaplanmalı.
13. Tekrarlayan işlem ikinci kez yanlışlıkla kaydedilememeli.
14. İşlem silme ve düzenleme sonrası bakiye doğru kalmalı.
15. Türkçe para biçimi doğru parse edilmeli.
16. Para hesaplamalarında kuruş hassasiyeti korunmalı.
17. Boş verilerde dashboard ve grafikler çökmemeli.
18. Sayfa yenilendiğinde kayıtlar kaybolmamalı.

### Aşama C — E2E testleri

Playwright kullanarak gerçek kullanıcı senaryolarını otomatikleştir.

Test akışları:
- Kayıt olma
- Giriş yapma
- Dashboard'a ulaşma
- Gelir ekleme
- Gider ekleme
- Özel kategori oluşturma
- İşlem düzenleme
- İşlem silme
- Hesap oluşturma
- Para transferi
- Rapor filtreleme
- Çıkış yapma
- Korunan sayfalara erişim denemesi

Gerektiğinde test veritabanı ve sahte kullanıcılar kullan.

E2E testleri güvenli, izole bir test ortamında çalıştır. Production verilerini test amacıyla silme veya değiştirme.

### Aşama D — Responsive test

Playwright ile en az şu viewport'ları test et:

- 360 × 800
- 375 × 812
- 390 × 844
- 430 × 932
- 768 × 1024
- 1440 × 900
- 1920 × 1080

Her viewport için:
- Screenshot al.
- Yerleşim sorunlarını tespit et.
- Yatay taşmayı kontrol et.
- Menüleri kontrol et.
- Dialog ve formları kontrol et.
- Butonların tıklanabilirliğini kontrol et.
- Grafiklerin görünürlüğünü kontrol et.

Tarayıcı kontrolü ve ekran görüntüsü araçları mevcutsa çıktıları görsel olarak incele.

Yalnızca testlerin geçmesiyle yetinme.

Kötü hizalama, kesilen metin, taşan tablo veya bozuk mobil form varsa düzelt.

### Aşama E — Güvenlik testleri

İki kullanıcı oluştur.

Kullanıcı A ile işlem ekle.

Kullanıcı B'nin bu işlemi okuyamadığını, güncelleyemediğini ve silemediğini kontrol et.

URL parametrelerini veya kayıt ID'lerini değiştirerek yetkisiz erişimi test et.

RLS politikalarını gerçek sorgularla doğrula.

### Aşama F — Hata düzeltme döngüsü

Şu döngüyü uygula:

1. Test çalıştır.
2. Hataları kaydet.
3. Kök nedeni belirle.
4. İlgili kodu düzelt.
5. Regresyon testi ekle.
6. Testleri yeniden çalıştır.
7. Yeni hata oluşmadığını doğrula.
8. Production build al.
9. Son kontrol yap.

Bu döngüyü tamamlanabilen bütün kritik testler geçene kadar sürdür.

Test edemediğin bir özellik varsa bunu açıkça raporla.

Hiçbir zaman çalıştırmadığın bir testi geçmiş gibi gösterme.

---

## 18. VERCEL DEPLOYMENT

Proje Vercel üzerinde yayınlanmaya uygun olmalı.

Gereksinimler:

- GitHub ile uyumlu proje
- Vercel compatible build
- Production environment variables
- Preview environment desteği
- Supabase Auth redirect URL ayarları
- Güvenli deployment yapılandırması
- Hatasız production build
- Doğru route handling
- Refresh sonrasında sorunsuz navigasyon

`.env.example` oluştur.

Environment variables'ın nasıl tanımlanacağını README'de açıkla.

Gizli bilgileri commit etme.

Gerçek Vercel veya Supabase hesabı erişimine sahip değilsen deployment'ın tamamlandığını iddia etme.

Bunun yerine deployment-ready projeyi tamamla ve kullanıcının yapması gereken erişim/ayar adımlarını belirt.

Erişim sağlanmışsa önce Preview deployment yapıp test et, sonra Production deployment'a geç.

---

## 19. DEMO VERİ VE İLK KULLANIM

Kullanıcı ilk defa giriş yaptığında boş bir uygulamayla karşılaşmamalı.

Gerçek hesabı kirletmeden örnek verilerle uygulamayı inceleyebileceği ayrı bir demo/test deneyimi oluştur.

Demo veriler:
- Maaş gelirleri
- Market harcamaları
- Faturalar
- Ulaşım
- Eğlence
- Birikim
- Birkaç aylık geçmiş işlem

Demo verilerin sahte olduğu açıkça belirtilmeli.

Gerçek kullanıcıya otomatik olarak sahte finansal işlem kaydetme.

Gerçek kullanıcı için onboarding:
- Hoş geldiniz
- İlk hesabını oluştur
- Başlangıç bakiyesini belirle
- İlk gelir veya giderini ekle
- Dashboard'ını görüntüle

şeklinde ilerleyebilmeli.

Demo modu hiçbir şekilde gerçek Supabase Auth ve RLS güvenliğini bypass etmemeli.

Supabase bilgileri henüz mevcut değilse uygulamanın UI ve hesaplama katmanları izole test verileriyle geliştirilebilmeli; bunun gerçek veritabanı entegrasyonu olmadığı açık olmalı.

---

## 20. EK ÖZELLİKLER

Temel sistem tamamen çalıştıktan sonra uygun gördüğün yüksek değerli özellikleri ekleyebilirsin.

Örnekler:
- CSV içe aktarma
- CSV dışa aktarma
- Özel tasarruf hedefleri
- İşlem etiketleri
- Tekrarlanan işlem isimleri için hızlı öneriler
- Önceki aya göre harcama karşılaştırması
- Yaklaşan ödemeler
- Finansal özet kartlarının kişiselleştirilmesi
- Hızlı işlem ekleme
- Klavye kısayolları
- Daha gelişmiş raporlama

Her ek özellik uygulamanın kullanımını kolaylaştırmalı.

Temel finansal doğruluğu ve güvenliği riske atacak gereksiz özellikler ekleme.

---

## 21. DOSYA YAPISI VE DOKÜMANTASYON

Temiz ve sürdürülebilir bir proje oluştur.

En azından şu çıktılar bulunmalı:

- Çalışan Next.js projesi
- Supabase migration dosyaları
- RLS politikaları
- Seed verileri
- `.env.example`
- README.md
- Test dosyaları
- Playwright yapılandırması
- Lint/typecheck/build scriptleri
- Deployment yönergeleri

README şu soruları yanıtlamalı:

1. Proje nasıl kurulur?
2. Environment variables nasıl tanımlanır?
3. Supabase nasıl bağlanır?
4. Veritabanı nasıl hazırlanır?
5. Uygulama nasıl çalıştırılır?
6. Testler nasıl çalıştırılır?
7. Vercel'e nasıl deploy edilir?
8. Bilinen sınırlamalar nelerdir?

Mümkünse GitHub Actions üzerinde lint, typecheck, unit test ve build doğrulaması oluştur.

---

## 22. TAMAMLANMA KRİTERLERİ

Proje ancak şu koşullar sağlandığında tamamlanmış kabul edilebilir:

- Gelir eklemek çalışıyor.
- Gider eklemek çalışıyor.
- İsimler kullanıcı tarafından yazılabiliyor.
- Kategoriler özelleştirilebiliyor.
- Veriler kalıcı olarak saklanıyor.
- Bakiye doğru hesaplanıyor.
- Dashboard gerçek verilerle çalışıyor.
- Rapor filtreleri doğru sonuç veriyor.
- Hesaplar arası transferler doğru hesaplanıyor.
- Kullanıcılar birbirlerinin verilerine erişemiyor.
- Mobil arayüz düzgün çalışıyor.
- Masaüstü arayüz düzgün çalışıyor.
- Test edilebilen kritik akışlar başarılı.
- Production build başarılı.
- Vercel deployment yapılandırması hazır.
- Gizli anahtarlar korunuyor.
- README güncel ve eksiksiz.

Eksik özellik varsa tamamlandı olarak işaretleme.

---

## 23. ÖZ DEĞERLENDİRME VE SON KALİTE KONTROLÜ

Geliştirme tamamlandıktan sonra kendini bağımsız bir kıdemli yazılım denetçisi gibi değerlendir.

Aşağıdaki alanları 100 puan üzerinden değerlendir:

- UI/UX kalitesi
- Mobil kullanılabilirlik
- Masaüstü kullanılabilirlik
- Finansal hesaplama doğruluğu
- Güvenlik
- Performans
- Kod kalitesi
- Test kapsamı
- Deployment hazırlığı

Puanları kanıtlara dayandır.

Kritik bir sorun tespit edersen düzeltebildiğin tüm sorunları gider ve ilgili testleri yeniden çalıştır.

Kapsam ve araçların izin verdiği ölçüde mümkün olan en iyi, kararlı sürümü oluştur.

Sonuçta bana:

1. Geliştirilen özelliklerin özetini
2. Tamamlanan testleri ve gerçek sonuçlarını
3. Düzeltilen hataları
4. Kalan hata ve sınırlamaları
5. Varsa test screenshot'larını
6. Son teknoloji mimarisini
7. Supabase kurulum adımlarını
8. Vercel deployment durumunu
9. Canlı URL'yi (gerçekten deploy edildiyse)
10. Projenin çalıştırma talimatlarını

sun.

Test raporuna yalnızca gerçekten çalıştırılmış komutlar ve elde edilen sonuçlar yazılmalı.

---

## 24. ÇALIŞMA TALİMATI

Şimdi bu projeyi gerçek bir ürün geliştirme görevi olarak ele al.

Önce kısa bir uygulama planı oluştur. Ardından planını uygulamaya başla.

Sadece proje planı, bileşen listesi veya örnek kod vermekle durma.

Dosyaları oluştur, veritabanı mimarisini kur, arayüzü geliştir, fonksiyonları bağla, testleri yaz, test et ve hataları düzelt.

Her kritik özellik uçtan uca çalışmalı.

Araçların destekliyorsa tarayıcıyı açarak uygulamayı test et ve ekran görüntülerini incele.

Gerekli erişimin bulunmadığı dış servis adımları dışında işi kullanıcıya bırakma.

Hedefim basit bir okul projesi değil; günlük hayatta gerçekten kullanılabilecek, modern, güvenilir, hızlı ve görsel açıdan güçlü bir kişisel finans uygulaması elde etmek.

**Önce finansal doğruluk ve güvenlik, ardından kusursuz kullanıcı deneyimi, sonra gelişmiş özellikler.**

Şimdi projeyi geliştir.