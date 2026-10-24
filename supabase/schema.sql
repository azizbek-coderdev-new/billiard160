-- Biliyard160: Supabase SQL Editor'da bir marta ishga tushiring
create table settings (id int primary key default 1 check (id=1), hourly_rate int not null default 40000, rounding int not null default 100);
insert into settings default values;

create table tables (id int primary key, name text not null, started_at timestamptz);
insert into tables values (1,'Stol 1',null),(2,'Stol 2',null),(3,'Stol 3',null);

create table menu_items (id bigserial primary key, name text not null, price int not null check (price>=0), created_at timestamptz default now());
insert into menu_items (name,price) values ('Choy',5000),('Suv 0.5L',3000),('Cola 0.5L',10000),('Chips',12000);

create table order_items (id bigserial primary key, table_id int not null references tables(id), name text not null, price int not null, qty int not null default 1 check (qty>0), created_at timestamptz default now());

create table checks (id bigserial primary key, table_id int not null, table_name text not null, started_at timestamptz not null, ended_at timestamptz not null default now(),
  duration_sec int not null, time_sum int not null, items jsonb not null default '[]', items_sum int not null default 0, total int not null, created_at timestamptz default now());

-- Faqat login qilgan admin ruxsat oladi
do $$ declare t text; begin
 foreach t in array array['settings','tables','menu_items','order_items','checks'] loop
  execute format('alter table %I enable row level security', t);
  execute format('create policy "admin" on %I for all to authenticated using (true) with check (true)', t);
 end loop; end $$;

-- Vaqt serverda olinadi (kompyuter soatiga bog'liq emas)
create or replace function start_table(p_table int) returns void language sql as $$
  update tables set started_at = now() where id = p_table and started_at is null; $$;

create or replace function close_table(p_table int) returns jsonb language plpgsql as $$
declare t tables; s settings; secs int; tsum int; isum int; its jsonb; c checks;
begin
  select * into t from tables where id = p_table for update;
  if t.started_at is null then raise exception 'Stol o''yinda emas'; end if;
  select * into s from settings where id = 1;
  secs := extract(epoch from (now() - t.started_at))::int;
  tsum := (round(s.hourly_rate::numeric * secs / 3600 / s.rounding) * s.rounding)::int;
  select coalesce(jsonb_agg(jsonb_build_object('name',name,'price',price,'qty',qty) order by id),'[]'), coalesce(sum(price*qty),0)
    into its, isum from order_items where table_id = p_table;
  insert into checks (table_id,table_name,started_at,duration_sec,time_sum,items,items_sum,total)
    values (p_table,t.name,t.started_at,secs,tsum,its,isum,tsum+isum) returning * into c;
  delete from order_items where table_id = p_table;
  update tables set started_at = null where id = p_table;
  return to_jsonb(c);
end $$;
