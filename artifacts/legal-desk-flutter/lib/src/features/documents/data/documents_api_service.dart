import 'package:dio/dio.dart';

import 'document_models.dart';

class DocumentsApiService {
  DocumentsApiService(this._dio);

  final Dio _dio;

  Future<List<DocumentModel>> list({String? docType, int? caseId, int? clientId}) async {
    final response = await _dio.get<List<dynamic>>(
      '/documents',
      queryParameters: {
        'docType': docType,
        'caseId': caseId,
        'clientId': clientId,
      },
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(DocumentModel.fromJson)
        .toList(growable: false);
  }

  Future<DocumentModel> create(CreateDocumentInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/documents', data: input.toJson());
    return DocumentModel.fromJson(response.data!);
  }

  Future<void> delete(int id) => _dio.delete<void>('/documents/$id');
}
