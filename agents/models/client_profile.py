from pydantic import BaseModel, Field


class VehicleInfo(BaseModel):
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    plate: str | None = None


class ClientProfile(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    vehicle: VehicleInfo = Field(default_factory=VehicleInfo)
    problem_description: str | None = None
    classification: str = "cold"  # 'hot', 'warm', 'cold'
    score: float = 0.0  # 0-100
    funnel_stage: str = "lead_novo"
    metadata: dict = Field(default_factory=dict)


class ClassificationResult(BaseModel):
    classification: str  # 'hot', 'warm', 'cold'
    score: float
    reasoning: str
    extracted_info: ClientProfile
