from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_owner
from app.models.entities import Owner, Store
from app.schemas.dto import StoreCreate, StoreOut

router = APIRouter(prefix="/stores", tags=["Stores / Cabang"])


@router.get("", response_model=List[StoreOut])
def list_stores(
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    """Mendapatkan daftar semua cabang/toko milik owner yang sedang login"""
    return db.query(Store).filter(Store.owner_id == current_owner.id).all()


@router.post("", response_model=StoreOut)
def create_store(
    payload: StoreCreate,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    """Menambahkan cabang/toko baru (Mendukung tipe: retail, electronics, fnb)"""
    # Guard: On-premise store count restriction
    store_count = db.query(Store).filter(Store.owner_id == current_owner.id).count()
    if store_count >= settings.MAX_STORES_ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Batas lisensi toko tercapai ({settings.MAX_STORES_ALLOWED} toko). Silakan upgrade lisensi Anda."
        )

    store = Store(
        owner_id=current_owner.id,
        name=payload.name,
        business_type=payload.business_type,
        phone=payload.phone,
        address=payload.address,
        receipt_footer=payload.receipt_footer
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("/{store_id}", response_model=StoreOut)
def get_store_detail(
    store_id: int,
    current_owner: Owner = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    store = db.query(Store).filter(Store.id == store_id, Store.owner_id == current_owner.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan atau bukan milik Anda.")
    return store
