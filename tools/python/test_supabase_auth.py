import requests
import json
import time

SUPABASE_URL = "https://agzutoonsruttqbjnclo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4"

email = f"teste.usuario{int(time.time())}@gmail.com"
password = "SenhaSegura123!"

print(f"Testando registro com: {email}")

response = requests.post(
    f"{SUPABASE_URL}/auth/v1/signup",
    headers={
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    },
    json={
        "email": email,
        "password": password,
        "data": {
            "full_name": "Usuario Teste"
        }
    }
)

print(f"Status: {response.status_code}")
try:
    print(f"Resposta: {json.dumps(response.json(), indent=2)}")
except:
    print(f"Resposta (texto): {response.text}")

if response.status_code == 200:
    print("\n✅ SUCESSO! Bug de autenticação corrigido!")
else:
    print("\n❌ FALHOU. Detalhes do erro acima.")
