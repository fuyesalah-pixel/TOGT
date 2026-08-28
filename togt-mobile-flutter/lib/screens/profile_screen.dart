import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import 'dashboard_list_screen.dart';
import 'profile/reviews_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  TUser? get user => AuthService.instance.currentUser;

  @override
  Widget build(BuildContext context) {
    final u = user;
    if (u != null && (u.role == UserRole.worker || u.role == UserRole.admin || u.role == UserRole.tech)) {
      return _WebOnlyProfile(role: u.role, onLogout: () async {
        await AuthService.instance.logout();
        if (mounted) setState(() {});
      });
    }
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Row(
            children: [
              Hero(
                tag: 'avatar',
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration:
                      BoxDecoration(shape: BoxShape.circle, gradient: TOGTColors.orangeGradient),
                  child: CircleAvatar(
                    radius: 34,
                    backgroundColor: TOGTColors.white,
                    child: Text(
                      (u?.name.isNotEmpty == true ? u!.name[0] : 'T').toUpperCase(),
                      style: TOGTTypography.h1.copyWith(color: TOGTColors.blue),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(u?.name ?? 'Guest Traveler', style: TOGTTypography.h2),
                  const SizedBox(height: 3),
                  Text(u?.email ?? 'Not signed in', style: TOGTTypography.small),
                  if (u != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: TOGTColors.blue.withOpacity(.08),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(u.role.name.toUpperCase(),
                          style: TOGTTypography.small
                              .copyWith(color: TOGTColors.blue, fontWeight: FontWeight.w800, fontSize: 10.5)),
                    ),
                  ],
                ]),
              ),
            ],
          ),
          const SizedBox(height: 26),
          _MenuCard(children: [
            _MenuItem(icon: Icons.receipt_long_rounded, label: 'My Requests', onTap: () => _open(context, 'My Requests', '/service-requests')),
            _MenuItem(icon: Icons.airplane_ticket_outlined, label: 'My Tickets', onTap: () => _open(context, 'My Tickets', '/tickets')),
            _MenuItem(icon: Icons.history_rounded, label: 'History', onTap: () => _open(context, 'History', '/service-requests')),
            _MenuItem(icon: Icons.star_outline_rounded, label: 'Reviews', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReviewsScreen()))),
            _MenuItem(icon: Icons.location_on_outlined, label: 'Parent Tracking', onTap: () => _open(context, 'Parent Tracking', '/groups')),
          ]),
          const SizedBox(height: 16),
          _MenuCard(children: [
            _MenuItem(icon: Icons.notifications_none_rounded, label: 'Notifications', onTap: () => _open(context, 'Notifications', '/notifications')),
             _MenuItem(icon: Icons.payments_outlined, label: 'Payments', onTap: () => _open(context, 'Payments', '/service-requests')),
            _MenuItem(icon: Icons.settings_outlined, label: 'Settings', onTap: () => _settings(context)),
            _MenuItem(icon: Icons.language_rounded, label: 'Language', trailing: 'English', onTap: () => _language(context)),
            _MenuItem(icon: Icons.dark_mode_outlined, label: 'Appearance', trailing: 'Light', onTap: () {}),
            _MenuItem(icon: Icons.support_agent_rounded, label: 'Help & Support', onTap: () {}),
          ]),
          const SizedBox(height: 26),
          AnimatedButton(
            label: u == null ? 'Sign In' : 'Log Out',
            icon: u == null ? Icons.login_rounded : Icons.logout_rounded,
            gradient: u == null ? TOGTColors.orangeGradient : LinearGradient(colors: [TOGTColors.red, TOGTColors.red.withOpacity(.8)]),
            onPressed: () async {
              if (u == null) return;
              await AuthService.instance.logout();
              if (mounted) setState(() {});
            },
          ),
          const SizedBox(height: 12),
          Center(child: Text('TOGT Tour & Travel v1.0.0', style: TOGTTypography.small)),
        ],
      ),
    );
  }

  void _open(BuildContext context, String title, String endpoint) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => DashboardListScreen(title: title, endpoint: endpoint)));
  void _settings(BuildContext context) => showDialog(context: context, builder: (_) => AlertDialog(title: const Text('Settings'), content: const Text('Your profile and notification preferences are managed securely with your TOGT account.'), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))]));
  void _language(BuildContext context) => showModalBottomSheet(context: context, builder: (_) => SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: ['English', 'Arabic', 'Amharic'].map((language) => ListTile(title: Text(language), onTap: () => Navigator.pop(context))).toList())));
}

class _WebOnlyProfile extends StatelessWidget {
  const _WebOnlyProfile({required this.role, required this.onLogout});
  final UserRole role;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) => SafeArea(child: Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
    const Icon(Icons.web_asset_rounded, size: 64, color: TOGTColors.orange),
    const SizedBox(height: 20),
    Text('Please Use Web Version', style: TOGTTypography.h1, textAlign: TextAlign.center),
    const SizedBox(height: 10),
    Text('Your role (${role.name.toUpperCase()}) requires the full dashboard available on the web.', textAlign: TextAlign.center, style: TOGTTypography.body),
    const SizedBox(height: 24),
    FilledButton.icon(onPressed: () => launchUrl(Uri.parse('https://travel.togttrading.com'), mode: LaunchMode.externalApplication), icon: const Icon(Icons.open_in_new_rounded), label: const Text('Open Web Version')),
    TextButton.icon(onPressed: onLogout, icon: const Icon(Icons.logout_rounded), label: const Text('Logout')),
  ]))));
}

class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: TOGTColors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(color: TOGTColors.navy.withOpacity(.05), blurRadius: 14, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
    this.badge,
  });

  final IconData icon;
  final String label;
  final String? trailing;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        splashColor: TOGTColors.orange.withOpacity(.1),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
          child: Row(children: [
            Icon(icon, size: 21, color: TOGTColors.blue),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: TOGTTypography.h3.copyWith(fontSize: 14.5))),
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: TOGTColors.orange.withOpacity(.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(badge!,
                    style: const TextStyle(
                        fontSize: 10.5, fontWeight: FontWeight.w800, color: TOGTColors.orangeDark)),
              )
            else if (trailing != null)
              Text(trailing!, style: TOGTTypography.small),
            if (badge == null && trailing == null)
              Icon(Icons.chevron_right_rounded, size: 20, color: TOGTColors.grey.withOpacity(.6)),
          ]),
        ),
      ),
    );
  }
}
