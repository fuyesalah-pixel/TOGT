import 'dart:async';

import 'api_service.dart';

class ChatService {
  ChatService._();
  static final ChatService instance = ChatService._();

  static const _fallback =
      'Welcome to TOGT Tour & Travel! I can help with Umrah packages, flight tickets, '
      'visa processing, domestic tours and more. (Live AI assistant is offline — '
      'connect OPENAI_API_KEY on the server to enable full responses.)';

  Stream<String> sendMessage(String message) async* {
    try {
      bool gotAny = false;
      await for (final chunk
          in ApiService.instance.sseStream('/chatbot/stream', {'message': message})) {
        gotAny = true;
        yield chunk;
      }
      if (!gotAny) yield _fallback;
    } catch (_) {
      try {
        final data = await ApiService.instance.post('/chatbot/ask', body: {'message': message});
        yield (data is Map ? (data['answer'] ?? data['reply'] ?? data['message'] ?? _fallback) : data)
            .toString();
      } catch (_) {
        yield _fallback;
      }
    }
  }
}
