enum PackageType {
  umrahEconomy('UMRAH_ECONOMY', 'Umrah Economy'),
  umrahVip('UMRAH_VIP', 'Umrah VIP'),
  umrahHoneymoon('UMRAH_HONEYMOON', 'Umrah Honeymoon'),
  umrahCustom('UMRAH_CUSTOM', 'Umrah Custom'),
  domesticPrebuilt('DOMESTIC_PREBUILT', 'Domestic Tour'),
  domesticCustom('DOMESTIC_CUSTOM', 'Domestic Custom'),
  foreignPrebuilt('FOREIGN_PREBUILT', 'Foreign Travel'),
  foreignCustom('FOREIGN_CUSTOM', 'Foreign Custom'),
  touristPrebuilt('TOURIST_PREBUILT', 'World Tour'),
  touristCustom('TOURIST_CUSTOM', 'Custom Trip');

  const PackageType(this.value, this.label);
  final String value;
  final String label;

  static PackageType fromValue(String v) =>
      PackageType.values.firstWhere((e) => e.value == v, orElse: () => PackageType.touristPrebuilt);

  bool get isUmrah => value.startsWith('UMRAH');
  bool get isDomestic => value.startsWith('DOMESTIC');
  bool get isForeign => value.startsWith('FOREIGN');
}

class TPackage {
  const TPackage({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    this.image,
    this.images = const [],
    this.price,
    this.currency,
    this.duration,
    this.maxMembers = 50,
    this.includes = const [],
    this.excludes = const [],
    this.destination,
  });

  final String id;
  final String title;
  final String description;
  final PackageType type;
  final String? image;
  final List<String> images;
  final double? price;
  final String? currency;
  final String? duration;
  final int maxMembers;
  final List<String> includes;
  final List<String> excludes;
  final String? destination;

  bool get isUmrah => type.isUmrah;

  factory TPackage.fromJson(Map<String, dynamic> j) {
    List<String> strList(dynamic v) =>
        (v as List<dynamic>? ?? []).map((e) => e.toString()).toList();
    return TPackage(
      id: j['id']?.toString() ?? '',
      title: j['title']?.toString() ?? 'Untitled',
      description: j['description']?.toString() ?? '',
      type: PackageType.fromValue(j['type']?.toString() ?? ''),
      image: j['image']?.toString(),
      images: strList(j['images']),
      price: (j['price'] as num?)?.toDouble(),
      currency: j['currency']?.toString(),
      duration: j['duration']?.toString(),
      maxMembers: (j['maxMembers'] as num?)?.toInt() ?? 50,
      includes: strList(j['includes']),
      excludes: strList(j['excludes']),
      destination: j['destination']?.toString(),
    );
  }
}
