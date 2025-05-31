export interface APIClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface APIRequestOptions extends RequestInit {
  timeout?: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal"?: number;
    proteins_100g?: number;
    proteins?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    fat_100g?: number;
    fat?: number;
    fiber_100g?: number;
    fiber?: number;
    sodium_100g?: number;
    sodium?: number;
    sugars_100g?: number;
    sugars?: number;
    "saturated-fat_100g"?: number;
    "saturated-fat"?: number;
  };
  serving_quantity?: number;
  serving_size?: string;
  image_url?: string;
  image_front_url?: string;
}
