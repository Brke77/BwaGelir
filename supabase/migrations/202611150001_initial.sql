-- KasaFlow: all money is integer kuruş; no service role required by the application.
begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  name text not null default '' check (length(name) <= 80),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  theme text not null default 'system' check (theme in ('light','dark','system')),
  budget_alerts boolean not null default true,
  currency text not null default 'TRY' check (currency = 'TRY'),
  language text not null default 'tr' check (language = 'tr'),
  timezone text not null default 'Europe/Istanbul' check (timezone = 'Europe/Istanbul'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('cash','bank','savings','other')),
  opening_balance bigint not null default 0 check (abs(opening_balance) <= 100000000000),
  currency text not null default 'TRY' check (currency = 'TRY'),
  description text not null default '' check (length(description) <= 500),
  color text not null default '#648a54' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('income','expense')),
  color text not null default '#648a54' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null default 'wallet' check (icon in ('shopping','home','receipt','car','heart','book','coffee','plane','briefcase','gift','wallet','paw')),
  archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id), unique (id, user_id, kind)
);
create unique index categories_name_unique on public.categories(user_id,kind,lower(trim(name)));
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('income','expense')),
  amount bigint not null check (amount between 1 and 100000000000),
  category_id uuid not null, account_id uuid not null,
  start_date date not null check (start_date between '1900-01-01' and '2199-12-31'),
  end_date date check (end_date >= start_date and end_date <= '2199-12-31'),
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly')),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id,user_id) references public.accounts(id,user_id),
  foreign key (category_id,user_id,kind) references public.categories(id,user_id,kind)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  kind text not null check (kind in ('income','expense','transfer')),
  amount bigint not null check (amount between 1 and 100000000000),
  date date not null check (date between '1900-01-01' and '2199-12-31' and date <= (now() at time zone 'Europe/Istanbul')::date),
  category_id uuid, account_id uuid not null, to_account_id uuid,
  description text not null default '' check (length(description) <= 500),
  recurring_rule_id uuid, occurrence_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id), unique (recurring_rule_id, occurrence_date),
  check ((kind = 'transfer' and category_id is null and to_account_id is not null and to_account_id <> account_id)
    or (kind in ('income','expense') and category_id is not null and to_account_id is null)),
  foreign key (account_id,user_id) references public.accounts(id,user_id),
  foreign key (to_account_id,user_id) references public.accounts(id,user_id),
  foreign key (category_id,user_id,kind) references public.categories(id,user_id,kind),
  foreign key (recurring_rule_id,user_id) references public.recurring_rules(id,user_id) on delete set null (recurring_rule_id)
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  amount bigint not null check (amount between 1 and 100000000000),
  month date not null check (extract(day from month) = 1 and month between '1900-01-01' and '2199-12-31'),
  category_id uuid, account_id uuid,
  category_kind text not null default 'expense' check (category_kind = 'expense'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (account_id,user_id) references public.accounts(id,user_id),
  foreign key (category_id,user_id,category_kind) references public.categories(id,user_id,kind)
);
create unique index budget_scope_unique on public.budgets(user_id,month,coalesce(category_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(account_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table public.recurring_occurrences (
  rule_id uuid not null, date date not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (rule_id,date),
  foreign key (rule_id,user_id) references public.recurring_rules(id,user_id) on delete cascade,
  foreign key (transaction_id,user_id) references public.transactions(id,user_id) on delete set null (transaction_id)
);

create index transactions_user_date_idx on public.transactions(user_id,date desc,id);
create index transactions_account_idx on public.transactions(user_id,account_id);
create index transactions_target_idx on public.transactions(user_id,to_account_id) where to_account_id is not null;
create index transactions_category_idx on public.transactions(user_id,category_id,date);
create index budgets_user_month_idx on public.budgets(user_id,month);
create index recurring_user_active_idx on public.recurring_rules(user_id,active);
create index occurrences_user_idx on public.recurring_occurrences(user_id,date);
create index accounts_user_idx on public.accounts(user_id);
create index categories_user_idx on public.categories(user_id);

-- A small database-backed write limiter works across Vercel instances.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.write_buckets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null
);
alter table private.write_buckets enable row level security;
revoke all on private.write_buckets from public, anon, authenticated;
create function public.consume_write_limit() returns boolean
language plpgsql security definer set search_path = '' as $$
declare who uuid := auth.uid(); bucket timestamptz := date_trunc('minute',now()); hits integer;
begin
  if who is null then return false; end if;
  insert into private.write_buckets(user_id,window_start,requests) values(who,bucket,1)
    on conflict(user_id) do update set window_start=excluded.window_start,
      requests=case when private.write_buckets.window_start=excluded.window_start then least(private.write_buckets.requests+1,1000000) else 1 end
    returning requests into hits;
  return hits <= 120;
end $$;
revoke all on function public.consume_write_limit() from public;
grant execute on function public.consume_write_limit() to authenticated;

create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','user_preferences','accounts','categories','transactions','budgets','recurring_rules','recurring_occurrences'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;

-- Prevent new assignments to archived categories, while allowing historical edits.
create function public.check_active_category() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.category_id is not null and (tg_op = 'INSERT' or new.category_id is distinct from old.category_id) then
    if exists(select 1 from public.categories where id = new.category_id and user_id = auth.uid() and archived) then
      raise exception 'CATEGORY_ARCHIVED' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger transaction_active_category before insert or update on public.transactions for each row execute function public.check_active_category();
create trigger rule_active_category before insert or update on public.recurring_rules for each row execute function public.check_active_category();
create trigger budget_active_category before insert or update on public.budgets for each row execute function public.check_active_category();

-- Only this trigger uses definer rights, to provision an empty new account.
create function public.on_user_created() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id,name) values(new.id,left(coalesce(new.raw_user_meta_data->>'name',''),80));
  insert into public.user_preferences(user_id) values(new.id);
  insert into public.categories(user_id,name,kind,color,icon) values
    (new.id,'Market','expense','#648a54','shopping'), (new.id,'Ev & Kira','expense','#8c78c5','home'),
    (new.id,'Faturalar','expense','#d5a35e','receipt'), (new.id,'Ulaşım','expense','#5e91b5','car'),
    (new.id,'Yeme & İçme','expense','#d17a64','coffee'), (new.id,'Alışveriş','expense','#bd78a5','gift'),
    (new.id,'Sağlık','expense','#67a59e','heart'), (new.id,'Seyahat','expense','#8289bd','plane'),
    (new.id,'Maaş','income','#648a54','briefcase'), (new.id,'Ek Gelir','income','#5e91b5','wallet');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.on_user_created();

-- Same anchoring as the UI: Jan 31 -> Feb 28/29 -> Mar 31.
create function public.scheduled_date(p_start date,p_frequency text,p_index integer) returns date
language plpgsql immutable set search_path = '' as $$
declare base date; last_day integer;
begin
  if p_index < 0 then raise exception 'INVALID_INDEX'; end if;
  if p_frequency = 'daily' then return p_start + p_index; end if;
  if p_frequency = 'weekly' then return p_start + p_index * 7; end if;
  if p_frequency not in ('monthly','yearly') then raise exception 'INVALID_FREQUENCY'; end if;
  base := (date_trunc('month',p_start) + make_interval(months => p_index * case when p_frequency = 'yearly' then 12 else 1 end))::date;
  last_day := extract(day from (base + interval '1 month - 1 day'))::integer;
  return base + least(extract(day from p_start)::integer,last_day) - 1;
end $$;

create function public.realize_occurrence(p_rule_id uuid,p_date date) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare r public.recurring_rules; n integer; tx uuid := gen_random_uuid();
begin
  select * into r from public.recurring_rules where id = p_rule_id and user_id = auth.uid() for update;
  if not found or not r.active then raise exception 'RULE_NOT_AVAILABLE'; end if;
  if p_date < r.start_date or p_date > coalesce(r.end_date,'2199-12-31'::date) or p_date > (now() at time zone 'Europe/Istanbul')::date then raise exception 'INVALID_OCCURRENCE_DATE'; end if;
  n := case r.frequency when 'daily' then p_date-r.start_date when 'weekly' then (p_date-r.start_date)/7
    when 'monthly' then (extract(year from p_date)::int-extract(year from r.start_date)::int)*12+extract(month from p_date)::int-extract(month from r.start_date)::int
    else extract(year from p_date)::int-extract(year from r.start_date)::int end;
  if public.scheduled_date(r.start_date,r.frequency,n) <> p_date then raise exception 'INVALID_OCCURRENCE_DATE'; end if;
  if exists(select 1 from public.recurring_occurrences where rule_id=r.id and date=p_date) then raise exception 'ALREADY_REALIZED' using errcode='23505'; end if;
  insert into public.transactions(id,name,kind,amount,date,category_id,account_id,description,recurring_rule_id,occurrence_date)
    values(tx,r.name,r.kind,r.amount,p_date,r.category_id,r.account_id,'Düzenli ödeme',r.id,p_date);
  insert into public.recurring_occurrences(rule_id,date,transaction_id) values(r.id,p_date,tx);
  return tx;
end $$;

create function public.get_workspace(p_start date,p_end date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb; from_date date; to_date date;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
  if p_start > p_end or p_start < '1900-01-01' or p_end > '2199-12-31' or p_end-p_start > 1096 then raise exception 'INVALID_RANGE'; end if;
  from_date := date_trunc('month',p_start)::date;
  to_date := (date_trunc('month',p_end) + interval '1 month - 1 day')::date;
  if (select count(*) from public.transactions where user_id=auth.uid() and date between from_date and to_date) > 10000 then raise exception 'RANGE_TOO_LARGE'; end if;
  select jsonb_build_object(
    'previous_summary',jsonb_build_object(
      'income',coalesce((select sum(amount) from public.transactions where user_id=auth.uid() and kind='income' and date >= p_start-(p_end-p_start+1) and date < p_start),0),
      'expense',coalesce((select sum(amount) from public.transactions where user_id=auth.uid() and kind='expense' and date >= p_start-(p_end-p_start+1) and date < p_start),0)),
    'previous_expenses',coalesce((select jsonb_agg(x) from (select category_id,sum(amount) as amount from public.transactions where user_id=auth.uid() and kind='expense' and date >= p_start-(p_end-p_start+1) and date < p_start group by category_id) x),'[]'::jsonb),
    'accounts', coalesce((select jsonb_agg(to_jsonb(a) || jsonb_build_object(
      'balance', a.opening_balance + coalesce((select sum(case when t.kind='transfer' then case when t.account_id=a.id then -t.amount else t.amount end when t.kind='income' then t.amount else -t.amount end) from public.transactions t where t.user_id=auth.uid() and (t.account_id=a.id or t.to_account_id=a.id)),0),
      'period_opening_balance',a.opening_balance + coalesce((select sum(case when t.kind='transfer' then case when t.account_id=a.id then -t.amount else t.amount end when t.kind='income' then t.amount else -t.amount end) from public.transactions t where t.user_id=auth.uid() and t.date < p_start and (t.account_id=a.id or t.to_account_id=a.id)),0)
    )) from public.accounts a where a.user_id=auth.uid()),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(c order by c.name) from public.categories c where c.user_id=auth.uid()),'[]'::jsonb),
    'transactions',coalesce((select jsonb_agg(t order by t.date desc,t.created_at desc,t.id) from public.transactions t where t.user_id=auth.uid() and t.date between from_date and to_date),'[]'::jsonb),
    'budgets',coalesce((select jsonb_agg(b) from public.budgets b where b.user_id=auth.uid() and b.month between from_date and to_date),'[]'::jsonb),
    'recurring_rules',coalesce((select jsonb_agg(r) from public.recurring_rules r where r.user_id=auth.uid()),'[]'::jsonb),
    'recurring_occurrences',coalesce((select jsonb_agg(o) from public.recurring_occurrences o where o.user_id=auth.uid()),'[]'::jsonb),
    'preferences', jsonb_build_object('name',coalesce((select name from public.profiles where user_id=auth.uid()),''),'theme',coalesce((select theme from public.user_preferences where user_id=auth.uid()),'system'),'budget_alerts',coalesce((select budget_alerts from public.user_preferences where user_id=auth.uid()),true))
  ) into result;
  return result;
end $$;

create function public.save_preferences(p_name text,p_theme text,p_alerts boolean) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.profiles(user_id,name) values(auth.uid(),p_name) on conflict(user_id) do update set name=excluded.name;
  insert into public.user_preferences(user_id,theme,budget_alerts) values(auth.uid(),p_theme,p_alerts) on conflict(user_id) do update set theme=excluded.theme,budget_alerts=excluded.budget_alerts;
end $$;

create function public.clear_financial_data() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.recurring_occurrences where user_id=auth.uid();
  delete from public.transactions where user_id=auth.uid();
  delete from public.recurring_rules where user_id=auth.uid();
  delete from public.budgets where user_id=auth.uid();
  delete from public.categories where user_id=auth.uid();
  delete from public.accounts where user_id=auth.uid();
end $$;

-- PostgreSQL grants function execution to PUBLIC by default; close it explicitly.
revoke all on function public.on_user_created() from public;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.check_active_category() from public;
revoke all on function public.scheduled_date(date,text,integer) from public;
revoke all on function public.realize_occurrence(uuid,date) from public;
revoke all on function public.get_workspace(date,date) from public;
revoke all on function public.save_preferences(text,text,boolean) from public;
revoke all on function public.clear_financial_data() from public;
grant execute on function public.scheduled_date(date,text,integer),public.realize_occurrence(uuid,date),public.get_workspace(date,date),public.save_preferences(text,text,boolean),public.clear_financial_data() to authenticated;
grant usage on schema public to authenticated;
commit;
