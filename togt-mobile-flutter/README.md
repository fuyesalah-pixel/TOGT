# TOGT Mobile App (Flutter)

Native mobile app for TOGT Tour & Travel — built from scratch with **Flutter 3.47** (single codebase → Android + iOS). Replaces the previous Capacitor wrapper approach.

## Status

| Item | State |
|---|---|
| Framework | Flutter 3.47.1 stable, Dart 3.13 |
| Platforms | Android (built & tested), iOS (source-ready, needs macOS to build) |
| Backend | Connects to existing NestJS API (`/api`) |
| Screens | Splash, Onboarding (3), Login, Home, Packages, Package Detail, Booking, Umrah, Chat, Profile |
| Animations | Hero transitions, staggered entrances, shimmer loading, auto-sliding hero carousel, bouncy icons, animated buttons, elastic nav, typing indicator |
| Release APK | `releases/TOGT-Mobile-v1.0.0.apk` (~49 MB) |
| Tests | `flutter test` passing, `flutter analyze` 0 errors |

## Project Layout

```
togt-mobile-flutter/
├── lib/
│   ├── main.dart
│   ├── theme/          # TOGT brand colors, typography, Material 3 theme
│   ├── models/         # package_model, user_model, request_model
│   ├── services/       # api_service (HTTP + SSE), auth, packages, chat, requests
│   ├── widgets/        # bottom_nav_bar, package_card, animated_button, hero_carousel, shimmer_loading
│   └── screens/        # splash, onboarding, login, home_shell, home, packages,
│                       # package_detail, booking, umrah, chat, profile
├── releases/           # Built APK + emulator screenshots
└── pubspec.yaml
```

## Backend Connection

`lib/services/api_service.dart`:

| Environment | API base | Image origin |
|---|---|---|
| Local dev (default) | `http://10.0.2.2:3001/api` (emulator → host localhost) | `http://10.0.2.2:3000` |
| Production | `https://travel.togttrading.com/api` | `https://travel.togttrading.com` |

Switch with: `flutter build apk --release --dart-define=TOGT_LOCAL_API=false`

Endpoints used: `GET /packages`, `POST /auth/google`, `POST /auth/logout`, `GET/POST /service-requests`, `POST /chatbot/ask`, `POST /chatbot/stream` (SSE).

> Google Sign-In activates once an OAuth client ID (Android) is configured in Google Cloud Console + the backend. Until then the login screen offers demo roles (Customer / Staff) for full exploration.

### Google Sign-In setup (project `togt-b4334` / `286137540239`)

Three identifiers must line up, and `google-services.json` must come from the *same* project:

| Piece | Value | Where |
|---|---|---|
| Android client (package + SHA-1) | `286137540239-8qn19octa…upp8lo` | Firebase project `togt-b4334` → registered for `com.togt.travel` |
| Web client (`serverClientId` + backend `GOOGLE_CLIENT_ID`) | `286137540239-denh5sa3p4ote6mb5pug2itnq9itf0p0` | `lib/services/auth_service.dart`, server env |
| Signing SHA-1 (debug) | `6A:7A:AE:0C:A3:9F:5D:7C:AD:72:F3:9C:21:3C:15:0C:03:82:68:FA` | `~/.android/debug.keystore` of this machine |

`ApiException: 10` (`DEVELOPER_ERROR`) means the APK's SHA-1 is not registered for
`com.togt.travel` in the project the bundled `google-services.json` belongs to — register it and
download a fresh file. Debug keystores are machine-specific, so each developer registers their
own. `ApiException: 7` (`NETWORK_ERROR`) means Play services could not reach Google: check the
emulator has working internet and retry.

`serverClientId` must be a **Web** client ID: the Google ID token's audience is that client, and
`togt-api` verifies it against `GOOGLE_CLIENT_ID`. Using the *Android* client ID in either place
makes `/auth/google-mobile` reject the token.

## Build & Run

```bash
flutter pub get
flutter run                      # debug on attached device/emulator
flutter build apk --release      # APK at build/app/outputs/flutter-apk/
flutter build ipa                # iOS (requires macOS + Xcode)
```

> If the Flutter SDK lives in a path containing spaces (`C:\Users\hp 840 g8\Desktop\flutter sdk`),
> `flutter build` fails in the native-assets step with `'C:\Users\hp' is not recognized` — the tool
> runs the hook compiler with an unquoted executable path. Build from a space-free SDK location
> instead (e.g. a hardlink copy such as `C:\flutter_hl`), or move both the SDK and the project.

## Prerequisites (this machine)

- Flutter SDK: `C:\dev\flutter` (on user PATH)
- JDK 17: `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` (`JAVA_HOME`)
- Android SDK: `C:\dev\android-sdk` (`ANDROID_HOME`)
- Emulator AVD: `TOGT_Test` (Pixel 6, API 34)

Start local backend first (`docker compose up -d`, `npm run start:dev` in `togt-api`, `npm run dev` in `togt-web` for package images), then launch the app.
