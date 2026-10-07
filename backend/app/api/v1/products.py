from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_owner
from app.models.entities import Owner, Store, Product, ProductVariant
from app.schemas.dto import ProductCreate, ProductOut

router = APIRouter(prefix="/stores/{store_id}/products", tags=["Products & Catalog"])


def verify_store_ownership(store_id: int, owner_id: int, db: Session) -> Store:
    store = db.query(Store).filter(Store.id == store_id, Store.owner_id == owner_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan atau bukan milik Anda.")
    return store


@router.get("", response_model=List[ProductOut])
def get_products(
    store_id: int,
    search: Optional[str] = None,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    verify_store_ownership(store_id, current_owner.id, db)
    query = db.query(Product).filter(Product.store_id == store_id)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )
    return query.all()


@router.post("", response_model=ProductOut)
def create_product(
    store_id: int,
    payload: ProductCreate,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    verify_store_ownership(store_id, current_owner.id, db)

    product = Product(
        store_id=store_id,
        category_id=payload.category_id,
        name=payload.name,
        sku=payload.sku,
        barcode=payload.barcode,
        description=payload.description,
        cost_price=payload.cost_price,
        selling_price=payload.selling_price,
        stock=payload.stock,
        track_stock=payload.track_stock,
        has_variants=payload.has_variants,
        has_serial_number=payload.has_serial_number
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # If has variants (Apparel / Riding Gear), add them
    if payload.has_variants and payload.variants:
        for v in payload.variants:
            variant = ProductVariant(
                product_id=product.id,
                name=v.name,
                sku=v.sku,
                barcode=v.barcode,
                cost_price=v.cost_price,
                selling_price=v.selling_price,
                stock=v.stock
            )
            db.add(variant)
        db.commit()

    return product
