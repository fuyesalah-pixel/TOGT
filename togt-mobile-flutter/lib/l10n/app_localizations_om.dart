// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Oromo (`om`).
class AppLocalizationsOm extends AppLocalizations {
  AppLocalizationsOm([String locale = 'om']) : super(locale);

  @override
  String get appTitle => 'TOGT Tour & Travel';

  @override
  String get welcome => 'Baga nagaan dhuftan';

  @override
  String get signInJourney => 'Imala itti aanu bookuuf seeni';

  @override
  String get continueGoogle => 'Google\'n itti fufi';

  @override
  String get connectingGoogle => 'Google waliin wal qabaa jira...';

  @override
  String signedInAs(Object name, Object role) {
    return '$name ($role) dhaan seeni jirta';
  }

  @override
  String get googleSignInFailed =>
      'Google\'n seenuu hin kallee. Qindaa\'ina kee mirkaneessi irra deebi\'i.';

  @override
  String get signInUnavailable =>
      'Google\'n seenuu amma hin danda\'amu. Booda irra deebi\'i.';

  @override
  String get unableSignIn =>
      'Amma seenuu hin danda\'amu. Maaloo irra deebi\'i.';

  @override
  String get appUpdated => 'Appiin haaraayee jira!';

  @override
  String get home => 'Mana';

  @override
  String get packages => 'Paakeejota';

  @override
  String get personal => 'Dhuunfaa';

  @override
  String get chat => 'Haasawa';

  @override
  String get profile => 'Piroofayilii';

  @override
  String get settings => 'Qindaa\'ina';

  @override
  String get language => 'Afaan';

  @override
  String get english => 'Ingliffa';

  @override
  String get arabic => 'Arabiffaa';

  @override
  String get amharic => 'Amaariffaa';

  @override
  String get saveChanges => 'Jijjiirama kaa\'i';

  @override
  String get saving => 'Kaa\'aa jira...';

  @override
  String get profileSettings => 'Qindaa\'ina piroofayilii';

  @override
  String get fullName => 'Maqaa guutuu';

  @override
  String get phone => 'Bilbila';

  @override
  String get address => 'Teessoo';

  @override
  String get nationality => 'Sabumaa';

  @override
  String get passportNumber => 'Lakkoofsa paspoortii';

  @override
  String get profileSaved => 'Piroofayiliin kaa\'ameera.';

  @override
  String get signInAgain => 'Maaloo irra deebi\'ee seeni.';

  @override
  String profileSaveFailed(Object error) {
    return 'Piroofayilii kaa\'uu hin danda\'ame: $error';
  }

  @override
  String get whereGo => 'Eessa dhaquu barbaadda?';

  @override
  String get searchDestinations => 'Iddoo fi paakeeja barbaadi…';

  @override
  String get services => 'Tajaajilota';

  @override
  String get gallery => 'Suuraalee';

  @override
  String get testimonials => 'Yaadannoo fudhatamtootaa';

  @override
  String get featuredPackages => 'Paakeejota addaa';

  @override
  String get search => 'Barbaadi';

  @override
  String get bookPackage => 'Paakeeja Booki';

  @override
  String get confirmBooking => 'Ajaja Mirkaneessi';

  @override
  String get formPrefilled => 'Foorimichi piroofayilii kee irraa guutameera';

  @override
  String get fillNamePhone => 'Maqaa fi bilbila kee guuti.';

  @override
  String submissionFailed(Object error) {
    return 'Erguu hin kallee: $error';
  }

  @override
  String get travelers => 'Imaltoota';

  @override
  String get packageType => 'Gosa paakeejaa';

  @override
  String get hotelPreference => 'Filannoo hooteelaa';

  @override
  String get roomType => 'Gosa kutaa';

  @override
  String get continueAction => 'Itti fufi';

  @override
  String get required => 'Barbaachisa';

  @override
  String get aiAssistant => 'Gargaara AI';

  @override
  String get humanSupport => 'Gargaarsa Namaa';

  @override
  String get commonTravelAnswers => 'Deebii fi gaaffii imalaa beekamaa.';

  @override
  String get chatTeam => 'Tiiimii TOGT waliin haasawi.';

  @override
  String get typeMessage => 'Ergaa barbaad…';

  @override
  String get send => 'Ergi';

  @override
  String get attachmentsHint =>
      'Wabiyyoota haasawa gargaarsaa keessatti dabaluu dandeessa.';

  @override
  String get onlineAi => 'Online · AI\'n hojjeta';

  @override
  String get specialistOnDuty => 'Ogeessi TOGT kan tajaajiluu';

  @override
  String get aiOffline => 'AI\'n ala jira';

  @override
  String get offlineReply =>
      'AI\'n amma hin hin gaafatamuu. Gargaarsa sindaraaaf +251 99 797 9741 bilbila.';

  @override
  String get chatWelcome =>
      'Baga nagaan! Ani Ahmed kan TOGT. Umra, tikkii, viizaa, imala fi bookinguin gaafadhu.';

  @override
  String chatSendFailed(String error) {
    return 'Erguu hin danda\'ame: $error';
  }

  @override
  String get retry => 'Irra deebi\'i';

  @override
  String get unavailable => 'Hin argamu';

  @override
  String get noPackages => 'Paakeejiin hin jiru.';

  @override
  String get loading => 'Fe\'amaa jira...';

  @override
  String get networkError => 'Dogogora network. Wal qabsiisi irra deebi\'i.';

  @override
  String get umrah => 'Umra';

  @override
  String get domesticTours => 'Imala Biyya Keessaa';

  @override
  String get touristTours => 'Imala Turistii';

  @override
  String get foreignTravel => 'Imala Biyya Alaa';

  @override
  String get visaProcessing => 'Hojiicini Viizaa';

  @override
  String get flightTicketing => 'Tikkeetii Concour';

  @override
  String get bookNow => 'Amma Booki';

  @override
  String get payNow => 'Amma Kaffali';

  @override
  String get notifications => 'Beeksisota';

  @override
  String get logoutConfirm => 'Ba\'uuf jaallattaa?';

  @override
  String get qibla => 'Qibla';

  @override
  String get prayerTimes => 'Yeroo salaata';

  @override
  String get azanAlarm => 'Adaan';

  @override
  String get azkar => 'Azkaroota';

  @override
  String get requestReceived => 'Gaaffii argameera';

  @override
  String get requestStatus => 'Haala gaaffii';

  @override
  String get ticket => 'Tikkeetii';

  @override
  String get visa => 'Viizaa';

  @override
  String get contact => 'Nu Qunnadhu';

  @override
  String get languageChanged => 'Afaan jijjiirameera';

  @override
  String get newFeatures => 'Haala Haaraa Dabalateera!';

  @override
  String versionLabel(Object version) {
    return 'Version $version';
  }

  @override
  String get later => 'Booda';

  @override
  String get updateNow => 'Amma Haaromsi';

  @override
  String get tryAgain => 'Irra Deebi\'i';

  @override
  String get updateFailed => 'Haaromsuun hin kallee.';

  @override
  String get updateInstallerError =>
      'Installer banuu hin danda\'ame. Qindaa\'ina keessatti appii kanaan fe\'iistoorii hayyami.';

  @override
  String get downloadFailed =>
      'Buufamuu hin kallee. Wal qabsiisi irra deebi\'i.';

  @override
  String get updateDescription => 'Haala haaraa fayyadamuuf appii haaromsi.';

  @override
  String get goHome => 'Gara Mana';

  @override
  String get requestSubmitted => 'Gaaffiin Milkaa\'inaan Ergameera!';

  @override
  String get requestSent => 'Gaaffiin kee tiiimii TOGT dhaqameera.';

  @override
  String get galleryMoments => 'Yaadannoo imala TOGT irraa';

  @override
  String get galleryUnavailable => 'Suuraaleen hin argamu';

  @override
  String get morePhotos => 'Suuraalee Dabalataa';

  @override
  String get videos => 'Vidiyoota';

  @override
  String get watchVideo => 'Vidiyoo ilaali';

  @override
  String get travelerReviews => 'Imaltootni keenya maal jedhu';

  @override
  String get seeMoreReviews => 'Yaadannoo Dabalataa Ilaali';

  @override
  String get showLess => 'Xiqqeessi';

  @override
  String get reviewsUnavailable => 'Yaadannoon hin argamu';

  @override
  String get noReviews => 'Yaadannoo hin jiru';

  @override
  String get verifiedCustomer => 'Fudhatamaa TOGT mirkanaa\'e';

  @override
  String get proudIata => 'Miseensa IATA boonsaa';

  @override
  String get iataDescriptionShort =>
      'Concour miseensa 370+ biyyoota 120+ keessa wal qabna.';

  @override
  String get memberAirlines => 'Concour Miseensota';

  @override
  String get countries => 'Biyyoota';

  @override
  String get globalAirTraffic => 'Sokkoo Concour Addunyaa';

  @override
  String get iataAccredited => 'IATA\'n Ragaa Qabu';

  @override
  String get transparentFares => 'Gatii Banaa';

  @override
  String get globalReach => 'Hafa Addunyaa';

  @override
  String get explorePackages => 'Paakeejota Qaqqabi';

  @override
  String get noPackagesFound => 'Paakeejiin hin argamne';

  @override
  String failedLoadPackages(Object error) {
    return 'Fe\'uun hin kallee\n$error';
  }

  @override
  String get searchPackages => 'Paakeeja barbaadi…';

  @override
  String get all => 'Hunda';

  @override
  String get custom => 'Dhokataa';

  @override
  String get seeAll => 'Hunda ilaali';

  @override
  String get cannotReachApi => 'Sarvittiin hin gaafatamu';

  @override
  String get welcomeToTogt => 'Baga Nagaan TOGT';

  @override
  String get bookPackagesEasily => 'Paakeeja Salphaatti Booki';

  @override
  String get trackJourney => 'Imala Kee Hordofi';

  @override
  String get skip => 'Dhiisi';

  @override
  String get next => 'Kan Cufe';

  @override
  String get getStarted => 'Jalqabi';

  @override
  String get umrahJourneys => 'Imala Umraa';

  @override
  String get prayerTools => 'Meeshaalee Salaata';

  @override
  String get umrahPackages => 'Paakeejota Umraa';

  @override
  String get noUmrahPackages => 'Paakeejin Umraa hin jiru.';

  @override
  String get personalTools => 'Meeshaalee guyyaa guyyaan';

  @override
  String get notifyBeforePrayer => 'Salaata dura na beeksiisi';

  @override
  String get allowLocationPrayer =>
      'Yeroo salaata har\'aa fe\'uuf iddoo hayyami.';

  @override
  String get findingQibla => 'Qibla barbaadaa jira...';

  @override
  String direction(Object degrees) {
    return 'Kallatti: $degrees°';
  }

  @override
  String distanceMakkah(Object distance) {
    return 'Fageenya Makkaa: $distance km';
  }

  @override
  String get compassUnavailable =>
      'Koombaasiin minaaduu kana irratti hin hojjetu';

  @override
  String get refreshLocation => 'Iddoo haari';

  @override
  String get tapToCount => 'Lakkoofsuuf ta\'i';

  @override
  String get reset => 'Zero Godhi';

  @override
  String get guestTraveler => 'Imaalaa Keessi';

  @override
  String get notSignedIn => 'Hin seene';

  @override
  String get myRequests => 'Gaaffilee Koo';

  @override
  String get myTickets => 'Tikkeetoota Koo';

  @override
  String get history => 'Keesa';

  @override
  String get reviews => 'Yaadannoo';

  @override
  String get parentTracking => 'Hordofii Warraa';

  @override
  String get payments => 'Kaffaltiota';

  @override
  String get helpSupport => 'Gargaarsa';

  @override
  String get signIn => 'Seeni';

  @override
  String get logOut => 'Ba\'i';

  @override
  String get signOut => 'Ba\'i';

  @override
  String get cancel => 'Dhiisi';

  @override
  String get signOutQuestion => 'Dhiiquuf jaallattaa?';

  @override
  String get close => 'Cufi';

  @override
  String get openWebVersion => 'Version Web Bani';

  @override
  String get pleaseUseWeb => 'Maaloo Version Web Fayyadami';

  @override
  String get supportPreferences =>
      'Piroofayilii fi filannoo beeksisa akkaawuntii TOGT keessatti nageenyaan qabatamaa jira.';

  @override
  String get sending => 'Ergaa jira...';

  @override
  String get sendRequest => 'Gaaffii Ergi';

  @override
  String get payLater => 'Booda Kaffali';

  @override
  String get paymentReferencePending =>
      'Kaffaltaan yeroo rakoo reference argamu ni bana.';

  @override
  String get requestFollowup =>
      'Waant barbaaddu nu himi; ogeessi TOGT si qabee ana.';

  @override
  String get noSupportWorker => 'Nama gargaaru hin jiru';

  @override
  String get queuedReply =>
      'Ergaan kee sako gargaarsaa jira. Ogeessi TOGT dhiyoo deebii.';

  @override
  String get sorryAi => 'Dhiifama, kun hin deebisu dandeenne.';

  @override
  String get askAnything => 'Waan tokko gaafadhu…';

  @override
  String get airlineExample => 'Ethiopian Airlines';

  @override
  String get detailsAvailable => 'Ibsa jira';

  @override
  String get active => 'Sochii irratti';

  @override
  String get untitled => 'Magaalaa hin qabu';

  @override
  String get toctItem => 'Waan TOGT';

  @override
  String journeysAvailable(Object count) {
    return 'Imala $count ni jira';
  }

  @override
  String get aboutPackage => 'Waa\'ee paakeeja kanaa';

  @override
  String get included => 'Waan keessa jiru';

  @override
  String get notIncluded => 'Waan keessa hin jirne';

  @override
  String get readAll => 'Hunda Dubisi';

  @override
  String get noNotifications => 'Beeksiisi hin jiru.';

  @override
  String get requestDetails => 'Ibsa Gaaffii';

  @override
  String get packageRequest => 'Paakeeja fi gaaffii';

  @override
  String get progressTimeline => 'Tayimlayinii haaromsaa';

  @override
  String get noProgress => 'Haaromsaan hin jiru.';

  @override
  String get documents => 'Dokumentiota';

  @override
  String get contactSupport => 'Gargaarsa qunnadhu';

  @override
  String get payment => 'Kaffaltaa';

  @override
  String amount(Object amount) {
    return 'Baay\'ina: $amount';
  }

  @override
  String get notSet => 'Hin qindaa\'ine';

  @override
  String get enterAmount => 'Baay\'ina galchi (ETB)';

  @override
  String get saveAmount => 'Baay\'ina kaa\'i';

  @override
  String transaction(Object id) {
    return 'Trasakshinii: $id';
  }

  @override
  String payNowAmount(Object amount, Object currency) {
    return 'Amma Kaffali - $amount $currency';
  }

  @override
  String get ticketDetails => 'Ibsa Tikkeetii';

  @override
  String get shareExperience => 'Milaasa kee nu himi';

  @override
  String get feedbackHelps =>
      'Yaadannoon kee imaltota biroo akka nanamtti filatani gargaara.';

  @override
  String get yourReview => 'Yaadannoo kee';

  @override
  String get tellJourney => 'Waa\'ee imalaa kee nu himi...';

  @override
  String photosCount(Object count) {
    return 'Suuraalee ($count/3)';
  }

  @override
  String get addPhoto => 'Suuraa dabalii';

  @override
  String get yourJourneyBegins => 'Imalni kee asii jalqaba';

  @override
  String get personalTitle => 'Dhuunfaa';

  @override
  String get azkarMorning => 'Azkara Ganamaa';

  @override
  String get azkarEvening => 'Azkara Galgalaa';

  @override
  String get beforeTravel => 'Imala dura';

  @override
  String get commonDuas => 'Du\'aawwan beekamaa';

  @override
  String get gloryAllah => 'Rabbii arbairaa fi faarsaa Isaa dha.';

  @override
  String webRoleMessage(Object role) {
    return 'Gahee kee ($role) dashboard web irratti barbaachisa.';
  }

  @override
  String get consulting => 'Gorsa';

  @override
  String get domesticTour => 'Imala Biyya Keessaa';

  @override
  String get touristTravel => 'Imala Turistii';

  @override
  String get flightTicket => 'Tikkeetii Concour';

  @override
  String get contactUs => 'Nu Qunnadhu';

  @override
  String get foreignTravelForm => 'Imala Biyya Alaa';

  @override
  String get visaForm => 'Hojiicini Viizaa';

  @override
  String get umrahForm => 'Umra';

  @override
  String get retryLoad => 'Irra deebi\'i';

  @override
  String failedLoad(Object error, Object item) {
    return '$item fe\'uun hin danda\'ame\n$error';
  }

  @override
  String noItems(Object item) {
    return '$item hin jiru.';
  }

  @override
  String get statusDetails => 'Ibsa jira';

  @override
  String get created => 'Uumame';

  @override
  String get updated => 'Haaromfame';

  @override
  String get newJourney => 'Imala biyya keessaa Itoophiyaa keessaa';

  @override
  String get airlineFares => 'Gatii gaarii concour guddaa irraa';

  @override
  String get visaEasy => 'Viizaa daawwannaa, yaalii fi maatiqaa';

  @override
  String get seeAllPackages => 'Hunda ilaali';

  @override
  String get flexibleDuration => 'Yeroo sochii qabu';

  @override
  String get customPricing => 'Gatii dhokataa';

  @override
  String get pickFromGallery => 'Galaasii irraa filadhu';

  @override
  String get takePhoto => 'Suuraa kaafi';

  @override
  String get connectingDots => 'Wal qabaa jira…';

  @override
  String get attachment => 'Wabiyyoo';

  @override
  String get permissionTitle => 'Hayyamu';

  @override
  String get permissionBody =>
      'TOGT akka milluu hojjachuuf hayyamoota muraasa barbaada: iddoo (yeroo salaataa fi Qibla), beeksisaa (adaan fi haasawa), suuraalee (dokumentiittan erguuf).';

  @override
  String get permissionGrant => 'Hayyamu';

  @override
  String get permissionLater => 'Amma hin yaadu';

  @override
  String get permissionOpenSettings => 'Qindaa\'ina bani';

  @override
  String get permissionBlockedBody =>
      'Hayyamoon tokko tokko kan yeroo hundaaf dhorkaman. Salaata, adaan, wabiyyoo akka hojjatuuf Qindaa\'ina keessatti bani.';

  @override
  String get azkarAfterPrayer => 'Salaata booda';

  @override
  String get azkarSleep => 'Hirriba dura';

  @override
  String get azkarDistress => 'Rakkoo keessa';

  @override
  String get azanExactHint =>
      'Adaan yeroon isaa akka ta\'uuf exact alarms hayyami. Qindaa\'ina bani.';

  @override
  String get browseFiles => 'Faayilota ilaali';

  @override
  String get attachmentsAllowed => 'Suuraa fi PDF hanga 10MB';

  @override
  String get unsupportedFileType =>
      'Gosa faayilii hin fudhatamu. JPG, PNG, GIF, WEBP yookiin PDF 10MB gaditti filadhu.';

  @override
  String fieldRequired(String field) {
    return '$field barbaachisa';
  }

  @override
  String get invalidEmail => 'Imeeelii sirrii galchi';

  @override
  String get invalidPhone =>
      'Lakkoofsa bilbilaa sirrii galchi (fkn 0912345678)';

  @override
  String get fixErrorsBelow => 'Iddoon ibsame mirkaneessi irra deebi\'i';

  @override
  String get selectOption => 'Filannoo filadhu';

  @override
  String get searchList => 'Barbaaduuf barbaad…';

  @override
  String get noMatches => 'Waan hin argamne';

  @override
  String get clearValue => 'Balleessi';

  @override
  String get returnAfterDeparture =>
      'Guyyaa deebii guyyaa imalaa dursee hin ta\'u';

  @override
  String get tripDetails => 'Ibsa imalaa';

  @override
  String get travelersSection => 'Imaltoota';

  @override
  String get contactSection => 'Odeeffannoo wal qunna';

  @override
  String get passportSection => 'Ibsa paspoortii';

  @override
  String get messageSection => 'Ergaa kee';

  @override
  String get tourSection => 'Ibsa imalaa';

  @override
  String get visaSection => 'Ibsa viizaa';

  @override
  String get updatingApp => 'Haaromsaa buufaa jira…';

  @override
  String get updateReady => 'Haaromsi qopheesse';

  @override
  String get installUpdate => 'Fe\'i';

  @override
  String get autoUpdateNote => 'TOGT yeroo online jirtu ofumaan buufata.';

  @override
  String get updateInstalling => 'Version haaraa fe\'amaa jira…';

  @override
  String get oromiffa => 'Oromoo';

  @override
  String get umrahGift => 'Umra Kennaa';

  @override
  String get giftNote =>
      'Umra kennaa — kan jaallattaniif guutuu yookiin haffii kaffali.';

  @override
  String get giftCheckbox => 'Kun kennaa dha';

  @override
  String get giftType => 'Gosa kennaa';

  @override
  String get giftFull => 'Kennaa guutuu (kan ergu 100% kaffala)';

  @override
  String get giftHalf => 'Kennaa haffii (kan ergu 50% kaffala)';

  @override
  String get giftHalfNote => 'Fudhaatu haftee 50% imala dura kaffalu qaba.';

  @override
  String get recipientName => 'Maqaa fudhaataa';

  @override
  String get recipientPhone => 'Bilbila fudhaataa';

  @override
  String get recipientEmail => 'Imeeelii fudhaataa (filannoo)';

  @override
  String get trackingIntro =>
      'Imaltota biroo hordofuuf gaaffii ergi; yeroon isaan hayyamanatti hordofiin jalqaba.';

  @override
  String get trackingSendRequest => 'Gaaffii Hordofii Ergi';

  @override
  String get trackingAccepted => 'Hayyameera';

  @override
  String get trackingDeclined => 'Dhiyeesseera';

  @override
  String get trackingPendingStatus => 'Gaaffii haadhu jira';

  @override
  String get trackingCancelled => 'Gaaffii dhiifame';

  @override
  String get trackingSearchHint =>
      'Fudhatamtoota maqaa yookiin imeelii irraa barbaadi';

  @override
  String get trackingIncomingTitle => 'Gaaffii hordofii siif dhufee jira';

  @override
  String get trackingLiveTitle => 'Amma Jira';

  @override
  String get trackingPeopleTitle => 'Nama hordofuu dandeessu';

  @override
  String get trackingLinked =>
      'Wal qabameera — imala isaanii hordofuu dandeessa';

  @override
  String get trackingNotLinked => 'Hin wal qabamne';

  @override
  String get trackingStartsWhenActive =>
      'Imala isaanii sochii jiruutti hordofiin jalqaba';

  @override
  String get trackingTravelingNow => 'Amma imalaa jira';

  @override
  String trackingFromGuide(Object distance) {
    return 'Qajeelchaa irraa $distance';
  }

  @override
  String get trackingWithGuide => 'Qajeelcha waliin';

  @override
  String get trackingDrifting => 'Qajeelcha irraa adda cinee';

  @override
  String get trackingSeparated => 'Qajeelcha irraa adda ba\'e';

  @override
  String get trackingOffline => 'Iddoo hin beekamu';

  @override
  String get trackingWaitingSignal => 'Iddoo jalqabaa eegaa jira…';

  @override
  String get trackingRefresh => 'Haari';

  @override
  String get locationBackgroundTitle => 'Iddoo duubbee barbaachisa';

  @override
  String get locationBackgroundBody =>
      'TOGT imala kee nageenyaan akka hordofamuuf iddoo duubbee fayyadama. Maaloo \"Allow all the time\" filadhu.';

  @override
  String get alarmsVolumeHint =>
      'Adaan teeknooloojii \'Alarm volume\' fayyadama — yoo dhaga\'amu baatu Qindaa\'ina → Sound irraa ol keessi.';

  @override
  String get tasbih => 'Tasbihaa';

  @override
  String get paymentNotSetYet =>
      'Kaffaalni amma hin qindaa\'in — maaloo gatiin kee qindaa\'uuf karaa timma eegadhu.';

  @override
  String get reviewSubmittedThanks => 'Galatoomi! Ilbaaxsi kee ergameera.';

  @override
  String reviewSubmittedNoPhotos(Object count) {
    return 'Galatoomi! Ilbaaxsi kee ergameera, garuu suufii $count hin olkaa\'inne.';
  }
}
