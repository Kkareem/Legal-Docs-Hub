CREATE TABLE office_bank_details (
 id INTEGER PRIMARY KEY CHECK(id=1), bank_name TEXT NOT NULL, beneficiary TEXT NOT NULL,
 iban TEXT NOT NULL, instructions TEXT NOT NULL DEFAULT ''
);
CREATE TABLE payment_receipts (
 id BIGSERIAL PRIMARY KEY, payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
 file_id BIGINT NOT NULL REFERENCES portal_files(id) ON DELETE CASCADE,
 reference TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','approved','rejected')),
 submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
 reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL, review_notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), reviewed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX one_pending_receipt_per_payment ON payment_receipts(payment_id) WHERE status='submitted';
