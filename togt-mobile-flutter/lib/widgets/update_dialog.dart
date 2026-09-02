import 'package:flutter/material.dart';

import '../services/update_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

enum _UpdateStage { prompt, downloading, error }

Future<void> showUpdateDialog(BuildContext context, AppUpdateInfo update) {
  return showDialog(
    context: context,
    barrierDismissible: !update.forceUpdate,
    builder: (_) => _UpdateDialog(update: update),
  );
}

class _UpdateDialog extends StatefulWidget {
  const _UpdateDialog({required this.update});

  final AppUpdateInfo update;

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  _UpdateStage _stage = _UpdateStage.prompt;
  int _received = 0;
  int? _total;
  String? _error;

  double get _progress =>
      _total != null && _total! > 0 ? (_received / _total!).clamp(0.0, 1.0) : 0;

  Future<void> _startUpdate() async {
    setState(() => _stage = _UpdateStage.downloading);
    try {
      final path = await UpdateService.instance.downloadApk(
        widget.update,
        onProgress: (received, total) {
          if (mounted) setState(() { _received = received; _total = total; });
        },
      );
      await UpdateService.instance.markInstallLaunched();
      final opened = await UpdateService.instance.installApk(path);
      if (!mounted) return;
      if (opened) {
        Navigator.of(context).pop();
      } else {
        setState(() {
          _stage = _UpdateStage.error;
          _error = 'Could not open the installer. Allow installs from this app in Settings and try again.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _stage = _UpdateStage.error;
          _error = 'Download failed. Check your connection and try again.';
        });
      }
    }
  }

  String get _progressText {
    final mb = _received / (1024 * 1024);
    if (_total == null) return '${mb.toStringAsFixed(1)} MB';
    final totalMb = _total! / (1024 * 1024);
    return '${mb.toStringAsFixed(1)} / ${totalMb.toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final downloading = _stage == _UpdateStage.downloading;
    return PopScope(
      canPop: !widget.update.forceUpdate && !downloading,
      child: Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
          decoration: BoxDecoration(
            color: TOGTColors.white,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 74,
                height: 74,
                decoration: const BoxDecoration(
                  gradient: TOGTColors.orangeGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.system_update_alt_rounded,
                    color: TOGTColors.white, size: 34),
              ),
              const SizedBox(height: 18),
              Text('New Features Added!',
                  textAlign: TextAlign.center,
                  style: TOGTTypography.h2.copyWith(fontSize: 21)),
              const SizedBox(height: 8),
              Text(
                _stage == _UpdateStage.error
                    ? (_error ?? 'Update failed.')
                    : 'Please update the app to enjoy new features and improvements.',
                textAlign: TextAlign.center,
                style: TOGTTypography.body
                    .copyWith(color: TOGTColors.grey, height: 1.45),
              ),
              if (widget.update.versionName.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text('Version ${widget.update.versionName}',
                    style: TOGTTypography.small.copyWith(
                        color: TOGTColors.orange, fontWeight: FontWeight.w700)),
              ],
              const SizedBox(height: 22),
              if (downloading) ...[
                LinearProgressIndicator(
                  value: _total == null ? null : _progress,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(8),
                  color: TOGTColors.orange,
                  backgroundColor: TOGTColors.lightGrey,
                ),
                const SizedBox(height: 10),
                Text(
                    _total == null
                        ? 'Downloading… $_progressText'
                        : 'Downloading… ${(_progress * 100).round()}% · $_progressText',
                    style: TOGTTypography.small),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: TOGTColors.orangeGradient,
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                            color: TOGTColors.orange.withOpacity(.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6)),
                      ],
                    ),
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: TOGTColors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18)),
                      ),
                      onPressed: _startUpdate,
                      child: Text(
                          _stage == _UpdateStage.error ? 'Try Again' : 'Update Now',
                          style: TOGTTypography.button),
                    ),
                  ),
                ),
                if (!widget.update.forceUpdate) ...[
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text('Later',
                        style: TOGTTypography.button
                            .copyWith(color: TOGTColors.grey)),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}