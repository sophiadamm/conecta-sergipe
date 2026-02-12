-- Allow volunteers to cancel (delete) their pending applications (matches)

CREATE POLICY "Voluntários podem cancelar candidaturas pendentes"
  ON public.matches FOR DELETE
  USING (
    status = 'pendente'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = voluntario_id
      AND user_id = auth.uid()
    )
  );
