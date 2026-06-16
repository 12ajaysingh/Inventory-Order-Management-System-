from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Customer, InventoryLog, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderItemResponse, OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


def _serialize_order(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                product_sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in order.items
        ],
    )


@router.get("", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_serialize_order(order) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _serialize_order(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    product_ids = [item.product_id for item in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate products in order are not allowed",
        )

    products = {
        product.id: product
        for product in db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
    }

    if len(products) != len(product_ids):
        missing = set(product_ids) - set(products.keys())
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {sorted(missing)}",
        )

    order_items: list[OrderItem] = []
    total_amount = Decimal("0.00")
    stock_errors: list[str] = []

    for item in payload.items:
        product = products[item.product_id]
        if product.stock_quantity < item.quantity:
            stock_errors.append(
                f"{product.name} ({product.sku}): requested {item.quantity}, available {product.stock_quantity}"
            )
            continue

        line_total = product.price * item.quantity
        total_amount += line_total
        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    if stock_errors:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Insufficient stock for one or more products", "errors": stock_errors},
        )

    order = Order(customer_id=customer.id, total_amount=total_amount, status="confirmed")
    order.items = order_items
    db.add(order)
    db.flush()

    for item in order_items:
        product = products[item.product_id]
        previous_stock = product.stock_quantity
        product.stock_quantity -= item.quantity
        db.add(
            InventoryLog(
                product_id=product.id,
                change_amount=-item.quantity,
                previous_stock=previous_stock,
                new_stock=product.stock_quantity,
                reason="order_placed",
                reference_id=order.id,
            )
        )

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order.id)
        .first()
    )
    return _serialize_order(order)
