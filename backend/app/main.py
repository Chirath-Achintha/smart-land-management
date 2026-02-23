from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models BEFORE create_all so SQLAlchemy knows about all tables
from app.database.connection import Base, engine
from app.models.user_model import User
from app.models.land_model import Land
from app.models.bid_model import Bid
from app.models.availability_model import Availability
from app.models.visit_model import Visit
from app.models.inquiry_model import Inquiry

from app.routes.auth_routes         import router as auth_router
from app.routes.land_routes         import router as land_router
from app.routes.bid_routes          import router as bid_router
from app.routes.availability_routes import router as availability_router
from app.routes.visit_routes        import router as visit_router
from app.routes.inquiry_routes      import router as inquiry_router

# Auto-create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Land Management API",
    description="Backend API for Smart Land Management System",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(land_router)
app.include_router(bid_router)
app.include_router(availability_router)
app.include_router(visit_router)
app.include_router(inquiry_router)

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "message": "Smart Land Management API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
