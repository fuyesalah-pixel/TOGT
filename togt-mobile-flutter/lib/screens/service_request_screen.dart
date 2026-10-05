import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/request_service.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../widgets/animated_button.dart';
import '../widgets/success_dialog.dart';

class ServiceRequestScreen extends StatefulWidget {
  const ServiceRequestScreen({super.key, required this.serviceType, required this.title, this.extraFields = const [], this.fieldDefaults = const {}});
  final String serviceType;
  final String title;

  /// Extra labels appended to the base field set (e.g. gift fields for the
  /// Umrah Gift form) — grouped into the trip-details section.
  final List<String> extraFields;

  /// Pre-selected values for any of the fields above.
  final Map<String, String> fieldDefaults;

  @override
  State<ServiceRequestScreen> createState() => _ServiceRequestScreenState();
}

class _ServiceRequestScreenState extends State<ServiceRequestScreen> {
  final Map<String, TextEditingController> _fields = {};
  Set<String> _errors = {};
  bool _busy = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    final user = AuthService.instance.currentUser;
    if (user != null) {
      _field('Full name').text = user.name;
      _field('Email').text = user.email;
      if (user.phone != null) _field('Phone').text = user.phone!;
      if (user.passportNumber != null) _field('Passport number').text = user.passportNumber!;
      if (user.nationality != null) _field('Nationality').text = user.nationality!;
    }
    // Sensible defaults so the most common choice is one tap away.
    if (_fieldNames.contains('Trip type')) {
      _field('Trip type').text = 'Round trip';
    }
    if (_fieldNames.contains('Cabin class')) {
      _field('Cabin class').text = 'Economy';
    }
    if (_fieldNames.contains('Need ticket?')) {
      _field('Need ticket?').text = 'Yes';
    }
    if (_fieldNames.contains('Adults')) {
      _field('Adults').text = '1';
    }
    for (final entry in widget.fieldDefaults.entries) {
      if (_fieldNames.contains(entry.key)) _field(entry.key).text = entry.value;
    }
  }

  TextEditingController _field(String name) => _fields.putIfAbsent(name, TextEditingController.new);

  List<String> get _fieldNames => [...switch (widget.serviceType) {
    'FLIGHT' => ['Trip type', 'From', 'To', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Full name', 'Email', 'Phone'],
    'UMRAH' => ['Package type', 'Travel date', 'Return date', 'Number of pilgrims', 'Hotel preference', 'Room type', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'VISA' => ['Nationality', 'Destination country', 'Visa type', 'Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Full name', 'Email', 'Phone', 'Address', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'DOMESTIC' => ['Tour type', 'Destination', 'Start date', 'End date', 'Number of people', 'Accommodation type', 'Full name', 'Email', 'Phone'],
    'FOREIGN' => ['Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Tour duration', 'Arrival date', 'Departure date', 'Number of people', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Nationality'],
    'CONTACT' => ['Full name', 'Email', 'Phone', 'Message'],
    'CONSULTING' => ['Full name', 'Email', 'Phone', 'Message'],
    _ => ['Destination country', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
  }, ...widget.extraFields];

  @override
  void dispose() { for (final field in _fields.values) field.dispose(); super.dispose(); }

  // ── Sections ──────────────────────────────────────────────────────────────
  // Fields are grouped into titled sections so long forms scan like the
  // professional booking flows users already know.
  List<(String, List<String>)> get _sections {
    final names = _fieldNames;
    final trip = names.where((n) => ['Trip type', 'From', 'To', 'Destination', 'Destination country', 'Departure date', 'Return date', 'Travel date', 'Arrival date', 'Start date', 'End date', 'Adults', 'Children', 'Infants', 'Number of pilgrims', 'Number of people', 'Tour duration', 'Cabin class', 'Airline', 'Airline preference', 'Package type', 'Hotel preference', 'Room type', 'Accommodation type', 'Tour type', 'Visa type', 'Need ticket?', 'Gift type', 'Recipient name', 'Recipient phone', 'Recipient email'].contains(n)).toList();
    final passport = names.where((n) => ['Nationality', 'Passport number', 'Passport issue date', 'Passport expiry date'].contains(n)).toList();
    final contact = names.where((n) => ['Full name', 'Email', 'Phone', 'Address'].contains(n)).toList();
    final message = names.where((n) => ['Message'].contains(n)).toList();
    final l10n = AppLocalizations.of(context);
    return [
      if (trip.isNotEmpty) (l10n.tripDetails, trip),
      if (passport.isNotEmpty) (l10n.passportSection, passport),
      if (contact.isNotEmpty) (l10n.contactSection, contact),
      if (message.isNotEmpty) (l10n.messageSection, message),
    ];
  }

  // ── Validation ────────────────────────────────────────────────────────────
  bool _isRequired(String label) {
    if (['Full name', 'Email'].contains(label)) return true;
    if (label == 'Phone' && widget.serviceType != 'DOMESTIC') return true;
    if (label == 'Message' && (widget.serviceType == 'CONTACT' || widget.serviceType == 'CONSULTING')) return true;
    return false;
  }

  String? _validate(String label, String value) {
    final l10n = AppLocalizations.of(context);
    final text = value.trim();
    if (_isRequired(label) && text.isEmpty) return l10n.fieldRequired(label);
    final key = label.toLowerCase();
    if (key == 'email' && text.isNotEmpty && !RegExp(r'^[\w.+-]+@[\w-]+\.[\w.-]+$').hasMatch(text)) return l10n.invalidEmail;
    if (key == 'phone' && text.isNotEmpty && (text.length < 9 || text.length > 15)) return l10n.invalidPhone;
    return null;
  }

  String? _crossValidate() {
    final l10n = AppLocalizations.of(context);
    // Return/End must not precede Departure/Start/Travel.
    final pairs = [['Departure date', 'Return date'], ['Travel date', 'Return date'], ['Start date', 'End date']];
    for (final pair in pairs) {
      final start = _fields[pair[0]]?.text.trim();
      final end = _fields[pair[1]]?.text.trim();
      if (start != null && end != null && start.isNotEmpty && end.isNotEmpty) {
        final startDate = DateTime.tryParse(start);
        final endDate = DateTime.tryParse(end);
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) return l10n.returnAfterDeparture;
      }
    }
    return null;
  }

  bool _validateAll() {
    final errors = <String>{ for (final entry in _fields.entries) if (_validate(entry.key, entry.value.text) != null) entry.key };
    if (_crossValidate() != null) {
      for (final label in ['Return date', 'End date']) {
        if (_fields[label]?.text.isNotEmpty == true) errors.add(label);
      }
    }
    setState(() => _errors = errors);
    return errors.isEmpty;
  }

  void _revalidate(String label) {
    if (!_errors.contains(label)) return;
    setState(() {
      if (_validate(label, _field(label).text) == null) {
        _errors = {..._errors}..remove(label);
      }
    });
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    if (!_validateAll()) {
      setState(() => _message = l10n.fixErrorsBelow);
      return;
    }
    setState(() { _busy = true; _message = null; });
    try {
      await RequestService.instance.createRequest(type: widget.serviceType, payload: {
        'details': _fields.entries.where((entry) => entry.value.text.trim().isNotEmpty).map((entry) => '${entry.key}: ${entry.value.text.trim()}').join('\n'),
      });
       if (!mounted) return;
       await SuccessDialog.show(
         context: context,
         onGoHome: () {
           for (final field in _fields.values) field.clear();
           setState(() => _errors = {});
         },
       );
    } catch (e) {
      setState(() => _message = l10n.submissionFailed(e.toString()));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Builders ──────────────────────────────────────────────────────────────
  Future<void> _date(String label) async {
    final initial = DateTime.tryParse(_field(label).text.trim()) ?? DateTime.now();
    final date = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 3650)), initialDate: initial);
    if (date != null) {
      _field(label).text = date.toIso8601String().split('T').first;
      _revalidate(label);
      setState(() {});
    }
  }

  Widget _sectionHeader(String title, IconData icon) => Padding(
    padding: const EdgeInsets.only(top: 8, bottom: 14),
    child: Row(children: [
      Container(padding: const EdgeInsets.all(7), decoration: BoxDecoration(color: TOGTColors.blue.withOpacity(.08), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 17, color: TOGTColors.blue)),
      const SizedBox(width: 10),
      Text(title, style: TOGTTypography.h3.copyWith(color: const Color(0xFF12394F))),
    ]),
  );

  Widget _fieldError(String label) {
    if (!_errors.contains(label)) return const SizedBox.shrink();
    final message = _validate(label, _field(label).text) ?? AppLocalizations.of(context).returnAfterDeparture;
    return Padding(
      padding: const EdgeInsets.only(top: 6, bottom: 4, left: 4),
      child: Row(children: [
        const Icon(Icons.error_outline_rounded, size: 14, color: TOGTColors.red),
        const SizedBox(width: 5),
        Expanded(child: Text(message, style: TOGTTypography.small.copyWith(color: TOGTColors.red, fontSize: 11.5))),
      ]),
    );
  }

  OutlineInputBorder _border(String label) {
    final invalid = _errors.contains(label);
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: invalid ? TOGTColors.red : TOGTColors.navy.withOpacity(.14), width: invalid ? 1.4 : 1),
    );
  }

  InputDecoration _decoration(String label, {Widget? suffix, String? hint}) => InputDecoration(
    labelText: label,
    hintText: hint,
    labelStyle: TextStyle(color: _errors.contains(label) ? TOGTColors.red : TOGTColors.grey),
    border: _border(label),
    enabledBorder: _border(label),
    focusedBorder: _border(label),
    suffixIcon: suffix,
  );

  bool _isCounter(String label) => ['Adults', 'Children', 'Infants', 'Number of pilgrims', 'Number of people'].contains(label);
  bool _isDate(String label) => label.toLowerCase().contains('date');

  /// Fixed-option fields are rendered as choice chips (option buttons).
  List<String>? _fixedOptions(String label) => switch (label) {
    'Trip type' => const ['One way', 'Round trip', 'Multi-city'],
    'Cabin class' => const ['Economy', 'Premium Economy', 'Business', 'First'],
    'Package type' => const ['Economy', 'VIP', 'Honeymoon', 'Custom'],
    'Visa type' => const ['Visit', 'Educational', 'Merchant', 'Medical', 'Family'],
    'Tour type' => const ['School', 'Honeymoon', 'Friends', 'Corporate', 'Custom'],
    'Hotel preference' => const ['3-star', '4-star', '5-star'],
    'Room type' => const ['Shared', 'Private'],
    'Accommodation type' => const ['Hotel', 'Apartment', 'Resort', 'Camping'],
    'Need ticket?' => const ['Yes', 'No'],
    'Gift type' => const ['Full gift (100% paid by sender)', 'Half gift (50% paid by sender)'],
    _ => null,
  };

  /// Long-list fields open a searchable picker sheet — cities, countries,
  /// airports, airlines.
  List<String>? _listOptions(String label) => switch (label) {
    'From' || 'To' => Airports,
    'Destination' => [...EthiopianCities, ...UmrahCities, ...InternationalCities],
    'Nationality' || 'Destination country' => Countries,
    'Airline' || 'Airline preference' => Airlines,
    _ => null,
  };

  Widget _buildField(String label) {
    if (_isDate(label)) return _dateField(label);
    if (_isCounter(label)) return _counterField(label);
    final fixed = _fixedOptions(label);
    if (fixed != null) return _choiceField(label, fixed);
    final list = _listOptions(label);
    if (list != null) return _pickerField(label, list);
    return _textField(label);
  }

  Widget _dateField(String label) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    TextField(
      controller: _field(label),
      readOnly: true,
      onTap: () => _date(label),
      decoration: _decoration(label, suffix: const Icon(Icons.calendar_month_rounded, color: TOGTColors.blue)),
    ),
    _fieldError(label),
  ]).paddingBottom();

  Widget _textField(String label) {
    final key = label.toLowerCase();
    final maxLength = key.contains('name') ? 50 : key == 'email' ? 100 : key == 'phone' ? 13 : key.contains('passport') ? 20 : key.contains('address') ? 200 : key.contains('message') || key.contains('notes') ? 500 : 100;
    final isMessage = key.contains('message');
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      TextField(
        controller: _field(label),
        maxLength: maxLength,
        maxLines: isMessage ? 4 : 1,
        keyboardType: label == 'Phone' ? TextInputType.phone : key == 'email' ? TextInputType.emailAddress : TextInputType.text,
        inputFormatters: [LengthLimitingTextInputFormatter(maxLength), if (label == 'Phone') FilteringTextInputFormatter.digitsOnly],
        onChanged: (_) => _revalidate(label),
        decoration: _decoration(label),
      ),
      _fieldError(label),
    ]).paddingBottom();
  }

  Widget _counterField(String label) {
    final value = int.tryParse(_field(label).text.trim()) ?? 0;
    final min = label == 'Adults' || label == 'Number of pilgrims' || label == 'Number of people' ? 1 : 0;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: _errors.contains(label) ? TOGTColors.red : TOGTColors.navy.withOpacity(.14)),
          borderRadius: BorderRadius.circular(14),
          color: TOGTColors.white,
        ),
        child: Row(children: [
          Expanded(child: Text(label, style: TOGTTypography.body.copyWith(color: const Color(0xFF12394F)))),
          _CounterButton(icon: Icons.remove_rounded, onTap: value <= min ? null : () {
            _field(label).text = '${value - 1}';
            setState(() {});
          }),
          Container(width: 44, alignment: Alignment.center, child: Text('$value', style: TOGTTypography.h3)),
          _CounterButton(icon: Icons.add_rounded, onTap: value >= 9 ? null : () {
            _field(label).text = '${value + 1}';
            setState(() {});
          }),
        ]),
      ),
      _fieldError(label),
    ]).paddingBottom();
  }

  Widget _choiceField(String label, List<String> options) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.only(bottom: 8, left: 4), child: Text(label, style: TOGTTypography.small.copyWith(fontWeight: FontWeight.w700, color: _errors.contains(label) ? TOGTColors.red : const Color(0xFF445066)))),
    Wrap(spacing: 8, runSpacing: 8, children: options.map((option) {
      final selected = _field(label).text.trim() == option;
      return ChoiceChip(
        label: Text(option),
        selected: selected,
        onSelected: (_) { _field(label).text = option; setState(() { _errors.remove(label); }); },
        selectedColor: TOGTColors.blue.withOpacity(.14),
        backgroundColor: TOGTColors.white,
        labelStyle: TOGTTypography.small.copyWith(fontWeight: FontWeight.w700, color: selected ? TOGTColors.blue : const Color(0xFF445066)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: selected ? TOGTColors.blue : TOGTColors.navy.withOpacity(.14))),
        showCheckmark: false,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      );
    }).toList(),
    ),
    _fieldError(label),
  ]).paddingBottom();

  Widget _pickerField(String label, List<String> options) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    TextField(
      controller: _field(label),
      readOnly: true,
      onTap: () => _openPicker(label, options),
      onChanged: (_) => _revalidate(label),
      decoration: _decoration(label, suffix: const Icon(Icons.expand_more_rounded, color: TOGTColors.grey), hint: label == 'Airline preference' ? 'Ethiopian Airlines' : label == 'From' ? 'ADD — Addis Ababa Bole Intl' : null),
    ),
    _fieldError(label),
  ]).paddingBottom();

  Future<void> _openPicker(String label, List<String> options) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => _SearchPickerSheet(title: label, options: options),
    );
    if (selected != null && mounted) {
      _field(label).text = selected;
      setState(() => _errors.remove(label));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
        appBar: AppBar(title: Text(widget.title)),
        body: ListView(padding: const EdgeInsets.all(22), children: [
          Text('${widget.title} request', style: TOGTTypography.h1),
          const SizedBox(height: 8),
           Text(l10n.requestFollowup, style: TOGTTypography.body),
          const SizedBox(height: 26),
          ..._sections.expand((section) => [
            _sectionHeader(section.$1, section.$1 == l10n.contactSection ? Icons.person_outline_rounded : section.$1 == l10n.passportSection ? Icons.badge_outlined : section.$1 == l10n.messageSection ? Icons.chat_bubble_outline_rounded : Icons.flight_takeoff_rounded),
            ...section.$2.map(_buildField),
            const SizedBox(height: 8),
          ]),
          const SizedBox(height: 18),
           AnimatedButton(label: _busy ? l10n.sending : l10n.sendRequest, icon: Icons.send_rounded, onPressed: _busy ? null : _submit),
          if (_message != null) Padding(
            padding: const EdgeInsets.only(top: 18),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: TOGTColors.red.withOpacity(.08), borderRadius: BorderRadius.circular(14)),
              child: Row(children: [
                const Icon(Icons.error_outline_rounded, color: TOGTColors.red, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Text(_message!, style: TOGTTypography.body.copyWith(color: TOGTColors.red))),
              ]),
            ),
          ),
          // No payment row here: requests without a staff-set price are paid
          // later from the request detail screen — contact-us never involves
          // payment at all.
        ]),
      );
  }
}

class _CounterButton extends StatelessWidget {
  const _CounterButton({required this.icon, this.onTap});
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10),
    child: Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(color: onTap == null ? TOGTColors.grey.withOpacity(.12) : TOGTColors.blue.withOpacity(.1), borderRadius: BorderRadius.circular(10)),
      child: Icon(icon, size: 18, color: onTap == null ? TOGTColors.grey : TOGTColors.blue),
    ),
  );
}

/// Searchable option sheet for long lists (cities, countries, airports,
/// airlines) — type-to-filter with matches highlighted, free of clutter.
class _SearchPickerSheet extends StatefulWidget {
  const _SearchPickerSheet({required this.title, required this.options});
  final String title;
  final List<String> options;

  @override
  State<_SearchPickerSheet> createState() => _SearchPickerSheetState();
}

class _SearchPickerSheetState extends State<_SearchPickerSheet> {
  String _query = '';

  List<String> get _matches {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return widget.options;
    final starts = <String>[];
    final contains = <String>[];
    for (final option in widget.options) {
      final lower = option.toLowerCase();
      if (lower.startsWith(q)) {
        starts.add(option);
      } else if (lower.contains(q)) {
        contains.add(option);
      }
    }
    return [...starts, ...contains];
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * .75),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
            child: Row(children: [
              Expanded(child: Text(widget.title, style: TOGTTypography.h3.copyWith(color: const Color(0xFF12394F)))),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded)),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: TextField(
              autofocus: true,
              onChanged: (value) => setState(() => _query = value),
              decoration: InputDecoration(
                hintText: l10n.searchList,
                prefixIcon: const Icon(Icons.search_rounded, color: TOGTColors.orange),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: TOGTColors.navy.withOpacity(.14))),
              ),
            ),
          ),
          Expanded(
            child: _matches.isEmpty
                ? Center(child: Text(l10n.noMatches, style: TOGTTypography.body.copyWith(color: TOGTColors.grey)))
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: _matches.length,
                    itemBuilder: (context, index) {
                      final option = _matches[index];
                      final isAirport = option.contains('—');
                      return InkWell(
                        onTap: () => Navigator.pop(context, option),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                          child: Row(children: [
                            Icon(isAirport ? Icons.flight_land_rounded : Icons.location_on_outlined, size: 17, color: TOGTColors.orange),
                            const SizedBox(width: 10),
                            Expanded(child: Text(option, style: TOGTTypography.body.copyWith(color: const Color(0xFF12394F)))),
                            const Icon(Icons.chevron_right_rounded, size: 18, color: TOGTColors.grey),
                          ]),
                        ),
                      );
                    },
                  ),
          ),
        ]),
      ),
    );
  }
}

extension on Widget { Widget paddingBottom() => Padding(padding: const EdgeInsets.only(bottom: 16), child: this); }

/// Ethiopian cities — domestic tours, flight origin, and default pool.
const EthiopianCities = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Bahir Dar', 'Gondar', 'Hawassa',
  'Jimma', 'Dessie', 'Jijiga', 'Shashamane', 'Bishoftu', 'Arba Minch',
  'Hosaena', 'Harar', 'Adama', 'Sodo', 'Nekemte', 'Assosa', 'Gambela',
  'Semera', 'Axum', 'Adigrat', 'Debre Markos', 'Debre Birhan', 'Woliso',
  'Weldiya', 'Robe', 'Butajira', 'Kombolcha', 'Ziway', 'Negele Borana',
  'Metu', 'Dilla', 'Shire', 'Inda Selassie', 'Wukro', 'Bule Hora', 'Moyale',
];

/// Cities most relevant to Umrah packages.
const UmrahCities = [
  'Makkah', 'Medina', 'Jeddah', 'Riyadh', 'Dammam', 'Ta\u2019if', 'Tabuk',
  'Yanbu', 'Buraidah', 'Abha', 'Khamis Mushait', 'Jizan',
];

/// Frequent international destinations.
const InternationalCities = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Istanbul', 'Antalya', 'Ankara',
  'Cairo', 'Alexandria', 'Nairobi', 'Kampala', 'Dar es Salaam', 'Kigali',
  'Mogadishu', 'Djibouti City', 'Khartoum', 'London', 'Frankfurt', 'Rome',
  'Milan', 'Paris', 'Amsterdam', 'Washington DC', 'New York', 'Toronto',
  'Kuala Lumpur', 'Jakarta', 'Bangkok', 'Delhi', 'Mumbai', 'Beijing',
  'Guangzhou', 'Tokyo', 'Sydney', 'Johannesburg', 'Casablanca',
];

/// Airports shown as "CODE — City, Airport name" so travelers can pick the
/// exact terminal pair for flight requests (international-standard autofill).
const Airports = [
  'ADD — Addis Ababa, Bole International',
  'DXB — Dubai, Dubai International',
  'DWC — Dubai, Al Maktoum International',
  'AUH — Abu Dhabi, Zayed International',
  'SHJ — Sharjah International',
  'DOH — Doha, Hamad International',
  'JED — Jeddah, King Abdulaziz International',
  'MED — Medina, Prince Mohammad bin Abdulaziz',
  'RUH — Riyadh, King Khalid International',
  'DMM — Dammam, King Fahd International',
  'IST — Istanbul, Istanbul Airport',
  'SAW — Istanbul, Sabiha Gökçen',
  'AYT — Antalya Airport',
  'CAI — Cairo International',
  'NBO — Nairobi, Jomo Kenyatta International',
  'EBB — Kampala, Entebbe International',
  'DAR — Dar es Salaam, Julius Nyerere International',
  'KGL — Kigali International',
  'MGQ — Mogadishu, Aden Adde International',
  'JIB — Djibouti–Ambouli International',
  'KRT — Khartoum International',
  'ASV — Assosa Airport',
  'LHR — London, Heathrow',
  'FRA — Frankfurt Airport',
  'FCO — Rome, Fiumicino',
  'MXP — Milan, Malpensa',
  'CDG — Paris, Charles de Gaulle',
  'AMS — Amsterdam, Schiphol',
  'IAD — Washington DC, Dulles',
  'JFK — New York, John F. Kennedy',
  'IYY — Addis Ababa (city code)',
  'YYZ — Toronto, Pearson International',
  'KUL — Kuala Lumpur International',
  'CGK — Jakarta, Soekarno–Hatta',
  'BKK — Bangkok, Suvarnabhumi',
  'DEL — Delhi, Indira Gandhi International',
  'BOM — Mumbai, Chhatrapati Shivaji',
  'PEK — Beijing Capital International',
  'CAN — Guangzhou, Baiyun International',
  'HND — Tokyo, Haneda',
  'SYD — Sydney, Kingsford Smith',
  'JNB — Johannesburg, O.R. Tambo',
  'CMN — Casablanca, Mohammed V',
];

/// Countries for nationality/destination-country fields (mirrors the web
/// smart-form schema).
const Countries = [
  'Ethiopia', 'United Arab Emirates', 'Saudi Arabia', 'Turkey', 'India',
  'China', 'Thailand', 'United States', 'United Kingdom', 'Canada',
  'Germany', 'France', 'Italy', 'Qatar', 'Kuwait', 'Egypt', 'Kenya',
  'Djibouti', 'South Africa', 'Morocco', 'Tanzania', 'Rwanda', 'Uganda',
  'Sudan', 'Somalia', 'Eritrea', 'Yemen', 'Oman', 'Bahrain', 'Jordan',
  'Lebanon', 'Iran', 'Iraq', 'Pakistan', 'Bangladesh', 'Sri Lanka',
  'Nepal', 'Maldives', 'Indonesia', 'Malaysia', 'Singapore', 'Philippines',
  'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Mongolia', 'Japan', 'South Korea',
  'Australia', 'New Zealand', 'Brazil', 'Argentina', 'Chile', 'Colombia',
  'Peru', 'Mexico', 'Cuba', 'Jamaica', 'Spain', 'Portugal', 'Netherlands',
  'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland',
  'Austria', 'Greece', 'Poland', 'Czech Republic', 'Hungary', 'Romania',
  'Bulgaria', 'Croatia', 'Serbia', 'Ireland', 'Iceland', 'Russia', 'Ukraine',
  'Belarus', 'Estonia', 'Latvia', 'Lithuania', 'Belize', 'Costa Rica',
  'Guatemala', 'Honduras', 'Nicaragua', 'Panama', 'Dominican Republic',
  'Puerto Rico', 'Venezuela', 'Bolivia', 'Ecuador', 'Paraguay', 'Uruguay',
];

/// Airlines (mirrors the web smart-form AIRLINES list, shortened to the
/// carriers most relevant to our travelers).
const Airlines = [
  'Ethiopian Airlines', 'Emirates', 'Qatar Airways', 'Turkish Airlines',
  'Saudia', 'SalamAir', 'Air Arabia', 'Flydubai', 'EgyptAir', 'Kenya Airways',
  'Lufthansa', 'British Airways', 'KLM', 'Air France', 'United Airlines',
  'Delta Air Lines', 'American Airlines', 'Singapore Airlines', 'Qantas',
  'Air India', 'Pakistan International Airlines', 'Gulf Air', 'Kuwait Airways',
  'Oman Air', 'RwandAir', 'Asky Airlines', 'Jubba Airways', 'SriLankan Airlines',
];
