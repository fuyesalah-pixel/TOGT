import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
class TicketDetailScreen extends StatelessWidget { const TicketDetailScreen({super.key, required this.ticket}); final Map<String, dynamic> ticket; @override Widget build(BuildContext context) { final l10n = AppLocalizations.of(context); return Scaffold(appBar: AppBar(title: Text(l10n.ticketDetails)), body: ListView(padding: const EdgeInsets.all(20), children: ticket.entries.map((entry) => ListTile(title: Text(entry.key), subtitle: Text('${entry.value}'))).toList())); } }
