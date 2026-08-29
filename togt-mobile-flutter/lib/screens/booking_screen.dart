import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/package_model.dart';
import '../services/request_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, required this.package});

  final TPackage package;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final Map<String, TextEditingController> _fields = {};
  int _travelers = 1;
  bool _submitting = false;
  String? _result;
  String? _error;

  bool get _isUmrah => widget.package.type.isUmrah;
  bool get _isDomestic => widget.package.type.isDomestic;
  bool get _isForeign => widget.package.type.isForeign;

  TextEditingController _field(String key) => _fields.putIfAbsent(key, TextEditingController.new);

  @override
  void dispose() {
    for (final controller in _fields.values) controller.dispose();
    super.dispose();
  }

  Future<void> _pickDate(String key) async {
    final date = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 3650)), initialDate: DateTime.now());
    if (date != null) _field(key).text = date.toIso8601String().split('T').first;
    if (mounted) setState(() {});
  }

  Future<void> _submit() async {
    if (_submitting) return;
    if (_field('fullName').text.trim().isEmpty || _field('phone').text.trim().isEmpty || _field('email').text.trim().isEmpty) {
      setState(() => _error = 'Please fill in your name and phone number.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await RequestService.instance.createRequest(
        type: _isUmrah ? 'UMRAH' : _isDomestic ? 'DOMESTIC' : _isForeign ? 'FOREIGN_TRAVEL' : 'TOURIST',
        payload: {
          'details': 'Booking: ${widget.package.title}\n${_fields.entries.map((e) => '${e.key}: ${e.value.text.trim()}').join('\n')}\nTravelers: $_travelers',
        },
      );
      setState(() => _result = 'Request sent! Our team will contact you shortly.');
    } catch (e) {
      setState(() => _error = 'Submission failed: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Package')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 10, 22, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: TOGTColors.blueGradient,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.package.title,
                      style: TOGTTypography.h2.copyWith(color: TOGTColors.white)),
                  const SizedBox(height: 6),
                  Text(
                    widget.package.price != null
                        ? '${widget.package.currency ?? 'ETB'} ${widget.package.price!.toStringAsFixed(0)} · ${widget.package.duration ?? 'Flexible'}'
                        : (widget.package.duration ?? 'Ask us for a quote'),
                    style: TextStyle(color: TOGTColors.white.withOpacity(.85), fontSize: 13.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
             _input('Full name', 'fullName'),
             _input('Email', 'email', keyboardType: TextInputType.emailAddress),
             _input('Phone', 'phone', keyboardType: TextInputType.phone, hint: '+251 ...'),
             if (_isForeign || _isDomestic) _input('Destination', 'destination'),
             if (_isForeign || _isDomestic || _isUmrah) _dateInput('Travel date', 'travelDate'),
             if (_isForeign || _isUmrah) _dateInput('Return date', 'returnDate'),
             if (_isForeign) ...[_dropdown('Cabin class', 'cabinClass', ['Economy', 'Premium Economy', 'Business', 'First']), _input('Airline preference', 'airline', hint: 'Ethiopian Airlines')],
             if (_isUmrah) ...[_dropdown('Package type', 'packageType', ['Economy', 'VIP', 'Honeymoon', 'Custom']), _dropdown('Hotel preference', 'hotel', ['3-star', '4-star', '5-star']), _dropdown('Room type', 'room', ['Shared', 'Private'])],
             if (_isForeign || _isUmrah) ...[_input('Passport number', 'passportNumber'), _dateInput('Passport issue date', 'passportIssueDate'), _dateInput('Passport expiry date', 'passportExpiry')],
             if (_isForeign) _input('Nationality', 'nationality'),
             if (_isDomestic) _dropdown('Tour type', 'tourType', ['School', 'Honeymoon', 'Friends', 'Corporate', 'Custom']),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Travelers', style: TOGTTypography.h3),
                Container(
                  decoration: BoxDecoration(
                    color: TOGTColors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(children: [
                    IconButton(
                        onPressed: () =>
                            setState(() => _travelers = (_travelers - 1).clamp(1, 50)),
                        icon: const Icon(Icons.remove_circle_outline_rounded)),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                      child: SizedBox(
                        key: ValueKey(_travelers),
                        width: 30,
                        child: Text('$_travelers',
                            textAlign: TextAlign.center,
                            style: TOGTTypography.h3.copyWith(fontSize: 17)),
                      ),
                    ),
                    IconButton(
                        onPressed: () => setState(() => _travelers = (_travelers + 1).clamp(1, 50)),
                        icon: const Icon(Icons.add_circle_outline_rounded,
                            color: TOGTColors.orange)),
                  ]),
                ),
              ],
            ),
            const SizedBox(height: 16),
             _input('Additional requirements', 'notes', maxLines: 3, hint: 'Special requests...'),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TOGTTypography.body.copyWith(color: TOGTColors.red)),
            ],
            const SizedBox(height: 26),
            AnimatedButton(
              label: 'Confirm Booking',
              onPressed: _result == null ? _submit : null,
            ),
            if (_result != null) ...[
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: TOGTColors.green.withOpacity(.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: TOGTColors.green.withOpacity(.4)),
                ),
                child: Row(children: [
                  const Icon(Icons.celebration_rounded, color: TOGTColors.green),
                  const SizedBox(width: 10),
                  Expanded(child: Text(_result!, style: TOGTTypography.body)),
                ]),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _input(String label, String key, {TextInputType? keyboardType, String? hint, int maxLines = 1}) {
    final isPhone = key == 'phone';
    final maxLength = key == 'fullName' ? 50 : key == 'email' ? 100 : isPhone ? 13 : key.toLowerCase().contains('passport') ? 20 : maxLines > 1 ? 500 : 200;
    return Padding(padding: const EdgeInsets.only(bottom: 16), child: TextField(controller: _field(key), keyboardType: keyboardType, maxLines: maxLines, maxLength: maxLength, inputFormatters: [LengthLimitingTextInputFormatter(maxLength), if (isPhone) FilteringTextInputFormatter.digitsOnly], decoration: InputDecoration(labelText: label, hintText: hint)));
  }

  Widget _dateInput(String label, String key) => Padding(padding: const EdgeInsets.only(bottom: 16), child: TextField(controller: _field(key), readOnly: true, onTap: () => _pickDate(key), decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_month_rounded))));

  Widget _dropdown(String label, String key, List<String> values) => Padding(padding: const EdgeInsets.only(bottom: 16), child: DropdownButtonFormField<String>(decoration: InputDecoration(labelText: label), items: values.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(), onChanged: (v) { if (v != null) _field(key).text = v; }));
}
