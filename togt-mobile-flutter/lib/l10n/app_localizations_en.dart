// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'TOGT Tour & Travel';

  @override
  String get welcome => 'Welcome aboard';

  @override
  String get signInJourney => 'Sign in to book your next journey';

  @override
  String get continueGoogle => 'Continue with Google';

  @override
  String get connectingGoogle => 'Connecting to Google...';

  @override
  String signedInAs(Object name, Object role) {
    return 'Signed in as $name ($role)';
  }

  @override
  String get googleSignInFailed =>
      'Google sign-in failed. Check your Google account setup and try again.';

  @override
  String get signInUnavailable =>
      'Google sign-in is not available yet. Please try again later.';

  @override
  String get unableSignIn => 'Unable to sign in right now. Please try again.';

  @override
  String get appUpdated => 'App updated successfully!';

  @override
  String get home => 'Home';

  @override
  String get packages => 'Packages';

  @override
  String get personal => 'Personal';

  @override
  String get chat => 'Chat';

  @override
  String get profile => 'Profile';

  @override
  String get settings => 'Settings';

  @override
  String get language => 'Language';

  @override
  String get english => 'English';

  @override
  String get arabic => 'العربية';

  @override
  String get amharic => 'አማርኛ';

  @override
  String get saveChanges => 'Save changes';

  @override
  String get saving => 'Saving...';

  @override
  String get profileSettings => 'Profile settings';

  @override
  String get fullName => 'Full name';

  @override
  String get phone => 'Phone';

  @override
  String get address => 'Address';

  @override
  String get nationality => 'Nationality';

  @override
  String get passportNumber => 'Passport number';

  @override
  String get profileSaved => 'Profile saved successfully.';

  @override
  String get signInAgain => 'Please sign in again.';

  @override
  String profileSaveFailed(Object error) {
    return 'Could not save profile: $error';
  }

  @override
  String get whereGo => 'Where would you like to go?';

  @override
  String get searchDestinations => 'Search destinations, packages…';

  @override
  String get services => 'Services';

  @override
  String get gallery => 'Gallery';

  @override
  String get testimonials => 'Testimonials';

  @override
  String get featuredPackages => 'Featured packages';

  @override
  String get search => 'Search';

  @override
  String get bookPackage => 'Book Package';

  @override
  String get confirmBooking => 'Confirm Booking';

  @override
  String get formPrefilled => 'Form pre-filled from your profile';

  @override
  String get fillNamePhone => 'Please fill in your name and phone number.';

  @override
  String submissionFailed(Object error) {
    return 'Submission failed: $error';
  }

  @override
  String get travelers => 'Travelers';

  @override
  String get packageType => 'Package type';

  @override
  String get hotelPreference => 'Hotel preference';

  @override
  String get roomType => 'Room type';

  @override
  String get continueAction => 'Continue';

  @override
  String get required => 'Required';

  @override
  String get aiAssistant => 'AI Assistant';

  @override
  String get humanSupport => 'Human Support';

  @override
  String get commonTravelAnswers => 'Common travel answers and requests.';

  @override
  String get chatTeam => 'Chat with the TOGT team.';

  @override
  String get typeMessage => 'Type a message…';

  @override
  String get send => 'Send';

  @override
  String get attachmentsHint =>
      'Attachments can be added from the support chat.';

  @override
  String get onlineAi => 'Online · AI powered';

  @override
  String get specialistOnDuty => 'TOGT specialist on duty';

  @override
  String get aiOffline => 'AI offline';

  @override
  String get offlineReply =>
      'I\'m having trouble reaching the AI assistant right now. Please call +251 99 797 9741 for immediate help.';

  @override
  String get chatWelcome =>
      'Welcome! I\'m Ahmed from TOGT. Ask me about Umrah packages, flights, visas, tours, and booking.';

  @override
  String chatSendFailed(String error) {
    return 'Unable to send message: $error';
  }

  @override
  String get retry => 'Retry';

  @override
  String get unavailable => 'Unavailable';

  @override
  String get noPackages => 'No packages available.';

  @override
  String get loading => 'Loading...';

  @override
  String get networkError =>
      'Network error. Check your connection and try again.';

  @override
  String get umrah => 'Umrah';

  @override
  String get domesticTours => 'Domestic Tours';

  @override
  String get touristTours => 'Tourist Tours';

  @override
  String get foreignTravel => 'Foreign Travel';

  @override
  String get visaProcessing => 'Visa Processing';

  @override
  String get flightTicketing => 'Flight Ticketing';

  @override
  String get bookNow => 'Book Now';

  @override
  String get payNow => 'Pay Now';

  @override
  String get notifications => 'Notifications';

  @override
  String get logoutConfirm => 'Are you sure you want to log out?';

  @override
  String get qibla => 'Qibla';

  @override
  String get prayerTimes => 'Prayer times';

  @override
  String get azanAlarm => 'Azan alarm';

  @override
  String get azkar => 'Azkar';

  @override
  String get requestReceived => 'Request received';

  @override
  String get requestStatus => 'Request status';

  @override
  String get ticket => 'Ticket';

  @override
  String get visa => 'Visa';

  @override
  String get contact => 'Contact Us';

  @override
  String get languageChanged => 'Language updated';

  @override
  String get newFeatures => 'New Features Added!';

  @override
  String versionLabel(Object version) {
    return 'Version $version';
  }

  @override
  String get later => 'Later';

  @override
  String get updateNow => 'Update Now';

  @override
  String get tryAgain => 'Try Again';

  @override
  String get updateFailed => 'Update failed.';

  @override
  String get updateInstallerError =>
      'Could not open the installer. Allow installs from this app in Settings and try again.';

  @override
  String get downloadFailed =>
      'Download failed. Check your connection and try again.';

  @override
  String get updateDescription =>
      'Please update the app to enjoy new features and improvements.';

  @override
  String get goHome => 'Go to Home';

  @override
  String get requestSubmitted => 'Request Submitted Successfully!';

  @override
  String get requestSent => 'Your request has been sent to the TOGT team.';

  @override
  String get galleryMoments => 'Moments from TOGT journeys';

  @override
  String get galleryUnavailable => 'Gallery unavailable';

  @override
  String get morePhotos => 'More Photos';

  @override
  String get videos => 'Videos';

  @override
  String get watchVideo => 'Watch video';

  @override
  String get travelerReviews => 'What our travelers say';

  @override
  String get seeMoreReviews => 'See More Reviews';

  @override
  String get showLess => 'Show Less';

  @override
  String get reviewsUnavailable => 'Reviews unavailable';

  @override
  String get noReviews => 'No reviews yet';

  @override
  String get verifiedCustomer => 'Verified TOGT customer';

  @override
  String get proudIata => 'Proud IATA Member Agency';

  @override
  String get iataDescriptionShort =>
      'Connecting you to over 370 member airlines across 120+ countries.';

  @override
  String get memberAirlines => 'Member Airlines';

  @override
  String get countries => 'Countries';

  @override
  String get globalAirTraffic => 'Global Air Traffic';

  @override
  String get iataAccredited => 'IATA Accredited';

  @override
  String get transparentFares => 'Transparent Fares';

  @override
  String get globalReach => 'Global Reach';

  @override
  String get explorePackages => 'Explore Packages';

  @override
  String get noPackagesFound => 'No packages found';

  @override
  String failedLoadPackages(Object error) {
    return 'Failed to load packages\n$error';
  }

  @override
  String get searchPackages => 'Search packages…';

  @override
  String get all => 'All';

  @override
  String get custom => 'Custom';

  @override
  String get seeAll => 'See all';

  @override
  String get cannotReachApi => 'Cannot reach the API';

  @override
  String get welcomeToTogt => 'Welcome to TOGT';

  @override
  String get bookPackagesEasily => 'Book Packages Easily';

  @override
  String get trackJourney => 'Track Your Journey';

  @override
  String get skip => 'Skip';

  @override
  String get next => 'Next';

  @override
  String get getStarted => 'Get Started';

  @override
  String get umrahJourneys => 'Umrah Journeys';

  @override
  String get prayerTools => 'Prayer Tools';

  @override
  String get umrahPackages => 'Umrah Packages';

  @override
  String get noUmrahPackages => 'No Umrah packages yet.';

  @override
  String get personalTools => 'Tools for your daily journey';

  @override
  String get notifyBeforePrayer => 'Notify me before prayer time';

  @override
  String get allowLocationPrayer =>
      'Allow location to load today’s prayer times.';

  @override
  String get findingQibla => 'Finding Qibla...';

  @override
  String direction(Object degrees) {
    return 'Direction: $degrees°';
  }

  @override
  String distanceMakkah(Object distance) {
    return 'Distance to Makkah: $distance km';
  }

  @override
  String get compassUnavailable => 'Compass unavailable on this device';

  @override
  String get refreshLocation => 'Refresh location';

  @override
  String get tapToCount => 'Tap to count';

  @override
  String get reset => 'Reset';

  @override
  String get guestTraveler => 'Guest Traveler';

  @override
  String get notSignedIn => 'Not signed in';

  @override
  String get myRequests => 'My Requests';

  @override
  String get myTickets => 'My Tickets';

  @override
  String get history => 'History';

  @override
  String get reviews => 'Reviews';

  @override
  String get parentTracking => 'Parent Tracking';

  @override
  String get payments => 'Payments';

  @override
  String get helpSupport => 'Help & Support';

  @override
  String get signIn => 'Sign In';

  @override
  String get logOut => 'Log Out';

  @override
  String get signOut => 'Sign Out';

  @override
  String get cancel => 'Cancel';

  @override
  String get signOutQuestion => 'Are you sure you want to sign out?';

  @override
  String get close => 'Close';

  @override
  String get openWebVersion => 'Open Web Version';

  @override
  String get pleaseUseWeb => 'Please Use Web Version';

  @override
  String get supportPreferences =>
      'Your profile and notification preferences are managed securely with your TOGT account.';

  @override
  String get sending => 'Sending...';

  @override
  String get sendRequest => 'Send Request';

  @override
  String get payLater => 'Pay Later';

  @override
  String get paymentReferencePending =>
      'Payment checkout will open when a payment reference is issued.';

  @override
  String get requestFollowup =>
      'Tell us what you need and a TOGT specialist will follow up.';

  @override
  String get noSupportWorker => 'No support worker is available';

  @override
  String get queuedReply =>
      'Your message is in the support queue. A TOGT specialist will reply shortly.';

  @override
  String get sorryAi => 'Sorry, I could not answer that.';

  @override
  String get askAnything => 'Ask anything…';

  @override
  String get airlineExample => 'Ethiopian Airlines';

  @override
  String get detailsAvailable => 'Details available';

  @override
  String get active => 'Active';

  @override
  String get untitled => 'Untitled';

  @override
  String get toctItem => 'TOGT item';

  @override
  String journeysAvailable(Object count) {
    return '$count journeys available';
  }

  @override
  String get aboutPackage => 'About this package';

  @override
  String get included => 'What\'s included';

  @override
  String get notIncluded => 'Not included';

  @override
  String get readAll => 'Read all';

  @override
  String get noNotifications => 'No notifications yet.';

  @override
  String get requestDetails => 'Request Details';

  @override
  String get packageRequest => 'Package & request';

  @override
  String get progressTimeline => 'Progress timeline';

  @override
  String get noProgress => 'No progress updates yet.';

  @override
  String get documents => 'Documents';

  @override
  String get contactSupport => 'Contact support';

  @override
  String get payment => 'Payment';

  @override
  String amount(Object amount) {
    return 'Amount: $amount';
  }

  @override
  String get notSet => 'Not set';

  @override
  String get enterAmount => 'Enter amount (ETB)';

  @override
  String get saveAmount => 'Save amount';

  @override
  String transaction(Object id) {
    return 'Transaction: $id';
  }

  @override
  String payNowAmount(Object amount, Object currency) {
    return 'Pay Now - $amount $currency';
  }

  @override
  String get ticketDetails => 'Ticket Details';

  @override
  String get shareExperience => 'Share your experience';

  @override
  String get feedbackHelps =>
      'Your feedback helps other travelers choose with confidence.';

  @override
  String get yourReview => 'Your review';

  @override
  String get tellJourney => 'Tell us about your journey...';

  @override
  String photosCount(Object count) {
    return 'Photos ($count/3)';
  }

  @override
  String get addPhoto => 'Add photo';

  @override
  String get yourJourneyBegins => 'Your journey begins here';

  @override
  String get personalTitle => 'Personal';

  @override
  String get azkarMorning => 'Morning Azkar';

  @override
  String get azkarEvening => 'Evening Azkar';

  @override
  String get beforeTravel => 'Before travel';

  @override
  String get commonDuas => 'Common duas';

  @override
  String get gloryAllah => 'Glory is to Allah and praise is His.';

  @override
  String webRoleMessage(Object role) {
    return 'Your role ($role) requires the full dashboard available on the web.';
  }

  @override
  String get consulting => 'Consulting';

  @override
  String get domesticTour => 'Domestic Tour';

  @override
  String get touristTravel => 'Tourist Travel';

  @override
  String get flightTicket => 'Flight Ticket';

  @override
  String get contactUs => 'Contact Us';

  @override
  String get foreignTravelForm => 'Foreign Travel';

  @override
  String get visaForm => 'Visa Processing';

  @override
  String get umrahForm => 'Umrah';

  @override
  String get retryLoad => 'Retry';

  @override
  String failedLoad(Object error, Object item) {
    return 'Unable to load $item\n$error';
  }

  @override
  String noItems(Object item) {
    return 'No $item yet.';
  }

  @override
  String get statusDetails => 'Details available';

  @override
  String get created => 'Created';

  @override
  String get updated => 'Updated';

  @override
  String get newJourney => 'Domestic tours across Ethiopia';

  @override
  String get airlineFares => 'Best fares on major airlines';

  @override
  String get visaEasy => 'Visit, medical & family visas';

  @override
  String get seeAllPackages => 'See all';

  @override
  String get flexibleDuration => 'Flexible duration';

  @override
  String get customPricing => 'Custom pricing';

  @override
  String get pickFromGallery => 'Choose from gallery';

  @override
  String get takePhoto => 'Take a photo';

  @override
  String get connectingDots => 'Connecting…';

  @override
  String get attachment => 'Attachment';

  @override
  String get permissionTitle => 'Allow access';

  @override
  String get permissionBody =>
      'TOGT needs a few permissions to work fully: location for prayer times & Qibla, notifications for azan alarms and chat, and photos for sending documents to support.';

  @override
  String get permissionGrant => 'Allow access';

  @override
  String get permissionLater => 'Not now';

  @override
  String get permissionOpenSettings => 'Open settings';

  @override
  String get permissionBlockedBody =>
      'Some permissions were permanently denied. Enable them in Settings so prayer times, azan alarms, and file sharing work.';

  @override
  String get azkarAfterPrayer => 'After prayer';

  @override
  String get azkarSleep => 'Before sleeping';

  @override
  String get azkarDistress => 'In distress';

  @override
  String get azanExactHint =>
      'Allow exact alarms so the azan fires right on time. Tap to open settings.';

  @override
  String get browseFiles => 'Browse files';

  @override
  String get attachmentsAllowed => 'Photos & PDF up to 10MB';

  @override
  String get unsupportedFileType =>
      'Unsupported file type. Please choose a JPG, PNG, GIF, WEBP image or a PDF under 10MB.';

  @override
  String fieldRequired(String field) {
    return '$field is required';
  }

  @override
  String get invalidEmail => 'Please enter a valid email address';

  @override
  String get invalidPhone =>
      'Please enter a valid phone number (e.g. 0912345678)';

  @override
  String get fixErrorsBelow =>
      'Please check the highlighted fields and try again';

  @override
  String get selectOption => 'Select an option';

  @override
  String get searchList => 'Type to search…';

  @override
  String get noMatches => 'No matches found';

  @override
  String get clearValue => 'Clear';

  @override
  String get returnAfterDeparture =>
      'Return date must be on or after the departure date';

  @override
  String get tripDetails => 'Trip details';

  @override
  String get travelersSection => 'Travelers';

  @override
  String get contactSection => 'Contact information';

  @override
  String get passportSection => 'Passport details';

  @override
  String get messageSection => 'Your message';

  @override
  String get tourSection => 'Tour details';

  @override
  String get visaSection => 'Visa details';

  @override
  String get updatingApp => 'Downloading update…';

  @override
  String get updateReady => 'Update ready';

  @override
  String get installUpdate => 'Install';

  @override
  String get autoUpdateNote =>
      'TOGT updates download automatically when you are online.';

  @override
  String get updateInstalling => 'Installing the new version…';

  @override
  String get oromiffa => 'Afaan Oromoo';

  @override
  String get umrahGift => 'Umrah Gift';

  @override
  String get giftNote =>
      'Give Umrah as a gift — full or half-sponsored for someone you love.';

  @override
  String get giftCheckbox => 'This is a gift';

  @override
  String get giftType => 'Gift type';

  @override
  String get giftFull => 'Full gift (100% paid by sender)';

  @override
  String get giftHalf => 'Half gift (50% paid by sender)';

  @override
  String get giftHalfNote =>
      'The recipient pays the remaining 50% before travel.';

  @override
  String get recipientName => 'Recipient full name';

  @override
  String get recipientPhone => 'Recipient phone';

  @override
  String get recipientEmail => 'Recipient email (optional)';

  @override
  String get trackingIntro =>
      'Send a request to follow someone’s trips — tracking starts once they accept.';

  @override
  String get trackingSendRequest => 'Request tracking';

  @override
  String get trackingAccepted => 'Accepted';

  @override
  String get trackingDeclined => 'Declined';

  @override
  String get trackingPendingStatus => 'Request in progress';

  @override
  String get trackingCancelled => 'Cancelled';

  @override
  String get trackingSearchHint => 'Search customers by name or email';

  @override
  String get trackingIncomingTitle => 'Tracking requests for you';

  @override
  String get trackingLiveTitle => 'Live now';

  @override
  String get trackingPeopleTitle => 'People you can track';

  @override
  String get trackingLinked => 'Linked — you can follow their trips';

  @override
  String get trackingNotLinked => 'Not linked';

  @override
  String get trackingStartsWhenActive =>
      'Tracking starts when their trip is active';

  @override
  String get trackingTravelingNow => 'Traveling now';

  @override
  String trackingFromGuide(Object distance) {
    return '$distance from guide';
  }

  @override
  String get trackingWithGuide => 'With guide';

  @override
  String get trackingDrifting => 'Drifting from guide';

  @override
  String get trackingSeparated => 'Separated from guide';

  @override
  String get trackingOffline => 'Signal offline';

  @override
  String get trackingWaitingSignal => 'Waiting for the first location…';

  @override
  String get trackingRefresh => 'Refresh';

  @override
  String get locationBackgroundTitle => 'Background location needed';

  @override
  String get locationBackgroundBody =>
      'TOGT uses your location in the background to keep your trip protected. Please choose “Allow all the time”.';

  @override
  String get alarmsVolumeHint =>
      'The azan plays on the alarm volume. If it is silent, raise Alarm volume in Settings → Sound.';
}
