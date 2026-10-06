/// Mapbox basemap wiring for the in-app maps.
///
/// The publishable (pk.*) token is injected at build time via
/// --dart-define=MAPBOX_ACCESS_TOKEN=... (see .github/workflows/build-flutter-apk.yml).
/// When it is absent (local `flutter run` without a dart-define, or a CI
/// build before the secret was added) maps transparently fall back to
/// OpenStreetMap raster tiles, so the app never breaks.
library;

const String mapboxAccessToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');

bool get hasMapboxTiles => mapboxAccessToken.isNotEmpty;

/// 256px raster tiles of Mapbox Streets; kept at 256 so it drops into
/// flutter_map's default TileLayer with no extra tile-size handling.
String get mapTileUrlTemplate => hasMapboxTiles
    ? 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=$mapboxAccessToken'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

String get mapAttribution => hasMapboxTiles
    ? '© Mapbox © OpenStreetMap'
    : '© OpenStreetMap contributors';
