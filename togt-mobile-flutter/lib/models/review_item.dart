class ReviewItem {
  const ReviewItem({
    required this.id,
    required this.name,
    required this.rating,
    required this.text,
    this.imageUrls = const [],
    this.createdAt,
  });

  final String id;
  final String name;
  final int rating;
  final String text;
  final List<String> imageUrls;
  final String? createdAt;

  factory ReviewItem.fromJson(Map<String, dynamic> j) {
    List<String> strList(dynamic v) =>
        (v as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    final user = j['user'];
    final name = user is Map
        ? (user['fullName']?.toString() ?? 'TOGT Customer')
        : 'TOGT Customer';
    return ReviewItem(
      id: j['id']?.toString() ?? '',
      name: name,
      rating: (j['rating'] as num?)?.toInt() ?? 5,
      text: j['reviewText']?.toString() ?? '',
      imageUrls: strList(j['imageUrls']),
      createdAt: j['createdAt']?.toString(),
    );
  }
}
