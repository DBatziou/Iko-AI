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


-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
                                        id BIGSERIAL PRIMARY KEY,
                                        chat_id BIGINT NOT NULL,
                                        created_by_user_id BIGINT,
                                        content TEXT NOT NULL,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        from_self BOOLEAN DEFAULT FALSE,
                                        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Check if tables exist and show their structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('chats', 'messages')
ORDER BY table_name, ordinal_position;
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

-- Run these SQL commands to add the missing columns to your messages table

-- Add the missing columns to the messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS from_self BOOLEAN DEFAULT FALSE;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'public.messages'
ORDER BY ordinal_position;

-- Optional: Update existing records to have from_self = FALSE if they're null
UPDATE public.messages SET from_self = FALSE WHERE from_self IS NULL;

ALTER TABLE public.messages ALTER COLUMN user_id DROP NOT NULL;

-- Option 2: Or drop the user_id column entirely if you're not using it
-- ALTER TABLE messages DROP COLUMN IF EXISTS user_id;

-- Also verify your messages table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'public.messages'
ORDER BY ordinal_position;


-- Update existing users to have proper ROLE_ prefix
UPDATE public.users
SET role = CASE
               WHEN role = 'SIMPLE_USER' THEN 'ROLE_USER'
               WHEN role = 'ADMINISTRATOR_USER' THEN 'ROLE_ADMIN'
               WHEN role NOT LIKE 'ROLE_%' THEN CONCAT('ROLE_', UPPER(role))
               ELSE role
    END
WHERE role IS NOT NULL;

-- Add some sample chats and messages for testing
-- (Only if you want test data)
INSERT INTO public.chats (user_id, title, created_at)
SELECT u.id, 'Welcome Chat', NOW()
FROM public.users u
WHERE u.username = 'john_doe'
  AND NOT EXISTS (SELECT 1 FROM public.chats c WHERE c.user_id = u.id AND c.title = 'Welcome Chat');

-- Insert a welcome message
INSERT INTO public.messages (chat_id, content, created_at, from_self, created_by_user_id)
SELECT c.id, 'Hello! Welcome to IKO AI. How can I help you today?', NOW(), false, NULL
FROM public.chats c
         JOIN public.users u ON c.user_id = u.id
WHERE u.username = 'john_doe' AND c.title = 'Welcome Chat'
  AND NOT EXISTS (SELECT 1 FROM public.messages m WHERE m.chat_id = c.id);

-- Verify the database structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('users', 'chats', 'messages')
ORDER BY table_name, ordinal_position;