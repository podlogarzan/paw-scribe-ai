
-- Replace SECURITY DEFINER helper with inline EXISTS checks (no recursion risk: none of these tables' policies reference themselves)
DROP POLICY IF EXISTS "owner can read entries"   ON public.entries;
DROP POLICY IF EXISTS "owner can insert entries" ON public.entries;
DROP POLICY IF EXISTS "owner can update entries" ON public.entries;
DROP POLICY IF EXISTS "owner can delete entries" ON public.entries;
CREATE POLICY "owner can read entries"   ON public.entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = entries.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can insert entries" ON public.entries FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = entries.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can update entries" ON public.entries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = entries.pet_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = entries.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can delete entries" ON public.entries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = entries.pet_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owner can read entry_photos"   ON public.entry_photos;
DROP POLICY IF EXISTS "owner can insert entry_photos" ON public.entry_photos;
DROP POLICY IF EXISTS "owner can delete entry_photos" ON public.entry_photos;
CREATE POLICY "owner can read entry_photos"   ON public.entry_photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE e.id = entry_photos.entry_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can insert entry_photos" ON public.entry_photos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE e.id = entry_photos.entry_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can delete entry_photos" ON public.entry_photos FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE e.id = entry_photos.entry_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owner can read documents"   ON public.documents;
DROP POLICY IF EXISTS "owner can insert documents" ON public.documents;
DROP POLICY IF EXISTS "owner can delete documents" ON public.documents;
CREATE POLICY "owner can read documents"   ON public.documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = documents.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = documents.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can delete documents" ON public.documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = documents.pet_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owner can read conversations"   ON public.conversations;
DROP POLICY IF EXISTS "owner can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "owner can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "owner can delete conversations" ON public.conversations;
CREATE POLICY "owner can read conversations"   ON public.conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = conversations.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = conversations.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can update conversations" ON public.conversations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = conversations.pet_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = conversations.pet_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can delete conversations" ON public.conversations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = conversations.pet_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "owner can read messages"   ON public.messages;
DROP POLICY IF EXISTS "owner can insert messages" ON public.messages;
DROP POLICY IF EXISTS "owner can delete messages" ON public.messages;
CREATE POLICY "owner can read messages"   ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c JOIN public.pets p ON p.id = c.pet_id WHERE c.id = messages.conversation_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c JOIN public.pets p ON p.id = c.pet_id WHERE c.id = messages.conversation_id AND p.user_id = auth.uid()));
CREATE POLICY "owner can delete messages" ON public.messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c JOIN public.pets p ON p.id = c.pet_id WHERE c.id = messages.conversation_id AND p.user_id = auth.uid()));

-- Drop helper and updated_at trigger function (set_updated_at) is invoked only by triggers; keep it.
DROP FUNCTION IF EXISTS public.user_owns_pet(uuid);

-- Lock down set_updated_at (only invoked from triggers; revoke from API roles)
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage RLS: only owner of containing pet/entry can access
CREATE POLICY "owner can read pet-avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pet-avatars' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND (p.avatar_path = name OR name LIKE p.id::text || '/%')));
CREATE POLICY "owner can write pet-avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pet-avatars' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));
CREATE POLICY "owner can update pet-avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pet-avatars' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));
CREATE POLICY "owner can delete pet-avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pet-avatars' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));

CREATE POLICY "owner can read entry-photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entry-photos' AND EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE p.user_id = auth.uid() AND name LIKE e.id::text || '/%'));
CREATE POLICY "owner can write entry-photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entry-photos' AND EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE p.user_id = auth.uid() AND name LIKE e.id::text || '/%'));
CREATE POLICY "owner can delete entry-photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'entry-photos' AND EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE p.user_id = auth.uid() AND name LIKE e.id::text || '/%'));

CREATE POLICY "owner can read documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));
CREATE POLICY "owner can write documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));
CREATE POLICY "owner can delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND name LIKE p.id::text || '/%'));
