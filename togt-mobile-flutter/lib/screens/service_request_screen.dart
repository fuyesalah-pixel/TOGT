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
  const ServiceRequestScreen({super.key, required this.serviceType, required this.title});
  final String serviceType;
  final String title;

  @override
  State<ServiceRequestScreen> createState() => _ServiceRequestScreenState();
}

class _ServiceRequestScreenState extends State<ServiceRequestScreen> {
  final Map<String, TextEditingController> _fields = {};
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
  }

  TextEditingController _field(String name) => _fields.putIfAbsent(name, TextEditingController.new);
  List<String> get _fieldNames => switch (widget.serviceType) {
    'FLIGHT' => ['Trip type', 'From', 'To', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Full name', 'Email', 'Phone'],
    'UMRAH' => ['Package type', 'Travel date', 'Return date', 'Number of pilgrims', 'Hotel preference', 'Room type', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'VISA' => ['Nationality', 'Destination country', 'Visa type', 'Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Full name', 'Email', 'Phone', 'Address', 'Passport number', 'Passport issue date', 'Passport expiry date'],
    'DOMESTIC' => ['Tour type', 'Destination', 'Start date', 'End date', 'Number of people', 'Accommodation type', 'Full name', 'Email', 'Phone'],
    'FOREIGN' => ['Need ticket?', 'Airline', 'Travel date', 'Cabin class', 'Tour duration', 'Arrival date', 'Departure date', 'Number of people', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date', 'Nationality'],
    'CONTACT' => ['Full name', 'Email', 'Phone', 'Message'],
    'CONSULTING' => ['Full name', 'Email', 'Phone', 'Message'],
    _ => ['Destination country', 'Departure date', 'Return date', 'Adults', 'Children', 'Infants', 'Cabin class', 'Airline preference', 'Full name', 'Email', 'Phone', 'Passport number', 'Passport issue date', 'Passport expiry date'],
  };

  @override
  void dispose() { for (final field in _fields.values) field.dispose(); super.dispose(); }

  Future<void> _date(String label) async {
    final date = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 3650)), initialDate: DateTime.now());
    if (date != null) _field(label).text = date.toIso8601String().split('T').first;
    if (mounted) setState(() {});
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    final required = ['Full name', 'Email', if (widget.serviceType != 'DOMESTIC') 'Phone', if (widget.serviceType == 'CONTACT' || widget.serviceType == 'CONSULTING') 'Message'];
    if (required.any((name) => _field(name).text.trim().isEmpty)) {
      setState(() => _message = l10n.required);
      return;
    }
    if (_field('Email').text.isNotEmpty && !_field('Email').text.contains('@')) { setState(() => _message = l10n.profileSaveFailed('valid email required')); return; }
    setState(() { _busy = true; _message = null; });
    try {
      await RequestService.instance.createRequest(type: widget.serviceType, payload: {
        'details': _fields.entries.map((entry) => '${entry.key}: ${entry.value.text.trim()}').join('\n'),
      });
       for (final field in _fields.values) field.clear();
       if (!mounted) return;
       await SuccessDialog.show(
         context: context,
         onGoHome: () {
           for (final field in _fields.values) field.clear();
         },
       );
    } catch (e) {
      setState(() => _message = l10n.submissionFailed(e.toString()));
    } finally {
      if (mounted) setState(() => _busy = false);
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
          ..._fieldNames.map((label) => _isDate(label) ? _dateField(label) : _inputField(label)),
          const SizedBox(height: 26),
           AnimatedButton(label: _busy ? l10n.sending : l10n.sendRequest, icon: Icons.send_rounded, onPressed: _busy ? null : _submit),
          if (_message != null) Padding(padding: const EdgeInsets.only(top: 18), child: Text(_message!, style: TOGTTypography.body.copyWith(color: _message!.startsWith('Request') ? TOGTColors.green : TOGTColors.red))),
           if (_message?.startsWith('Request') == true) Row(children: [Expanded(child: OutlinedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.paymentReferencePending))), child: Text(l10n.payNow))), const SizedBox(width: 12), Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.payLater)))]),
        ]),
      );
  }

  bool _isDate(String label) => label.toLowerCase().contains('date');

  /// Fields whose options the user picks from — exactly like the web smart
  /// form's datalists (free text allowed, suggestions while typing).
  List<String>? _optionsFor(String label) {
    switch (label) {
      case 'From':
      case 'To':
      case 'Destination':
        return [...EthiopianCities, ...UmrahCities, ...InternationalCities];
      case 'Nationality':
      case 'Destination country':
        return Countries;
      case 'Airline':
      case 'Airline preference':
        return Airlines;
      case 'Cabin class':
        return const ['Economy', 'Premium Economy', 'Business', 'First'];
      case 'Package type':
        return const ['Economy', 'VIP', 'Honeymoon', 'Custom'];
      case 'Visa type':
        return const ['Visit', 'Educational', 'Merchant', 'Medical', 'Family'];
      case 'Tour type':
        return const ['School', 'Honeymoon', 'Friends', 'Corporate', 'Custom'];
      case 'Hotel preference':
        return const ['3-star', '4-star', '5-star'];
      case 'Room type':
        return const ['Shared', 'Private'];
      case 'Accommodation type':
        return const ['Hotel', 'Apartment', 'Resort', 'Camping'];
      case 'Trip type':
        return const ['One way', 'Round trip', 'Multi-city'];
      default:
        return null;
    }
  }

  Widget _inputField(String label) {
    final key = label.toLowerCase();
    final numeric = ['Adults', 'Children', 'Infants', 'Passengers', 'Number of pilgrims', 'Number of people'].contains(label);
    final maxLength = numeric ? 1 : key.contains('name') ? 50 : key == 'email' ? 100 : key == 'phone' ? 13 : key.contains('passport') ? 20 : key.contains('address') ? 200 : key.contains('message') || key.contains('notes') ? 500 : 100;
    final options = _optionsFor(label);
    if (options != null) return _SuggestionField(label: label, controller: _field(label), options: options);
    return TextField(controller: _field(label), maxLength: maxLength, keyboardType: numeric || label == 'Phone' ? TextInputType.number : label == 'Email' ? TextInputType.emailAddress : TextInputType.text, inputFormatters: [LengthLimitingTextInputFormatter(maxLength), if (numeric || label == 'Phone') FilteringTextInputFormatter.digitsOnly], decoration: InputDecoration(labelText: label, hintText: label == 'Airline preference' ? 'Ethiopian Airlines' : null)).paddingBottom();
  }

  Widget _dateField(String label) => TextField(controller: _field(label), readOnly: true, onTap: () => _date(label), decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_month_rounded))).paddingBottom();
}

/// Live autocomplete text field: type the first few letters and matching
/// suggestions appear inline (prefix matches first, then substring matches).
/// Free text is always allowed, mirroring the web form's datalist inputs.
class _SuggestionField extends StatefulWidget {
  const _SuggestionField({required this.label, required this.controller, required this.options});
  final String label;
  final TextEditingController controller;
  final List<String> options;

  @override
  State<_SuggestionField> createState() => _SuggestionFieldState();
}

class _SuggestionFieldState extends State<_SuggestionField> {
  String _query = '';
  FocusNode? _focus;

  static const _maxSuggestions = 5;

  List<String> get _matches {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return const [];
    final starts = <String>[];
    final contains = <String>[];
    for (final option in widget.options) {
      final lower = option.toLowerCase();
      if (lower.startsWith(q)) {
        starts.add(option);
      } else if (lower.contains(q)) {
        contains.add(option);
      }
      if (starts.length >= _maxSuggestions) break;
    }
    return [...starts, ...contains].take(_maxSuggestions).toList();
  }

  void _onChanged(String value) {
    setState(() => _query = value);
  }

  @override
  Widget build(BuildContext context) {
    final matches = _matches;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: widget.controller,
          onChanged: _onChanged,
          decoration: InputDecoration(labelText: widget.label, suffixIcon: const Icon(Icons.search_rounded, size: 20)),
        ),
        if (matches.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 6, bottom: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: TOGTColors.navy.withOpacity(.08)),
              boxShadow: [BoxShadow(color: TOGTColors.navy.withOpacity(.08), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: matches.map((option) => InkWell(
                onTap: () {
                  widget.controller.text = option;
                  setState(() => _query = option);
                  FocusScope.of(context).unfocus();
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(border: Border(bottom: BorderSide(color: TOGTColors.navy.withOpacity(.05)))),
                  child: Row(children: [
                    const Icon(Icons.location_on_outlined, size: 15, color: TOGTColors.orange),
                    const SizedBox(width: 8),
                    Expanded(child: Text(option, style: TOGTTypography.small.copyWith(color: const Color(0xFF12394F)))),
                  ]),
                ),
              )).toList(),
            ),
          )
        else
          const SizedBox(height: 14),
      ],
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
