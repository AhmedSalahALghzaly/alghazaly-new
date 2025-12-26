"""
SQLAlchemy models for Al-Ghazaly Auto Parts
Designed for WatermelonDB sync compatibility
"""
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey,
    Table, JSON, BigInteger, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

# Association table for product-car_model many-to-many
product_car_models = Table(
    'product_car_models',
    Base.metadata,
    Column('product_id', String(36), ForeignKey('products.id', ondelete='CASCADE'), primary_key=True),
    Column('car_model_id', String(36), ForeignKey('car_models.id', ondelete='CASCADE'), primary_key=True),
)


class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    picture = Column(Text, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete for sync
    
    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_users_updated_at', 'updated_at'),
    )


class UserSession(Base):
    __tablename__ = 'user_sessions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    user = relationship("User", back_populates="sessions")


class CarBrand(Base):
    __tablename__ = 'car_brands'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False)
    logo = Column(Text, nullable=True)  # Base64 image
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    models = relationship("CarModel", back_populates="brand", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_car_brands_updated_at', 'updated_at'),
    )


class CarModel(Base):
    __tablename__ = 'car_models'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey('car_brands.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False)
    year_start = Column(Integer, nullable=True)
    year_end = Column(Integer, nullable=True)
    image_url = Column(Text, nullable=True)  # Base64 image
    description = Column(Text, nullable=True)
    description_ar = Column(Text, nullable=True)
    variants = Column(JSON, default=list)  # Store variants as JSON array
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    brand = relationship("CarBrand", back_populates="models")
    products = relationship("Product", secondary=product_car_models, back_populates="car_models")
    
    __table_args__ = (
        Index('idx_car_models_updated_at', 'updated_at'),
    )


class ProductBrand(Base):
    __tablename__ = 'product_brands'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=True)
    logo = Column(Text, nullable=True)  # Base64 image
    country_of_origin = Column(String(255), nullable=True)
    country_of_origin_ar = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    products = relationship("Product", back_populates="product_brand")
    
    __table_args__ = (
        Index('idx_product_brands_updated_at', 'updated_at'),
    )


class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    icon = Column(String(100), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Self-referential relationship
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category")
    
    __table_args__ = (
        Index('idx_categories_updated_at', 'updated_at'),
    )


class Product(Base):
    __tablename__ = 'products'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    description_ar = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    product_brand_id = Column(String(36), ForeignKey('product_brands.id', ondelete='SET NULL'), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    image_url = Column(Text, nullable=True)  # Base64 primary image
    images = Column(JSON, default=list)  # Array of base64 images
    stock_quantity = Column(Integer, default=0)
    hidden_status = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    product_brand = relationship("ProductBrand", back_populates="products")
    category = relationship("Category", back_populates="products")
    car_models = relationship("CarModel", secondary=product_car_models, back_populates="products")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    favorites = relationship("Favorite", back_populates="product", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="product", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_products_updated_at', 'updated_at'),
        Index('idx_products_category', 'category_id'),
        Index('idx_products_brand', 'product_brand_id'),
    )


class Cart(Base):
    __tablename__ = 'carts'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = 'cart_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    cart_id = Column(String(36), ForeignKey('carts.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(String(36), ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    
    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")
    
    __table_args__ = (
        Index('idx_cart_items_cart_product', 'cart_id', 'product_id', unique=True),
    )


class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    subtotal = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=150.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(String(50), default='pending', index=True)
    payment_method = Column(String(50), default='cash_on_delivery')
    notes = Column(Text, nullable=True)
    is_viewed = Column(Boolean, default=False)
    # Delivery address as JSON
    delivery_address = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_orders_updated_at', 'updated_at'),
        Index('idx_orders_status', 'status'),
    )


class OrderItem(Base):
    __tablename__ = 'order_items'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(String(36), ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    product_name = Column(String(255), nullable=False)
    product_name_ar = Column(String(255), nullable=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Favorite(Base):
    __tablename__ = 'favorites'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")
    
    __table_args__ = (
        Index('idx_favorites_user_product', 'user_id', 'product_id', unique=True),
        Index('idx_favorites_updated_at', 'updated_at'),
    )


class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    user_picture = Column(Text, nullable=True)
    text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    product = relationship("Product", back_populates="comments")
    user = relationship("User", back_populates="comments")
    
    __table_args__ = (
        Index('idx_comments_updated_at', 'updated_at'),
    )


# Sync tracking table for WatermelonDB
class SyncLog(Base):
    __tablename__ = 'sync_logs'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(String(36), nullable=False)
    action = Column(String(20), nullable=False)  # created, updated, deleted
    timestamp = Column(BigInteger, nullable=False)  # Unix timestamp in ms for WatermelonDB
    user_id = Column(String(36), nullable=True)  # Who made the change
    
    __table_args__ = (
        Index('idx_sync_logs_table_timestamp', 'table_name', 'timestamp'),
    )
