class DocumentModel {
  const DocumentModel({
    required this.id,
    required this.fileUrl,
    required this.fileName,
    required this.docType,
    required this.isOriginal,
    required this.createdAt,
    this.caseId,
    this.clientId,
    this.uploadedBy,
    this.uploaderName,
    this.notes,
  });

  final int id;
  final String fileUrl;
  final String fileName;
  final String docType;
  final bool isOriginal;
  final String createdAt;
  final int? caseId;
  final int? clientId;
  final int? uploadedBy;
  final String? uploaderName;
  final String? notes;

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['id'] as int,
      fileUrl: json['fileUrl'] as String? ?? '',
      fileName: json['fileName'] as String? ?? '',
      docType: json['docType'] as String? ?? 'other',
      isOriginal: json['isOriginal'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
      caseId: json['caseId'] as int?,
      clientId: json['clientId'] as int?,
      uploadedBy: json['uploadedBy'] as int?,
      uploaderName: json['uploaderName'] as String?,
      notes: json['notes'] as String?,
    );
  }
}

class CreateDocumentInput {
  const CreateDocumentInput({
    required this.fileUrl,
    required this.fileName,
    required this.docType,
    required this.isOriginal,
    this.caseId,
    this.clientId,
    this.uploadedBy,
    this.notes,
  });

  final String fileUrl;
  final String fileName;
  final String docType;
  final bool isOriginal;
  final int? caseId;
  final int? clientId;
  final int? uploadedBy;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'fileUrl': fileUrl,
        'fileName': fileName,
        'docType': docType,
        'isOriginal': isOriginal,
        'caseId': caseId,
        'clientId': clientId,
        'uploadedBy': uploadedBy,
        'notes': notes,
      };
}
