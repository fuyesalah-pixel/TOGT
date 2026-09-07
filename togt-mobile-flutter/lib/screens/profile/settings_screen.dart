import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/locale_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final name = TextEditingController(text: AuthService.instance.currentUser?.name);
  late final phone = TextEditingController(text: AuthService.instance.currentUser?.phone);
  late final address = TextEditingController(text: AuthService.instance.currentUser?.address);
  late final nationality = TextEditingController(text: AuthService.instance.currentUser?.nationality);
  late final passport = TextEditingController(text: AuthService.instance.currentUser?.passportNumber);
  bool busy = false;
  String? message;

  @override void dispose() { name.dispose(); phone.dispose(); address.dispose(); nationality.dispose(); passport.dispose(); super.dispose(); }

  Future<void> save() async {
    final l10n = AppLocalizations.of(context);
    setState(() { busy = true; message = null; });
    try {
      final remote = await ApiService.instance.get('/auth/me');
      if (remote is Map<String, dynamic>) await AuthService.instance.persistRemoteUser(remote);
      final userId = AuthService.instance.currentUser?.id;
       if (userId == null) throw Exception(l10n.signInAgain);
      final data = await ApiService.instance.patch('/users/$userId', body: {'fullName': name.text.trim(), 'phone': phone.text.trim(), 'address': address.text.trim(), 'nationality': nationality.text.trim(), 'passportNumber': passport.text.trim()});
      if (data is Map<String, dynamic>) await AuthService.instance.persistRemoteUser(data);
       if (mounted) setState(() => message = l10n.profileSaved);
    } catch (e) { if (mounted) setState(() => message = l10n.profileSaveFailed(e.toString())); }
    finally { if (mounted) setState(() => busy = false); }
  }

  @override Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final selected = LocaleService.instance.locale.value?.languageCode ?? 'en';
    return Scaffold(appBar: AppBar(title: Text(l10n.settings)), body: ListView(padding: const EdgeInsets.all(22), children: [
    Text(l10n.profileSettings, style: Theme.of(context).textTheme.headlineSmall),
    const SizedBox(height: 18),
    DropdownButtonFormField<String>(value: selected, decoration: InputDecoration(labelText: l10n.language), items: [DropdownMenuItem(value: 'en', child: Text(l10n.english)), DropdownMenuItem(value: 'ar', child: Text(l10n.arabic)), DropdownMenuItem(value: 'am', child: Text(l10n.amharic))], onChanged: (value) { if (value != null) LocaleService.instance.setLocale(value); }),
    const SizedBox(height: 18),
    for (final field in [TextField(controller: name, decoration: InputDecoration(labelText: l10n.fullName)), TextField(controller: phone, decoration: InputDecoration(labelText: l10n.phone)), TextField(controller: address, decoration: InputDecoration(labelText: l10n.address)), TextField(controller: nationality, decoration: InputDecoration(labelText: l10n.nationality)), TextField(controller: passport, decoration: InputDecoration(labelText: l10n.passportNumber))]) Padding(padding: const EdgeInsets.only(bottom: 14), child: field),
    FilledButton(onPressed: busy ? null : save, child: Text(busy ? l10n.saving : l10n.saveChanges)),
    if (message != null) Padding(padding: const EdgeInsets.only(top: 14), child: Text(message!)),
  ]));
  }
}
