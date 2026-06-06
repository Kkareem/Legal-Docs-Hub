import 'document_models.dart';
import 'documents_api_service.dart';

class DocumentsRepository {
  DocumentsRepository(this._service);

  final DocumentsApiService _service;

  Future<List<DocumentModel>> list({String? docType, int? caseId, int? clientId}) =>
      _service.list(docType: docType, caseId: caseId, clientId: clientId);
  Future<DocumentModel> create(CreateDocumentInput input) => _service.create(input);
  Future<void> delete(int id) => _service.delete(id);
}
