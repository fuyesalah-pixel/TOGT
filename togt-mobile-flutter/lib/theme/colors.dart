import 'package:flutter/material.dart';

class TOGTColors {
  static const blue = Color(0xFF1F67B1);
  static const blueDark = Color(0xFF164E85);
  static const orange = Color(0xFFFF9300);
  static const orangeDark = Color(0xFFE07C00);
  static const navy = Color(0xFF12394F);
  static const white = Color(0xFFFFFFFF);
  static const offWhite = Color(0xFFF6F8FB);
  static const grey = Color(0xFF7A8699);
  static const lightGrey = Color(0xFFE4E9F0);
  static const green = Color(0xFF2BB673);
  static const red = Color(0xFFE5484D);

  static const blueGradient = LinearGradient(
    colors: [Color(0xFF1F67B1), Color(0xFF12394F)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const orangeGradient = LinearGradient(
    colors: [Color(0xFFFFB259), Color(0xFFFF9300)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
