-- Чтение брокеров бухгалтером
alter policy "Access by matrix (read)"
on "public"."brokers"
to authenticated
using (
  exists (
    select 1
    from access_matrix oam
    where (oam.is_admin = true
        or oam.is_dispatcher = true
        or oam.is_tracking = true
        or oam.is_accountant = true)
      and oam.user_uuid = auth.uid()
  )
);

-- Редактирование брокеров бухгалтером
alter policy "Access by matrix (update)"
on "public"."brokers"
to authenticated
using (
  exists (
    select 1
    from access_matrix oam
    where (oam.is_admin = true
        or oam.is_dispatcher = true
        or oam.is_accountant = true)
      and oam.user_uuid = auth.uid()
  )
)
with check (
  exists (
    select 1
    from access_matrix oam
    where (oam.is_admin = true
        or oam.is_dispatcher = true
        or oam.is_accountant = true)
      and oam.user_uuid = auth.uid()
  )
);
