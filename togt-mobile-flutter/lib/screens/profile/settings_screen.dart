import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';

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
    setState(() { busy = true; message = null; });
    try {
      final remote = await ApiService.instance.get('/auth/me');
      if (remote is Map<String, dynamic>) await AuthService.instance.persistRemoteUser(remote);
      final userId = AuthService.instance.currentUser?.id;
      if (userId == null) throw Exception('Please sign in again.');
      final data = await ApiService.instance.patch('/users/$userId', body: {'fullName': name.text.trim(), 'phone': phone.text.trim(), 'address': address.text.trim(), 'nationality': nationality.text.trim(), 'passportNumber': passport.text.trim()});
      if (data is Map<String, dynamic>) await AuthService.instance.persistRemoteUser(data);
      if (mounted) setState(() => message = 'Profile saved successfully.');
    } catch (e) { if (mounted) setState(() => message = 'Could not save profile: $e'); }
    finally { if (mounted) setState(() => busy = false); }
  }

  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Settings')), body: ListView(padding: const EdgeInsets.all(22), children: [
    Text('Profile settings', style: Theme.of(context).textTheme.headlineSmall),
    const SizedBox(height: 18),
    for (final field in [TextField(controller: name, decoration: const InputDecoration(labelText: 'Full name')), TextField(controller: phone, decoration: const InputDecoration(labelText: 'Phone')), TextField(controller: address, decoration: const InputDecoration(labelText: 'Address')), TextField(controller: nationality, decoration: const InputDecoration(labelText: 'Nationality')), TextField(controller: passport, decoration: const InputDecoration(labelText: 'Passport number'))]) Padding(padding: const EdgeInsets.only(bottom: 14), child: field),
    FilledButton(onPressed: busy ? null : save, child: Text(busy ? 'Saving...' : 'Save changes')),
    if (message != null) Padding(padding: const EdgeInsets.only(top: 14), child: Text(message!)),
  ]));
}
