from transformers import AutoModel

print("Loading CLOSP-VS...")

model = AutoModel.from_pretrained(
    "DarthReca/CLOSP-VS",
    trust_remote_code=True
)

print("CLOSP-VS loaded successfully!")