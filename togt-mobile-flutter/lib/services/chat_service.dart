import 'dart:async';

import 'api_service.dart';

class ChatPackage {
  const ChatPackage({
    required this.id,
    required this.title,
    this.description = '',
    this.image,
    this.price,
    this.currency,
    this.duration,
    this.includes = const [],
  });

  final String id;
  final String title;
  final String description;
  final String? image;
  final double? price;
  final String? currency;
  final String? duration;
  final List<String> includes;

  factory ChatPackage.fromJson(Map<String, dynamic> j) => ChatPackage(
        id: j['id']?.toString() ?? '',
        title: j['title']?.toString() ?? 'Untitled',
        description: j['description']?.toString() ?? '',
        image: j['image']?.toString(),
        price: (j['price'] as num?)?.toDouble(),
        currency: j['currency']?.toString(),
        duration: j['duration']?.toString(),
        includes: ((j['includes'] as List<dynamic>?) ?? []).map((e) => e.toString()).toList(),
      );
}

class ChatReplyEvent {
  const ChatReplyEvent({this.text = '', this.packages});
  final String text;
  final List<ChatPackage>? packages;
}

class ChatService {
  ChatService._();
  static final ChatService instance = ChatService._();

  String _conversationId = 'mobile-${DateTime.now().millisecondsSinceEpoch}';
  String _userName = '';

  set userName(String value) => _userName = value.trim();

  static const _fallback =
      'Welcome to TOGT Tour & Travel! I can help with Umrah packages, flight tickets, '
      'visa processing, domestic tours and more. Please contact +251 99 797 9741 for immediate help.';

  Stream<ChatReplyEvent> sendReply(String message) async* {
    List<ChatPackage>? packages;
    try {
      final data = await ApiService.instance.post('/chatbot/ask', body: {
        'message': message,
        'conversationId': _conversationId,
        if (_userName.isNotEmpty) 'userInfo': {'name': _userName},
      });
      if (data is Map) {
        final reply = (data['reply']?.toString() ?? data['message']?.toString() ?? '').trim();
        final list = data['packages'];
        if (list is List) packages = list.map((e) => ChatPackage.fromJson(e as Map<String, dynamic>)).toList();
        if (reply.isNotEmpty) yield ChatReplyEvent(text: reply);
        if (packages != null && packages.isNotEmpty) yield ChatReplyEvent(packages: packages);
        if (reply.isEmpty) yield ChatReplyEvent(text: _fallback);
        return;
      }
    } catch (_) {
      // Non-streaming ask failed; fall back to the streaming endpoint below.
    }

    bool gotAny = false;
    try {
      await for (final chunk
          in ApiService.instance.sseStream('/chatbot/stream', {'message': message, 'conversationId': _conversationId}, onMeta: (meta) {
        final list = meta['packages'];
        if (list is List) packages = list.map((e) => ChatPackage.fromJson(e as Map<String, dynamic>)).toList();
      })) {
        gotAny = true;
        if (chunk.isNotEmpty) yield ChatReplyEvent(text: chunk);
      }
      if (!gotAny) yield ChatReplyEvent(text: _fallback);
      if (packages != null && packages.isNotEmpty) yield ChatReplyEvent(packages: packages);
    } catch (_) {
      yield ChatReplyEvent(text: _fallback);
    }
  }
}