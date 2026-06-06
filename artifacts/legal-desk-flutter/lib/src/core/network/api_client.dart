import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio/browser.dart';
import 'package:dio/io.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../errors/app_exception.dart';

class ApiClientFactory {
  static Future<Dio> create(AppConfig config) async {
    final dio = Dio(
      BaseOptions(
        baseUrl: config.apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        headers: const {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    if (kIsWeb) {
      final adapter = BrowserHttpClientAdapter(withCredentials: true);
      dio.httpClientAdapter = adapter;
    } else {
      final cookieJar = CookieJar();
      dio.interceptors.add(CookieManager(cookieJar));
      final adapter = IOHttpClientAdapter(
        createHttpClient: () {
          final client = HttpClient();
          client.badCertificateCallback = (_, _, _) => false;
          return client;
        },
      );
      dio.httpClientAdapter = adapter;
    }

    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          final response = error.response;
          final data = response?.data;
          final message = switch (data) {
            Map<String, dynamic> map when map['message'] is String => map['message'] as String,
            Map<String, dynamic> map when map['detail'] is String => map['detail'] as String,
            String value => value,
            _ => error.message ?? 'Unknown network error',
          };
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: response,
              error: AppException(message, statusCode: response?.statusCode),
              type: error.type,
            ),
          );
        },
      ),
    );

    return dio;
  }
}
