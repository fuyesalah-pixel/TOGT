enum RequestStatus { pending, inReview, approved, rejected, completed }

class TRequest {
  const TRequest({
    required this.id,
    required this.type,
    required this.status,
    required this.createdAt,
    this.details,
    this.price,
  });

  final String id;
  final String type;
  final RequestStatus status;
  final DateTime createdAt;
  final String? details;
  final double? price;

  factory TRequest.fromJson(Map<String, dynamic> j) {
    return TRequest(
      id: j['id']?.toString() ?? '',
      type: (j['type'] ?? j['serviceType'] ?? 'General').toString(),
      status: RequestStatus.values.firstWhere(
        (s) => s.name.toLowerCase() == (j['status']?.toString() ?? 'pending').toLowerCase(),
        orElse: () => RequestStatus.pending,
      ),
      createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? '') ?? DateTime.now(),
      details: j['details']?.toString() ?? j['description']?.toString(),
      price: (j['price'] as num?)?.toDouble(),
    );
  }
}
