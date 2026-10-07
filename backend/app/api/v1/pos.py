import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_owner
from app.models.entities import Owner, Store, Product, ProductVariant, Order, OrderItem
from app.schemas.dto import OrderCreate

router = APIRouter(prefix="/stores/{store_id}/pos", tags=["Point of Sale (POS)"])


@router.post("/checkout")
def checkout_order(
    store_id: int,
    payload: OrderCreate,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    """Proses pembayaran kasir, potong stok otomatis, dan cetak invoice"""
    store = db.query(Store).filter(Store.id == store_id, Store.owner_id == current_owner.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan.")

    # Generate invoice number: INV-YYYYMMDD-XXXX
    today_str = datetime.datetime.now().strftime("%Y%m%d")
    unique_suffix = str(uuid.uuid4().hex[:5]).upper()
    invoice_number = f"INV/{store_id}/{today_str}/{unique_suffix}"

    subtotal = 0.0
    order_items_to_create = []

    for item_data in payload.items:
        product = db.query(Product).filter(Product.id == item_data.product_id, Product.store_id == store_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Produk ID {item_data.product_id} tidak ditemukan.")

        item_subtotal = item_data.quantity * item_data.unit_price
        subtotal += item_subtotal

        # Stock deduction
        if product.track_stock:
            if item_data.variant_id:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.id == item_data.variant_id,
                    ProductVariant.product_id == product.id
                ).first()
                if variant:
                    variant.stock -= item_data.quantity
            else:
                product.stock -= item_data.quantity

        order_items_to_create.append({
            "product_id": product.id,
            "variant_id": item_data.variant_id,
            "product_name": product.name,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "cost_price": product.cost_price,
            "subtotal": item_subtotal,
            "notes": item_data.notes,
            "serials": item_data.serials
        })

    total_amount = subtotal - payload.discount + payload.tax
    change_amount = max(0.0, payload.amount_paid - total_amount) if payload.payment_method == "cash" else 0.0

    order = Order(
        store_id=store_id,
        invoice_number=invoice_number,
        order_type=payload.order_type,
        table_number=payload.table_number,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        subtotal=subtotal,
        discount=payload.discount,
        tax=payload.tax,
        total_amount=total_amount,
        payment_status="paid" if (payload.amount_paid >= total_amount or payload.payment_method != "cash") else "unpaid",
        payment_method=payload.payment_method,
        amount_paid=payload.amount_paid,
        change_amount=change_amount,
        notes=payload.notes
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Insert items
    for oi in order_items_to_create:
        item = OrderItem(
            order_id=order.id,
            product_id=oi["product_id"],
            variant_id=oi["variant_id"],
            product_name=oi["product_name"],
            quantity=oi["quantity"],
            unit_price=oi["unit_price"],
            cost_price=oi["cost_price"],
            subtotal=oi["subtotal"],
            notes=oi["notes"],
            serials=oi["serials"]
        )
        db.add(item)

    db.commit()

    return {
        "status": "success",
        "message": "Transaksi berhasil disimpan",
        "invoice_number": invoice_number,
        "total_amount": total_amount,
        "amount_paid": payload.amount_paid,
        "change_amount": change_amount,
        "order_id": order.id,
        "receipt_footer": store.receipt_footer
    }


@router.get("/recent-orders")
def get_recent_orders(
    store_id: int,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    """Mendapatkan transaksi terbaru untuk toko ini"""
    return db.query(Order).filter(Order.store_id == store_id).order_by(Order.created_at.desc()).limit(20).all()
