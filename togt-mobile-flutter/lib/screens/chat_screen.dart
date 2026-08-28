import 'dart:async';

import 'package:flutter/material.dart';

import '../services/chat_service.dart';
import '../services/chat_socket_service.dart';
import '../services/auth_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<_Msg> _messages = [
    const _Msg(text: 'Salam! 👋 Welcome to TOGT. Ask me about Umrah packages, flights, visas or tours.', fromUser: false),
  ];
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  bool _typing = false;
  bool _human = false;
  String? _humanWorkerId;

  void _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _typing) return;
    _controller.clear();
    setState(() {
      _messages.add(_Msg(text: text, fromUser: true));
      _typing = true;
    });
    _scrollDown();

    if (_human) {
      try {
        final workerId = _humanWorkerId ?? ((await ChatSocketService.instance.start()) as Map)['workerId']?.toString();
        if (workerId == null) throw Exception('No support worker is available');
        _humanWorkerId = workerId;
        await ChatSocketService.instance.sendMessage(receiverId: workerId, message: text);
      } catch (e) {
        if (mounted) setState(() { _typing = false; _messages.add(_Msg(text: 'Unable to send message: $e', fromUser: false)); });
      } finally {
        if (mounted) setState(() => _typing = false);
      }
      return;
    }
    final replyBuffer = StringBuffer();
    try {
      await for (final chunk in _human
          ? Stream<String>.value('Your message is in the support queue. A TOGT specialist will reply shortly.')
          : ChatService.instance.sendMessage(text)) {
        replyBuffer.write(chunk);
        setState(() {});
        _scrollDown();
      }
    } finally {
      setState(() {
        _typing = false;
        _messages.add(_Msg(
            text: replyBuffer.isEmpty ? 'Sorry, I could not answer that.' : replyBuffer.toString(),
            fromUser: false));
      });
      _scrollDown();
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
    return SafeArea(
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
                child: const Icon(Icons.smart_toy_rounded, color: TOGTColors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('TOGT Assistant', style: TOGTTypography.h3),
                Row(children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration:
                        const BoxDecoration(color: TOGTColors.green, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 5),
                  Text('Online · AI powered', style: TOGTTypography.small),
                ]),
              ]),
             ]),
           ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, icon: Icon(Icons.smart_toy_outlined), label: Text('AI Assistant')),
                ButtonSegment(value: true, icon: Icon(Icons.support_agent_outlined), label: Text('Human Support')),
              ],
              selected: {_human},
              onSelectionChanged: (v) => _setMode(v.first),
            ),
          ),
          Expanded(
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
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: 'Ask anything…',
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
    );
  }

  Future<void> _setMode(bool human) async {
    setState(() => _human = human);
    if (!human) { ChatSocketService.instance.dispose(); return; }
    try {
      final conversation = await ChatSocketService.instance.start();
      if (conversation is Map) _humanWorkerId = conversation['workerId']?.toString();
      ChatSocketService.instance.connect(onMessage: (data) {
        final message = data['message']?.toString();
        if (message != null && mounted) setState(() => _messages.add(_Msg(text: message, fromUser: false)));
      }, onRoleChanged: (role) async { await AuthService.instance.applyRole(role); if (mounted) setState(() {}); }, onTyping: () { if (mounted) setState(() {}); });
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
  const _Msg({required this.text, required this.fromUser});
  final String text;
  final bool fromUser;
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
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
            child: Text(widget.msg.text,
                style: TOGTTypography.body.copyWith(
                    color: user ? TOGTColors.white : TOGTColors.navy, fontSize: 13.8)),
          ),
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
