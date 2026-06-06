import 'package:dio/dio.dart';

import 'search_models.dart';

class SearchApiService {
  SearchApiService(this._dio);

  final Dio _dio;

  Future<SearchResultModel> search(String query) async {
    final response = await _dio.get<Map<String, dynamic>>('/search', queryParameters: {'q': query});
    return SearchResultModel.fromJson(response.data!);
  }
}
