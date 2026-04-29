// 짧고 사람이 읽을 수 있는 ID 생성. crypto.randomBytes 사용.
// 공대 ID와 초대 코드 양쪽에 씀.
//
// - 헷갈리는 글자 제외 (0/O, 1/I/l) → Crockford Base32 변형
// - 8자 = 32^8 ≈ 1조 가지. 공대 단위 충돌 위험 미미.

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // 30자, ambiguous 제거

function randomCode(length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[arr[i]! % ALPHABET.length];
  }
  return out;
}

/** 공대 문서 ID — 8자 (URL slug 용) */
export function generatePartyId(): string {
  return randomCode(8).toLowerCase();
}

/** 초대 코드 — 6자 대문자 (사람이 입력하기 좋게) */
export function generateInviteCode(): string {
  return randomCode(6);
}
