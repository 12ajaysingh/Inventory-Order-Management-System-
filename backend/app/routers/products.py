from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InventoryLog, Product
from app.schemas import InventoryLogResponse, ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product SKU must be unique",
        )
    db.refresh(product)

    log = InventoryLog(
        product_id=product.id,
        change_amount=product.stock_quantity,
        previous_stock=0,
        new_stock=product.stock_quantity,
        reason="initial_stock",
    )
    db.add(log)
    db.commit()

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True)
    previous_stock = product.stock_quantity

    for field, value in updates.items():
        setattr(product, field, value)

    if "stock_quantity" in updates and updates["stock_quantity"] != previous_stock:
        db.add(
            InventoryLog(
                product_id=product.id,
                change_amount=updates["stock_quantity"] - previous_stock,
                previous_stock=previous_stock,
                new_stock=updates["stock_quantity"],
                reason="manual_adjustment",
            )
        )

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.order_items:
    for item in product.order_items:
        db.delete(item)
    db.delete(product)
    db.commit()


@router.get("/{product_id}/inventory", response_model=list[InventoryLogResponse])
def get_product_inventory(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    logs = (
        db.query(InventoryLog)
        .filter(InventoryLog.product_id == product_id)
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
        for log in logs
    ]
