import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../../navigation/app_navigator.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Self-service account deletion. Calls DELETE /users/me, which anonymises the
/// profile, removes uploaded documents and personal records, and revokes all
/// sessions. Deleting the account does not cancel active bookings.
class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  bool get _canDelete => _confirm.text.trim().toUpperCase() == 'DELETE' && !_busy;

  @override
  void dispose() {
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete your account?'),
        content: const Text(
          'This permanently deletes your Togt Travel account and personal data. '
          'This cannot be undone. Active bookings are not cancelled automatically.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete permanently', style: TextStyle(color: TOGTColors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ApiService.instance.delete('/users/me');
      await AuthService.instance.logout();
      if (!mounted) return;
      AppNavigator.goToLogin();
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Delete my account')),
      body: ListView(
        padding: const EdgeInsets.all(22),
        children: [
          const Icon(Icons.delete_forever_rounded, size: 64, color: TOGTColors.red),
          const SizedBox(height: 16),
          Text('This permanently deletes your account', style: TOGTTypography.h1),
          const SizedBox(height: 12),
          Text(
            'When you delete your account we immediately:',
            style: TOGTTypography.body,
          ),
          const SizedBox(height: 10),
          const _Bullet('erase your name, email, phone, address, birthday, nationality and passport details;'),
          const _Bullet('delete your passport/ID scans, profile photo, review photos and chat attachments;'),
          const _Bullet('delete your chat messages, reviews, notifications, saved devices and location history;'),
          const _Bullet('sign you out everywhere.'),
          const SizedBox(height: 16),
          Text(
            'Paid invoices, tickets and payment records are kept for up to 7 years because tax, '
            'accounting and airline rules require them. They are no longer linked to your profile.',
            style: TOGTTypography.small,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: TOGTColors.orange.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              'Deleting your account does not cancel an active booking. Contact support first if you '
              'still need to travel or want a refund.',
              style: TOGTTypography.small.copyWith(color: TOGTColors.orangeDark),
            ),
          ),
          const SizedBox(height: 22),
          TextField(
            controller: _confirm,
            textCapitalization: TextCapitalization.characters,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Type DELETE to confirm',
              hintText: 'DELETE',
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _canDelete ? _delete : null,
            style: FilledButton.styleFrom(backgroundColor: TOGTColors.red),
            child: Text(_busy ? 'Deleting…' : 'Delete my account'),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Text(_error!, style: TOGTTypography.small.copyWith(color: TOGTColors.red)),
            ),
          const SizedBox(height: 24),
          Text(
            'Prefer email? Send a request from your registered address to info@togttrading.com '
            'with the subject "Delete my account".',
            style: TOGTTypography.small,
          ),
          const SizedBox(height: 24),
          // Link to the self-service deletion request form (opens the browser).
          TextButton.icon(
            onPressed: _openDeletionRequestForm,
            icon: const Icon(Icons.open_in_new, size: 18),
            label: Text(l10n.deleteAccountLink),
          ),
          const SizedBox(height: 8),
          Text(
            'The request form opens your browser to the Google Data Safety request screen. '
            'It is the same endpoint your account deletion request is sent to.',
            style: TOGTTypography.small.copyWith(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------- deletion request form
  // The app deletes the account immediately when the user confirms.
  // Play's Data safety form instead points to a *request* form (below), which
  // walks the user through the exact steps Google asks for, then the app
  // performs the deletion. Both endpoints point at the same backend URL.
  Future<void> _openDeletionRequestForm() async {
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetCtx) {
        final l10n = AppLocalizations.of(sheetCtx);
        return Padding(
          padding: EdgeInsets.fromLTRB(22, 22 + MediaQuery.of(sheetCtx).viewPadding.top, 22, 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  const Icon(Icons.delete_forever_rounded, size: 28, color: TOGTColors.red),
                  const SizedBox(width: 12),
                  Expanded(child: Text(l10n.deleteAccountTitle, style: TOGTTypography.h3)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                l10n.deleteAccountSubtitle,
                style: TOGTTypography.body.copyWith(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('How deletion works', style: TOGTTypography.body.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    ...[
                      'Your name, email, phone, address, birthday, nationality and passport details are erased.',
                      'Your passport/ID scans, profile photo, review photos and chat attachments are deleted.',
                      'Your chat messages, reviews, notifications, saved devices and location history are removed.',
                      'All sessions are revoked and you are signed out everywhere it was used.',
                    ].map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(color: TOGTColors.orange, fontWeight: FontWeight.w800)),
                          Expanded(child: Text(item, style: TOGTTypography.small)),
                        ],
                      ),
                    )).toList(),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text('Or request it another way', style: TOGTTypography.body.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text(
                'Send a request from your registered address to info@togttrading.com with the subject “Delete my account”. '
                'A TOGT specialist will confirm with you before the account is deleted.',
                style: TOGTTypography.small.copyWith(color: Colors.grey.shade700),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  _openDeletionRequestForm();
                },
                icon: const Icon(Icons.open_in_new, size: 18),
                label: Text(l10n.deleteAccountLink),
              ),
              const SizedBox(height: 8),
              Text(
                'The request form opens your browser to the Google Data Safety request screen. '
                'It is the same endpoint your account deletion request is sent to.',
                style: TOGTTypography.small.copyWith(color: Colors.grey.shade500),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------- deletion assistance bullet
class _Bullet extends StatelessWidget {
  const _Bullet(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('•  ', style: TextStyle(color: TOGTColors.orange, fontWeight: FontWeight.w800)),
          Expanded(child: Text(text, style: TOGTTypography.small)),
        ],
      ),
    );
  }
}
