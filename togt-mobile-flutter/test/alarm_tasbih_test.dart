import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:togt_mobile_app/config/map_config.dart';
import 'package:togt_mobile_app/services/prayer_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('CustomAlarm persistence', () {
    test('JSON round-trip keeps every field', () {
      final alarm = CustomAlarm(id: 'a1', hour: 5, minute: 30, label: 'Fajr wake-up', enabled: false);
      final restored = CustomAlarm.fromJson(alarm.toJson());
      expect(restored.id, 'a1');
      expect(restored.hour, 5);
      expect(restored.minute, 30);
      expect(restored.label, 'Fajr wake-up');
      expect(restored.enabled, isFalse);
    });

    test('missing fields fall back to safe defaults', () {
      final alarm = CustomAlarm.fromJson({'id': 'x'});
      expect(alarm.hour, 6);
      expect(alarm.minute, 0);
      expect(alarm.enabled, isTrue);
    });

    test('saveAll/loadAll round-trips through SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final alarms = [
        CustomAlarm(id: 'a', hour: 6, minute: 15, label: 'Ihram'),
        CustomAlarm(id: 'b', hour: 21, minute: 5, label: '', enabled: false),
      ];
      await CustomAlarm.saveAll(alarms);
      final loaded = await CustomAlarm.loadAll();
      expect(loaded.length, 2);
      expect(loaded.first.label, 'Ihram');
      expect(loaded.last.enabled, isFalse);
    });

    test('corrupt storage degrades to an empty list', () async {
      SharedPreferences.setMockInitialValues({'togt_custom_alarms': 'not-json{{'});
      expect(await CustomAlarm.loadAll(), isEmpty);
    });
  });

  group('Mapbox fallback config (no dart-define in tests)', () {
    test('falls back to OpenStreetMap tiles when no token is baked in', () {
      // Test builds run without --dart-define=MAPBOX_ACCESS_TOKEN.
      expect(hasMapboxTiles, isFalse);
      expect(mapTileUrlTemplate, contains('tile.openstreetmap.org'));
      expect(mapAttribution, contains('OpenStreetMap'));
    });
  });

  group('Prayer time calculation (Umm al-Qura, Addis Ababa)', () {
    final times = PrayerService.calculateFor(9.005401, 38.763611);

    test('the five prayers come back in canonical order within one day', () {
      final order = [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha];
      for (var i = 0; i < order.length - 1; i++) {
        expect(order[i].isBefore(order[i + 1]), isTrue, reason: 'prayer $i must precede prayer ${i + 1}');
      }
      // All five belong to the same solar day: Isha lands within 24h of Fajr
      // (robust around UTC-midnight test runs).
      expect(times.isha.difference(times.fajr), lessThan(const Duration(hours: 24)));
      expect(times.isha.difference(times.fajr), greaterThan(const Duration(hours: 6)));
    });

    test('Fajr is a dawn prayer and Maghrib/Isha sit at sunset (UTC sanity)', () {
      // Addis Ababa is UTC+3 year-round: dawn ≈ 05–06 local = 02–03 UTC,
      // sunset ≈ 18–19 local = 15–16 UTC.
      expect(times.fajr.toUtc().hour, inInclusiveRange(0, 4));
      expect(times.maghrib.toUtc().hour, inInclusiveRange(14, 17));
      expect(times.isha.toUtc().isAfter(times.maghrib.toUtc()), isTrue);
    });
  });
}
