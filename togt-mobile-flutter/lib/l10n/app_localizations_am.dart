// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Amharic (`am`).
class AppLocalizationsAm extends AppLocalizations {
  AppLocalizationsAm([String locale = 'am']) : super(locale);

  @override
  String get appTitle => 'TOGT Tour & Travel';

  @override
  String get welcome => 'እንኳን ደህና መጡ';

  @override
  String get signInJourney => 'ቀጣይ ጉዞዎን ለማስያዝ ይግቡ';

  @override
  String get continueGoogle => 'በGoogle ይቀጥሉ';

  @override
  String get connectingGoogle => 'ከGoogle ጋር በመገናኘት ላይ...';

  @override
  String signedInAs(Object name, Object role) {
    return 'እንደ $name ($role) ገብተዋል';
  }

  @override
  String get googleSignInFailed =>
      'የGoogle መግቢያ አልተሳካም። የGoogle መለያዎን ያረጋግጡና እንደገና ይሞክሩ።';

  @override
  String get signInUnavailable => 'የGoogle መግቢያ አሁን አይገኝም። ቆይተው ይሞክሩ።';

  @override
  String get unableSignIn => 'አሁን መግባት አልተቻለም። እንደገና ይሞክሩ።';

  @override
  String get appUpdated => 'መተግበሪያው በተሳካ ሁኔታ ተዘምኗል!';

  @override
  String get home => 'መነሻ';

  @override
  String get packages => 'ፓኬጆች';

  @override
  String get personal => 'መንፈሳዊ';

  @override
  String get chat => 'ውይይት';

  @override
  String get profile => 'መገለጫ';

  @override
  String get settings => 'ቅንብሮች';

  @override
  String get language => 'ቋንቋ';

  @override
  String get english => 'English';

  @override
  String get arabic => 'العربية';

  @override
  String get amharic => 'አማርኛ';

  @override
  String get saveChanges => 'ለውጦችን አስቀምጥ';

  @override
  String get saving => 'በማስቀመጥ ላይ...';

  @override
  String get profileSettings => 'የመገለጫ ቅንብሮች';

  @override
  String get fullName => 'ሙሉ ስም';

  @override
  String get phone => 'ስልክ';

  @override
  String get address => 'አድራሻ';

  @override
  String get nationality => 'ዜግነት';

  @override
  String get passportNumber => 'የፓስፖርት ቁጥር';

  @override
  String get profileSaved => 'መገለጫው በተሳካ ሁኔታ ተቀምጧል።';

  @override
  String get signInAgain => 'እንደገና ይግቡ።';

  @override
  String profileSaveFailed(Object error) {
    return 'መገለጫውን ማስቀመጥ አልተቻለም: $error';
  }

  @override
  String get whereGo => 'ወዴት መሄድ ይፈልጋሉ?';

  @override
  String get searchDestinations => 'መዳረሻዎችን ወይም ፓኬጆችን ይፈልጉ…';

  @override
  String get services => 'አገልግሎቶች';

  @override
  String get gallery => 'ጋለሪ';

  @override
  String get testimonials => 'የደንበኞች አስተያየት';

  @override
  String get featuredPackages => 'ተመራጭ ፓኬጆች';

  @override
  String get search => 'ፍለጋ';

  @override
  String get bookPackage => 'ፓኬጅ ያስይዙ';

  @override
  String get confirmBooking => 'ቦታ ማስያዝን ያረጋግጡ';

  @override
  String get formPrefilled => 'ቅጹ ከመገለጫዎ ተሞልቷል';

  @override
  String get fillNamePhone => 'እባክዎ ስምዎንና ስልክ ቁጥርዎን ያስገቡ።';

  @override
  String submissionFailed(Object error) {
    return 'ጥያቄውን መላክ አልተሳካም: $error';
  }

  @override
  String get travelers => 'ተጓዦች';

  @override
  String get packageType => 'የፓኬጅ አይነት';

  @override
  String get hotelPreference => 'የሆቴል ምርጫ';

  @override
  String get roomType => 'የክፍል አይነት';

  @override
  String get continueAction => 'ቀጥል';

  @override
  String get required => 'አስፈላጊ';

  @override
  String get aiAssistant => 'AI ረዳት';

  @override
  String get humanSupport => 'የሰው ድጋፍ';

  @override
  String get commonTravelAnswers => 'የተለመዱ የጉዞ መልሶችና ጥያቄዎች።';

  @override
  String get chatTeam => 'ከTOGT ቡድን ጋር ይወያዩ።';

  @override
  String get typeMessage => 'መልዕክት ይጻፉ…';

  @override
  String get send => 'ላክ';

  @override
  String get attachmentsHint => 'ከድጋፍ ውይይት ማያያዣዎችን ማከል ይችላሉ።';

  @override
  String get onlineAi => 'በመስመር ላይ · AI የሚያግዝ';

  @override
  String get specialistOnDuty => 'የTOGT ባለሙያ በሥራ ላይ';

  @override
  String get aiOffline => 'AI ከመስመር ውጭ ነው';

  @override
  String get offlineReply =>
      'በአሁኑ ጊዜ AI አገልግሎቱን ማግኘት እየተሳነ ነው። እባክዎ ወዲያውኑ ለእርዳታ +251 99 797 9741 ይደውሉ።';

  @override
  String get chatWelcome =>
      'እንኳን ደህና መጡ! እኔ አህመድ ነኝ ከ TOGT። ስለ ኡምራ ፓኬጆች፣ በረራዎች፣ ቪዛ፣ ጉዞዎች እና ቦታ ማስያዝ ይጠይቁኝ።';

  @override
  String chatSendFailed(String error) {
    return 'መልዕክቱን መላክ አልተቻለም፦ $error';
  }

  @override
  String get retry => 'እንደገና ሞክር';

  @override
  String get unavailable => 'አይገኝም';

  @override
  String get noPackages => 'ምንም ፓኬጅ አልተገኘም።';

  @override
  String get loading => 'በመጫን ላይ...';

  @override
  String get networkError => 'የኔትወርክ ስህተት። ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።';

  @override
  String get umrah => 'ዑምራ';

  @override
  String get domesticTours => 'የሀገር ውስጥ ጉዞዎች';

  @override
  String get touristTours => 'የቱሪስት ጉዞዎች';

  @override
  String get foreignTravel => 'የውጭ ሀገር ጉዞ';

  @override
  String get visaProcessing => 'ቪዛ ማስፈጸም';

  @override
  String get flightTicketing => 'የበረራ ቲኬት';

  @override
  String get bookNow => 'አሁን ያስይዙ';

  @override
  String get payNow => 'አሁን ይክፈሉ';

  @override
  String get notifications => 'ማሳወቂያዎች';

  @override
  String get logoutConfirm => 'ከመለያዎ መውጣት ይፈልጋሉ?';

  @override
  String get qibla => 'ቂብላ';

  @override
  String get prayerTimes => 'የጸሎት ጊዜዎች';

  @override
  String get azanAlarm => 'የአዛን ማንቂያ';

  @override
  String get azkar => 'ዝክር';

  @override
  String get requestReceived => 'ጥያቄው ደርሷል';

  @override
  String get requestStatus => 'የጥያቄ ሁኔታ';

  @override
  String get ticket => 'ቲኬት';

  @override
  String get visa => 'ቪዛ';

  @override
  String get contact => 'ያግኙን';

  @override
  String get languageChanged => 'ቋንቋው ተዘምኗል';

  @override
  String get newFeatures => 'አዲስ ባህሪያት ተጨምረዋል!';

  @override
  String versionLabel(Object version) {
    return 'ስሪት $version';
  }

  @override
  String get later => 'በኋላ';

  @override
  String get updateNow => 'አሁን አዘምን';

  @override
  String get tryAgain => 'እንደገና ሞክር';

  @override
  String get updateFailed => 'ማዘመን አልተሳካም።';

  @override
  String get updateInstallerError =>
      'መጫኛውን መክፈት አልተቻለም። ከዚህ መተግበሪያ መጫንን በቅንብሮች ይፍቀዱና እንደገና ይሞክሩ።';

  @override
  String get downloadFailed => 'ማውረድ አልተሳካም። ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።';

  @override
  String get updateDescription => 'አዲስ ባህሪያትና ማሻሻያዎችን ለማግኘት መተግበሪያውን ያዘምኑ።';

  @override
  String get goHome => 'ወደ መነሻ ሂድ';

  @override
  String get requestSubmitted => 'ጥያቄው በተሳካ ሁኔታ ተልኳል!';

  @override
  String get requestSent => 'ጥያቄዎ ለTOGT ቡድን ተልኳል።';

  @override
  String get galleryMoments => 'ከTOGT ጉዞዎች የተወሰዱ ጊዜያት';

  @override
  String get galleryUnavailable => 'ጋለሪው አይገኝም';

  @override
  String get morePhotos => 'ተጨማሪ ፎቶዎች';

  @override
  String get videos => 'ቪዲዮዎች';

  @override
  String get watchVideo => 'ቪዲዮ ይመልከቱ';

  @override
  String get travelerReviews => 'ተጓዦቻችን ምን ይላሉ';

  @override
  String get seeMoreReviews => 'ተጨማሪ ግምገማዎችን ይመልከቱ';

  @override
  String get showLess => 'ያነሰ አሳይ';

  @override
  String get reviewsUnavailable => 'ግምገማዎች አይገኙም';

  @override
  String get noReviews => 'እስካሁን ግምገማ የለም';

  @override
  String get verifiedCustomer => 'የተረጋገጠ የTOGT ደንበኛ';

  @override
  String get proudIata => 'ኩሩ የIATA አባል ኤጀንሲ';

  @override
  String get iataDescriptionShort =>
      'ከ120 በላይ በሆኑ አገሮች ከ370 በላይ የIATA አባል አየር መንገዶችን እናገናኛለን።';

  @override
  String get memberAirlines => 'አባል አየር መንገዶች';

  @override
  String get countries => 'አገሮች';

  @override
  String get globalAirTraffic => 'ዓለም አቀፍ የአየር ትራፊክ';

  @override
  String get iataAccredited => 'የIATA እውቅና ያለው';

  @override
  String get transparentFares => 'ግልጽ ዋጋዎች';

  @override
  String get globalReach => 'ዓለም አቀፍ ተደራሽነት';

  @override
  String get explorePackages => 'ፓኬጆችን ያስሱ';

  @override
  String get noPackagesFound => 'ምንም ፓኬጅ አልተገኘም';

  @override
  String failedLoadPackages(Object error) {
    return 'ፓኬጆችን መጫን አልተሳካም\n$error';
  }

  @override
  String get searchPackages => 'ፓኬጆችን ይፈልጉ…';

  @override
  String get all => 'ሁሉም';

  @override
  String get custom => 'ብጁ';

  @override
  String get seeAll => 'ሁሉንም ይመልከቱ';

  @override
  String get cannotReachApi => 'ከሰርቨሩ ጋር መገናኘት አልተቻለም';

  @override
  String get welcomeToTogt => 'ወደ TOGT እንኳን በደህና መጡ';

  @override
  String get bookPackagesEasily => 'ፓኬጆችን በቀላሉ ያስይዙ';

  @override
  String get trackJourney => 'ጉዞዎን ይከታተሉ';

  @override
  String get skip => 'ዝለል';

  @override
  String get next => 'ቀጥል';

  @override
  String get getStarted => 'ይጀምሩ';

  @override
  String get umrahJourneys => 'የዑምራ ጉዞዎች';

  @override
  String get prayerTools => 'የጸሎት መሣሪያዎች';

  @override
  String get umrahPackages => 'የዑምራ ፓኬጆች';

  @override
  String get noUmrahPackages => 'እስካሁን የዑምራ ፓኬጅ የለም።';

  @override
  String get personalTools => 'ለዕለታዊ ጉዞዎ መሣሪያዎች';

  @override
  String get notifyBeforePrayer => 'ከጸሎት ጊዜ በፊት አሳውቀኝ';

  @override
  String get allowLocationPrayer => 'የዛሬን የጸሎት ጊዜ ለመጫን የአካባቢ ፈቃድ ይስጡ።';

  @override
  String get findingQibla => 'ቂብላን በመፈለግ ላይ...';

  @override
  String direction(Object degrees) {
    return 'አቅጣጫ: $degrees°';
  }

  @override
  String distanceMakkah(Object distance) {
    return 'ከመካ ያለው ርቀት: $distance ኪ.ሜ';
  }

  @override
  String get compassUnavailable => 'በዚህ መሣሪያ ኮምፓስ አይገኝም';

  @override
  String get refreshLocation => 'አካባቢን አድስ';

  @override
  String get tapToCount => 'ለመቁጠር ይንኩ';

  @override
  String get reset => 'ዳግም አስጀምር';

  @override
  String get guestTraveler => 'እንግዳ ተጓዥ';

  @override
  String get notSignedIn => 'አልገቡም';

  @override
  String get myRequests => 'ጥያቄዎቼ';

  @override
  String get myTickets => 'ቲኬቶቼ';

  @override
  String get history => 'ታሪክ';

  @override
  String get reviews => 'ግምገማዎች';

  @override
  String get parentTracking => 'የወላጅ ክትትል';

  @override
  String get payments => 'ክፍያዎች';

  @override
  String get helpSupport => 'እርዳታና ድጋፍ';

  @override
  String get signIn => 'ይግቡ';

  @override
  String get logOut => 'ውጣ';

  @override
  String get signOut => 'ውጣ';

  @override
  String get cancel => 'ሰርዝ';

  @override
  String get signOutQuestion => 'ከመለያዎ መውጣት ይፈልጋሉ?';

  @override
  String get close => 'ዝጋ';

  @override
  String get openWebVersion => 'የድር ስሪቱን ክፈት';

  @override
  String get pleaseUseWeb => 'እባክዎ የድር ስሪቱን ይጠቀሙ';

  @override
  String get supportPreferences =>
      'መገለጫዎና የማሳወቂያ ምርጫዎችዎ በTOGT መለያዎ በደህንነት ይተዳደራሉ።';

  @override
  String get sending => 'በመላክ ላይ...';

  @override
  String get sendRequest => 'ጥያቄ ላክ';

  @override
  String get payLater => 'በኋላ ይክፈሉ';

  @override
  String get paymentReferencePending => 'የክፍያ ማጣቀሻ ሲወጣ የክፍያ ገጹ ይከፈታል።';

  @override
  String get requestFollowup => 'የሚፈልጉትን ይንገሩን የTOGT ባለሙያ ይከታተልዎታል።';

  @override
  String get noSupportWorker => 'ምንም የድጋፍ ሰራተኛ አይገኝም';

  @override
  String get queuedReply => 'መልዕክትዎ በድጋፍ ሰልፍ ውስጥ ነው። የTOGT ባለሙያ በቅርቡ ይመልሳል።';

  @override
  String get sorryAi => 'ይቅርታ፣ መመለስ አልቻልኩም።';

  @override
  String get askAnything => 'ማንኛውንም ይጠይቁ…';

  @override
  String get airlineExample => 'የኢትዮጵያ አየር መንገድ';

  @override
  String get detailsAvailable => 'ዝርዝሩ ይገኛል';

  @override
  String get active => 'ንቁ';

  @override
  String get untitled => 'ርዕስ የለም';

  @override
  String get toctItem => 'የTOGT ንጥል';

  @override
  String journeysAvailable(Object count) {
    return '$count ጉዞዎች ይገኛሉ';
  }

  @override
  String get aboutPackage => 'ስለዚህ ፓኬጅ';

  @override
  String get included => 'የተካተቱ ነገሮች';

  @override
  String get notIncluded => 'ያልተካተቱ ነገሮች';

  @override
  String get readAll => 'ሁሉንም አንብብ';

  @override
  String get noNotifications => 'እስካሁን ማሳወቂያ የለም።';

  @override
  String get requestDetails => 'የጥያቄ ዝርዝር';

  @override
  String get packageRequest => 'ፓኬጅና ጥያቄ';

  @override
  String get progressTimeline => 'የሂደት ጊዜ መስመር';

  @override
  String get noProgress => 'እስካሁን የሂደት ማሻሻያ የለም።';

  @override
  String get documents => 'ሰነዶች';

  @override
  String get contactSupport => 'ድጋፍን ያግኙ';

  @override
  String get payment => 'ክፍያ';

  @override
  String amount(Object amount) {
    return 'መጠን: $amount';
  }

  @override
  String get notSet => 'አልተወሰነም';

  @override
  String get enterAmount => 'መጠን ያስገቡ (ብር)';

  @override
  String get saveAmount => 'መጠኑን አስቀምጥ';

  @override
  String transaction(Object id) {
    return 'ግብይት: $id';
  }

  @override
  String payNowAmount(Object amount, Object currency) {
    return 'አሁን ይክፈሉ - $amount $currency';
  }

  @override
  String get ticketDetails => 'የቲኬት ዝርዝር';

  @override
  String get shareExperience => 'ልምድዎን ያጋሩ';

  @override
  String get feedbackHelps => 'አስተያየትዎ ሌሎች ተጓዦች በልበ ሙሉነት እንዲመርጡ ይረዳል።';

  @override
  String get yourReview => 'የእርስዎ ግምገማ';

  @override
  String get tellJourney => 'ስለ ጉዞዎ ይንገሩን...';

  @override
  String photosCount(Object count) {
    return 'ፎቶዎች ($count/3)';
  }

  @override
  String get addPhoto => 'ፎቶ ጨምር';

  @override
  String get yourJourneyBegins => 'ጉዞዎ እዚህ ይጀምራል';

  @override
  String get personalTitle => 'መንፈሳዊ';

  @override
  String get azkarMorning => 'የጠዋት ዝክር';

  @override
  String get azkarEvening => 'የማታ ዝክር';

  @override
  String get beforeTravel => 'ከመጓዝ በፊት';

  @override
  String get commonDuas => 'የተለመዱ ዱዓዎች';

  @override
  String get gloryAllah => 'ሱብሓነላህ ወበሓምዲሂ።';

  @override
  String webRoleMessage(Object role) {
    return 'የእርስዎ ሚና ($role) በድር ላይ ያለውን ሙሉ ዳሽቦርድ ይፈልጋል።';
  }

  @override
  String get consulting => 'ምክር';

  @override
  String get domesticTour => 'የሀገር ውስጥ ጉዞ';

  @override
  String get touristTravel => 'የቱሪስት ጉዞ';

  @override
  String get flightTicket => 'የበረራ ቲኬት';

  @override
  String get contactUs => 'ያግኙን';

  @override
  String get foreignTravelForm => 'የውጭ ሀገር ጉዞ';

  @override
  String get visaForm => 'ቪዛ ማስፈጸም';

  @override
  String get umrahForm => 'ዑምራ';

  @override
  String get retryLoad => 'እንደገና ሞክር';

  @override
  String failedLoad(Object error, Object item) {
    return '$itemን መጫን አልተቻለም\n$error';
  }

  @override
  String noItems(Object item) {
    return 'እስካሁን $item የለም።';
  }

  @override
  String get statusDetails => 'ዝርዝሩ ይገኛል';

  @override
  String get created => 'ተፈጥሯል';

  @override
  String get updated => 'ተዘምኗል';

  @override
  String get newJourney => 'በኢትዮጵያ የሀገር ውስጥ ጉዞዎች';

  @override
  String get airlineFares => 'በዋና የአየር መንገዶች ላይ ምርጥ ዋጋዎች';

  @override
  String get visaEasy => 'የጉብኝት፣ የህክምናና የቤተሰብ ቪዛዎች';

  @override
  String get seeAllPackages => 'ሁሉንም ይመልከቱ';

  @override
  String get flexibleDuration => 'ተለዋዋጭ ቆይታ';

  @override
  String get customPricing => 'ብጁ ዋጋ';

  @override
  String get pickFromGallery => 'ከጋለሪው ይምረጡ';

  @override
  String get takePhoto => 'ፎቶ ያንሱ';

  @override
  String get connectingDots => 'በመገናኘት ላይ…';

  @override
  String get attachment => 'አባሪ';

  @override
  String get permissionTitle => 'ፈቃድ ይስጡ';

  @override
  String get permissionBody =>
      'TOGT ሙሉ በሙሉ ለመሥራት ጥቂት ፈቃዶች ያስፈልገዋል፦ ለጸሎት ጊዜና ቂብላ የአካባቢ፣ ለአዛን ማንቂያና ውይይት ማሳወቂያ፣ ለድጋፍ ሰነዶች ፎቶ።';

  @override
  String get permissionGrant => 'ፈቃድ ስጥ';

  @override
  String get permissionLater => 'አሁን አይደለም';

  @override
  String get permissionOpenSettings => 'ቅንብሮችን ክፈት';

  @override
  String get permissionBlockedBody =>
      'አንዳንድ ፈቃዶች በቋሚነት ተከልክለዋል። የጸሎት ጊዜ፣ የአዛን ማንቂያና ፋይል መላክ እንዲሰሩ በቅንብሮች ይፍቀዱ።';

  @override
  String get azkarAfterPrayer => 'ከጸሎት በኋላ';

  @override
  String get azkarSleep => 'ከመኝታ በፊት';

  @override
  String get azkarDistress => 'በስቃይ ጊዜ';

  @override
  String get azanExactHint =>
      'አዛን በትክክል እንዲደርስ የትክክለኛ ማንቂያ ፈቃድ ይስጡ። ለመክፈት ይንኩ።';

  @override
  String get browseFiles => 'ፋይሎችን ይምረጡ';

  @override
  String get attachmentsAllowed => 'ፎቶና PDF እስከ 10MB';

  @override
  String get unsupportedFileType =>
      'የወደደው የፋይል አይነት አይደገፍም። JPG፣ PNG፣ GIF፣ WEBP ምስል ወይም ከ10MB በታች PDF ይምረጡ።';

  @override
  String fieldRequired(String field) {
    return '$field ያስፈልጋል';
  }

  @override
  String get invalidEmail => 'ትክክለኛ ኢሜይል ያስገቡ';

  @override
  String get invalidPhone => 'ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0912345678)';

  @override
  String get fixErrorsBelow => 'እባክዎ የተለዩትን መስኮች ያረጋግጡ እና እንደገና ይሞክሩ';

  @override
  String get selectOption => 'አማራጭ ይምረጡ';

  @override
  String get searchList => 'ለመፈለግ ይጻፉ…';

  @override
  String get noMatches => 'ውጤት አልተገኘም';

  @override
  String get clearValue => 'አጽዳ';

  @override
  String get returnAfterDeparture => 'የመመለሻ ቀን ከመነሻ ቀን በኋላ መሆን አለበት';

  @override
  String get tripDetails => 'የጉዞ ዝርዝር';

  @override
  String get travelersSection => 'ተጓዞች';

  @override
  String get contactSection => 'የመገናኛ መረጃ';

  @override
  String get passportSection => 'የፓስፖርት ዝርዝር';

  @override
  String get messageSection => 'መልእክትዎ';

  @override
  String get tourSection => 'የጉዞ ዝርዝር';

  @override
  String get visaSection => 'የቪዛ ዝርዝር';

  @override
  String get updatingApp => 'ኢንተርኔት ማውረጃ…';

  @override
  String get updateReady => 'ማውረጃ ተዘጋጅቷል';

  @override
  String get installUpdate => 'ጫን';

  @override
  String get autoUpdateNote => 'የTOGT ማውረጃዎች በኢንተርኔት ሲገናኙ በራስ-ሰር ይወርዳሉ።';

  @override
  String get updateInstalling => 'አዲሱ ስሪት በመጫን ላይ…';

  @override
  String get oromiffa => 'ኦሮምኛ';

  @override
  String get umrahGift => 'የዑምራ ስጦታ';

  @override
  String get giftNote => 'ዑምራን እንደ ስጦታ ይስጡ — ሙሉ ወይም ግማሽ ክፍያ ለሚወዱት ሰው።';

  @override
  String get giftCheckbox => 'ይህ ስጦታ ነው';

  @override
  String get giftType => 'የስጦታ ዓይነት';

  @override
  String get giftFull => 'ሙሉ ስጦታ (100% በላኪው ይከፈላል)';

  @override
  String get giftHalf => 'ግማሽ ስጦታ (50% በላኪው ይከፈላል)';

  @override
  String get giftHalfNote => 'ተቀባዩ ቀሪውን 50% ከጉዞ በፊት ይከፍላል።';

  @override
  String get recipientName => 'የተቀባዩ ሙሉ ስም';

  @override
  String get recipientPhone => 'የተቀባዩ ስልክ';

  @override
  String get recipientEmail => 'የተቀባዩ ኢሜይል (አማራጭ)';

  @override
  String get trackingIntro => 'የሌሎችን ጉዞ ለመከታተል ጥያቄ ይላኩ — ከተስማሙ በኋላ ክትትል ይጀምራል።';

  @override
  String get trackingSendRequest => 'የክትትል ጥያቄ ላክ';

  @override
  String get trackingAccepted => 'ተቀብቷል';

  @override
  String get trackingDeclined => 'አልተቀበለም';

  @override
  String get trackingPendingStatus => 'ጥያቄው በሂደት ላይ ነው';

  @override
  String get trackingCancelled => 'ተሰርዟል';

  @override
  String get trackingSearchHint => 'ተጠቃሚዎችን በስም ወይም በኢሜይል ይፈልጉ';

  @override
  String get trackingIncomingTitle => 'ለእርስዎ የመጡ የክትትል ጥያቄዎች';

  @override
  String get trackingLiveTitle => 'አሁን በስራ ላይ';

  @override
  String get trackingPeopleTitle => 'መከታተል የሚችሏቸው ሰዎች';

  @override
  String get trackingLinked => 'የተገናኘ — ጉዞዎቻቸውን መከታተል ይችላሉ';

  @override
  String get trackingNotLinked => 'አልተገናኘም';

  @override
  String get trackingStartsWhenActive => 'ጉዞያቸው ሲጀመር ክትትሉ ይጀምራል';

  @override
  String get trackingTravelingNow => 'አሁን በጉዞ ላይ';

  @override
  String trackingFromGuide(Object distance) {
    return 'ከመሪው $distance ርቀት';
  }

  @override
  String get trackingWithGuide => 'ከመሪው ጋር';

  @override
  String get trackingDrifting => 'ከመሪው እየራቀ';

  @override
  String get trackingSeparated => 'ከመሪው ተለይቷል';

  @override
  String get trackingOffline => 'ምልክት የለም';

  @override
  String get trackingWaitingSignal => 'የመጀመሪያውን አካባቢ በመጠበቅ ላይ…';

  @override
  String get trackingRefresh => 'አድስ';

  @override
  String get locationBackgroundTitle => 'የአካባቢ ፈቃድ ያስፈልጋል';

  @override
  String get locationBackgroundBody =>
      'TOGT ጉዞዎ ደህንነቱ እንዲጠበቅ አካባቢዎን በዳራ ላይ ይጠቀማል። “Allow all the time” ይምረጡ።';

  @override
  String get alarmsVolumeHint =>
      'አዛን የማንቂያ ድምፅ ይጠቀማል። ከሆነ የማንቂያ ድምፅን በ Settings → Sound ያሳድጉ።';
}
