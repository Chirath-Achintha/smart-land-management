from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
import os

from app.database.connection import init_db

from app.routes.auth_routes         import router as auth_router
from app.routes.land_routes         import router as land_router
from app.routes.bid_routes          import router as bid_router
from app.routes.availability_routes import router as availability_router
from app.routes.visit_routes        import router as visit_router
from app.routes.inquiry_routes      import router as inquiry_router
from app.routes.service_booking_routes import router as service_booking_router
from app.routes.user_routes import router as user_router
from app.routes.notification_routes import router as notification_router
from app.routes.constructor_team_routes import router as constructor_team_router

app = FastAPI(
    title="Smart Land Management API",
    description="Backend API for Smart Land Management System",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    await init_db()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth_router)
app.include_router(land_router)
app.include_router(bid_router)
app.include_router(availability_router)
app.include_router(visit_router)
app.include_router(inquiry_router)
app.include_router(service_booking_router)
app.include_router(user_router)
app.include_router(notification_router)
app.include_router(constructor_team_router)

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "message": "Smart Land Management API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
