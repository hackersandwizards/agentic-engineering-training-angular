export interface Contact {
  id: string;
  organisation: string;
  description: string | null;
  owner_id: string;
  owner?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  created_at: string;
  updated_at: string;
}
