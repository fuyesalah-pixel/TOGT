import '../models/package_model.dart';
import 'api_service.dart';

class PackageService {
  PackageService._();
  static final PackageService instance = PackageService._();

  List<TPackage> _cache = [];

  List<TPackage> get cached => _cache;

  Future<List<TPackage>> fetchPackages({bool forceRefresh = false}) async {
    if (!forceRefresh && _cache.isNotEmpty) return _cache;
    final data = await ApiService.instance.get('/packages');
    final list = (data is List ? data : (data['items'] ?? data['data'] ?? [])) as List<dynamic>;
    _cache = list.map((e) => TPackage.fromJson(e as Map<String, dynamic>)).toList();
    return _cache;
  }

  TPackage? byId(String id) {
    try {
      return _cache.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  List<TPackage> byType({bool Function(TPackage)? where}) {
    final all = _cache;
    return where == null ? all : all.where(where).toList();
  }

  List<TPackage> umrahPackages() => _cache.where((p) => p.isUmrah).toList();

  List<TPackage> featured({int limit = 6}) => _cache.take(limit).toList();
}
