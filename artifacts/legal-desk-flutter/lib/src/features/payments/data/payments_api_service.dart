import 'package:dio/dio.dart';

import 'payment_models.dart';

class PaymentsApiService {
  PaymentsApiService(this._dio);

  final Dio _dio;

  Future<List<PaymentModel>> list({String? status, int? clientId, int? caseId}) async {
    final response = await _dio.get<List<dynamic>>(
      '/payments',
      queryParameters: {
        'status': status,
        'clientId': clientId,
        'caseId': caseId,
      },
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(PaymentModel.fromJson)
        .toList(growable: false);
  }

  Future<PaymentSummaryModel> summary() async {
    final response = await _dio.get<Map<String, dynamic>>('/dashboard/payment-summary');
    return PaymentSummaryModel.fromJson(response.data!);
  }

  Future<PaymentModel> create(CreatePaymentInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/payments', data: input.toJson());
    return PaymentModel.fromJson(response.data!);
  }

  Future<PaymentModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/payments/$id', data: payload);
    return PaymentModel.fromJson(response.data!);
  }

  Future<void> delete(int id) => _dio.delete<void>('/payments/$id');
}
