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
  shelf: string;
  freezer: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  image_url: string;
  user_id: string;
  fridge_id: string;
  expiry_date: string;
  serving_number: number;
  created_at: string;
  claimed_by?: string;
  // Joined fields
  fridge_name?: string;
  owner_name?: string;
  owner_slack?: string;
}
