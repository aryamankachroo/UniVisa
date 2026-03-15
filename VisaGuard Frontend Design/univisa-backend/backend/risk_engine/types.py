from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class CurrentStage(str, Enum):
    STUDYING = "studying"
    CPT = "cpt"
    OPT = "opt"
    STEM_OPT = "stem_opt"
    OPT_APPROVED_NOT_STARTED = "opt_approved_not_started"


class EnrollmentStatus(str, Enum):
    FULL_TIME = "full_time"
    REDUCED_COURSE_LOAD = "reduced_course_load"
    NOT_ENROLLED = "not_enrolled"


class CptType(str, Enum):
    PART_TIME = "part_time"
    FULL_TIME = "full_time"


class StemApplicationStatus(str, Enum):
    NOT_APPLIED = "not_applied"
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"


class ImmigrationCaseInput(BaseModel):
    """Structured questionnaire input from the frontend."""

    fullName: str
    university: str
    country: str

    currentStage: CurrentStage

    programStart: date
    programEnd: date

    enrollmentStatus: EnrollmentStatus

    workHours: Optional[float] = None
    courseChanges: Optional[bool] = None
    usingCpt: Optional[bool] = None

    cptHours: Optional[float] = None
    cptType: Optional[CptType] = None

    optStart: Optional[date] = None
    optEnd: Optional[date] = None

    unemploymentDaysUsed: Optional[int] = None

    employedInAuthorizedJob: Optional[bool] = None
    changeEmployer: Optional[bool] = None

    stemEligible: Optional[bool] = None
    stemApplicationStatus: Optional[StemApplicationStatus] = None

    travelPlans: Optional[bool] = None
    receivedUSCISNotices: Optional[bool] = None
    unauthorizedWork: Optional[bool] = None
    sevisTerminatedBefore: Optional[bool] = None


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplianceFlag(BaseModel):
    """Single deterministic compliance flag."""

    code: str
    description: Optional[str] = None


class DeadlinesOutput(BaseModel):
    nextDeadline: Optional[date]
    daysUntilNextDeadline: Optional[int]


class RiskAnalysisResult(BaseModel):
    riskScore: int
    riskLevel: RiskLevel
    flags: List[ComplianceFlag]
    tasks: List[str]
    deadlines: DeadlinesOutput

