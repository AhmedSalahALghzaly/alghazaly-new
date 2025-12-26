/**
 * WatermelonDB Schema for Al-Ghazaly Auto Parts
 * Defines the local database structure for offline-first architecture
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    // Car Brands
    tableSchema({
      name: 'car_brands',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'name_ar', type: 'string' },
        { name: 'logo', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Car Models
    tableSchema({
      name: 'car_models',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'brand_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'name_ar', type: 'string' },
        { name: 'year_start', type: 'number', isOptional: true },
        { name: 'year_end', type: 'number', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'description_ar', type: 'string', isOptional: true },
        { name: 'variants', type: 'string', isOptional: true }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Product Brands
    tableSchema({
      name: 'product_brands',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'name_ar', type: 'string', isOptional: true },
        { name: 'logo', type: 'string', isOptional: true },
        { name: 'country_of_origin', type: 'string', isOptional: true },
        { name: 'country_of_origin_ar', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Categories
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'name_ar', type: 'string' },
        { name: 'parent_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'icon', type: 'string', isOptional: true },
        { name: 'sort_order', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Products
    tableSchema({
      name: 'products',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'name_ar', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'description_ar', type: 'string', isOptional: true },
        { name: 'price', type: 'number' },
        { name: 'sku', type: 'string', isIndexed: true },
        { name: 'product_brand_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'images', type: 'string', isOptional: true }, // JSON array string
        { name: 'car_model_ids', type: 'string', isOptional: true }, // JSON array string
        { name: 'stock_quantity', type: 'number' },
        { name: 'hidden_status', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Favorites (user-specific, synced)
    tableSchema({
      name: 'favorites',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Cart Items (local-first)
    tableSchema({
      name: 'cart_items',
      columns: [
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Sync metadata
    tableSchema({
      name: 'sync_metadata',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'last_pulled_at', type: 'number' },
      ],
    }),
  ],
});
