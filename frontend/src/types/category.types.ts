export interface Category {
  id: string;
  userId: string | null;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
}
