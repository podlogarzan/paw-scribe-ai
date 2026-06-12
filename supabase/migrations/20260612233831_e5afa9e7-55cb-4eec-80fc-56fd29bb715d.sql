
-- ============ Helper: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ pets ============
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  birth_date date,
  sex text,
  neutered boolean DEFAULT false,
  weight_kg numeric,
  microchip_no text,
  allergies text[],
  notes text,
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read pets"   ON public.pets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner can insert pets" ON public.pets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner can update pets" ON public.pets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner can delete pets" ON public.pets FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX pets_user_id_idx ON public.pets(user_id);

-- ============ Helper: user owns pet (security definer to avoid recursion) ============
CREATE OR REPLACE FUNCTION public.user_owns_pet(_pet_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.pets WHERE id = _pet_id AND user_id = auth.uid());
$$;

-- ============ entries ============
CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('appointment','vaccination','health_issue','note','ai_log')),
  title text NOT NULL,
  description text,
  occurred_at timestamptz NOT NULL,
  created_by text NOT NULL DEFAULT 'user' CHECK (created_by IN ('user','ai')),
  source_conversation_id uuid,
  reminder_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read entries"   ON public.entries FOR SELECT TO authenticated USING (public.user_owns_pet(pet_id));
CREATE POLICY "owner can insert entries" ON public.entries FOR INSERT TO authenticated WITH CHECK (public.user_owns_pet(pet_id));
CREATE POLICY "owner can update entries" ON public.entries FOR UPDATE TO authenticated USING (public.user_owns_pet(pet_id)) WITH CHECK (public.user_owns_pet(pet_id));
CREATE POLICY "owner can delete entries" ON public.entries FOR DELETE TO authenticated USING (public.user_owns_pet(pet_id));
CREATE TRIGGER entries_set_updated_at BEFORE UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX entries_pet_id_occurred_at_idx ON public.entries(pet_id, occurred_at DESC);

-- ============ entry_photos ============
CREATE TABLE public.entry_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_photos TO authenticated;
GRANT ALL ON public.entry_photos TO service_role;
ALTER TABLE public.entry_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read entry_photos"   ON public.entry_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_photos.entry_id AND public.user_owns_pet(e.pet_id)));
CREATE POLICY "owner can insert entry_photos" ON public.entry_photos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_photos.entry_id AND public.user_owns_pet(e.pet_id)));
CREATE POLICY "owner can delete entry_photos" ON public.entry_photos FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.id = entry_photos.entry_id AND public.user_owns_pet(e.pet_id)));

-- ============ documents ============
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('passport','vaccination_card','lab_result','insurance','invoice','other')),
  label text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read documents"   ON public.documents FOR SELECT TO authenticated USING (public.user_owns_pet(pet_id));
CREATE POLICY "owner can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.user_owns_pet(pet_id));
CREATE POLICY "owner can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.user_owns_pet(pet_id));
CREATE INDEX documents_pet_id_idx ON public.documents(pet_id);

-- ============ conversations ============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read conversations"   ON public.conversations FOR SELECT TO authenticated USING (public.user_owns_pet(pet_id));
CREATE POLICY "owner can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (public.user_owns_pet(pet_id));
CREATE POLICY "owner can update conversations" ON public.conversations FOR UPDATE TO authenticated USING (public.user_owns_pet(pet_id)) WITH CHECK (public.user_owns_pet(pet_id));
CREATE POLICY "owner can delete conversations" ON public.conversations FOR DELETE TO authenticated USING (public.user_owns_pet(pet_id));
CREATE TRIGGER conversations_set_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX conversations_pet_id_idx ON public.conversations(pet_id, updated_at DESC);

-- ============ messages ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  image_paths text[],
  created_entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can read messages"   ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND public.user_owns_pet(c.pet_id)));
CREATE POLICY "owner can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND public.user_owns_pet(c.pet_id)));
CREATE POLICY "owner can delete messages" ON public.messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND public.user_owns_pet(c.pet_id)));
CREATE INDEX messages_conversation_id_idx ON public.messages(conversation_id, created_at);
