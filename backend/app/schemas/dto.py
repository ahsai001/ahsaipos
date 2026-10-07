from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth Schemas
class OwnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class OwnerLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    owner_id: int
    owner_name: str


# Store Schemas
class StoreCreate(BaseModel):
    name: str
    business_type: str = "retail"  # retail, electronics, fnb
    phone: Optional[str] = None
    address: Optional[str] = None
    receipt_footer: Optional[str] = "Terima kasih atas kunjungan Anda!"


class StoreOut(BaseModel):
    id: int
    name: str
    business_type: str
    phone: Optional[str]
    address: Optional[str]
    receipt_footer: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Product Schemas
class VariantCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    stock: float = 0.0


class ProductCreate(BaseModel):
    name: str
    category_id: Optional[int] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    stock: float = 0.0
    track_stock: bool = True
    has_variants: bool = False
    has_serial_number: bool = False
    variants: Optional[List[VariantCreate]] = None


class VariantOut(BaseModel):
    id: int
    name: str
    sku: Optional[str]
    cost_price: float
    selling_price: float
    stock: float

    class Config:
        from_attributes = True


class SerialOut(BaseModel):
    id: int
    serial_number: str
    status: str
    warranty_months: int
    warranty_expiry: Optional[datetime]

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    store_id: int
    name: str
    sku: Optional[str]
    barcode: Optional[str]
    cost_price: float
    selling_price: float
    stock: float
    track_stock: bool
    has_variants: bool
    has_serial_number: bool
    variants: Optional[List[VariantOut]] = []
    serials: Optional[List[SerialOut]] = []

    class Config:
        from_attributes = True


# Order & POS Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: float = 1.0
    unit_price: float
    notes: Optional[str] = None
    serials: Optional[List[str]] = None


class OrderCreate(BaseModel):
    order_type: str = "takeaway"  # takeaway, dine_in
    table_number: Optional[str] = None
    customer_name: Optional[str] = "Pelanggan Umum"
    customer_phone: Optional[str] = None
    items: List[OrderItemCreate]
    discount: float = 0.0
    tax: float = 0.0
    payment_method: str = "cash"
    amount_paid: float = 0.0
    notes: Optional[str] = None
