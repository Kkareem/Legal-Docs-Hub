import 'search_api_service.dart';
import 'search_models.dart';

class SearchRepository {
  SearchRepository(this._service);

  final SearchApiService _service;

  Future<SearchResultModel> search(String query) => _service.search(query);
}
