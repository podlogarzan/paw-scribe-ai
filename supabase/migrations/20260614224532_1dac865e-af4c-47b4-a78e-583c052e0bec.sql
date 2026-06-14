
DROP POLICY IF EXISTS "owner can read pet-avatars" ON storage.objects;
DROP POLICY IF EXISTS "owner can write pet-avatars" ON storage.objects;
DROP POLICY IF EXISTS "owner can update pet-avatars" ON storage.objects;
DROP POLICY IF EXISTS "owner can delete pet-avatars" ON storage.objects;

CREATE POLICY "owner can read pet-avatars" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'pet-avatars'
  AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "owner can write pet-avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pet-avatars'
  AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "owner can update pet-avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'pet-avatars'
  AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);

CREATE POLICY "owner can delete pet-avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'pet-avatars'
  AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.user_id = auth.uid()
      AND storage.objects.name LIKE p.id::text || '/%'
  )
);
