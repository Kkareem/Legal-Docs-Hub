import 'package:intl/intl.dart';

String formatDateTime(String? value, {String pattern = 'd MMM yyyy, hh:mm a'}) {
  if (value == null || value.isEmpty) return '—';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return DateFormat(pattern, 'ar').format(date.toLocal());
}

String formatDate(String? value, {String pattern = 'd MMM yyyy'}) {
  if (value == null || value.isEmpty) return '—';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  return DateFormat(pattern, 'ar').format(date.toLocal());
}

String formatCurrency(num? value) {
  final formatter = NumberFormat.currency(
    locale: 'ar_SA',
    symbol: 'SAR ',
    decimalDigits: 0,
  );
  return formatter.format(value ?? 0);
}
