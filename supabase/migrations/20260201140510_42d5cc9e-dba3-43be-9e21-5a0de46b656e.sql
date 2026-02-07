-- Deletar usuário órfão que não tem profile correspondente
DELETE FROM auth.users WHERE email = 'tuckmantel86@gmail.com';