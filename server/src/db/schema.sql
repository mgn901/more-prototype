CREATE TABLE pos_instances (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pos_instance_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    seller_name TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (pos_instance_id) REFERENCES pos_instances(id)
);

CREATE TABLE discount_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pos_instance_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'quantity_discount' or 'value_discount'
    details TEXT NOT NULL, -- JSON string for products, quantity, discount value/rate
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (pos_instance_id) REFERENCES pos_instances(id)
);

CREATE TABLE ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pos_instance_id TEXT NOT NULL,
    entry_type TEXT NOT NULL, -- 'sale', 'deposit', 'withdrawal', 'reversal'
    data TEXT NOT NULL, -- JSON string for entry details
    is_reverted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (pos_instance_id) REFERENCES pos_instances(id)
);

CREATE TABLE ledger_reversals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pos_instance_id TEXT NOT NULL,
    original_ledger_entry_id INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (pos_instance_id) REFERENCES pos_instances(id),
    FOREIGN KEY (original_ledger_entry_id) REFERENCES ledger_entries(id)
);
