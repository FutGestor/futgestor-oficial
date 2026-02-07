

# Primeiro Acesso como Admin

## Problema Identificado
Sua conta (`futgestor@gmail.com`) foi criada e o email ja esta confirmado, porem:
- O perfil na tabela `profiles` nao foi criado (o trigger automatico pode nao existir ou falhou)
- Nenhum papel de admin foi atribuido na tabela `user_roles`

Por isso, ao tentar fazer login, o sistema mostra "Aguardando aprovacao" e faz logout.

## O que sera feito

### 1. Criar seu perfil na tabela `profiles`
Inserir um registro com `aprovado = true` para que o sistema permita o login.

### 2. Atribuir o papel de admin
Inserir um registro na tabela `user_roles` com o papel `admin` para seu usuario.

### 3. Verificar o trigger de criacao de perfil
Garantir que exista um trigger `handle_new_user` para que futuros usuarios tenham seus perfis criados automaticamente ao se cadastrar.

## Detalhes Tecnicos

### Migracoes SQL necessarias

**Inserir perfil e role de admin:**
```sql
INSERT INTO public.profiles (id, nome, aprovado)
VALUES ('6dcc735a-95a8-498a-bc21-2a94cdb0a893', 'FutGestor Admin', true)
ON CONFLICT (id) DO UPDATE SET aprovado = true;

INSERT INTO public.user_roles (user_id, role)
VALUES ('6dcc735a-95a8-498a-bc21-2a94cdb0a893', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Verificar/criar trigger para novos usuarios:**
Verificar se a funcao `handle_new_user` existe e cria automaticamente um perfil quando um novo usuario se cadastra. Se nao existir, criar:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, aprovado)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    false
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Resultado esperado
Apos a implementacao, voce podera fazer login com `futgestor@gmail.com` e sera redirecionado diretamente para o painel administrativo (`/admin`).

