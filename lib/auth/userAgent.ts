// 인앱 브라우저(웹뷰) 감지.
// 디스코드 등 인앱 브라우저는 IndexedDB를 영속화하지 않아 로그인이 유지되지
// 않음 → 로그인 페이지에서 감지해 외부 브라우저로 유도한다.
//
// 한계: iOS 인앱 웹뷰는 UA에 앱 시그니처가 안 실리는 경우가 있어 완벽하지 않음.
// 안드로이드 WebView("; wv)")는 잡히지만 iOS는 일부 누락 가능.

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null; // "디스코드" 등 — 안내 문구용. 일반 웹뷰면 null.
}

export function detectInAppBrowser(ua: string | null | undefined): InAppBrowserInfo {
  if (!ua) return { isInApp: false, appName: null };
  const u = ua.toLowerCase();

  // 앱별 UA 시그니처
  if (u.includes("discord")) return { isInApp: true, appName: "디스코드" };
  if (u.includes("kakaotalk")) return { isInApp: true, appName: "카카오톡" };
  if (u.includes("fban") || u.includes("fbav")) return { isInApp: true, appName: "페이스북" };
  if (u.includes("instagram")) return { isInApp: true, appName: "인스타그램" };
  if (u.includes("line/")) return { isInApp: true, appName: "라인" };
  if (u.includes("naver")) return { isInApp: true, appName: "네이버" };

  // 안드로이드 WebView 일반 시그니처
  if (u.includes("; wv)")) return { isInApp: true, appName: null };

  return { isInApp: false, appName: null };
}
