drop table value;
drop table location;
drop table company;
drop table localuser;

create table localuser(
  id serial primary key,
  name text not null unique,
  password text not null
);

create table company(
  id serial primary key,
  name text not null,
  creator_id int references localuser(id)
);

create table value(
  id serial primary key,
  name text not null,
  company_id int references company(id) on delete cascade
);

create table location(
  id serial primary key,
  latitude real not null,
  longitude real not null,
  company_id int references company(id) on delete cascade
);
