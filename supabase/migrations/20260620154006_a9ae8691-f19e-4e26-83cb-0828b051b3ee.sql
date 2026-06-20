
CREATE POLICY "owner can update documents" ON public.documents
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = documents.pet_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = documents.pet_id AND p.user_id = auth.uid()));

CREATE POLICY "owner can update documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND objects.name LIKE (p.id::text || '/%')))
WITH CHECK (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM public.pets p WHERE p.user_id = auth.uid() AND objects.name LIKE (p.id::text || '/%')));

CREATE POLICY "owner can update entry-photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'entry-photos' AND EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE p.user_id = auth.uid() AND objects.name LIKE (e.id::text || '/%')))
WITH CHECK (bucket_id = 'entry-photos' AND EXISTS (SELECT 1 FROM public.entries e JOIN public.pets p ON p.id = e.pet_id WHERE p.user_id = auth.uid() AND objects.name LIKE (e.id::text || '/%')));

CREATE POLICY "owner can update chat-photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'chat-photos' AND EXISTS (SELECT 1 FROM public.conversations c JOIN public.pets p ON p.id = c.pet_id WHERE p.user_id = auth.uid() AND objects.name LIKE (c.id::text || '/%')))
WITH CHECK (bucket_id = 'chat-photos' AND EXISTS (SELECT 1 FROM public.conversations c JOIN public.pets p ON p.id = c.pet_id WHERE p.user_id = auth.uid() AND objects.name LIKE (c.id::text || '/%')));
