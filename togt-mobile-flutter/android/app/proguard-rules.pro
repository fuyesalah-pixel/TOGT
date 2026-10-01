# R8 rules for the TOGT release build.
# Flutter injects its own keep-rules for the engine and each plugin's
# consumer rules are applied automatically; these cover the rest.

# Flutter engine / embedding (standard template rules).
-keep class io.flutter.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.app.**  { *; }

# Google Play services / Firebase thin layers referenced only reflectively
# from their SDKs. Narrow keeps keep R8 effective elsewhere.
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# socket.io-java-client / engine.io use org.json and reflection on message
# parsing; keep the parsing layer intact.
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# Removes reflective-access warnings that R8 cannot resolve (harmless).
-dontwarn java.lang.invoke.StringConcatFactory
