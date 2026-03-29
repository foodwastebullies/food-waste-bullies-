export interface User {
  id: string;
  name: string;
  email: string;
  slack_handle?: string;
  check_in_date?: string;
  check_out_date?: string;
  role: 'housemate' | 'food_police';
  admin: boolean;
}

export interface Fridge {
  id: string;
  name: string;
}

export interface Shelf {
  id: string;
  fridge_id: string;
  name: string;
  freezer: boolean;
  // Joined fields
  fridge_name?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  image_url: string;
  user_id: string;
  shelf_id: string;
  expiry_date: string;
  serving_number: number;
  created_at: string;
  claimed_by?: string;
  // Joined fields
  fridge_id?: string;
  fridge_name?: string;
  shelf_name?: string;
  owner_name?: string;
  owner_slack?: string;
}

export interface NewFoodItem {
  id: string;
  name: string;
  image_url: string;
  user_id: string;
  shelf_id: string;
  expiry_date: string;
  serving_number: number;
}

export interface UpdateUser {
  name: string;
  email: string;
  password?: string;
  slack_handle: string;
  role: 'housemate' | 'food_police';
  admin: boolean;
  check_in_date?: string;
  check_out_date?: string;
}

export interface NewUser {
  id: string;
  name: string;
  email: string;
  password: string;
  slack_handle: string;
  role: 'housemate' | 'food_police';
  admin: boolean;
  check_in_date?: string;
  check_out_date?: string;
}
