class PaymentModel {
  const PaymentModel({
    required this.id,
    required this.clientId,
    required this.amount,
    required this.type,
    required this.status,
    required this.createdAt,
    this.clientName,
    this.caseId,
    this.caseNumber,
    this.consultationId,
    this.paidAt,
    this.notes,
  });

  final int id;
  final int clientId;
  final num amount;
  final String type;
  final String status;
  final String createdAt;
  final String? clientName;
  final int? caseId;
  final String? caseNumber;
  final int? consultationId;
  final String? paidAt;
  final String? notes;

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] as int,
      clientId: json['clientId'] as int,
      amount: json['amount'] as num? ?? 0,
      type: json['type'] as String? ?? 'case_fee',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] as String? ?? '',
      clientName: json['clientName'] as String?,
      caseId: json['caseId'] as int?,
      caseNumber: json['caseNumber'] as String?,
      consultationId: json['consultationId'] as int?,
      paidAt: json['paidAt'] as String?,
      notes: json['notes'] as String?,
    );
  }
}

class PaymentSummaryModel {
  const PaymentSummaryModel({
    required this.totalCollected,
    required this.totalPending,
    required this.totalOverdue,
  });

  final num totalCollected;
  final num totalPending;
  final num totalOverdue;

  factory PaymentSummaryModel.fromJson(Map<String, dynamic> json) {
    return PaymentSummaryModel(
      totalCollected: json['totalCollected'] as num? ?? 0,
      totalPending: json['totalPending'] as num? ?? 0,
      totalOverdue: json['totalOverdue'] as num? ?? 0,
    );
  }
}

class CreatePaymentInput {
  const CreatePaymentInput({
    required this.clientId,
    required this.amount,
    required this.type,
    required this.status,
    this.caseId,
    this.consultationId,
    this.paidAt,
    this.notes,
  });

  final int clientId;
  final num amount;
  final String type;
  final String status;
  final int? caseId;
  final int? consultationId;
  final String? paidAt;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'clientId': clientId,
        'amount': amount,
        'type': type,
        'status': status,
        'caseId': caseId,
        'consultationId': consultationId,
        'paidAt': paidAt,
        'notes': notes,
      };
}
