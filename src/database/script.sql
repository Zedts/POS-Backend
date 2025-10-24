-- Tabel admin: admin/pengelola sistem
CREATE TABLE admin (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- Username login admin
    password_hash VARCHAR(255) NOT NULL, -- Password yang di-hash
    full_name VARCHAR(100) NOT NULL,
    created_date DATETIME DEFAULT GETDATE(),
    updated_date DATETIME DEFAULT GETDATE()
);

-- Tabel student: siswa sekaligus employee yang mengelola POS
CREATE TABLE student (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nisn VARCHAR(20) UNIQUE NOT NULL, -- Nomor Induk Siswa Nasional
    username VARCHAR(50) NOT NULL UNIQUE, -- Username login employee / user
    password_hash VARCHAR(255) NOT NULL, -- Password yang di-hash
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    class VARCHAR(3) NOT NULL CHECK (class IN ('X', 'XI', 'XII')),
    major VARCHAR(10) NOT NULL CHECK (major IN ('RPL', 'DKV1', 'DKV2', 'BR', 'MP', 'AK')),
    is_active BIT DEFAULT 1,
    created_date DATETIME DEFAULT GETDATE(),
    updated_date DATETIME DEFAULT GETDATE()
);

-- Tabel category: kategori produk
CREATE TABLE category (
    id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL -- Nama kategori produk
);

-- Tabel products: produk dan informasi terkait
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    qty INT DEFAULT 0,
    supplier VARCHAR(100),
    price DECIMAL(18,0) NOT NULL,
    picture_url VARCHAR(500),
    created_by INT NOT NULL, -- admin yang buat produk
    updated_by INT NULL,
    created_date DATETIME DEFAULT GETDATE(),
    updated_date DATETIME DEFAULT GETDATE(),
    status VARCHAR(10) CHECK (status IN ('kadaluarsa', 'tidak')),
    exp_date DATE,
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (created_by) REFERENCES admin(id),
    FOREIGN KEY (updated_by) REFERENCES admin(id)
);

-- Tabel product_price_history: riwayat perubahan harga produk
CREATE TABLE product_price_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL,
    old_price DECIMAL(18,0),
    new_price DECIMAL(18,0),
    changed_at DATETIME DEFAULT GETDATE(),
    changed_by INT NOT NULL, -- admin yang ubah harga
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (changed_by) REFERENCES admin(id)
);

-- Tabel discount: data diskon dan pengaturan masa berlaku
CREATE TABLE discount (
    discount_id INT IDENTITY(1,1) PRIMARY KEY,
    discount_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_percent DECIMAL(5,2) NOT NULL,
    min_purchase DECIMAL(18,0) DEFAULT 0,
    max_discount DECIMAL(18,0) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INT NULL,
    used_count INT DEFAULT 0,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    created_by INT NOT NULL,
    updated_by INT NULL,
    created_date DATETIME DEFAULT GETDATE(),
    updated_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES admin(id),
    FOREIGN KEY (updated_by) REFERENCES admin(id)
);

-- Tabel orders: transaksi penjualan yang dibuat oleh siswa sebagai employee
CREATE TABLE orders (
    order_number VARCHAR(50) PRIMARY KEY,
    order_date DATETIME DEFAULT GETDATE(),
    employee_id INT NOT NULL, -- FK ke siswa yang input order
    order_total DECIMAL(18,0),
    balance DECIMAL(18,0),
    discount_code VARCHAR(50) NULL,
    FOREIGN KEY (employee_id) REFERENCES student(id),
    FOREIGN KEY (discount_code) REFERENCES discount(discount_code)
);

-- Tabel order_details: detail produk dalam satu order
CREATE TABLE order_details (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200),
    product_picture VARCHAR(500),
    qty_product INT,
    price_product DECIMAL(18,0),
    status VARCHAR(10) CHECK (status IN ('complete', 'pending')) DEFAULT 'pending',
    verified_by INT NULL, -- siswa yang verifikasi
    verified_date DATETIME NULL,
    balance DECIMAL(18,0),
    FOREIGN KEY (order_number) REFERENCES orders(order_number),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (verified_by) REFERENCES student(id)
);

-- Tabel invoices: penyimpanan data invoice untuk print dan payment tracking
CREATE TABLE invoices (
    id INT IDENTITY(1,1) PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_status VARCHAR(10) NOT NULL CHECK (invoice_status IN ('diproses', 'gagal', 'berhasil')),
    invoice_date DATETIME DEFAULT GETDATE(),
    order_number VARCHAR(50) NOT NULL,
    order_total DECIMAL(18,0),
    discount_code VARCHAR(50),
    discount_percent DECIMAL(5,2),
    balance DECIMAL(18,0),
    paid_by VARCHAR(10) NOT NULL CHECK (paid_by IN ('cash', 'qr')),
    verified_by INT NOT NULL, -- siswa yang verifikasi pembayaran
    mobile_employee VARCHAR(20) NULL,
    FOREIGN KEY (order_number) REFERENCES orders(order_number),
    FOREIGN KEY (discount_code) REFERENCES discount(discount_code),
    FOREIGN KEY (verified_by) REFERENCES student(id)
);
