
-- Reset password for futgestor@gmail.com to temporary: TralhasAdmin2024!
UPDATE auth.users 
SET encrypted_password = crypt('TralhasAdmin2024!', gen_salt('bf'))
WHERE email = 'futgestor@gmail.com';
