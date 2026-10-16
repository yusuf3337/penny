# Penny

Penny, finans kayıtlarını cihazda tutan bir kişisel bütçe uygulamasıdır. İşlemler, bütçeler, hedefler, abonelikler ve borç/alacaklar uygulama içinde yönetilir. Koyu görünüm sistem temasını izleyebilir veya Ayarlar'dan seçilebilir.

Arayüz Türkçe, İngilizce, Almanca, Fransızca, Korece, Basitleştirilmiş Çince, Japonca, Rusça ve İtalyanca sunulur. Ayarlar'dan dil seçilebilir veya cihaz/uygulama dili izlenebilir. Çeviriler uygulamanın içinde bulunur; çalışma sırasında çeviri hizmetine veri gönderilmez. Yayından önce abonelik, finans ve gizlilik metinlerini ana dili konuşan kişilerle gözden geçirin.

## Geliştirme

```sh
npm install
npx expo start --go
```

Expo Go'da arayüz ve Pro özellikleri geliştirme anahtarıyla test edilebilir. Gerçek App Store satın alımı Expo Go'da çalışmaz; StoreKit içeren iOS development build veya TestFlight gerekir.
Yeni dil sistemi ek bir native yerelleştirme modülü gerektirmez. Eski Metro oturumu açıkken `ExpoLocalization` hatası görülürse oturumu kapatıp `npx expo start --go --clear` ile yeniden başlatın.

## App Store abonelikleri

Penny, iOS'ta `expo-iap` aracılığıyla doğrudan Apple StoreKit kullanır. RevenueCat veya başka bir ödeme servisi kullanılmaz. Pro hakkı cihazdaki StoreKit etkin aboneliği ve Apple doğrulamasıyla açılır. Yerel test anahtarı üretim sürümünde geçerli değildir.

Yeni borç/alacak kaydı oluşturma Pro kapsamındadır. Aboneliği sona eren kullanıcılar önceki kayıtlarını görmeye, ödeme kaydetmeye ve silmeye devam edebilir.

App Store Connect'te aynı abonelik grubunda iki otomatik yenilenen ürün oluşturun:

- `com.yourdomain.penny.pro.monthly` — aylık
- `com.yourdomain.penny.pro.yearly` — yıllık

Farklı ürün kimlikleri kullanırsanız `.env.example` içindeki `EXPO_PUBLIC_IOS_PRO_MONTHLY_ID` ve `EXPO_PUBLIC_IOS_PRO_YEARLY_ID` değerlerini `.env` dosyanızda belirtin. Fiyatlar ve para birimi App Store'dan gelir; uygulama sabit fiyat göstermez. Satın alma, geri yükleme ve abonelik yönetimi Pro ekranındadır.

App Store Connect'te Türkiye fiyatını koruyup ABD ve Euro kullanan mağazalar için ayrı fiyat belirleyebilirsiniz. Diğer mağazalarda Apple'ın önerdiği karşılıkları gözden geçirip gerekirse değiştirebilirsiniz. Ekrandaki abonelik tutarı Apple hesabının App Store ülkesine göre yerel para biriminde gösterilir; arayüz dili veya fiziksel konum fiyatı belirlemez. Uygulamadaki kişisel finans kayıtları ise hâlâ TRY cinsindedir, otomatik döviz çevrimi yapılmaz.

App Store'a göndermeden önce:

1. App Store Connect'te ürünlerin süre, fiyat, yerelleştirme ve inceleme bilgilerini tamamlayın. Ürün kimliklerinin kodla birebir eşleştiğini doğrulayın.
2. [PRIVACY.md](PRIVACY.md) metnine destek iletişim bilgilerinizi ekleyip herkese açık bir HTTPS adreste yayımlayın. Bu adresi `.env` içinde `EXPO_PUBLIC_PRIVACY_POLICY_URL` olarak ve App Store Connect gizlilik politikası alanında belirtin.
3. TestFlight sürümünde gerçek bir cihaz ve sandbox Apple hesabıyla aylık/yıllık satın alma, geri yükleme, yenileme ve iptali deneyin.
4. App Store Connect'te uygulama gizlilik beyanını, ekran görüntülerini, açıklamayı ve abonelik ürünlerini tamamlayın. Geliştirme modundaki Pro test düğmesi üretim sürümünde görünmez.

Bu hesap ve ürün ayarları olmadan kodun paketlenmesi mümkündür, fakat gerçek satın alma akışı doğrulanamaz.

## TestFlight yüklemesi

EAS projesi kendi Expo hesabınıza bağlıdır. `production` profili App Store dağıtımı ve uzaktan artan iOS derleme numarası için ayarlanmıştır. İlk imzalı derlemede Apple Developer hesabıyla giriş ve iki aşamalı doğrulama istenir:

```sh
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

İkinci komut ilk komut başarıyla tamamlandıktan sonra çalıştırılmalıdır. EAS Submit derlemeyi TestFlight'a yollar; App Store yayını için ayrıca App Review gönderimi gerekir. Apple oturum açma bilgilerini veya doğrulama kodlarını proje dosyalarına koymayın.

Desktop/iCloud altında yerel iOS derlemesinde Xcode, üretilen `ExpoModulesJSI.framework` dosyasındaki Finder niteliklerini imzalamayı reddedebilir. Böyle bir durumda projeyi iCloud eşitlemesi dışında bir dizinde derleyin; aynı kaynaklarla bu yöntemle simülatör derlemesi başarıyla tamamlandı.

## Veri

Finans kayıtları AsyncStorage'da tutulur. Ayarlardan JSON yedeği paylaşılabilir veya geri yüklenebilir. Pro üyeler işlemlerini seçilen dile uygun tarih, sayı biçimi ve CSV ayıracıyla dışa aktarabilir.

Kontroller: `npm run check:locales`, `npx tsc --noEmit`, `npx expo-doctor` ve `npx expo export --platform ios`.
