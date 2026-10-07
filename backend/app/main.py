from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, stores, products, pos

# Auto create tables on boot
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Tenant SaaS & On-Premise POS and Mini-ERP for Retail, Electronics/Service, and F&B."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(stores.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(pos.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": settings.DEPLOYMENT_MODE,
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
