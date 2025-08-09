CREATE TABLE IF NOT EXISTS public.users
(
    id       bigserial primary key,
    username text

);


CREATE TABLE IF NOT EXISTS public.chats
(
    id      bigserial primary key,
    user_id bigint not null,
    title   text
);

-- .....1 month later

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email text unique;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password text;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role text;


INSERT INTO public.users (username, email, password, name, role)
VALUES ('john_doe', 'john_doe@example.com', '1234', 'John Doe', 'SIMPLE_USER'),
       ('jane_doe', 'jane_doe@example.com', '5678', 'Jane Doe', 'ADMINISTRATOR_USER')
ON CONFLICT (email) DO NOTHING;



INSERT INTO public.chats (user_id, title)
VALUES ((SELECT id FROM public.users WHERE email = 'john_doe@example.com'), 'Daily Standup'),
       ((SELECT id FROM public.users WHERE email = 'john_doe@example.com'), 'Project Planning'),
       ((SELECT id FROM public.users WHERE email = 'john_doe@example.com'), 'Budget Review'),
       ((SELECT id FROM public.users WHERE email = 'john_doe@example.com'), 'Retrospective'),
       ((SELECT id FROM public.users WHERE email = 'john_doe@example.com'), 'Design Discussion'),
       ((SELECT id FROM public.users WHERE email = 'jane_doe@example.com'), 'Daily Standup'),
       ((SELECT id FROM public.users WHERE email = 'jane_doe@example.com'), 'Admin Team Meeting'),
       ((SELECT id FROM public.users WHERE email = 'jane_doe@example.com'), 'User Feedback'),
       ((SELECT id FROM public.users WHERE email = 'jane_doe@example.com'), 'Roadmap Session'),
       ((SELECT id FROM public.users WHERE email = 'jane_doe@example.com'), 'Marketing Sync');


ALTER TABLE public.chats
    ADD COLUMN IF NOT EXISTS created_at timestamp;

