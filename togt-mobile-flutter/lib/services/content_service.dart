import '../models/gallery_item.dart';
import '../models/review_item.dart';
import 'api_service.dart';

class ContentService {
  ContentService._();
  static final ContentService instance = ContentService._();

  Future<List<GalleryItem>> fetchGallery() async {
    final data = await ApiService.instance.get('/content/gallery');
    final list = (data is List ? data : (data['items'] ?? data['data'] ?? [])) as List<dynamic>;
    return list.map((e) => GalleryItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ReviewItem>> fetchVisibleReviews() async {
    final data = await ApiService.instance.get('/reviews/visible');
    final list = (data is List ? data : (data['items'] ?? data['data'] ?? [])) as List<dynamic>;
    final reviews = list.map((e) => ReviewItem.fromJson(e as Map<String, dynamic>)).toList();
    return reviews.where((r) => r.text.trim().isNotEmpty).toList();
  }
}
