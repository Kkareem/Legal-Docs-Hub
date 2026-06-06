class PowerOfAttorneyModel {
  const PowerOfAttorneyModel({
    required this.id,
    required this.clientId,
    required this.status,
    required this.createdAt,
    this.clientName,
    this.caseId,
    this.caseNumber,
    this.receivedBy,
    this.receivedByName,
    this.handedBy,
    this.receivedAt,
    this.returnBy,
    this.returnedAt,
    this.notes,
  });

  final int id;
  final int clientId;
  final String status;
  final String createdAt;
  final String? clientName;
  final int? caseId;
  final String? caseNumber;
  final int? receivedBy;
  final String? receivedByName;
  final String? handedBy;
  final String? receivedAt;
  final String? returnBy;
  final String? returnedAt;
  final String? notes;

  factory PowerOfAttorneyModel.fromJson(Map<String, dynamic> json) {
    return PowerOfAttorneyModel(
      id: json['id'] as int,
      clientId: json['clientId'] as int,
      status: json['status'] as String? ?? 'in_office',
      createdAt: json['createdAt'] as String? ?? '',
      clientName: json['clientName'] as String?,
      caseId: json['caseId'] as int?,
      caseNumber: json['caseNumber'] as String?,
      receivedBy: json['receivedBy'] as int?,
      receivedByName: json['receivedByName'] as String?,
      handedBy: json['handedBy'] as String?,
      receivedAt: json['receivedAt'] as String?,
      returnBy: json['returnBy'] as String?,
      returnedAt: json['returnedAt'] as String?,
      notes: json['notes'] as String?,
    );
  }
}

class CreatePowerOfAttorneyInput {
  const CreatePowerOfAttorneyInput({
    required this.clientId,
    required this.status,
    this.caseId,
    this.receivedBy,
    this.handedBy,
    this.receivedAt,
    this.returnBy,
    this.returnedAt,
    this.notes,
  });

  final int clientId;
  final String status;
  final int? caseId;
  final int? receivedBy;
  final String? handedBy;
  final String? receivedAt;
  final String? returnBy;
  final String? returnedAt;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'clientId': clientId,
        'status': status,
        'caseId': caseId,
        'receivedBy': receivedBy,
        'handedBy': handedBy,
        'receivedAt': receivedAt,
        'returnBy': returnBy,
        'returnedAt': returnedAt,
        'notes': notes,
      };
}
