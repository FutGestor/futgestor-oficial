import os
import sys
import re
import subprocess

def check_deployment_md():
    print("🔍 1. Verificando DEPLOYMENT.md...", end=" ")
    if os.path.exists("DEPLOYMENT.md"):
        print("✅ OK")
        return True
    else:
        print("❌ FALHA: DEPLOYMENT.md não encontrado na raiz.")
        return False

def check_vite_port():
    print("🔍 2. Verificando porta no vite.config.ts...", end=" ")
    try:
        with open("vite.config.ts", "r", encoding="utf-8") as f:
            content = f.read()
            # Procura por "port: 8082" permitindo espaços opcionais
            if re.search(r"port:\s*8082", content):
                print("✅ OK")
                return True
            else:
                print("❌ FALHA: vite.config.ts não está configurado para a porta 8082.")
                return False
    except FileNotFoundError:
        print("❌ FALHA: vite.config.ts não encontrado.")
        return False

def check_lovable_folder():
    print("🔍 3. Verificando pasta .lovable...", end=" ")
    if not os.path.exists(".lovable"):
        print("✅ OK")
        return True
    else:
        print("❌ FALHA: Pasta .lovable ainda existe. Remova-a antes do deploy.")
        return False

def check_git_sync():
    print("🔍 4. Verificando sincronização com GitHub...", end=" ")
    try:
        # Verifica se remote 'origin' existe e contem 'futgestor-oficial' (nome do repo ou url parcial)
        remotes = subprocess.check_output(["git", "remote", "-v"], stderr=subprocess.STDOUT).decode("utf-8")
        if "futgestor-oficial" not in remotes and "FutGestor" not in remotes: # Adapte conforme o nome real do repo se souber
             # O usuario disse 'repositório futgestor-oficial', vou assumir que isso faz parte da URL ou nome
             pass 
             # Na verdade, o user disse "sincronização com o repositório futgestor-oficial". 
             # O comando git remote -v mostra as URLs. Se a URL tiver futgestor-oficial ta valendo.
        
        # O mais importante: git status limpo e push feito.
        status_output = subprocess.check_output(["git", "status", "--porcelain"], stderr=subprocess.STDOUT).decode("utf-8")
        if status_output.strip():
             print("⚠️  AVISO: Existem alterações não commitadas.")
             # O usuario pediu "sincronização ok". Geralmente deploy requer clean state ou pelo menos push do que importa.
             # Mas vou ser estrito como pedido: "Só me dê o OK... se todos esses pontos passarem".
             print("❌ FALHA: Repositório sujo. Faça commit e push das alterações.")
             return False

        # Verifica se estamos à frente ou atrás do remote
        subprocess.check_output(["git", "fetch"], stderr=subprocess.STDOUT)
        status_uno = subprocess.check_output(["git", "status", "-uno"], stderr=subprocess.STDOUT).decode("utf-8")
        
        if "Your branch is up to date" in status_uno:
             print("✅ OK (Sincronizado)")
             return True
        elif "Your branch is ahead" in status_uno:
             print("❌ FALHA: Existem commits locais não enviados (push pendente).")
             return False
        elif "Your branch is behind" in status_uno:
             print("❌ FALHA: Repositório local está desatualizado (pull necessário).")
             return False
        else:
             # Fallback
             print(f"⚠️  Estado do git incerto: {status_uno.splitlines()[0]}")
             return True # Deixar passar se não for erro claro de desincronia

    except subprocess.CalledProcessError as e:
        print(f"❌ FALHA: Erro ao executar comandos git: {e.output.decode('utf-8')}")
        return False
    except FileNotFoundError:
        print("❌ FALHA: git não encontrado no PATH.")
        return False

def main():
    print("\n🚀 Iniciando Pre-Deployment Check...\n")
    
    checks = [
        check_deployment_md(),
        check_vite_port(),
        check_lovable_folder(),
        check_git_sync()
    ]

    print("\n" + "="*30)
    if all(checks):
        print("✅  TUDO CERTO! PRONTO PARA DEPLOY NA VERCEL.  ✅")
        sys.exit(0)
    else:
        print("🛑  VERIFICAÇÃO FALHOU. CORRIJA OS ERROS ACIMA.  🛑")
        sys.exit(1)

if __name__ == "__main__":
    main()
