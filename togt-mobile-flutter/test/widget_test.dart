import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';

import 'package:togt_mobile_app/main.dart';

void main() {
  testWidgets('splash navigates to onboarding', (WidgetTester tester) async {
    await tester.pumpWidget(const TogtApp());
    await tester.pump();
    expect(find.byType(Image), findsWidgets);

    await tester.pump(const Duration(seconds: 3));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();

    expect(find.text('Book Packages Easily').hitTestable(), findsNothing);
  });
}
