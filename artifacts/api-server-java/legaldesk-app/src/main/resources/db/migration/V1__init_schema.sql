CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'lawyer',
    office_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    national_id TEXT,
    address TEXT,
    office_id BIGINT,
    status TEXT NOT NULL DEFAULT 'new',
    service_type TEXT,
    notes TEXT,
    user_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id BIGSERIAL PRIMARY KEY,
    case_number TEXT NOT NULL,
    court_case_number TEXT,
    type TEXT NOT NULL DEFAULT 'civil',
    court TEXT,
    division TEXT,
    client_id BIGINT NOT NULL,
    lead_lawyer_id BIGINT,
    status TEXT NOT NULL DEFAULT 'new',
    opposing_party TEXT,
    description TEXT,
    office_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT,
    client_id BIGINT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'other',
    is_original BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    case_id BIGINT,
    assigned_to BIGINT,
    due_date TIMESTAMPTZ,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new',
    office_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hearings (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    court TEXT,
    type TEXT NOT NULL DEFAULT 'session',
    assigned_lawyer BIGINT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultations (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    summary TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fee NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to BIGINT,
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    case_id BIGINT,
    consultation_id BIGINT,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'case_fee',
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS powers_of_attorney (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    case_id BIGINT,
    received_by BIGINT NOT NULL,
    handed_by TEXT,
    received_at TIMESTAMPTZ NOT NULL,
    return_by TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_office',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    ref_id BIGINT,
    ref_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id BIGINT,
    old_val TEXT,
    new_val TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
