import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/package_model.dart';
import '../services/api_service.dart';
import '../services/chat_service.dart';
import '../services/chat_socket_service.dart';
import '../services/auth_service.dart';
import '../services/document_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import 'package_detail_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.human});
  final bool human;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<_Msg> _messages = [];
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  bool _typing = false;
  bool _uploading = false;
  bool _live = false;
  late bool _human = widget.human;
  String? _humanWorkerId;
  bool? _aiOnline;
  String? _userId;

  String get _historyKey => _human ? 'togt_chat_human' : 'togt_chat_ai';

  @override
  void initState() {
    super.initState();
    _userId = AuthService.instance.currentUser?.id;
    _loadHistory();
    if (_human) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _setMode(true));
    } else {
      _checkAi();
    }
  }

  @override
  void dispose() {
    // Leaving the AI chat tears down the socket; leaving the human chat keeps
    // it alive only while this screen exists (the service is a singleton and
    // reconnects automatically when the screen reopens).
    if (!_human) ChatSocketService.instance.dispose();
    super.dispose();
  }

  Future<void> _checkAi() async {
    final online = await ChatService.instance.isOnline();
    if (mounted) setState(() => _aiOnline = online);
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_historyKey) ?? [];
    if (!mounted) return;
    setState(() => _messages = saved.map((item) => _Msg.fromJson(item)).toList());
    if (_messages.isEmpty) {
      final greeting = AppLocalizations.of(context).chatWelcome;
      setState(() => _messages = [_Msg(text: greeting, fromUser: false)]);
      await _saveHistory();
    }
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_historyKey, _messages.map((message) => message.toJson()).toList());
  }

  void _appendIncoming(Map<String, dynamic> data) {
    // Ignore echoes of our own messages (they are already in the list).
    final senderId = data['senderId']?.toString();
    if (senderId != null && senderId == _userId) return;
    final text = data['message']?.toString() ?? '';
    final fileUrl = data['fileUrl']?.toString();
    final fileType = data['fileType']?.toString();
    if (text.isEmpty && (fileUrl == null || fileUrl.isEmpty)) return;
    if (!_human) return; // AI chat never receives socket messages
    var msg = _Msg(text: text, fromUser: false, fileUrl: fileUrl, fileType: fileType);
    // Suppress duplicates (the API emits several event names per message).
    final last = _messages.isEmpty ? null : _messages.last;
    if (last != null && !last.fromUser && last.text == msg.text && last.fileUrl == msg.fileUrl) return;
    if (_messages.any((m) => !m.fromUser && m.text == msg.text && m.fileUrl == msg.fileUrl && m.sentAt == msg.sentAt)) return;
    if (mounted) {
      setState(() => _messages.add(msg));
      _saveHistory();
      _scrollDown();
    }
  }

  void _send() async {
    final l10n = AppLocalizations.of(context);
    final text = _controller.text.trim();
    if ((text.isEmpty && !_uploading) || _typing) return;
    if (text.isEmpty) return;
    _controller.clear();
    setState(() {
      _messages.add(_Msg(text: text, fromUser: true));
      _typing = true;
    });
    await _saveHistory();
    _scrollDown();

    if (_human) {
      try {
        if (_humanWorkerId == null) {
          final response = await ChatSocketService.instance.start();
          _humanWorkerId = response is Map ? response['workerId']?.toString() : null;
        }
        final workerId = _humanWorkerId;
        if (workerId == null) throw Exception('No support worker is available');
        await ChatSocketService.instance.sendMessage(receiverId: workerId, message: text);
      } catch (e) {
        if (mounted) {
          setState(() {
            _typing = false;
            _messages.add(_Msg(text: l10n.chatSendFailed(e.toString()), fromUser: false));
          });
          await _saveHistory();
        }
      } finally {
        if (mounted) setState(() => _typing = false);
      }
      return;
    }
    final replyBuffer = StringBuffer();
    List<ChatPackage>? packages;
    try {
      await for (final event in ChatService.instance.sendReply(text, fallback: l10n.offlineReply)) {
        if (event.text.isNotEmpty) replyBuffer.write(event.text);
        if (event.packages != null && event.packages!.isNotEmpty) packages = event.packages;
        setState(() {});
        _scrollDown();
      }
    } finally {
      setState(() {
        _typing = false;
        _messages.add(_Msg(
            text: replyBuffer.isEmpty ? l10n.sorryAi : replyBuffer.toString(),
            fromUser: false,
            packages: packages));
      });
      await _saveHistory();
      _scrollDown();
    }
  }

  Future<void> _attach() async {
    final l10n = AppLocalizations.of(context);
    if (_uploading) return;
    var workerId = _humanWorkerId;
    if (workerId == null) {
      // The paperclip must work before any text message is sent: open the
      // support conversation on demand instead of silently doing nothing.
      try {
        final conversation = await ChatSocketService.instance.start();
        workerId = conversation is Map ? conversation['workerId']?.toString() : null;
        _humanWorkerId = workerId;
        if (workerId != null && mounted) setState(() {});
      } catch (_) {}
      if (workerId == null) {
        if (mounted) {
          setState(() => _messages.add(_Msg(text: l10n.chatSendFailed('No support worker is available yet — please try again in a moment.'), fromUser: false)));
          await _saveHistory();
        }
        return;
      }
    }
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Wrap(children: [
          ListTile(leading: const Icon(Icons.photo_library_rounded), title: Text(l10n.pickFromGallery), onTap: () => Navigator.pop(sheetContext, ImageSource.gallery)),
          ListTile(leading: const Icon(Icons.photo_camera_rounded), title: Text(l10n.takePhoto), onTap: () => Navigator.pop(sheetContext, ImageSource.camera)),
        ]),
      ),
    );
    if (source == null || !mounted) return;
    final picked = await DocumentService.instance.pickImage(source);
    if (picked == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      await ChatSocketService.instance.sendFile(receiverId: workerId, filePath: picked.path, message: '');
      setState(() => _messages.add(_Msg(text: '', fromUser: true, fileUrl: picked.path, fileType: 'image/jpeg', localPath: picked.path)));
      await _saveHistory();
      _scrollDown();
    } catch (e) {
      if (mounted) {
        setState(() => _messages.add(_Msg(text: l10n.chatSendFailed(e.toString()), fromUser: false)));
        await _saveHistory();
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent + 80,
            duration: const Duration(milliseconds: 350), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
      bottom: false,
      child: Column(
        children: [
           Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: TOGTColors.orangeGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                 child: Icon(_human ? Icons.support_agent_rounded : Icons.smart_toy_rounded, color: TOGTColors.white, size: 22),
              ),
              const SizedBox(width: 12),
Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_human ? l10n.humanSupport : l10n.aiAssistant, style: TOGTTypography.h3),
                Row(children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _human
                          ? (_live ? TOGTColors.green : const Color(0xFFF59E0B))
                          : (_aiOnline == false ? const Color(0xFFF59E0B) : TOGTColors.green),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                    Text(_human
                        ? (_live ? l10n.specialistOnDuty : l10n.connectingDots)
                        : (_aiOnline == false ? l10n.aiOffline : l10n.onlineAi), style: TOGTTypography.small),
                ]),
              ]),
             ]),
           ),

           Expanded(
             child: Container(
               color: const Color(0xFFF6F8FB),
               child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              itemCount: _messages.length + (_typing ? 1 : 0),
              itemBuilder: (context, i) {
                if (i == _messages.length && _typing) return _buildTyping();
                return _Bubble(msg: _messages[i], index: i);
              },
               ),
             ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            decoration: BoxDecoration(
              color: TOGTColors.white,
              boxShadow: [
                BoxShadow(color: TOGTColors.navy.withOpacity(.05), blurRadius: 16, offset: const Offset(0, -4)),
              ],
            ),
            child: SafeArea(
              top: false,
               child: Row(children: [
                 if (_human)
                   IconButton(
                     onPressed: _uploading ? null : _attach,
                     icon: _uploading
                         ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: TOGTColors.blue))
                         : const Icon(Icons.attach_file_rounded, color: TOGTColors.blue),
                   ),
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.send,
                    autocorrect: false,
                    enableSuggestions: false,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                       hintText: l10n.askAnything,
                      suffixIcon: Icon(Icons.emoji_emotions_outlined, color: TOGTColors.grey.withOpacity(.6)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _send,
                  child: Container(
                    padding: const EdgeInsets.all(13),
                    decoration: const BoxDecoration(
                        gradient: TOGTColors.blueGradient, shape: BoxShape.circle),
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: _typing
                          ? SizedBox(
                              key: UniqueKey(),
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: TOGTColors.white))
                          : const Icon(Icons.send_rounded,
                              key: ValueKey('send'), size: 19, color: TOGTColors.white),
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
      ),
    );
  }

  Future<void> _loadRemoteHistory() async {
    final workerId = _humanWorkerId;
    if (!_human || workerId == null) return;
    final data = await ChatSocketService.instance.messages(workerId);
    final items = (data is List ? data : (data is Map ? data['items'] : null) as List? ?? []) as List<dynamic>;
    if (!mounted) return;
    setState(() => _messages = items.map((item) {
          final map = Map<String, dynamic>.from(item as Map);
          final senderId = map['senderId']?.toString();
          return _Msg(
            text: map['message']?.toString() ?? map['content']?.toString() ?? '',
            fromUser: _userId != null && senderId == _userId,
            fileUrl: map['fileUrl']?.toString(),
            fileType: map['fileType']?.toString(),
          );
        }).where((m) => m.text.isNotEmpty || (m.fileUrl?.isNotEmpty ?? false)).toList());
    await _saveHistory();
    _scrollDown();
  }

  Future<void> _setMode(bool human) async {
    await _saveHistory();
    setState(() => _human = human);
    if (!human) { ChatSocketService.instance.dispose(); return; }
    await _loadHistory();
    try {
      final conversation = await ChatSocketService.instance.start();
      if (conversation is Map) _humanWorkerId = conversation['workerId']?.toString();
      if (_humanWorkerId != null) await _loadRemoteHistory();
      ChatSocketService.instance.connect(onMessage: _appendIncoming, onRoleChanged: (role) async { await AuthService.instance.applyRole(role); if (mounted) setState(() {}); }, onTyping: () { if (mounted) setState(() {}); }, onConnectionChanged: (connected) { if (mounted) setState(() => _live = connected); });
      if (mounted) setState(() => _live = ChatSocketService.instance.isConnected);
    } catch (_) {}
  }

  Widget _buildTyping() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: TOGTColors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2.5),
            child: _PulsingDot(delay: i * 220),
          );
        })),
      ),
    );
  }
}

class _Msg {
  _Msg({required this.text, required this.fromUser, this.packages, this.fileUrl, this.fileType, this.localPath, DateTime? sentAt})
      : sentAt = sentAt ?? DateTime.now();
  final String text;
  final bool fromUser;
  final List<ChatPackage>? packages;
  final String? fileUrl;
  final String? fileType;
  final String? localPath;
  final DateTime sentAt;

  bool get isImage => (fileType?.startsWith('image/') ?? false) || (fileUrl ?? localPath ?? '').toLowerCase().contains('.jpg') || (fileUrl ?? localPath ?? '').toLowerCase().contains('.png') || (fileUrl ?? localPath ?? '').toLowerCase().contains('.jpeg') || (fileUrl ?? localPath ?? '').toLowerCase().contains('.webp');

  bool get hasAttachment => (fileUrl?.isNotEmpty ?? false) || (localPath?.isNotEmpty ?? false);

  factory _Msg.fromJson(String value) {
    final parts = value.split('|');
    String text = parts.first.replaceAll('¦', '|');
    String? fileUrl;
    String? fileType;
    // Extended format: text|from|fileUrl¦(escaped)|fileType
    if (parts.length >= 3) {
      fileUrl = parts[2] == '' ? null : parts[2].replaceAll('¦', '|');
      fileType = parts.length >= 4 && parts[3].isNotEmpty ? parts[3].replaceAll('¦', '|') : null;
    }
    return _Msg(text: text, fromUser: parts.length > 1 && parts[1] == '1', fileUrl: fileUrl, fileType: fileType);
  }

  String toJson() => '${text.replaceAll('|', '¦')}|${fromUser ? '1' : '0'}|${(fileUrl ?? '').replaceAll('|', '¦')}|${(fileType ?? '').replaceAll('|', '¦')}';
}

class _Bubble extends StatefulWidget {
  const _Bubble({required this.msg, required this.index});

  final _Msg msg;
  final int index;

  @override
  State<_Bubble> createState() => _BubbleState();
}

class _BubbleState extends State<_Bubble> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 400))..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.msg.fromUser;
    return FadeTransition(
      opacity: CurvedAnimation(parent: _c, curve: Curves.easeOut),
      child: SlideTransition(
        position: Tween<Offset>(begin: Offset(user ? .15 : -.15, 0), end: Offset.zero)
            .animate(CurvedAnimation(parent: _c, curve: Curves.easeOutCubic)),
        child: Align(
          alignment: user ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 5),
            padding: widget.msg.isImage && widget.msg.hasAttachment ? const EdgeInsets.all(5) : const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .75),
            decoration: BoxDecoration(
              gradient: user ? TOGTColors.blueGradient : null,
              color: user ? null : TOGTColors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(20),
                topRight: const Radius.circular(20),
                bottomLeft: user ? const Radius.circular(20) : Radius.zero,
                bottomRight: user ? Radius.zero : const Radius.circular(20),
              ),
              boxShadow: [
                BoxShadow(color: TOGTColors.navy.withOpacity(.06), blurRadius: 8, offset: const Offset(0, 3)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: user ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (widget.msg.hasAttachment) _attachment(context),
                if (widget.msg.text.isNotEmpty) ...[
                  if (widget.msg.hasAttachment) const SizedBox(height: 6),
                  _rich(widget.msg.text,
                      TOGTTypography.body.copyWith(
                          color: user ? TOGTColors.white : const Color(0xFF12394F), fontSize: 13.8, decoration: TextDecoration.none)),
                ],
                if (widget.msg.packages != null && widget.msg.packages!.isNotEmpty)
                  ...widget.msg.packages!.take(4).map((pkg) => _buildPackageCard(context, pkg)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _attachment(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (widget.msg.isImage) {
      final raw = widget.msg.fileUrl!;
      // Private storage keys resolve to short-lived signed URLs before display.
      if (raw.startsWith('r2-private://')) {
        return FutureBuilder<String>(
          future: ApiService.instance.resolveDocumentUrl(raw),
          builder: (context, snapshot) {
            final signed = snapshot.data;
            if (snapshot.connectionState != ConnectionState.done) {
              return const SizedBox(width: 210, height: 210, child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
            }
            if (signed == null || signed == raw) {
              return const SizedBox(width: 210, height: 210, child: Center(child: Icon(Icons.broken_image_rounded, color: TOGTColors.grey)));
            }
            return ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: GestureDetector(
                onTap: () => _openImageViewer(context, signed, false),
                child: SizedBox(width: 210, height: 210, child: Image.network(signed, width: 210, height: 210, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox(width: 210, height: 210, child: Center(child: Icon(Icons.broken_image_rounded, color: TOGTColors.grey))))),
              ),
            );
          },
        );
      }
      final src = widget.msg.localPath ?? ApiService.instance.resolveImageUrl(raw);
      final isLocal = widget.msg.localPath != null;
      final image = isLocal
          ? Image.file(File(src), width: 210, height: 210, fit: BoxFit.cover)
          : Image.network(src, width: 210, height: 210, fit: BoxFit.cover, loadingBuilder: (_, child, progress) => progress == null ? child : const SizedBox(width: 210, height: 210, child: Center(child: CircularProgressIndicator(strokeWidth: 2))));
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: GestureDetector(
          onTap: () => _openImageViewer(context, src, isLocal),
          child: SizedBox(width: 210, height: 210, child: image),
        ),
      );
    }
    return InkWell(
      onTap: () async {
        // Local previews open directly; remote files (including private R2
        // keys exchanged for signed URLs) open via the system viewer.
        final raw = widget.msg.fileUrl!;
        final resolved = raw.startsWith('r2-private://')
            ? await ApiService.instance.resolveDocumentUrl(raw)
            : ApiService.instance.resolveImageUrl(raw);
        await DocumentService.instance.openRemote(resolved);
      },
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(widget.msg.fromUser ? Icons.insert_drive_file_rounded : Icons.picture_as_pdf_rounded, size: 18, color: widget.msg.fromUser ? TOGTColors.white : TOGTColors.blue),
        const SizedBox(width: 6),
        Text(l10n.attachment, style: TOGTTypography.small.copyWith(color: widget.msg.fromUser ? TOGTColors.white : TOGTColors.blue, decoration: TextDecoration.underline, decorationColor: widget.msg.fromUser ? TOGTColors.white : TOGTColors.blue)),
      ]),
    );
  }

  void _openImageViewer(BuildContext context, String src, bool isLocal) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, iconTheme: const IconThemeData(color: Colors.white)),
        body: Center(
          child: InteractiveViewer(
            child: isLocal ? Image.file(File(src)) : Image.network(src),
          ),
        ),
      ),
    ));
  }

  Widget _rich(String text, TextStyle base) {
    if (!text.contains('**')) return Text(text, style: base);
    final pieces = text.split(RegExp(r'(\*\*[^*]+\*\*)'));
    return Text.rich(
      TextSpan(
        style: base,
        children: pieces.where((part) => part.isNotEmpty).map((part) {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return TextSpan(text: part.substring(2, part.length - 2), style: base.copyWith(fontWeight: FontWeight.w700));
          }
          return TextSpan(text: part.replaceFirst(RegExp(r'^#{1,3}\s+'), ''));
        }).toList(),
      ),
    );
  }

  String _fmt(double? value) {
    if (value == null) return '';
    final whole = value.truncate().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < whole.length; i++) {
      buffer.write(whole[i]);
      final remaining = whole.length - i - 1;
      if (remaining > 0 && remaining % 3 == 0) buffer.write(',');
    }
    return value == value.truncateToDouble() ? buffer.toString() : value.toStringAsFixed(2);
  }

  Widget _buildPackageCard(BuildContext context, ChatPackage pkg) {
    final l10n = AppLocalizations.of(context);
    final width = MediaQuery.of(context).size.width * .66;
    final imageUrl = pkg.image != null && pkg.image!.isNotEmpty ? ApiService.instance.resolveImageUrl(pkg.image!) : null;
    return GestureDetector(
      key: ValueKey('chat-pkg-${pkg.id}'),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => PackageDetailScreen(
          package: TPackage.fromJson({
            'id': pkg.id,
            'title': pkg.title,
            'description': pkg.description,
            'image': pkg.image,
            'price': pkg.price,
            'currency': pkg.currency,
            'duration': pkg.duration,
            'includes': pkg.includes,
          }),
        ),
      )),
      child: Container(
        width: width,
        margin: const EdgeInsets.only(top: 8),
        decoration: BoxDecoration(
          color: TOGTColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: TOGTColors.navy.withOpacity(.08)),
          boxShadow: [BoxShadow(color: TOGTColors.navy.withOpacity(.06), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl != null)
              Image.network(
                imageUrl,
                height: 84,
                width: width,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 84,
                  width: width,
                  decoration: const BoxDecoration(gradient: TOGTColors.blueGradient),
                  child: const Center(child: Icon(Icons.flight_takeoff_rounded, size: 32, color: TOGTColors.white)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pkg.title, style: TOGTTypography.h3.copyWith(fontSize: 13.5, color: const Color(0xFF12394F))),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Flexible(
                        child: Text(pkg.duration ?? l10n.flexibleDuration,
                            style: TOGTTypography.small.copyWith(color: TOGTColors.grey), overflow: TextOverflow.ellipsis),
                      ),
                      if (pkg.price != null)
                        Padding(
                          padding: const EdgeInsets.only(left: 6),
                          child: Text('${_fmt(pkg.price)} ${pkg.currency ?? 'ETB'}',
                              style: TOGTTypography.small.copyWith(color: TOGTColors.orange, fontWeight: FontWeight.bold)),
                        )
                      else
                        Text(l10n.customPricing, style: TOGTTypography.small.copyWith(color: TOGTColors.orange, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  if (pkg.description.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(pkg.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TOGTTypography.small.copyWith(color: TOGTColors.grey)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot({required this.delay});

  final int delay;

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 600));

  late final Timer _timer = Timer(Duration(milliseconds: widget.delay), () {
    if (mounted) _c.repeat(reverse: true);
  });

  @override
  void dispose() {
    _timer.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _c,
      child: Container(
          width: 7,
          height: 7,
          decoration: const BoxDecoration(color: TOGTColors.grey, shape: BoxShape.circle)),
    );
  }
}
