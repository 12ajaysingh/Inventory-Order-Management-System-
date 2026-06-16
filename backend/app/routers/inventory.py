from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InventoryLog, Product
from app.schemas import InventoryLogResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/logs", response_model=list[InventoryLogResponse])
def list_inventory_logs(db: Session = Depends(get_db)):
    logs = (
        db.query(InventoryLog, Product)
        .join(Product, InventoryLog.product_id == Product.id)
        .order_by(InventoryLog.created_at.desc())
        .all()
    )
    return [
        InventoryLogResponse(
            id=log.id,
            product_id=log.product_id,
            product_name=product.name,
            product_sku=product.sku,
            change_amount=log.change_amount,
            previous_stock=log.previous_stock,
            new_stock=log.new_stock,
            reason=log.reason,
            reference_id=log.reference_id,
            created_at=log.created_at,
        )
        for log, product in logs
    ]
