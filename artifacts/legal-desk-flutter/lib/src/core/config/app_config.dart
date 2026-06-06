import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  AppConfig({
    required this.apiBaseUrl,
  });

  final String apiBaseUrl;

  static const _apiBasePreferenceKey = 'api_base_url';

  factory AppConfig.fromEnvironment(SharedPreferences sharedPreferences) {
    final saved = sharedPreferences.getString(_apiBasePreferenceKey);
    final env = const String.fromEnvironment('API_BASE_URL');

    if (saved != null && saved.isNotEmpty) {
      return AppConfig(apiBaseUrl: saved);
    }

    if (env.isNotEmpty) {
      return AppConfig(apiBaseUrl: env);
    }

    if (kIsWeb) {
      return AppConfig(apiBaseUrl: '/api');
    }

    return AppConfig(apiBaseUrl: 'http://127.0.0.1:8015/api');
  }
}
