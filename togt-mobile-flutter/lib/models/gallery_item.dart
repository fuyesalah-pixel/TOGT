class GalleryVideo {
  const GalleryVideo({required this.url, required this.title});

  final String url;
  final String title;

  factory GalleryVideo.fromJson(Map<String, dynamic> j) => GalleryVideo(
        url: j['url']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
      );
}

class GalleryItem {
  const GalleryItem({
    required this.id,
    required this.title,
    required this.category,
    required this.image,
    required this.description,
    this.images = const [],
    this.videos = const [],
    this.date,
    this.location,
    this.videoUrl,
  });

  final String id;
  final String title;
  final String category;
  final String image;
  final String description;
  final List<String> images;
  final List<GalleryVideo> videos;
  final String? date;
  final String? location;
  final String? videoUrl;

  List<String> get allImages {
    final list = <String>[];
    if (image.isNotEmpty) list.add(image);
    list.addAll(images.where((e) => e.isNotEmpty && e != image));
    return list;
  }

  factory GalleryItem.fromJson(Map<String, dynamic> j) {
    List<String> strList(dynamic v) =>
        (v as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    final rawVideos = j['videos'] as List<dynamic>? ?? const [];
    return GalleryItem(
      id: j['id']?.toString() ?? '',
      title: j['title']?.toString() ?? 'Untitled',
      category: j['category']?.toString() ?? 'TOUR',
      image: j['image']?.toString() ?? '',
      description: j['description']?.toString() ?? '',
      images: strList(j['images']),
      videos: rawVideos
          .whereType<Map>()
          .map((e) => GalleryVideo.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      date: j['date']?.toString(),
      location: j['location']?.toString(),
      videoUrl: j['videoUrl']?.toString(),
    );
  }
}
