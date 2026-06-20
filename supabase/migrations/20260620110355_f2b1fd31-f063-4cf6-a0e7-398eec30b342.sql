
-- Fix documents bucket policies: anchor to objects.name instead of pet.name
DROP POLICY IF EXISTS "owner can read documents" ON storage.objects;
DROP POLICY IF EXISTS "owner can write documents" ON storage.objects;
DROP POLICY IF EXISTS "owner can delete documents" ON storage.objects;

CREATE POLICY "owner can read documents" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "owner can write documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "owner can delete documents" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

-- Fix entry-photos bucket policies: anchor to objects.name based on entry id
DROP POLICY IF EXISTS "owner can read entry-photos" ON storage.objects;
DROP POLICY IF EXISTS "owner can write entry-photos" ON storage.objects;
DROP POLICY IF EXISTS "owner can delete entry-photos" ON storage.objects;

CREATE POLICY "owner can read entry-photos" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'entry-photos' AND EXISTS (
    SELECT 1 FROM public.entries e
    JOIN public.pets p ON p.id = e.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE e.id::text || '/%'
  )
);

CREATE POLICY "owner can write entry-photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'entry-photos' AND EXISTS (
    SELECT 1 FROM public.entries e
    JOIN public.pets p ON p.id = e.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE e.id::text || '/%'
  )
);

CREATE POLICY "owner can delete entry-photos" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'entry-photos' AND EXISTS (
    SELECT 1 FROM public.entries e
    JOIN public.pets p ON p.id = e.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE e.id::text || '/%'
  )
);

-- Add chat-photos bucket policies (paths are conversationId/filename)
DROP POLICY IF EXISTS "owner can read chat-photos" ON storage.objects;
DROP POLICY IF EXISTS "owner can write chat-photos" ON storage.objects;
DROP POLICY IF EXISTS "owner can delete chat-photos" ON storage.objects;

CREATE POLICY "owner can read chat-photos" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-photos' AND EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.pets p ON p.id = c.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE c.id::text || '/%'
  )
);

CREATE POLICY "owner can write chat-photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-photos' AND EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.pets p ON p.id = c.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE c.id::text || '/%'
  )
);

CREATE POLICY "owner can delete chat-photos" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-photos' AND EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.pets p ON p.id = c.pet_id
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE c.id::text || '/%'
  )
);
