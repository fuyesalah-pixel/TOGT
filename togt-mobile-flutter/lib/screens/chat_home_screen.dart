import 'package:flutter/material.dart';

import '../theme/typography.dart';
import 'chat_screen.dart';

class ChatHomeScreen extends StatelessWidget {
  const ChatHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('TOGT Support', style: TOGTTypography.h1),
          const SizedBox(height: 8),
          Text('Choose how you want to talk', style: TOGTTypography.body),
          const SizedBox(height: 22),
          _ChoiceCard(title: 'AI Assistant', subtitle: 'Common travel answers and requests.', icon: Icons.smart_toy_outlined, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen(human: false)))),
          _ChoiceCard(title: 'Human Support', subtitle: 'Chat with the TOGT team.', icon: Icons.support_agent_outlined, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen(human: true)))),
        ],
      ),
    );
  }
}

class _ChoiceCard extends StatelessWidget {
  const _ChoiceCard({required this.title, required this.subtitle, required this.icon, required this.onTap});
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      margin: const EdgeInsets.only(bottom: 14),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        leading: CircleAvatar(radius: 26, child: Icon(icon)),
        title: Text(title, style: TOGTTypography.h3),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      ),
    );
  }
}
