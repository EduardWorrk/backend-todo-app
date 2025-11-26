export interface CategoryDto {
  id: number;
  name: string;
  color: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryDto {
  name: string;
  color?: string | null;
}

export interface CategoriesResponseDto {
  status: 'success' | 'error';
  categories: CategoryDto[];
}

export interface CategoryResponseDto {
  status: 'success' | 'error';
  message: string;
  category: CategoryDto;
}

export interface DeleteCategoryResponseDto {
  status: 'success' | 'error';
  message: string;
}




