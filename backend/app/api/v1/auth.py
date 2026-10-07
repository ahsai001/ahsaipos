from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.entities import Owner
from app.schemas.dto import OwnerCreate, OwnerLogin, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register_owner(payload: OwnerCreate, db: Session = Depends(get_db)):
    # Guard: If on_premise, public registration can be blocked or restricted!
    if settings.DEPLOYMENT_MODE == "on_premise":
        existing_owners = db.query(Owner).count()
        if existing_owners >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registrasi publik dinonaktifkan pada edisi On-Premise. Silakan hubungi administrator lisensi."
            )

    # Check email duplicate
    existing = db.query(Owner).filter(Owner.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau login."
        )

    new_owner = Owner(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        plan="free"
    )
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)

    token = create_access_token(data={"sub": str(new_owner.id), "name": new_owner.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "owner_id": new_owner.id,
        "owner_name": new_owner.name
    }


@router.post("/login", response_model=Token)
def login_owner(payload: OwnerLogin, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.email == payload.email).first()
    if not owner or not verify_password(payload.password, owner.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah."
        )

    if not owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun ini telah dinonaktifkan."
        )

    token = create_access_token(data={"sub": str(owner.id), "name": owner.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "owner_id": owner.id,
        "owner_name": owner.name
    }
