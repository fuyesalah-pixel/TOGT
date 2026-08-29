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

## Build & Run

```bash
flutter pub get
flutter run                      # debug on attached device/emulator
flutter build apk --release      # APK at build/app/outputs/flutter-apk/
flutter build ipa                # iOS (requires macOS + Xcode)
```

## Prerequisites (this machine)

- Flutter SDK: `C:\dev\flutter` (on user PATH)
- JDK 17: `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` (`JAVA_HOME`)
- Android SDK: `C:\dev\android-sdk` (`ANDROID_HOME`)
- Emulator AVD: `TOGT_Test` (Pixel 6, API 34)

Start local backend first (`docker compose up -d`, `npm run start:dev` in `togt-api`, `npm run dev` in `togt-web` for package images), then launch the app.
