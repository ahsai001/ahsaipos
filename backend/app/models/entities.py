import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# -------------------------------------------------------------
# Multi-Tenant Core: Owners, Stores, Users
# -------------------------------------------------------------
class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    plan = Column(String(30), default="free")  # free, pro, enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    stores = relationship("Store", back_populates="owner", cascade="all, delete-orphan")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    # business_type: 'retail' (riding gear), 'electronics' (komputer & cctv), 'fnb' (rumah makan)
    business_type = Column(String(30), default="retail", nullable=False)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    receipt_footer = Column(String(255), default="Terima kasih atas kunjungan Anda!")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("Owner", back_populates="stores")
    users = relationship("User", back_populates="store", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    tables = relationship("RestaurantTable", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")


class User(Base):
    """Staff / Cashier in a specific store"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default="cashier")  # manager, cashier, waiter, kitchen
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    store = relationship("Store", back_populates="users")


# -------------------------------------------------------------
# Products, Categories, Variants (Apparel), Serials (Electronics)
# -------------------------------------------------------------
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)

    store = relationship("Store", back_populates="categories")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(50), nullable=True, index=True)
    barcode = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    stock = Column(Float, default=0.0)
    min_stock_alert = Column(Float, default=5.0)

    # Flags for specific store types
    track_stock = Column(Boolean, default=True)  # False for FnB non-measured foods or services
    has_variants = Column(Boolean, default=False)  # For Apparel/Riding gear
    has_serial_number = Column(Boolean, default=False)  # For Computer/CCTV
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    store = relationship("Store", back_populates="products")
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    serials = relationship("ProductSerial", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    """Varian ukuran / warna untuk Toko Riding Gear / Apparel"""
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g. "Ukuran L - Hitam"
    sku = Column(String(50), nullable=True)
    barcode = Column(String(50), nullable=True)
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    stock = Column(Float, default=0.0)

    product = relationship("Product", back_populates="variants")


class ProductSerial(Base):
    """Tracking Serial Number & Garansi untuk Toko Komputer & CCTV"""
    __tablename__ = "product_serials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    serial_number = Column(String(100), nullable=False, index=True)
    status = Column(String(30), default="available")  # available, sold, rma
    warranty_months = Column(Integer, default=12)
    warranty_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="serials")


# -------------------------------------------------------------
# F&B Module: Tables
# -------------------------------------------------------------
class RestaurantTable(Base):
    __tablename__ = "restaurant_tables"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    table_number = Column(String(20), nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String(30), default="empty")  # empty, occupied, reserved

    store = relationship("Store", back_populates="tables")


# -------------------------------------------------------------
# Orders / POS Transactions
# -------------------------------------------------------------
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)  # Cashier ID
    order_type = Column(String(30), default="takeaway")  # takeaway, dine_in, delivery
    table_number = Column(String(30), nullable=True)  # For F&B
    customer_name = Column(String(100), default="Pelanggan Umum")
    customer_phone = Column(String(30), nullable=True)

    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    payment_status = Column(String(30), default="paid")  # unpaid, paid, refunded
    payment_method = Column(String(30), default="cash")  # cash, qris, transfer, debit
    amount_paid = Column(Float, default=0.0)
    change_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    store = relationship("Store", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, nullable=True)
    product_name = Column(String(150), nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    notes = Column(String(255), nullable=True)  # e.g. "Pedas / Kurang gula"
    serials = Column(JSON, nullable=True)  # e.g. ["SN12345"] for computer/cctv

    order = relationship("Order", back_populates="items")
