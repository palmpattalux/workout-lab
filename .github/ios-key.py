# Checks the four App Store Connect secrets before the iPhone upload, and writes the .p8 key
# as a clean file. A pasted key often loses its line breaks or gains Windows line endings; this
# rebuilds it either way. It prints only yes/no checks and lengths, never the secrets themselves.
# Usage: python3 ios-key.py <output .p8 path>   (reads TEAM, KEY_ID, ISSUER, KEY_P8 from env)
import base64, os, re, sys

EC_OID = bytes.fromhex('06072a8648ce3d0201')     # ecPublicKey
P256_OID = bytes.fromhex('06082a8648ce3d030107')  # prime256v1, what Apple's keys use
DASHES = '-‐‑‒–—―−'
MARK = re.compile('[' + DASHES + r']*\s*(BEGIN|END)\s+(EC\s+)?PRIVATE\s+KEY\s*[' + DASHES + ']*', re.I)

problems = []
env = lambda k: os.environ.get(k, '').strip()
team, key_id, issuer, raw = env('TEAM'), env('KEY_ID'), env('ISSUER'), os.environ.get('KEY_P8', '')

def short_id(v):
  return re.fullmatch(r'[A-Z0-9]{10}', v or '') is not None

def uuid(v):
  return re.fullmatch(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', v or '') is not None

print(f'APPLE_TEAM_ID: {len(team)} characters, looks right: {"yes" if short_id(team) else "no"}')
print(f'ASC_KEY_ID: {len(key_id)} characters, looks right: {"yes" if short_id(key_id) else "no"}')
print(f'ASC_ISSUER_ID: {len(issuer)} characters, looks right: {"yes" if uuid(issuer) else "no"}')
if not short_id(team):
  problems.append('APPLE_TEAM_ID should be your 10-character Team ID (developer.apple.com > Membership details).')
if uuid(key_id) and short_id(issuer):
  problems.append('ASC_KEY_ID and ASC_ISSUER_ID look swapped: the Key ID is 10 characters, the Issuer ID is the long one with dashes.')
else:
  if not short_id(key_id):
    problems.append('ASC_KEY_ID should be the 10-character Key ID shown next to the key.')
  if not uuid(issuer):
    problems.append('ASC_ISSUER_ID should be the Issuer ID above the keys list (8-4-4-4-12 letters and numbers with dashes).')

def der_of(text, depth=0):
  body = re.sub(r'[^A-Za-z0-9+/=]', '', MARK.sub('', text.replace('﻿', '')))
  if not body:
    return None, 'it is empty'
  if len(body) < 100:
    return None, f'it holds something short ({len(text.strip())} characters), not the whole .p8 file'
  if len(body) % 4:
    return None, 'the key text looks cut off (copy the whole file, from BEGIN to END)'
  try:
    der = base64.b64decode(body, validate=True)
  except Exception:
    return None, 'the key text is not valid (copy it again from the .p8 file)'
  if der.startswith(b'-----BEGIN') and depth == 0:
    return der_of(der.decode('ascii', 'replace'), 1)
  if der[:1] != b'\x30' or EC_OID not in der:
    return None, 'this is not an App Store Connect .p8 key'
  return der, None

lines = raw.replace('\r\n', '\n').strip().split('\n')
print(f'ASC_KEY_P8: {len(raw)} characters, {len(lines)} lines, '
      f'BEGIN line: {"yes" if re.search("BEGIN", raw) else "no"}, END line: {"yes" if re.search("END", raw) else "no"}, '
      f'Windows line endings: {"yes" if chr(13) in raw else "no"}')
der, why = der_of(raw)
if der is None:
  problems.append(f'ASC_KEY_P8: {why}. Open the .p8 in TextEdit, copy everything, and paste it as the secret again.')
else:
  b64 = base64.b64encode(der).decode()
  pem = '-----BEGIN PRIVATE KEY-----\n' + '\n'.join(b64[i:i + 64] for i in range(0, len(b64), 64)) + '\n-----END PRIVATE KEY-----\n'
  fixed = pem.strip() != raw.replace('\r\n', '\n').strip()
  print(f'ASC_KEY_P8 is a valid key{" (rebuilt from the pasted text)" if fixed else ""}, P-256: {"yes" if P256_OID in der else "no"}')
  with open(sys.argv[1], 'w') as f:
    f.write(pem)
  os.chmod(sys.argv[1], 0o600)

for p in problems:
  print(f'::error::{p}')
sys.exit(1 if problems else 0)
