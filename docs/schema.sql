-- delete old orders
with ids as (select o.id
             from orders o
                      left join owner_payment_orders oo on oo.doc_order = o.id
                      left join employee_payment_orders eo on eo.doc_order = o.id
             where o.created_at < '2025-01-01' and oo.doc_order is null and eo.doc_order is null
             order by o.created_at),

     t1 as (DELETE FROM order_comments
WHERE document IN (select * from ids)),

    t2 as (DELETE FROM order_events
WHERE document IN (select * from ids)),

    t3 as (DELETE FROM order_files
WHERE document IN (select * from ids)),

    t4 as (DELETE FROM order_stages
WHERE document IN (select * from ids))

DELETE FROM orders
WHERE id IN (select * from ids);

------------

CREATE INDEX idx_order_events_document_kind_datetime ON order_events (document, kind, datetime DESC);
-- CREATE INDEX idx_order_events_kind_document_datetime ON order_events (kind, document, datetime);

CREATE INDEX idx_order_stages_document_created_at ON order_stages (document, created_at DESC);

---
ALTER TABLE user_conditions disable TRIGGER USER;
---

ALTER TABLE orders ENABLE TRIGGER USER;
ALTER TABLE order_comments ENABLE TRIGGER USER;
ALTER TABLE order_stages ENABLE TRIGGER USER;
ALTER TABLE order_events ENABLE TRIGGER USER;

ALTER TABLE owner_payments ENABLE TRIGGER USER;
ALTER TABLE owner_payment_orders ENABLE TRIGGER USER;

ALTER TABLE employee_payments ENABLE TRIGGER USER;
ALTER TABLE employee_payment_orders ENABLE TRIGGER USER;

---

select max(number)
from orders
where organization = 1

---

TRUNCATE TABLE orders, order_stages, order_comments, order_events, order_files, owner_payments, owner_payment_orders, owner_payment_expenses, employee_payments, employee_payment_orders, employee_payment_settlements RESTART IDENTITY;

---

ALTER TABLE orders DISABLE TRIGGER USER;
ALTER TABLE order_comments DISABLE TRIGGER USER;
ALTER TABLE order_stages DISABLE TRIGGER USER;
ALTER TABLE order_events DISABLE TRIGGER USER;

ALTER TABLE owner_payments DISABLE TRIGGER USER;
ALTER TABLE owner_payment_orders DISABLE TRIGGER USER;

ALTER TABLE employee_payments DISABLE TRIGGER USER;
ALTER TABLE employee_payment_orders DISABLE TRIGGER USER;

---


CREATE OR REPLACE VIEW public.orders_journal as
select
    e.driver,
    e.vehicle,
    case
        when c.driver_percent is not null then round(o.cost * c.driver_percent / 100.0, 2)
        else c.driver_cost
        end as driver_cost,
    o.id,
    o.number,
    o.organization,
    o.broker,
    o.year,
    o.week,
    s.stage,
    s.stage_ts,
    o.cost,
    o.created_at,
    o.created_by,
    o.posted_loads,
    o.refs,
    o.total_pieces,
    o.total_weight,
    o.total_miles,
    o.excluded
from
    orders o
        left join lateral (
        select
            oe.id,
            oe.created_at,
            oe.created_by,
            oe.document,
            oe.kind,
            oe.datetime,
            oe.address,
            oe.city,
            oe.state,
            oe.zip,
            oe.cost,
            oe.driver,
            oe.vehicle,
            oe.details,
            oe.percent
        from
            order_events oe
        where
            oe.document = o.id
          and oe.kind = 'agreement'::order_event_kind
    and oe.datetime <= now()
order by
    oe.datetime desc
    limit
    1
    ) e on true
    left join lateral (
    select
    os.stage,
    os.created_at as stage_ts
    from
    order_stages os
    where
    os.document = o.id
    order by
    os.created_at desc
    limit
    1
    ) s on true
    left join (
    select distinct
    on (oe.document) oe.document,
    oe.cost as driver_cost,
    oe.percent as driver_percent
    from
    order_events oe
    where
    oe.kind = 'agreement'::order_event_kind
    order by
    oe.document,
    oe.datetime
    ) c on c.document = o.id
order by
    o.created_at desc;

create view orders_tracking as
select e.id as event_id,
       e.created_at as event_created_at,
       e.created_by as event_created_by,
       e.kind as event_kind,
       e.datetime as event_datetime,
       e.address as event_address,
       e.city as event_city,
       e.state as event_state,
       e.zip as event_zip,
       e.details as event_details,
       o.*
from orders_journal o
         left join stages s on s.id = o.stage
         left join order_events e on e.document = o.id and ((o.stage in (2, 4) and e.kind in ('pick-up')) or (o.stage in (5, 6) and e.kind in ('delivery')))
where s.is_tracking = true
order by e.datetime;

CREATE OR REPLACE FUNCTION set_team() RETURNS TRIGGER AS $$
BEGIN
SELECT team INTO NEW.team
FROM access_matrix
WHERE user_uuid = auth.uid() AND organization = NEW.organization;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_set_team_on_insert
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE set_team();

CREATE OR REPLACE FUNCTION set_created_by() RETURNS TRIGGER AS $$
BEGIN
SELECT id INTO NEW.created_by
FROM users
WHERE uid = auth.uid();

NEW.created_at = NOW();

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brokers_set_created_by_on_insert
BEFORE INSERT ON brokers
FOR EACH ROW
EXECUTE PROCEDURE set_created_by();


CREATE TABLE order_number_sequences (
    organization INT PRIMARY KEY references organizations (id),
    last_value INT NOT NULL DEFAULT 0
);


CREATE OR REPLACE FUNCTION order_next_number() RETURNS TRIGGER AS $$
BEGIN
-- SELECT COALESCE(MAX(number), 0) + 1 INTO NEW.number
-- FROM orders
-- WHERE organization = NEW.organization;

UPDATE order_number_sequences
SET last_value = last_value + 1
WHERE organization = NEW.organization
RETURNING last_value INTO NEW.number;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER orders_set_number_on_insert
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE order_next_number();

CREATE OR REPLACE FUNCTION week_fixation_function() RETURNS TRIGGER AS $$
DECLARE
dt timestamp;
BEGIN
  IF (SELECT is_week_fixation FROM stages WHERE id = NEW.state) THEN
SELECT NOW() - INTERVAL '1 days' INTO dt;
UPDATE orders
SET week = DATE_PART('week', dt), year = DATE_PART('year', dt)
WHERE id = NEW.document;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER week_fixation_trigger
    AFTER INSERT ON order_stages
    FOR EACH ROW
    EXECUTE FUNCTION week_fixation_function();

CREATE OR REPLACE FUNCTION delete_stage() RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.deleted_by IS NULL AND NEW.deleted_by IS NOT NULL) THEN
    SELECT id INTO NEW.deleted_by
    FROM users
    WHERE uid = auth.uid();

    NEW.deleted_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_stages_revert
    BEFORE UPDATE ON order_stages
    FOR EACH ROW
    EXECUTE PROCEDURE delete_stage();


alter policy "Access by matrix"
on "public"."access_matrix"
to authenticated
using (
    (( SELECT uid() AS uid) = user_uuid)
);

alter policy "Access by matrix"
on "public"."organizations"
to authenticated
using (
  (EXISTS ( SELECT 1   FROM access_matrix oam  WHERE ((oam.organization = organizations.id) AND (oam.user_uuid   = ( SELECT auth.uid() AS uuid)))))
);


alter policy "Access by matrix (read)"
on "public"."brokers"
to public
using (
  EXISTS ( SELECT 1
  FROM access_matrix oam
  WHERE (oam.is_admin = true OR oam.is_dispatcher = true OR oam.is_tracking = true) AND oam.user_uuid = auth.uid() )
);

-- TODO order update policy
((created_by IN ( SELECT oam.user_id
    FROM access_matrix oam
    WHERE ((oam.organization = orders.organization) AND (oam.user_uuid = uid())))) OR (EXISTS ( SELECT 1
    FROM access_matrix oam
    WHERE ((oam.is_admin = true) AND (oam.user_uuid = uid())))))

-- police for admin
EXISTS ( SELECT 1
FROM access_matrix oam
WHERE oam.is_admin = true AND oam.user_uuid = auth.uid() )

-- add hr and OR (oam.is_accountant = true)

(EXISTS ( SELECT 1
   FROM access_matrix oam
  WHERE (((oam.is_admin = true) OR (oam.is_dispatcher = true) OR (oam.is_hr = true ) OR (oam.is_accountant = true)) AND (oam.user_uuid = auth.uid()))))


alter policy "Access by matrix (create)"
on "public"."brokers"
to authenticated
with check (
  EXISTS ( SELECT 1
  FROM access_matrix oam
  WHERE (oam.is_admin = true OR oam.is_dispatcher = true) AND oam.user_uuid = auth.uid() )
);

alter policy "Access by matrix (update)"
on "public"."brokers"
to authenticated
with check (
  EXISTS ( SELECT 1
  FROM access_matrix oam
  WHERE (oam.is_admin = true OR oam.is_dispatcher = true) AND oam.user_uuid = auth.uid() )
);

(EXISTS ( SELECT 1
    FROM access_matrix oam
    WHERE ((oam.user_uuid = ( SELECT auth.uid() AS uid)) AND ((oam.is_admin = true) OR (oam.is_tracking = true) OR ((oam.is_dispatcher = true) AND ( SELECT COALESCE(( SELECT s.is_dispatcher
    FROM (order_stages os
    LEFT JOIN stages s ON ((s.id = os.stage)))
    WHERE (os.document = orders.id)
    ORDER BY os.created_at DESC
    LIMIT 1), true) AS "allow") AND ((oam.user_id = orders.created_by) OR (oam.team = orders.team)))))))



(EXISTS ( SELECT 1
   FROM access_matrix oam
  WHERE (((oam.is_admin = true) OR (oam.is_dispatcher = true) OR (oam.is_payroll_accountant = true)) AND (oam.user_uuid = auth.uid()))))


create view public.owner_unpaid_orders as
select
    opo.doc_payment,
    v.owner,
    o.driver,
    o.vehicle,
    o.driver_cost,
    o.id,
    o.number,
    o.created_at,
    o.created_by,
    o.posted_loads,
    o.refs,
    o.organization,
    o.broker,
    o.total_pieces,
    o.total_weight,
    o.total_miles,
    o.cost,
    o.stage,
    o.excluded,
    o.year,
    o.week
from
    orders_journal o
        left join vehicles v on v.id = o.vehicle
        left join owner_payment_orders opo on opo.doc_order = o.id
where
    opo.doc_payment is null
  and o.year is not null
  and o.week is not null;


create view public.owner_unpaid_expenses as
select
    oe.id,
    oe.created_at,
    oe.owner,
    oe.notes,
    oe.amount,
    oe.created_by,
    oe.organization
from
    owner_expenses oe
        left join owner_payment_expenses ope on ope.doc_expense = oe.id
where
    ope.doc_payment is null;


create view public.owner_payments_journal as
select
    p.id,
    p.created_at,
    p.created_by,
    p.organization,
    p.owner,
    p.year,
    p.week,
    COALESCE(ps.order_cost, 0::numeric) as orders,
    COALESCE(px.amount, 0::numeric) as expenses,
    COALESCE(ps.amount, 0::numeric) as amount,
    COALESCE(ps.amount, 0::numeric) - COALESCE(px.amount, 0::numeric) as payout
from
    owner_payments p
        left join lateral (
        select
            o.doc_payment,
            sum(o.order_cost) as order_cost,
            sum(o.amount) as amount
        from
            owner_payment_orders o
        group by
            o.doc_payment
            ) ps on ps.doc_payment = p.id
        left join lateral (
        select
            ex.doc_payment,
            sum(ex.amount) as amount
        from
            owner_payment_expenses ex
        group by
            ex.doc_payment
            ) px on px.doc_payment = p.id;


create view public.employee_unpaid_orders as
select
    o.id,
    o.number,
    o.created_at,
    o.created_by as employee,
    o.posted_loads,
    o.refs,
    o.organization,
    o.broker,
    o.total_pieces,
    o.total_weight,
    o.total_miles,
    o.cost,
    o.driver_cost as driver_payment,
    o.stage,
    o.excluded,
    o.year,
    o.week
from orders_journal o
left join vehicles v on v.id = o.vehicle
left join employee_payment_orders p on p.doc_order = o.id
where p.doc_payment is null
  and o.year is not null
  and o.week is not null;


create view public.employee_unpaid_settlements as
select
    es.id,
    es.created_at,
    es.created_by,
    es.organization,
    es.employee,
    es.notes,
    es.amount
from
    employee_settlements es
    left join employee_payment_settlements p on p.doc_settlements = es.id
where
    p.doc_payment is null;


create view public.employee_payments_journal as
select
    ep.id,
    ep.created_at,
    ep.created_by,
    ep.organization,
    ep.dispatcher, -- TODO employee
    ep.month,
    ep.year,
    ep.percent_of_gross,
    ep.percent_of_driver,
    ep.to_pay,
    ep.ex_rate,
    ep.income_tax,
    COALESCE(ps.number::numeric, 0::numeric) as number_of_orders,
    COALESCE(ps.order_cost, 0::numeric) as gross,
    COALESCE(ps.amount, 0::numeric) as driver_payment,
    COALESCE(pe.amount, 0::numeric) as settlements,
    COALESCE(ep.to_pay, 0::numeric) + COALESCE(pe.amount, 0::numeric)  as payout
from
    employee_payments ep
        left join lateral (
        select
            o.doc_payment,
            count(o.doc_order) as number,
            sum(o.amount) as amount,
            sum(o.order_cost) as order_cost
        from
            employee_payment_orders o
                join orders on orders.id = o.doc_order
        where
            orders.excluded = false
        group by
            o.doc_payment
            ) ps on ps.doc_payment = ep.id
        left join lateral (
        select
            es.doc_payment,
            sum(es.amount) as amount
        from
            employee_payment_settlements es
        group by
            es.doc_payment
            ) pe on pe.doc_payment = ep.id;

-- create view public.employee_payment_journal as
-- create view public.employee_unpaid_settlements as
-- create view public.employee_unpaid_orders as

-- create view public.owner_payments_journal as
-- create view public.owner_unpaid_expenses as
-- create view public.owner_unpaid_orders as

create view public.quick_pays_journal WITH (security_invoker = on) as
select
    qp.id as qp_id,
    qp.created_at as qp_created_at,
    qp.created_by as qp_created_by,
    qp.document as qp_document,
    qp.driver as qp_driver,
    qp.owner as qp_owner,
    qp.vehicle as qp_vehicle,
    qp.amount as qp_amount,
    qp.organization as qp_organization,
    qp.note as qp_note,
    s.stage as qp_stage,
    s.stage_created_at as qp_stage_created_at
    o.*,
from
    quick_pays qp
        left join orders_journal o on o.id = qp.document
        left join lateral (
        select
            qps.stage as stage,
            qps.created_at as stage_created_at
        from
            quick_pay_stages qps
        where
            qps.document = qp.id
        order by
            qps.created_at desc
            limit
    1
  ) s on true;


-- async function load_unpaid_orders(orgId: number | null, userId: number | null) {
--     let requestPayments = supabase
--       .from('employee_unpaid_orders')
--       .select('*')
--       .eq('organization', orgId)
--
--     if (userId) {
--       requestPayments = requestPayments.or(
--         'created_by.eq.' + userId + ',vehicle_found_by.eq.' + userId,
--       )
--     }
--
--     const responsePayments = await requestPayments
--
--     const map = new Map<number, Array<EmployeePaymentRecord>>()
--     responsePayments.data?.forEach((json) => {
--
--       const record = {
--         employee: json['created_by'],
--         employee_payment: 0,
--         order: json as Order,
--       } as EmployeePaymentRecord
--
--       const key = record.employee
--       const list = map.get(key) ?? []
--       list.push(record)
--       map.set(key, list)
--
--       if (json['vehicle_found_by']) {
--         const record = {
--           employee: json['vehicle_found_by'],
--           employee_payment: 0,
--           order: json as Order,
--         } as EmployeePaymentRecord
--
--         const key = record.employee
--         const list = map.get(key) ?? []
--         list.push(record)
--         map.set(key, list)
--       }
--     })
--
--     console.log('Итоговый mapping:', map)
--     return map
--   }
