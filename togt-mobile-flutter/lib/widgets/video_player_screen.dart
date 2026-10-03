import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../theme/colors.dart';
import '../theme/typography.dart';

/// Extracts the video id from any YouTube URL (watch, youtu.be, shorts,
/// embed or live).
String? youTubeId(String url) {
  final match = RegExp(
    r'(?:youtube\.com/(?:watch\?v=|shorts/|embed/|live/)|youtu\.be/)([A-Za-z0-9_-]{6,})',
  ).firstMatch(url.trim());
  return match?.group(1);
}

/// True for direct video file links (mp4/webm/mov/...).
bool isDirectVideoUrl(String url) =>
    RegExp(r'\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)', caseSensitive: false).hasMatch(url.trim());

/// Thumbnail URL for a YouTube link (null for other links).
String? youTubeThumbnail(String url) {
  final id = youTubeId(url);
  return id == null ? null : 'https://i.ytimg.com/vi/$id/hqdefault.jpg';
}

/// Opens a video INSIDE the app: YouTube links play in an embedded player,
/// direct video files play in a native-style HTML5 player. Everything stays
/// within the app — no hand-off to YouTube or a browser.
Future<void> openVideoPlayer(BuildContext context, {required String url, required String title}) async {
  await Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => VideoPlayerScreen(url: url, title: title)),
  );
}

class VideoPlayerScreen extends StatefulWidget {
  const VideoPlayerScreen({super.key, required this.url, required this.title});

  final String url;
  final String title;

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late final WebViewController _controller;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _ready = true);
          },
        ),
      );
    final raw = widget.url.trim();
    final id = youTubeId(raw);
    if (id != null) {
      // YouTube embed: autoplay, no related videos, minimal branding.
      _controller.loadRequest(
        Uri.parse('https://www.youtube-nocookie.com/embed/$id?autoplay=1&rel=0&modestbranding=1&playsinline=1'),
      );
    } else if (isDirectVideoUrl(raw)) {
      // Direct file: full-bleed HTML5 video with native controls.
      final html = '''
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;padding:0;background:#000;height:100%;display:flex;align-items:center;justify-content:center}
video{width:100%;height:100%;object-fit:contain}</style></head>
<body><video src="${const HtmlEscape().convert(raw)}" controls autoplay playsinline></video></body></html>''';
      _controller.loadHtmlString(html);
    } else {
      // Unknown host (e.g. Vimeo): load the page directly — most video
      // providers render a playable embed themselves.
      _controller.loadRequest(Uri.parse(raw));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: TOGTColors.white,
        elevation: 0,
        title: Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TOGTTypography.h3.copyWith(color: TOGTColors.white),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (!_ready)
            const Center(child: CircularProgressIndicator(color: TOGTColors.orange)),
        ],
      ),
    );
  }
}
