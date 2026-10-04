import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_am.dart';
import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_om.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('am'),
    Locale('ar'),
    Locale('en'),
    Locale('om')
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'TOGT Tour & Travel'**
  String get appTitle;

  /// No description provided for @welcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome aboard'**
  String get welcome;

  /// No description provided for @signInJourney.
  ///
  /// In en, this message translates to:
  /// **'Sign in to book your next journey'**
  String get signInJourney;

  /// No description provided for @continueGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueGoogle;

  /// No description provided for @connectingGoogle.
  ///
  /// In en, this message translates to:
  /// **'Connecting to Google...'**
  String get connectingGoogle;

  /// No description provided for @signedInAs.
  ///
  /// In en, this message translates to:
  /// **'Signed in as {name} ({role})'**
  String signedInAs(Object name, Object role);

  /// No description provided for @googleSignInFailed.
  ///
  /// In en, this message translates to:
  /// **'Google sign-in failed. Check your Google account setup and try again.'**
  String get googleSignInFailed;

  /// No description provided for @signInUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Google sign-in is not available yet. Please try again later.'**
  String get signInUnavailable;

  /// No description provided for @unableSignIn.
  ///
  /// In en, this message translates to:
  /// **'Unable to sign in right now. Please try again.'**
  String get unableSignIn;

  /// No description provided for @appUpdated.
  ///
  /// In en, this message translates to:
  /// **'App updated successfully!'**
  String get appUpdated;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @packages.
  ///
  /// In en, this message translates to:
  /// **'Packages'**
  String get packages;

  /// No description provided for @personal.
  ///
  /// In en, this message translates to:
  /// **'Personal'**
  String get personal;

  /// No description provided for @chat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chat;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get arabic;

  /// No description provided for @amharic.
  ///
  /// In en, this message translates to:
  /// **'አማርኛ'**
  String get amharic;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get saveChanges;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get saving;

  /// No description provided for @profileSettings.
  ///
  /// In en, this message translates to:
  /// **'Profile settings'**
  String get profileSettings;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @address.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// No description provided for @nationality.
  ///
  /// In en, this message translates to:
  /// **'Nationality'**
  String get nationality;

  /// No description provided for @passportNumber.
  ///
  /// In en, this message translates to:
  /// **'Passport number'**
  String get passportNumber;

  /// No description provided for @profileSaved.
  ///
  /// In en, this message translates to:
  /// **'Profile saved successfully.'**
  String get profileSaved;

  /// No description provided for @signInAgain.
  ///
  /// In en, this message translates to:
  /// **'Please sign in again.'**
  String get signInAgain;

  /// No description provided for @profileSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not save profile: {error}'**
  String profileSaveFailed(Object error);

  /// No description provided for @whereGo.
  ///
  /// In en, this message translates to:
  /// **'Where would you like to go?'**
  String get whereGo;

  /// No description provided for @searchDestinations.
  ///
  /// In en, this message translates to:
  /// **'Search destinations, packages…'**
  String get searchDestinations;

  /// No description provided for @services.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get services;

  /// No description provided for @gallery.
  ///
  /// In en, this message translates to:
  /// **'Gallery'**
  String get gallery;

  /// No description provided for @testimonials.
  ///
  /// In en, this message translates to:
  /// **'Testimonials'**
  String get testimonials;

  /// No description provided for @featuredPackages.
  ///
  /// In en, this message translates to:
  /// **'Featured packages'**
  String get featuredPackages;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @bookPackage.
  ///
  /// In en, this message translates to:
  /// **'Book Package'**
  String get bookPackage;

  /// No description provided for @confirmBooking.
  ///
  /// In en, this message translates to:
  /// **'Confirm Booking'**
  String get confirmBooking;

  /// No description provided for @formPrefilled.
  ///
  /// In en, this message translates to:
  /// **'Form pre-filled from your profile'**
  String get formPrefilled;

  /// No description provided for @fillNamePhone.
  ///
  /// In en, this message translates to:
  /// **'Please fill in your name and phone number.'**
  String get fillNamePhone;

  /// No description provided for @submissionFailed.
  ///
  /// In en, this message translates to:
  /// **'Submission failed: {error}'**
  String submissionFailed(Object error);

  /// No description provided for @travelers.
  ///
  /// In en, this message translates to:
  /// **'Travelers'**
  String get travelers;

  /// No description provided for @packageType.
  ///
  /// In en, this message translates to:
  /// **'Package type'**
  String get packageType;

  /// No description provided for @hotelPreference.
  ///
  /// In en, this message translates to:
  /// **'Hotel preference'**
  String get hotelPreference;

  /// No description provided for @roomType.
  ///
  /// In en, this message translates to:
  /// **'Room type'**
  String get roomType;

  /// No description provided for @continueAction.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueAction;

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get required;

  /// No description provided for @aiAssistant.
  ///
  /// In en, this message translates to:
  /// **'AI Assistant'**
  String get aiAssistant;

  /// No description provided for @humanSupport.
  ///
  /// In en, this message translates to:
  /// **'Human Support'**
  String get humanSupport;

  /// No description provided for @commonTravelAnswers.
  ///
  /// In en, this message translates to:
  /// **'Common travel answers and requests.'**
  String get commonTravelAnswers;

  /// No description provided for @chatTeam.
  ///
  /// In en, this message translates to:
  /// **'Chat with the TOGT team.'**
  String get chatTeam;

  /// No description provided for @typeMessage.
  ///
  /// In en, this message translates to:
  /// **'Type a message…'**
  String get typeMessage;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @attachmentsHint.
  ///
  /// In en, this message translates to:
  /// **'Attachments can be added from the support chat.'**
  String get attachmentsHint;

  /// No description provided for @onlineAi.
  ///
  /// In en, this message translates to:
  /// **'Online · AI powered'**
  String get onlineAi;

  /// No description provided for @specialistOnDuty.
  ///
  /// In en, this message translates to:
  /// **'TOGT specialist on duty'**
  String get specialistOnDuty;

  /// No description provided for @aiOffline.
  ///
  /// In en, this message translates to:
  /// **'AI offline'**
  String get aiOffline;

  /// No description provided for @offlineReply.
  ///
  /// In en, this message translates to:
  /// **'I\'m having trouble reaching the AI assistant right now. Please call +251 99 797 9741 for immediate help.'**
  String get offlineReply;

  /// No description provided for @chatWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome! I\'m Ahmed from TOGT. Ask me about Umrah packages, flights, visas, tours, and booking.'**
  String get chatWelcome;

  /// No description provided for @chatSendFailed.
  ///
  /// In en, this message translates to:
  /// **'Unable to send message: {error}'**
  String chatSendFailed(String error);

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @unavailable.
  ///
  /// In en, this message translates to:
  /// **'Unavailable'**
  String get unavailable;

  /// No description provided for @noPackages.
  ///
  /// In en, this message translates to:
  /// **'No packages available.'**
  String get noPackages;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @networkError.
  ///
  /// In en, this message translates to:
  /// **'Network error. Check your connection and try again.'**
  String get networkError;

  /// No description provided for @umrah.
  ///
  /// In en, this message translates to:
  /// **'Umrah'**
  String get umrah;

  /// No description provided for @domesticTours.
  ///
  /// In en, this message translates to:
  /// **'Domestic Tours'**
  String get domesticTours;

  /// No description provided for @touristTours.
  ///
  /// In en, this message translates to:
  /// **'Tourist Tours'**
  String get touristTours;

  /// No description provided for @foreignTravel.
  ///
  /// In en, this message translates to:
  /// **'Foreign Travel'**
  String get foreignTravel;

  /// No description provided for @visaProcessing.
  ///
  /// In en, this message translates to:
  /// **'Visa Processing'**
  String get visaProcessing;

  /// No description provided for @flightTicketing.
  ///
  /// In en, this message translates to:
  /// **'Flight Ticketing'**
  String get flightTicketing;

  /// No description provided for @bookNow.
  ///
  /// In en, this message translates to:
  /// **'Book Now'**
  String get bookNow;

  /// No description provided for @payNow.
  ///
  /// In en, this message translates to:
  /// **'Pay Now'**
  String get payNow;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @logoutConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to log out?'**
  String get logoutConfirm;

  /// No description provided for @qibla.
  ///
  /// In en, this message translates to:
  /// **'Qibla'**
  String get qibla;

  /// No description provided for @prayerTimes.
  ///
  /// In en, this message translates to:
  /// **'Prayer times'**
  String get prayerTimes;

  /// No description provided for @azanAlarm.
  ///
  /// In en, this message translates to:
  /// **'Azan alarm'**
  String get azanAlarm;

  /// No description provided for @azkar.
  ///
  /// In en, this message translates to:
  /// **'Azkar'**
  String get azkar;

  /// No description provided for @requestReceived.
  ///
  /// In en, this message translates to:
  /// **'Request received'**
  String get requestReceived;

  /// No description provided for @requestStatus.
  ///
  /// In en, this message translates to:
  /// **'Request status'**
  String get requestStatus;

  /// No description provided for @ticket.
  ///
  /// In en, this message translates to:
  /// **'Ticket'**
  String get ticket;

  /// No description provided for @visa.
  ///
  /// In en, this message translates to:
  /// **'Visa'**
  String get visa;

  /// No description provided for @contact.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get contact;

  /// No description provided for @languageChanged.
  ///
  /// In en, this message translates to:
  /// **'Language updated'**
  String get languageChanged;

  /// No description provided for @newFeatures.
  ///
  /// In en, this message translates to:
  /// **'New Features Added!'**
  String get newFeatures;

  /// No description provided for @versionLabel.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String versionLabel(Object version);

  /// No description provided for @later.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get later;

  /// No description provided for @updateNow.
  ///
  /// In en, this message translates to:
  /// **'Update Now'**
  String get updateNow;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get tryAgain;

  /// No description provided for @updateFailed.
  ///
  /// In en, this message translates to:
  /// **'Update failed.'**
  String get updateFailed;

  /// No description provided for @updateInstallerError.
  ///
  /// In en, this message translates to:
  /// **'Could not open the installer. Allow installs from this app in Settings and try again.'**
  String get updateInstallerError;

  /// No description provided for @downloadFailed.
  ///
  /// In en, this message translates to:
  /// **'Download failed. Check your connection and try again.'**
  String get downloadFailed;

  /// No description provided for @updateDescription.
  ///
  /// In en, this message translates to:
  /// **'Please update the app to enjoy new features and improvements.'**
  String get updateDescription;

  /// No description provided for @goHome.
  ///
  /// In en, this message translates to:
  /// **'Go to Home'**
  String get goHome;

  /// No description provided for @requestSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Request Submitted Successfully!'**
  String get requestSubmitted;

  /// No description provided for @requestSent.
  ///
  /// In en, this message translates to:
  /// **'Your request has been sent to the TOGT team.'**
  String get requestSent;

  /// No description provided for @galleryMoments.
  ///
  /// In en, this message translates to:
  /// **'Moments from TOGT journeys'**
  String get galleryMoments;

  /// No description provided for @galleryUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Gallery unavailable'**
  String get galleryUnavailable;

  /// No description provided for @morePhotos.
  ///
  /// In en, this message translates to:
  /// **'More Photos'**
  String get morePhotos;

  /// No description provided for @videos.
  ///
  /// In en, this message translates to:
  /// **'Videos'**
  String get videos;

  /// No description provided for @watchVideo.
  ///
  /// In en, this message translates to:
  /// **'Watch video'**
  String get watchVideo;

  /// No description provided for @travelerReviews.
  ///
  /// In en, this message translates to:
  /// **'What our travelers say'**
  String get travelerReviews;

  /// No description provided for @seeMoreReviews.
  ///
  /// In en, this message translates to:
  /// **'See More Reviews'**
  String get seeMoreReviews;

  /// No description provided for @showLess.
  ///
  /// In en, this message translates to:
  /// **'Show Less'**
  String get showLess;

  /// No description provided for @reviewsUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Reviews unavailable'**
  String get reviewsUnavailable;

  /// No description provided for @noReviews.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet'**
  String get noReviews;

  /// No description provided for @verifiedCustomer.
  ///
  /// In en, this message translates to:
  /// **'Verified TOGT customer'**
  String get verifiedCustomer;

  /// No description provided for @proudIata.
  ///
  /// In en, this message translates to:
  /// **'Proud IATA Member Agency'**
  String get proudIata;

  /// No description provided for @iataDescriptionShort.
  ///
  /// In en, this message translates to:
  /// **'Connecting you to over 370 member airlines across 120+ countries.'**
  String get iataDescriptionShort;

  /// No description provided for @memberAirlines.
  ///
  /// In en, this message translates to:
  /// **'Member Airlines'**
  String get memberAirlines;

  /// No description provided for @countries.
  ///
  /// In en, this message translates to:
  /// **'Countries'**
  String get countries;

  /// No description provided for @globalAirTraffic.
  ///
  /// In en, this message translates to:
  /// **'Global Air Traffic'**
  String get globalAirTraffic;

  /// No description provided for @iataAccredited.
  ///
  /// In en, this message translates to:
  /// **'IATA Accredited'**
  String get iataAccredited;

  /// No description provided for @transparentFares.
  ///
  /// In en, this message translates to:
  /// **'Transparent Fares'**
  String get transparentFares;

  /// No description provided for @globalReach.
  ///
  /// In en, this message translates to:
  /// **'Global Reach'**
  String get globalReach;

  /// No description provided for @explorePackages.
  ///
  /// In en, this message translates to:
  /// **'Explore Packages'**
  String get explorePackages;

  /// No description provided for @noPackagesFound.
  ///
  /// In en, this message translates to:
  /// **'No packages found'**
  String get noPackagesFound;

  /// No description provided for @failedLoadPackages.
  ///
  /// In en, this message translates to:
  /// **'Failed to load packages\n{error}'**
  String failedLoadPackages(Object error);

  /// No description provided for @searchPackages.
  ///
  /// In en, this message translates to:
  /// **'Search packages…'**
  String get searchPackages;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @custom.
  ///
  /// In en, this message translates to:
  /// **'Custom'**
  String get custom;

  /// No description provided for @seeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAll;

  /// No description provided for @cannotReachApi.
  ///
  /// In en, this message translates to:
  /// **'Cannot reach the API'**
  String get cannotReachApi;

  /// No description provided for @welcomeToTogt.
  ///
  /// In en, this message translates to:
  /// **'Welcome to TOGT'**
  String get welcomeToTogt;

  /// No description provided for @bookPackagesEasily.
  ///
  /// In en, this message translates to:
  /// **'Book Packages Easily'**
  String get bookPackagesEasily;

  /// No description provided for @trackJourney.
  ///
  /// In en, this message translates to:
  /// **'Track Your Journey'**
  String get trackJourney;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// No description provided for @umrahJourneys.
  ///
  /// In en, this message translates to:
  /// **'Umrah Journeys'**
  String get umrahJourneys;

  /// No description provided for @prayerTools.
  ///
  /// In en, this message translates to:
  /// **'Prayer Tools'**
  String get prayerTools;

  /// No description provided for @umrahPackages.
  ///
  /// In en, this message translates to:
  /// **'Umrah Packages'**
  String get umrahPackages;

  /// No description provided for @noUmrahPackages.
  ///
  /// In en, this message translates to:
  /// **'No Umrah packages yet.'**
  String get noUmrahPackages;

  /// No description provided for @personalTools.
  ///
  /// In en, this message translates to:
  /// **'Tools for your daily journey'**
  String get personalTools;

  /// No description provided for @notifyBeforePrayer.
  ///
  /// In en, this message translates to:
  /// **'Notify me before prayer time'**
  String get notifyBeforePrayer;

  /// No description provided for @allowLocationPrayer.
  ///
  /// In en, this message translates to:
  /// **'Allow location to load today’s prayer times.'**
  String get allowLocationPrayer;

  /// No description provided for @findingQibla.
  ///
  /// In en, this message translates to:
  /// **'Finding Qibla...'**
  String get findingQibla;

  /// No description provided for @direction.
  ///
  /// In en, this message translates to:
  /// **'Direction: {degrees}°'**
  String direction(Object degrees);

  /// No description provided for @distanceMakkah.
  ///
  /// In en, this message translates to:
  /// **'Distance to Makkah: {distance} km'**
  String distanceMakkah(Object distance);

  /// No description provided for @compassUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Compass unavailable on this device'**
  String get compassUnavailable;

  /// No description provided for @refreshLocation.
  ///
  /// In en, this message translates to:
  /// **'Refresh location'**
  String get refreshLocation;

  /// No description provided for @tapToCount.
  ///
  /// In en, this message translates to:
  /// **'Tap to count'**
  String get tapToCount;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @guestTraveler.
  ///
  /// In en, this message translates to:
  /// **'Guest Traveler'**
  String get guestTraveler;

  /// No description provided for @notSignedIn.
  ///
  /// In en, this message translates to:
  /// **'Not signed in'**
  String get notSignedIn;

  /// No description provided for @myRequests.
  ///
  /// In en, this message translates to:
  /// **'My Requests'**
  String get myRequests;

  /// No description provided for @myTickets.
  ///
  /// In en, this message translates to:
  /// **'My Tickets'**
  String get myTickets;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @reviews.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviews;

  /// No description provided for @parentTracking.
  ///
  /// In en, this message translates to:
  /// **'Parent Tracking'**
  String get parentTracking;

  /// No description provided for @payments.
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get payments;

  /// No description provided for @helpSupport.
  ///
  /// In en, this message translates to:
  /// **'Help & Support'**
  String get helpSupport;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get signIn;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get signOut;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @signOutQuestion.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to sign out?'**
  String get signOutQuestion;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @openWebVersion.
  ///
  /// In en, this message translates to:
  /// **'Open Web Version'**
  String get openWebVersion;

  /// No description provided for @pleaseUseWeb.
  ///
  /// In en, this message translates to:
  /// **'Please Use Web Version'**
  String get pleaseUseWeb;

  /// No description provided for @supportPreferences.
  ///
  /// In en, this message translates to:
  /// **'Your profile and notification preferences are managed securely with your TOGT account.'**
  String get supportPreferences;

  /// No description provided for @sending.
  ///
  /// In en, this message translates to:
  /// **'Sending...'**
  String get sending;

  /// No description provided for @sendRequest.
  ///
  /// In en, this message translates to:
  /// **'Send Request'**
  String get sendRequest;

  /// No description provided for @payLater.
  ///
  /// In en, this message translates to:
  /// **'Pay Later'**
  String get payLater;

  /// No description provided for @paymentReferencePending.
  ///
  /// In en, this message translates to:
  /// **'Payment checkout will open when a payment reference is issued.'**
  String get paymentReferencePending;

  /// No description provided for @requestFollowup.
  ///
  /// In en, this message translates to:
  /// **'Tell us what you need and a TOGT specialist will follow up.'**
  String get requestFollowup;

  /// No description provided for @noSupportWorker.
  ///
  /// In en, this message translates to:
  /// **'No support worker is available'**
  String get noSupportWorker;

  /// No description provided for @queuedReply.
  ///
  /// In en, this message translates to:
  /// **'Your message is in the support queue. A TOGT specialist will reply shortly.'**
  String get queuedReply;

  /// No description provided for @sorryAi.
  ///
  /// In en, this message translates to:
  /// **'Sorry, I could not answer that.'**
  String get sorryAi;

  /// No description provided for @askAnything.
  ///
  /// In en, this message translates to:
  /// **'Ask anything…'**
  String get askAnything;

  /// No description provided for @airlineExample.
  ///
  /// In en, this message translates to:
  /// **'Ethiopian Airlines'**
  String get airlineExample;

  /// No description provided for @detailsAvailable.
  ///
  /// In en, this message translates to:
  /// **'Details available'**
  String get detailsAvailable;

  /// No description provided for @active.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get active;

  /// No description provided for @untitled.
  ///
  /// In en, this message translates to:
  /// **'Untitled'**
  String get untitled;

  /// No description provided for @toctItem.
  ///
  /// In en, this message translates to:
  /// **'TOGT item'**
  String get toctItem;

  /// No description provided for @journeysAvailable.
  ///
  /// In en, this message translates to:
  /// **'{count} journeys available'**
  String journeysAvailable(Object count);

  /// No description provided for @aboutPackage.
  ///
  /// In en, this message translates to:
  /// **'About this package'**
  String get aboutPackage;

  /// No description provided for @included.
  ///
  /// In en, this message translates to:
  /// **'What\'s included'**
  String get included;

  /// No description provided for @notIncluded.
  ///
  /// In en, this message translates to:
  /// **'Not included'**
  String get notIncluded;

  /// No description provided for @readAll.
  ///
  /// In en, this message translates to:
  /// **'Read all'**
  String get readAll;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet.'**
  String get noNotifications;

  /// No description provided for @requestDetails.
  ///
  /// In en, this message translates to:
  /// **'Request Details'**
  String get requestDetails;

  /// No description provided for @packageRequest.
  ///
  /// In en, this message translates to:
  /// **'Package & request'**
  String get packageRequest;

  /// No description provided for @progressTimeline.
  ///
  /// In en, this message translates to:
  /// **'Progress timeline'**
  String get progressTimeline;

  /// No description provided for @noProgress.
  ///
  /// In en, this message translates to:
  /// **'No progress updates yet.'**
  String get noProgress;

  /// No description provided for @documents.
  ///
  /// In en, this message translates to:
  /// **'Documents'**
  String get documents;

  /// No description provided for @contactSupport.
  ///
  /// In en, this message translates to:
  /// **'Contact support'**
  String get contactSupport;

  /// No description provided for @payment.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get payment;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount: {amount}'**
  String amount(Object amount);

  /// No description provided for @notSet.
  ///
  /// In en, this message translates to:
  /// **'Not set'**
  String get notSet;

  /// No description provided for @enterAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter amount (ETB)'**
  String get enterAmount;

  /// No description provided for @saveAmount.
  ///
  /// In en, this message translates to:
  /// **'Save amount'**
  String get saveAmount;

  /// No description provided for @transaction.
  ///
  /// In en, this message translates to:
  /// **'Transaction: {id}'**
  String transaction(Object id);

  /// No description provided for @payNowAmount.
  ///
  /// In en, this message translates to:
  /// **'Pay Now - {amount} {currency}'**
  String payNowAmount(Object amount, Object currency);

  /// No description provided for @ticketDetails.
  ///
  /// In en, this message translates to:
  /// **'Ticket Details'**
  String get ticketDetails;

  /// No description provided for @shareExperience.
  ///
  /// In en, this message translates to:
  /// **'Share your experience'**
  String get shareExperience;

  /// No description provided for @feedbackHelps.
  ///
  /// In en, this message translates to:
  /// **'Your feedback helps other travelers choose with confidence.'**
  String get feedbackHelps;

  /// No description provided for @yourReview.
  ///
  /// In en, this message translates to:
  /// **'Your review'**
  String get yourReview;

  /// No description provided for @tellJourney.
  ///
  /// In en, this message translates to:
  /// **'Tell us about your journey...'**
  String get tellJourney;

  /// No description provided for @photosCount.
  ///
  /// In en, this message translates to:
  /// **'Photos ({count}/3)'**
  String photosCount(Object count);

  /// No description provided for @addPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get addPhoto;

  /// No description provided for @yourJourneyBegins.
  ///
  /// In en, this message translates to:
  /// **'Your journey begins here'**
  String get yourJourneyBegins;

  /// No description provided for @personalTitle.
  ///
  /// In en, this message translates to:
  /// **'Personal'**
  String get personalTitle;

  /// No description provided for @azkarMorning.
  ///
  /// In en, this message translates to:
  /// **'Morning Azkar'**
  String get azkarMorning;

  /// No description provided for @azkarEvening.
  ///
  /// In en, this message translates to:
  /// **'Evening Azkar'**
  String get azkarEvening;

  /// No description provided for @beforeTravel.
  ///
  /// In en, this message translates to:
  /// **'Before travel'**
  String get beforeTravel;

  /// No description provided for @commonDuas.
  ///
  /// In en, this message translates to:
  /// **'Common duas'**
  String get commonDuas;

  /// No description provided for @gloryAllah.
  ///
  /// In en, this message translates to:
  /// **'Glory is to Allah and praise is His.'**
  String get gloryAllah;

  /// No description provided for @webRoleMessage.
  ///
  /// In en, this message translates to:
  /// **'Your role ({role}) requires the full dashboard available on the web.'**
  String webRoleMessage(Object role);

  /// No description provided for @consulting.
  ///
  /// In en, this message translates to:
  /// **'Consulting'**
  String get consulting;

  /// No description provided for @domesticTour.
  ///
  /// In en, this message translates to:
  /// **'Domestic Tour'**
  String get domesticTour;

  /// No description provided for @touristTravel.
  ///
  /// In en, this message translates to:
  /// **'Tourist Travel'**
  String get touristTravel;

  /// No description provided for @flightTicket.
  ///
  /// In en, this message translates to:
  /// **'Flight Ticket'**
  String get flightTicket;

  /// No description provided for @contactUs.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get contactUs;

  /// No description provided for @foreignTravelForm.
  ///
  /// In en, this message translates to:
  /// **'Foreign Travel'**
  String get foreignTravelForm;

  /// No description provided for @visaForm.
  ///
  /// In en, this message translates to:
  /// **'Visa Processing'**
  String get visaForm;

  /// No description provided for @umrahForm.
  ///
  /// In en, this message translates to:
  /// **'Umrah'**
  String get umrahForm;

  /// No description provided for @retryLoad.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retryLoad;

  /// No description provided for @failedLoad.
  ///
  /// In en, this message translates to:
  /// **'Unable to load {item}\n{error}'**
  String failedLoad(Object error, Object item);

  /// No description provided for @noItems.
  ///
  /// In en, this message translates to:
  /// **'No {item} yet.'**
  String noItems(Object item);

  /// No description provided for @statusDetails.
  ///
  /// In en, this message translates to:
  /// **'Details available'**
  String get statusDetails;

  /// No description provided for @created.
  ///
  /// In en, this message translates to:
  /// **'Created'**
  String get created;

  /// No description provided for @updated.
  ///
  /// In en, this message translates to:
  /// **'Updated'**
  String get updated;

  /// No description provided for @newJourney.
  ///
  /// In en, this message translates to:
  /// **'Domestic tours across Ethiopia'**
  String get newJourney;

  /// No description provided for @airlineFares.
  ///
  /// In en, this message translates to:
  /// **'Best fares on major airlines'**
  String get airlineFares;

  /// No description provided for @visaEasy.
  ///
  /// In en, this message translates to:
  /// **'Visit, medical & family visas'**
  String get visaEasy;

  /// No description provided for @seeAllPackages.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get seeAllPackages;

  /// No description provided for @flexibleDuration.
  ///
  /// In en, this message translates to:
  /// **'Flexible duration'**
  String get flexibleDuration;

  /// No description provided for @customPricing.
  ///
  /// In en, this message translates to:
  /// **'Custom pricing'**
  String get customPricing;

  /// No description provided for @pickFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get pickFromGallery;

  /// No description provided for @takePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take a photo'**
  String get takePhoto;

  /// No description provided for @connectingDots.
  ///
  /// In en, this message translates to:
  /// **'Connecting…'**
  String get connectingDots;

  /// No description provided for @attachment.
  ///
  /// In en, this message translates to:
  /// **'Attachment'**
  String get attachment;

  /// No description provided for @permissionTitle.
  ///
  /// In en, this message translates to:
  /// **'Allow access'**
  String get permissionTitle;

  /// No description provided for @permissionBody.
  ///
  /// In en, this message translates to:
  /// **'TOGT needs a few permissions to work fully: location for prayer times & Qibla, notifications for azan alarms and chat, and photos for sending documents to support.'**
  String get permissionBody;

  /// No description provided for @permissionGrant.
  ///
  /// In en, this message translates to:
  /// **'Allow access'**
  String get permissionGrant;

  /// No description provided for @permissionLater.
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get permissionLater;

  /// No description provided for @permissionOpenSettings.
  ///
  /// In en, this message translates to:
  /// **'Open settings'**
  String get permissionOpenSettings;

  /// No description provided for @permissionBlockedBody.
  ///
  /// In en, this message translates to:
  /// **'Some permissions were permanently denied. Enable them in Settings so prayer times, azan alarms, and file sharing work.'**
  String get permissionBlockedBody;

  /// No description provided for @azkarAfterPrayer.
  ///
  /// In en, this message translates to:
  /// **'After prayer'**
  String get azkarAfterPrayer;

  /// No description provided for @azkarSleep.
  ///
  /// In en, this message translates to:
  /// **'Before sleeping'**
  String get azkarSleep;

  /// No description provided for @azkarDistress.
  ///
  /// In en, this message translates to:
  /// **'In distress'**
  String get azkarDistress;

  /// No description provided for @azanExactHint.
  ///
  /// In en, this message translates to:
  /// **'Allow exact alarms so the azan fires right on time. Tap to open settings.'**
  String get azanExactHint;

  /// No description provided for @browseFiles.
  ///
  /// In en, this message translates to:
  /// **'Browse files'**
  String get browseFiles;

  /// No description provided for @attachmentsAllowed.
  ///
  /// In en, this message translates to:
  /// **'Photos & PDF up to 10MB'**
  String get attachmentsAllowed;

  /// No description provided for @unsupportedFileType.
  ///
  /// In en, this message translates to:
  /// **'Unsupported file type. Please choose a JPG, PNG, GIF, WEBP image or a PDF under 10MB.'**
  String get unsupportedFileType;

  /// No description provided for @fieldRequired.
  ///
  /// In en, this message translates to:
  /// **'{field} is required'**
  String fieldRequired(String field);

  /// No description provided for @invalidEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email address'**
  String get invalidEmail;

  /// No description provided for @invalidPhone.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid phone number (e.g. 0912345678)'**
  String get invalidPhone;

  /// No description provided for @fixErrorsBelow.
  ///
  /// In en, this message translates to:
  /// **'Please check the highlighted fields and try again'**
  String get fixErrorsBelow;

  /// No description provided for @selectOption.
  ///
  /// In en, this message translates to:
  /// **'Select an option'**
  String get selectOption;

  /// No description provided for @searchList.
  ///
  /// In en, this message translates to:
  /// **'Type to search…'**
  String get searchList;

  /// No description provided for @noMatches.
  ///
  /// In en, this message translates to:
  /// **'No matches found'**
  String get noMatches;

  /// No description provided for @clearValue.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clearValue;

  /// No description provided for @returnAfterDeparture.
  ///
  /// In en, this message translates to:
  /// **'Return date must be on or after the departure date'**
  String get returnAfterDeparture;

  /// No description provided for @tripDetails.
  ///
  /// In en, this message translates to:
  /// **'Trip details'**
  String get tripDetails;

  /// No description provided for @travelersSection.
  ///
  /// In en, this message translates to:
  /// **'Travelers'**
  String get travelersSection;

  /// No description provided for @contactSection.
  ///
  /// In en, this message translates to:
  /// **'Contact information'**
  String get contactSection;

  /// No description provided for @passportSection.
  ///
  /// In en, this message translates to:
  /// **'Passport details'**
  String get passportSection;

  /// No description provided for @messageSection.
  ///
  /// In en, this message translates to:
  /// **'Your message'**
  String get messageSection;

  /// No description provided for @tourSection.
  ///
  /// In en, this message translates to:
  /// **'Tour details'**
  String get tourSection;

  /// No description provided for @visaSection.
  ///
  /// In en, this message translates to:
  /// **'Visa details'**
  String get visaSection;

  /// No description provided for @updatingApp.
  ///
  /// In en, this message translates to:
  /// **'Downloading update…'**
  String get updatingApp;

  /// No description provided for @updateReady.
  ///
  /// In en, this message translates to:
  /// **'Update ready'**
  String get updateReady;

  /// No description provided for @installUpdate.
  ///
  /// In en, this message translates to:
  /// **'Install'**
  String get installUpdate;

  /// No description provided for @autoUpdateNote.
  ///
  /// In en, this message translates to:
  /// **'TOGT updates download automatically when you are online.'**
  String get autoUpdateNote;

  /// No description provided for @updateInstalling.
  ///
  /// In en, this message translates to:
  /// **'Installing the new version…'**
  String get updateInstalling;

  /// No description provided for @oromiffa.
  ///
  /// In en, this message translates to:
  /// **'Afaan Oromoo'**
  String get oromiffa;

  /// No description provided for @umrahGift.
  ///
  /// In en, this message translates to:
  /// **'Umrah Gift'**
  String get umrahGift;

  /// No description provided for @giftNote.
  ///
  /// In en, this message translates to:
  /// **'Give Umrah as a gift — full or half-sponsored for someone you love.'**
  String get giftNote;

  /// No description provided for @giftCheckbox.
  ///
  /// In en, this message translates to:
  /// **'This is a gift'**
  String get giftCheckbox;

  /// No description provided for @giftType.
  ///
  /// In en, this message translates to:
  /// **'Gift type'**
  String get giftType;

  /// No description provided for @giftFull.
  ///
  /// In en, this message translates to:
  /// **'Full gift (100% paid by sender)'**
  String get giftFull;

  /// No description provided for @giftHalf.
  ///
  /// In en, this message translates to:
  /// **'Half gift (50% paid by sender)'**
  String get giftHalf;

  /// No description provided for @giftHalfNote.
  ///
  /// In en, this message translates to:
  /// **'The recipient pays the remaining 50% before travel.'**
  String get giftHalfNote;

  /// No description provided for @recipientName.
  ///
  /// In en, this message translates to:
  /// **'Recipient full name'**
  String get recipientName;

  /// No description provided for @recipientPhone.
  ///
  /// In en, this message translates to:
  /// **'Recipient phone'**
  String get recipientPhone;

  /// No description provided for @recipientEmail.
  ///
  /// In en, this message translates to:
  /// **'Recipient email (optional)'**
  String get recipientEmail;

  /// No description provided for @trackingIntro.
  ///
  /// In en, this message translates to:
  /// **'Send a request to follow someone’s trips — tracking starts once they accept.'**
  String get trackingIntro;

  /// No description provided for @trackingSendRequest.
  ///
  /// In en, this message translates to:
  /// **'Request tracking'**
  String get trackingSendRequest;

  /// No description provided for @trackingAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get trackingAccepted;

  /// No description provided for @trackingDeclined.
  ///
  /// In en, this message translates to:
  /// **'Declined'**
  String get trackingDeclined;

  /// No description provided for @trackingPendingStatus.
  ///
  /// In en, this message translates to:
  /// **'Request in progress'**
  String get trackingPendingStatus;

  /// No description provided for @trackingCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get trackingCancelled;

  /// No description provided for @trackingSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search customers by name or email'**
  String get trackingSearchHint;

  /// No description provided for @trackingIncomingTitle.
  ///
  /// In en, this message translates to:
  /// **'Tracking requests for you'**
  String get trackingIncomingTitle;

  /// No description provided for @trackingLiveTitle.
  ///
  /// In en, this message translates to:
  /// **'Live now'**
  String get trackingLiveTitle;

  /// No description provided for @trackingPeopleTitle.
  ///
  /// In en, this message translates to:
  /// **'People you can track'**
  String get trackingPeopleTitle;

  /// No description provided for @trackingLinked.
  ///
  /// In en, this message translates to:
  /// **'Linked — you can follow their trips'**
  String get trackingLinked;

  /// No description provided for @trackingNotLinked.
  ///
  /// In en, this message translates to:
  /// **'Not linked'**
  String get trackingNotLinked;

  /// No description provided for @trackingStartsWhenActive.
  ///
  /// In en, this message translates to:
  /// **'Tracking starts when their trip is active'**
  String get trackingStartsWhenActive;

  /// No description provided for @trackingTravelingNow.
  ///
  /// In en, this message translates to:
  /// **'Traveling now'**
  String get trackingTravelingNow;

  /// No description provided for @trackingFromGuide.
  ///
  /// In en, this message translates to:
  /// **'{distance} from guide'**
  String trackingFromGuide(Object distance);

  /// No description provided for @trackingWithGuide.
  ///
  /// In en, this message translates to:
  /// **'With guide'**
  String get trackingWithGuide;

  /// No description provided for @trackingDrifting.
  ///
  /// In en, this message translates to:
  /// **'Drifting from guide'**
  String get trackingDrifting;

  /// No description provided for @trackingSeparated.
  ///
  /// In en, this message translates to:
  /// **'Separated from guide'**
  String get trackingSeparated;

  /// No description provided for @trackingOffline.
  ///
  /// In en, this message translates to:
  /// **'Signal offline'**
  String get trackingOffline;

  /// No description provided for @trackingWaitingSignal.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the first location…'**
  String get trackingWaitingSignal;

  /// No description provided for @trackingRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get trackingRefresh;

  /// No description provided for @locationBackgroundTitle.
  ///
  /// In en, this message translates to:
  /// **'Background location needed'**
  String get locationBackgroundTitle;

  /// No description provided for @locationBackgroundBody.
  ///
  /// In en, this message translates to:
  /// **'TOGT uses your location in the background to keep your trip protected. Please choose “Allow all the time”.'**
  String get locationBackgroundBody;

  /// No description provided for @alarmsVolumeHint.
  ///
  /// In en, this message translates to:
  /// **'The azan plays on the alarm volume. If it is silent, raise Alarm volume in Settings → Sound.'**
  String get alarmsVolumeHint;

  /// No description provided for @tasbih.
  ///
  /// In en, this message translates to:
  /// **'Tasbih'**
  String get tasbih;

  /// No description provided for @paymentNotSetYet.
  ///
  /// In en, this message translates to:
  /// **'The payment was not set yet — please wait for our team to set your cost.'**
  String get paymentNotSetYet;

  /// No description provided for @reviewSubmittedThanks.
  ///
  /// In en, this message translates to:
  /// **'Thank you! Your review has been submitted.'**
  String get reviewSubmittedThanks;

  /// No description provided for @reviewSubmittedNoPhotos.
  ///
  /// In en, this message translates to:
  /// **'Thank you! Your review was submitted, but {count} photo(s) could not be uploaded.'**
  String reviewSubmittedNoPhotos(Object count);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['am', 'ar', 'en', 'om'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'am':
      return AppLocalizationsAm();
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'om':
      return AppLocalizationsOm();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
