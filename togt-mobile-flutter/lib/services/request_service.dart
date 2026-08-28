import '../models/request_model.dart';
import 'api_service.dart';

class RequestService {
  RequestService._();
  static final RequestService instance = RequestService._();

  Future<List<TRequest>> fetchMyRequests() async {
    final data = await ApiService.instance.get('/service-requests');
    final list = (data is List ? data : (data['items'] ?? data['data'] ?? [])) as List<dynamic>;
    return list.map((e) => TRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TRequest> createRequest({
    required String type,
    required Map<String, dynamic> payload,
  }) async {
    final data = await ApiService.instance
        .post('/service-requests', body: {'serviceType': type, 'formData': payload});
    return TRequest.fromJson((data ?? {}) as Map<String, dynamic>);
  }
}
