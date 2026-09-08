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

  static const _fallback =
      'Welcome to TOGT Tour & Travel! I can help with Umrah packages, flight tickets, '
      'visa processing, domestic tours and more. Please contact +251 99 797 9741 for immediate help.';

  Stream<ChatReplyEvent> sendReply(String message) async* {
    List<ChatPackage>? packages;
    bool gotAny = false;
    try {
      await for (final chunk
          in ApiService.instance.sseStream('/chatbot/stream', {'message': message}, onMeta: (meta) {
        final list = meta['packages'];
        if (list is List) packages = list.map((e) => ChatPackage.fromJson(e as Map<String, dynamic>)).toList();
      })) {
        gotAny = true;
        if (chunk.isNotEmpty) yield ChatReplyEvent(text: chunk);
      }
      if (!gotAny) yield ChatReplyEvent(text: _fallback);
      if (packages != null && packages!.isNotEmpty) yield ChatReplyEvent(packages: packages);
    } catch (_) {
      try {
        final data = await ApiService.instance.post('/chatbot/ask', body: {'message': message});
        final payload = data is Map ? data : null;
        final text = (payload?['reply'] ?? payload?['answer'] ?? payload?['message'] ?? _fallback).toString();
        yield ChatReplyEvent(
          text: text,
          packages: payload?['packages'] is List
              ? (payload!['packages'] as List)
                  .map((e) => ChatPackage.fromJson(e as Map<String, dynamic>))
                  .toList()
              : null,
        );
      } catch (_) {
        yield ChatReplyEvent(text: _fallback);
      }
    }
  }
}