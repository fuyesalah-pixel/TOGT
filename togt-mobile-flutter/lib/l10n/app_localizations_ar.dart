// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'TOGT للسياحة والسفر';

  @override
  String get welcome => 'مرحباً بك';

  @override
  String get signInJourney => 'سجّل الدخول لحجز رحلتك القادمة';

  @override
  String get continueGoogle => 'المتابعة باستخدام Google';

  @override
  String get connectingGoogle => 'جارٍ الاتصال بـ Google...';

  @override
  String signedInAs(Object name, Object role) {
    return 'تم تسجيل الدخول باسم $name ($role)';
  }

  @override
  String get googleSignInFailed =>
      'فشل تسجيل الدخول عبر Google. تحقق من إعداد حساب Google وحاول مرة أخرى.';

  @override
  String get signInUnavailable =>
      'تسجيل الدخول عبر Google غير متاح حالياً. حاول لاحقاً.';

  @override
  String get unableSignIn => 'تعذر تسجيل الدخول الآن. حاول مرة أخرى.';

  @override
  String get appUpdated => 'تم تحديث التطبيق بنجاح!';

  @override
  String get home => 'الرئيسية';

  @override
  String get packages => 'الباقات';

  @override
  String get personal => 'الروحانيات';

  @override
  String get chat => 'المحادثة';

  @override
  String get profile => 'الملف الشخصي';

  @override
  String get settings => 'الإعدادات';

  @override
  String get language => 'اللغة';

  @override
  String get english => 'English';

  @override
  String get arabic => 'العربية';

  @override
  String get amharic => 'አማርኛ';

  @override
  String get saveChanges => 'حفظ التغييرات';

  @override
  String get saving => 'جارٍ الحفظ...';

  @override
  String get profileSettings => 'إعدادات الملف الشخصي';

  @override
  String get fullName => 'الاسم الكامل';

  @override
  String get phone => 'الهاتف';

  @override
  String get address => 'العنوان';

  @override
  String get nationality => 'الجنسية';

  @override
  String get passportNumber => 'رقم جواز السفر';

  @override
  String get profileSaved => 'تم حفظ الملف الشخصي بنجاح.';

  @override
  String get signInAgain => 'يرجى تسجيل الدخول مرة أخرى.';

  @override
  String profileSaveFailed(Object error) {
    return 'تعذر حفظ الملف الشخصي: $error';
  }

  @override
  String get whereGo => 'إلى أين تريد الذهاب؟';

  @override
  String get searchDestinations => 'ابحث عن وجهات أو باقات…';

  @override
  String get services => 'الخدمات';

  @override
  String get gallery => 'معرض الصور';

  @override
  String get testimonials => 'آراء العملاء';

  @override
  String get featuredPackages => 'الباقات المميزة';

  @override
  String get search => 'بحث';

  @override
  String get bookPackage => 'احجز الباقة';

  @override
  String get confirmBooking => 'تأكيد الحجز';

  @override
  String get formPrefilled => 'تم ملء النموذج من ملفك الشخصي';

  @override
  String get fillNamePhone => 'يرجى إدخال الاسم ورقم الهاتف.';

  @override
  String submissionFailed(Object error) {
    return 'فشل إرسال الطلب: $error';
  }

  @override
  String get travelers => 'المسافرون';

  @override
  String get packageType => 'نوع الباقة';

  @override
  String get hotelPreference => 'تفضيل الفندق';

  @override
  String get roomType => 'نوع الغرفة';

  @override
  String get continueAction => 'متابعة';

  @override
  String get required => 'مطلوب';

  @override
  String get aiAssistant => 'المساعد الذكي';

  @override
  String get humanSupport => 'دعم بشري';

  @override
  String get commonTravelAnswers => 'إجابات وطلبات السفر الشائعة.';

  @override
  String get chatTeam => 'تحدث مع فريق TOGT.';

  @override
  String get typeMessage => 'اكتب رسالة…';

  @override
  String get send => 'إرسال';

  @override
  String get attachmentsHint => 'يمكن إضافة المرفقات من محادثة الدعم.';

  @override
  String get onlineAi => 'متصل · مدعوم بالذكاء الاصطناعي';

  @override
  String get specialistOnDuty => 'متخصص TOGT متاح';

  @override
  String get aiOffline => 'الذكاء الاصطناعي غير متصل';

  @override
  String get offlineReply =>
      'أواجه مشكلة في الوصول إلى المساعد الذكي الآن. يرجى الاتصال بـ +251 99 797 9741 للحصول على مساعدة فورية.';

  @override
  String get chatWelcome =>
      'مرحباً! أنا أحمد من TOGT. اسألني عن باقات العمرة، التذاكر، التأشيرات، الجولات والحجز.';

  @override
  String chatSendFailed(String error) {
    return 'تعذر إرسال الرسالة: $error';
  }

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get unavailable => 'غير متاح';

  @override
  String get noPackages => 'لا توجد باقات متاحة.';

  @override
  String get loading => 'جارٍ التحميل...';

  @override
  String get networkError => 'خطأ في الشبكة. تحقق من الاتصال وحاول مرة أخرى.';

  @override
  String get umrah => 'العمرة';

  @override
  String get domesticTours => 'الجولات الداخلية';

  @override
  String get touristTours => 'جولات الزوار';

  @override
  String get foreignTravel => 'السفر للخارج';

  @override
  String get visaProcessing => 'معالجة التأشيرات';

  @override
  String get flightTicketing => 'حجز التذاكر';

  @override
  String get bookNow => 'احجز الآن';

  @override
  String get payNow => 'ادفع الآن';

  @override
  String get notifications => 'الإشعارات';

  @override
  String get logoutConfirm => 'هل أنت متأكد من تسجيل الخروج؟';

  @override
  String get qibla => 'القبلة';

  @override
  String get prayerTimes => 'مواقيت الصلاة';

  @override
  String get azanAlarm => 'منبه الأذان';

  @override
  String get azkar => 'الأذكار';

  @override
  String get requestReceived => 'تم استلام الطلب';

  @override
  String get requestStatus => 'حالة الطلب';

  @override
  String get ticket => 'تذكرة';

  @override
  String get visa => 'تأشيرة';

  @override
  String get contact => 'تواصل معنا';

  @override
  String get languageChanged => 'تم تحديث اللغة';

  @override
  String get newFeatures => 'تمت إضافة ميزات جديدة!';

  @override
  String versionLabel(Object version) {
    return 'الإصدار $version';
  }

  @override
  String get later => 'لاحقاً';

  @override
  String get updateNow => 'تحديث الآن';

  @override
  String get tryAgain => 'حاول مرة أخرى';

  @override
  String get updateFailed => 'فشل التحديث.';

  @override
  String get updateInstallerError =>
      'تعذر فتح المثبّت. اسمح بالتثبيت من هذا التطبيق في الإعدادات ثم حاول مرة أخرى.';

  @override
  String get downloadFailed => 'فشل التنزيل. تحقق من الاتصال وحاول مرة أخرى.';

  @override
  String get updateDescription =>
      'حدّث التطبيق للاستفادة من الميزات والتحسينات الجديدة.';

  @override
  String get goHome => 'العودة إلى الرئيسية';

  @override
  String get requestSubmitted => 'تم إرسال الطلب بنجاح!';

  @override
  String get requestSent => 'تم إرسال طلبك إلى فريق TOGT.';

  @override
  String get galleryMoments => 'لحظات من رحلات TOGT';

  @override
  String get galleryUnavailable => 'المعرض غير متاح';

  @override
  String get morePhotos => 'المزيد من الصور';

  @override
  String get videos => 'الفيديوهات';

  @override
  String get watchVideo => 'مشاهدة الفيديو';

  @override
  String get travelerReviews => 'ماذا يقول مسافرونا';

  @override
  String get seeMoreReviews => 'شاهد المزيد من التقييمات';

  @override
  String get showLess => 'عرض أقل';

  @override
  String get reviewsUnavailable => 'التقييمات غير متاحة';

  @override
  String get noReviews => 'لا توجد تقييمات بعد';

  @override
  String get verifiedCustomer => 'عميل TOGT موثّق';

  @override
  String get proudIata => 'وكالة عضو فخور في IATA';

  @override
  String get iataDescriptionShort =>
      'نربطك بأكثر من 370 شركة طيران عضو في أكثر من 120 دولة.';

  @override
  String get memberAirlines => 'شركات الطيران الأعضاء';

  @override
  String get countries => 'الدول';

  @override
  String get globalAirTraffic => 'الحركة الجوية العالمية';

  @override
  String get iataAccredited => 'معتمد من IATA';

  @override
  String get transparentFares => 'أسعار شفافة';

  @override
  String get globalReach => 'وصول عالمي';

  @override
  String get explorePackages => 'استكشف الباقات';

  @override
  String get noPackagesFound => 'لا توجد باقات';

  @override
  String failedLoadPackages(Object error) {
    return 'فشل تحميل الباقات\n$error';
  }

  @override
  String get searchPackages => 'ابحث عن الباقات…';

  @override
  String get all => 'الكل';

  @override
  String get custom => 'مخصصة';

  @override
  String get seeAll => 'عرض الكل';

  @override
  String get cannotReachApi => 'تعذر الاتصال بالخادم';

  @override
  String get welcomeToTogt => 'مرحباً بك في TOGT';

  @override
  String get bookPackagesEasily => 'احجز الباقات بسهولة';

  @override
  String get trackJourney => 'تابع رحلتك';

  @override
  String get skip => 'تخطي';

  @override
  String get next => 'التالي';

  @override
  String get getStarted => 'ابدأ الآن';

  @override
  String get umrahJourneys => 'رحلات العمرة';

  @override
  String get prayerTools => 'أدوات الصلاة';

  @override
  String get umrahPackages => 'باقات العمرة';

  @override
  String get noUmrahPackages => 'لا توجد باقات عمرة بعد.';

  @override
  String get personalTools => 'أدوات لرحلتك اليومية';

  @override
  String get notifyBeforePrayer => 'إشعاري قبل وقت الصلاة';

  @override
  String get allowLocationPrayer => 'اسمح بالموقع لتحميل مواقيت الصلاة اليوم.';

  @override
  String get findingQibla => 'جارٍ تحديد القبلة...';

  @override
  String direction(Object degrees) {
    return 'الاتجاه: $degrees°';
  }

  @override
  String distanceMakkah(Object distance) {
    return 'المسافة إلى مكة: $distance كم';
  }

  @override
  String get compassUnavailable => 'البوصلة غير متاحة على هذا الجهاز';

  @override
  String get refreshLocation => 'تحديث الموقع';

  @override
  String get tapToCount => 'اضغط للعد';

  @override
  String get reset => 'إعادة ضبط';

  @override
  String get guestTraveler => 'مسافر زائر';

  @override
  String get notSignedIn => 'غير مسجل الدخول';

  @override
  String get myRequests => 'طلباتي';

  @override
  String get myTickets => 'تذاكري';

  @override
  String get history => 'السجل';

  @override
  String get reviews => 'التقييمات';

  @override
  String get parentTracking => 'تتبع الوالدين';

  @override
  String get payments => 'المدفوعات';

  @override
  String get helpSupport => 'المساعدة والدعم';

  @override
  String get signIn => 'تسجيل الدخول';

  @override
  String get logOut => 'تسجيل الخروج';

  @override
  String get signOut => 'تسجيل الخروج';

  @override
  String get cancel => 'إلغاء';

  @override
  String get signOutQuestion => 'هل أنت متأكد من تسجيل الخروج؟';

  @override
  String get close => 'إغلاق';

  @override
  String get openWebVersion => 'فتح نسخة الويب';

  @override
  String get pleaseUseWeb => 'يرجى استخدام نسخة الويب';

  @override
  String get supportPreferences =>
      'تتم إدارة ملفك وتفضيلات الإشعارات بأمان من خلال حساب TOGT.';

  @override
  String get sending => 'جارٍ الإرسال...';

  @override
  String get sendRequest => 'إرسال الطلب';

  @override
  String get payLater => 'الدفع لاحقاً';

  @override
  String get paymentReferencePending =>
      'ستفتح صفحة الدفع عند إصدار مرجع الدفع.';

  @override
  String get requestFollowup =>
      'أخبرنا بما تحتاجه وسيتابع معك أحد متخصصي TOGT.';

  @override
  String get noSupportWorker => 'لا يوجد موظف دعم متاح';

  @override
  String get queuedReply =>
      'رسالتك في قائمة الدعم. سيرد عليك متخصص TOGT قريباً.';

  @override
  String get sorryAi => 'عذراً، لم أتمكن من الإجابة.';

  @override
  String get askAnything => 'اسأل عن أي شيء…';

  @override
  String get airlineExample => 'الخطوط الجوية الإثيوبية';

  @override
  String get detailsAvailable => 'التفاصيل متاحة';

  @override
  String get active => 'نشط';

  @override
  String get untitled => 'بدون عنوان';

  @override
  String get toctItem => 'عنصر TOGT';

  @override
  String journeysAvailable(Object count) {
    return '$count رحلة متاحة';
  }

  @override
  String get aboutPackage => 'عن هذه الباقة';

  @override
  String get included => 'ما تتضمنه الباقة';

  @override
  String get notIncluded => 'غير مشمول';

  @override
  String get readAll => 'قراءة الكل';

  @override
  String get noNotifications => 'لا توجد إشعارات بعد.';

  @override
  String get requestDetails => 'تفاصيل الطلب';

  @override
  String get packageRequest => 'الباقة والطلب';

  @override
  String get progressTimeline => 'الجدول الزمني للتقدم';

  @override
  String get noProgress => 'لا توجد تحديثات تقدم بعد.';

  @override
  String get documents => 'المستندات';

  @override
  String get contactSupport => 'تواصل مع الدعم';

  @override
  String get payment => 'الدفع';

  @override
  String amount(Object amount) {
    return 'المبلغ: $amount';
  }

  @override
  String get notSet => 'غير محدد';

  @override
  String get enterAmount => 'أدخل المبلغ (بر)';

  @override
  String get saveAmount => 'حفظ المبلغ';

  @override
  String transaction(Object id) {
    return 'المعاملة: $id';
  }

  @override
  String payNowAmount(Object amount, Object currency) {
    return 'ادفع الآن - $amount $currency';
  }

  @override
  String get ticketDetails => 'تفاصيل التذكرة';

  @override
  String get shareExperience => 'شارك تجربتك';

  @override
  String get feedbackHelps =>
      'تساعد ملاحظاتك المسافرين الآخرين على الاختيار بثقة.';

  @override
  String get yourReview => 'تقييمك';

  @override
  String get tellJourney => 'أخبرنا عن رحلتك...';

  @override
  String photosCount(Object count) {
    return 'الصور ($count/3)';
  }

  @override
  String get addPhoto => 'إضافة صورة';

  @override
  String get yourJourneyBegins => 'رحلتك تبدأ هنا';

  @override
  String get personalTitle => 'الروحانيات';

  @override
  String get azkarMorning => 'أذكار الصباح';

  @override
  String get azkarEvening => 'أذكار المساء';

  @override
  String get beforeTravel => 'قبل السفر';

  @override
  String get commonDuas => 'أدعية شائعة';

  @override
  String get gloryAllah => 'سبحان الله وبحمده.';

  @override
  String webRoleMessage(Object role) {
    return 'يتطلب دورك ($role) لوحة التحكم الكاملة على الويب.';
  }

  @override
  String get consulting => 'الاستشارات';

  @override
  String get domesticTour => 'جولة داخلية';

  @override
  String get touristTravel => 'سفر سياحي';

  @override
  String get flightTicket => 'تذكرة طيران';

  @override
  String get contactUs => 'تواصل معنا';

  @override
  String get foreignTravelForm => 'السفر للخارج';

  @override
  String get visaForm => 'معالجة التأشيرات';

  @override
  String get umrahForm => 'العمرة';

  @override
  String get retryLoad => 'إعادة المحاولة';

  @override
  String failedLoad(Object error, Object item) {
    return 'تعذر تحميل $item\n$error';
  }

  @override
  String noItems(Object item) {
    return 'لا يوجد $item بعد.';
  }

  @override
  String get statusDetails => 'التفاصيل متاحة';

  @override
  String get created => 'تم الإنشاء';

  @override
  String get updated => 'تم التحديث';

  @override
  String get newJourney => 'جولات داخلية عبر إثيوبيا';

  @override
  String get airlineFares => 'أفضل الأسعار على شركات الطيران الكبرى';

  @override
  String get visaEasy => 'تأشيرات الزيارة والعلاج والعائلة';

  @override
  String get seeAllPackages => 'عرض الكل';

  @override
  String get flexibleDuration => 'مدة مرنة';

  @override
  String get customPricing => 'سعر مخصص';

  @override
  String get pickFromGallery => 'اختر من المعرض';

  @override
  String get takePhoto => 'التقط صورة';

  @override
  String get connectingDots => 'جارٍ الاتصال…';

  @override
  String get attachment => 'مرفق';

  @override
  String get permissionTitle => 'السماح بالوصول';

  @override
  String get permissionBody =>
      'يحتاج TOGT بعض الأذونات ليعمل بالكامل: الموقع لمواقيت الصلاة والقبلة، الإشعارات للأذان والمحادثة، والصور لإرسال المستندات للدعم.';

  @override
  String get permissionGrant => 'السماح';

  @override
  String get permissionLater => 'ليس الآن';

  @override
  String get permissionOpenSettings => 'فتح الإعدادات';

  @override
  String get permissionBlockedBody =>
      'تم رفض بعض الأذونات نهائياً. فعّلها من الإعدادات لتعمل مواقيت الصلاة وأذان الإشعارات ومشاركة الملفات.';

  @override
  String get azkarAfterPrayer => 'بعد الصلاة';

  @override
  String get azkarSleep => 'قبل النوم';

  @override
  String get azkarDistress => 'عند الشدة';

  @override
  String get azanExactHint =>
      'اسمح بالتنبيهات الدقيقة ليبدأ الأذان في وقته تماماً. اضغط لفتح الإعدادات.';
}
