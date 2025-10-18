export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          city: string;
          age: number | null;
          disability: string;
          memo: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          city?: string;
          age?: number | null;
          disability?: string;
          memo?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          age?: number | null;
          disability?: string;
          memo?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
}
