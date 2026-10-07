from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AhsaiPOS"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Deployment mode: 'saas' or 'on_premise'
    DEPLOYMENT_MODE: str = "saas"
    
    # On-premise license key (if applicable)
    LICENSE_KEY: Optional[str] = None
    MAX_STORES_ALLOWED: int = 999  # SaaS default unlimited per platform; on_premise locked by license
    
    # Security
    SECRET_KEY: str = "ahsaipos_super_secret_jwt_key_change_me_in_production_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Default SQLite for local dev, PostgreSQL for production)
    DATABASE_URL: str = "sqlite:///./ahsaipos.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
