# BEYOND INTERACTION — 재현 실험 프롬프트

## 요약

현재 사이트의 디자인·문구·일곱 챕터·장면 연결·최적화 요구를 처음부터 구현하도록 정리한 프롬프트다. 0번 공통 지시 뒤 1~9번을 순서대로 사용한다.

## 실험 방법

- 원본과 다른 빈 폴더·새 대화에서 진행한다. 원본 HTML·SCSS·JS·다른 MD·스크린샷은 제공하지 않는다.
- 기본 실험은 **이 문서의 프롬프트 + 동일한 이미지**만 제공한다. 원본 `assets/images`의 JPG만 새 프로젝트의 같은 경로로 복사한다. 코드나 이미지 백업 폴더는 복사하지 않는다.
- 이미지를 주지 않는 실험은 별도로 기록한다. 이 경우 이미지 선택 차이와 프롬프트 해석 차이가 함께 생기므로 동일 이미지 실험과 구분한다.
- 0번을 먼저 전달하고, 1~9번을 차례대로 전달한다. 수정 피드백을 추가하지 않고 첫 완성본을 저장하면 프롬프트 자체의 재현성을 비교하기 좋다.
- 한 번에 실험하려면 0~9번의 프롬프트 본문을 모두 전달하고, “각 단계를 순서대로 구현하고 최종 결과까지 완성해줘”라고 덧붙인다.
- 모델명·실행 날짜·단계별/일괄 전달 여부·이미지 제공 여부·추가 피드백 횟수를 기록한다. 완성 후 같은 창 크기와 같은 스크롤 위치에서 원본과 비교한다.

## 0. 공통 브리프와 정적 프로젝트 구성

```text
BEYOND INTERACTION이라는 실험적 인터랙션 사이트를 만들어줘. 제품 소개 페이지가 아니라 타이포그래피, 입체, 재질, 공간, 포인터 반응을 순서대로 체험하는 긴 싱글 페이지다. 이후 전달할 1~9번 지시까지 일관된 구조로 구현해줘. 이번 단계에서는 공통 구조와 기본 레이아웃만 작성해줘.

[실행 조건]
- HTML + SCSS + 일반 JavaScript + jQuery + GSAP/ScrollTrigger를 사용한다.
- Chrome에서 index.html을 파일로 직접 열어 동작해야 한다. 서버·npm·번들러·React·TypeScript·ES module·fetch fragment는 사용하지 않는다.
- 전체 section DOM은 index.html에 작성한다. JS는 일반 script로 읽고 DOM과 CDN 의존성이 준비된 뒤 초기화한다.
- jQuery 3.7.1: https://code.jquery.com/jquery-3.7.1.min.js
- GSAP 3.12.5: https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js
- ScrollTrigger 3.12.5: https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js
- Three.js 0.160.1 classic 배포본: https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js
- Three.js는 Dimension 근처에서만 한 번 로드한다. 추가 플러그인·SplitText·MorphSVG·Lenis·물리 라이브러리는 쓰지 않는다.
- CDN과 폰트 사용에는 인터넷이 필요하다. 로딩 실패 시 무한 대기하지 말고 정적 텍스트·이미지·앵커 탐색을 유지한다.

[소스 구조]
- index.html
- scss/style.scss, scss/style.css: 같은 경로에서 관리한다. 바로 열어 볼 수 있도록 컴파일된 CSS도 제공한다.
- scss/_reset.scss: 속성 리셋, _variable.scss: 변수·토큰, _mixin.scss: flex·position·size·font 등, _base.scss: 기본 스타일, _layout.scss: 공통 레이아웃.
- scss/_intro.scss, _outro.scss, scss/chapters/_awakening.scss, _dimension.scss, _typography.scss, _matter.scss, _journey.scss, _magnetic.scss, _weight.scss.
- js/main.js, js/core: 초기화·registry·진행률·refresh·탐색·인트로·챕터 전환.
- js/chapters: 챕터별 연출, js/effects: reveal·분산·회전·가로 이동·parallax·zoom·magnetic·variable weight 재사용 효과.
- 공통 클래스는 chapter, stage, intro, eyebrow, theme, description, field 등으로 짧게 짓고 type-awakening 같은 추가 클래스로 변형한다. 자식 이름에 부모 단어를 반복하지 않는다.
- 효과는 root와 options를 받아 필요한 update/setProgress/setActive와 destroy를 반환하도록 설계한다. 같은 transform을 서로 다른 효과가 덮어쓰지 않도록 glyph/face처럼 역할을 나눈다.
- 앱 init은 중복 호출에 안전하게, destroy는 자신이 만든 이벤트·observer·timer·RAF·GSAP context·ScrollTrigger·GPU 자원까지 정리하도록 한다.

[전체 시각 규칙]
- 배경은 거의 검정 #101010과 따뜻한 밝은색 #f2f0ea 두 가지가 중심이다. 순백색 대신 #f2f0ea를 사용한다. 보조색은 #aaa8a2, 선은 #383936, 제한적인 포인트는 #668acc.
- Awakening·Typography·Weight는 밝은 배경/어두운 글자, Dimension·Matter·Journey·Magnetic은 어두운 배경/밝은 글자다.
- 기본 서체는 Pretendard Variable. https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css
- 모든 세리프는 Source Serif 4 variable 200~900. https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@200..900&display=swap
- 폰트 파일을 다운로드하거나 fonts 폴더를 만들지 않는다.
- gutter는 clamp(1.25rem, 4vw, 5rem), header 높이는 4.5rem, spacing은 .5/1/1.5/2.5/4/7rem을 기준으로 한다. 화면은 큰 여백과 큰 글자, 선명한 대비를 사용한다. 카드 UI나 장식용 그라데이션은 추가하지 않는다.
- 상단 header는 fixed, 배경색 없이 blur 8px. 좌측 BEYOND INTERACTION 로고, 우측에 일곱 챕터 메뉴를 가로로 직접 표시한다. 드롭다운은 만들지 않는다.
- 밝은 장면의 header 글자는 #101010, 어두운 장면은 #f2f0ea. mix-blend-mode로 header 색을 만들지 말고 실제 화면 상태에 따라 명시적으로 변경한다.
- 모바일 기준은 768px 이하. 모바일/터치 header에서는 로고를 숨기고 메뉴만 가로 스크롤 가능하게 한다. 메뉴 스크롤바는 숨긴다.
- 브라우저 세로 스크롤바는 여백·화살표 없이 8px. 스크롤 영역 폭은 유지하고 intro/outro가 표시될 때만 track/thumb를 투명하게 한다.
- 각 stage는 header 아래가 아니라 화면 맨 위부터 100svh를 채운다. 상단의 작은 공통 intro는 좌측 챕터 번호/이름과 우측 theme 문구로 구성한다. 모바일에서는 세로로 쌓아 중앙 정렬한다.
- 일곱 챕터 순서는 Awakening → Dimension → Typography → Matter → Journey → Magnetic → Weight. 맨 앞에 전체 화면 intro, 맨 뒤에 outro가 있다.
- 일반 휠·터치는 브라우저 기본 스크롤이다. 휠 한 번에 다음 챕터로 강제 이동하거나 스크롤을 가로채지 않는다. 메뉴 이동만 약 .85초의 부드러운 이동을 제공한다.
- 이전/다음 버튼, 별도 챕터 선택 화면, Infinite, Playground는 만들지 않는다.
```

## 1. 시작 인트로

```text
공통 브리프를 유지하며 시작 인트로를 구현해줘.

- 검정 #101010 배경이 header 위까지 화면 전체를 덮는다. 중앙에 Pretendard로 BEYOND INTERACTION, 그 아래 테두리형 SKIP 버튼을 둔다.
- 문구 크기는 clamp(1.2rem, 4.8vw, 5rem), 자간 -.04em. 각 letter는 처음 굵기 200·최종 크기의 5배이며 화면 바깥의 서로 다른 방향/각도에서 출발한다.
- letter별 약 .02초 간격, 개별 1.2초 동안 제자리로 모여 전체 등장은 약 1.5초다. 이동은 빠르게 감속하며 안착한다.
- 모인 후 글자 순서를 한 번 무작위로 섞고, 약 3.2초에 걸쳐 각 letter 굵기를 200에서 바로 900으로 변경한다. 굵기 보간이나 물결 애니메이션은 넣지 않는다. 초반 전환 간격은 길고 마지막은 빠르게 몰린다.
- 마지막 letter까지 굵어진 실제 시점부터 3초 홀드한다.
- 이후 굵기 900을 유지하며 각 letter가 1.2초 동안 5배로 커지고, 자신이 처음 출발했던 화면 밖 위치와 각도로 돌아간다. 동시에 intro 전체가 fadeout한다. 전체 자동 재생은 약 8.9초다.
- SKIP은 처음부터 표시한다. 언제 눌러도 현재 opacity에서 .3초 동안 intro 전체를 닫고 예약된 볼드/퇴장 작업을 취소한다.
- intro 동안 배경 휠·터치 이동을 막되 스크롤바 영역의 폭을 바꾸지 않는다. 닫힌 뒤 이벤트와 타이머를 정리한다.
- 직접 #chapter 접근에서는 intro를 건너뛴다. index.html?intro=1은 scroll top으로 초기화하고 intro를 재생한 뒤 파라미터를 소비한다.
- reduced-motion에서는 굵기 900인 문구를 정적으로 보여주고 3초 후 짧게 fadeout한다.
```

## 2. Awakening

```text
Awakening을 구현해줘. 밝은 배경 #f2f0ea 위에서 글자 자체가 살아 움직이는 첫 장면이다.

- 공통 intro: 01 / Awakening, The beginning.
- 큰 제목은 BEYOND / INTERACTION 두 줄. Source Serif 4 굵기 200, clamp(2.5rem, 9.4vw, 10rem). 모바일은 clamp(2.3rem, 9.4vw, 4.5rem).
- INTERACTION의 마지막에는 텍스트 온점 대신 .13em 크기 검정 사각형을 붙인다. 이 사각형이 다음 검정 장면을 여는 포인트다.
- 하단 문구: “하나의 문장에서, 새로운 감각이 시작됩니다.”, 작은 안내: “아래로 스크롤해 이야기를 시작하세요.”
- intro가 닫히거나 해당 챕터에 진입하면 스크롤 없이 letter가 아래 64px/opacity 0에서 하나씩 자동 등장한다. 개별 .6초, 간격 .025초 정도다. intro 뒤에서 미리 재생하지 않는다.
- 등장 후 정지 중에도 각 letter가 순차적으로 .35초 동안 200→900, 바로 .35초 동안 900→200으로 돌아온다. 다음 글자는 .12초 간격으로 시작하고 전체 펄스가 끝나면 얇은 상태로 2초 쉰 후 반복한다.
- 이 제목에는 포인터/터치 가까이에서 200~900으로 굵어지는 효과도 적용한다. 자동 볼드와 가까움 볼드 중 큰 값을 사용하고, letter 폭을 미리 확보해 줄바꿈이나 이웃 위치가 흔들리지 않게 한다.
- 스크롤 시 제목 전체 대신 각 letter가 서로 반대 방향으로 약 180~240도 회전한다. 검정 사각형은 회전에서 제외한다.
- section 높이는 max(430svh, 100svh + 3300px). 진행은 section 높이에서 viewport를 뺀 실제 길이로 계산한다. 처음 2000px까지 회전하고 이후 분산이 시작된다. 마지막 30%에는 letter 각도가 0도로 돌아온다.
- PC에서는 글자가 넓게 흩어지며 사라지고 모바일에서는 이동과 회전을 줄인다. 분산은 미리 정한 벡터를 사용해 역스크롤 시 같은 경로로 복원한다.
- 마지막 검정 사각형은 같은 DOM을 유지한 채 원래 위치에서 확대되어 화면을 검정으로 채운다. 새 사각형을 겹쳐 만들거나 큐브로 morph하지 않는다. 다음 Dimension은 화면 고정 상태로 서서히 나타나야 한다.
```

## 3. Dimension

```text
Dimension을 구현해줘. 검정 배경 위 중성 은빛의 입체 큐브 조각 장면이다.

- 공통 intro: 02 / Dimension, A different perspective.
- Source Serif 4 굵기 600의 제목: A new / dimension. 두 번째 줄은 밝은 선으로만 그린 outline 글자다. 제목은 좌상단, 조각은 화면 중앙보다 조금 우측에 둔다. 모바일에서는 중앙 배치한다.
- 제목 크기는 clamp(3.25rem, 8vw, 8rem), 행간 .95. 하단 설명은 “평면을 벗어나, 형태와 공간 사이를 바라봅니다.”, 작은 안내는 “스크롤로 조각을 펼치고, 마우스로 시선을 바꿔보세요.”
- section 높이는 240svh. 카메라 FOV 약 42도, z 약 8.5에서 시작한다.
- 외부 3D 모델 없이 둥근 모서리의 작은 큐브를 코드로 만든다. 3×3×3 중 중앙 한 칸을 뺀 26개를 간격 약 .73으로 조합해 큰 추상 큐브를 만든다. geometry/material은 공유한다.
- 금속 재질은 metalness 1, roughness 약 .18. 코드로 생성한 흑백 스튜디오 반사 환경과 흰 조명만 사용한다. 푸른 반사광은 넣지 않는다.
- 스크롤 전체에서 조각 그룹이 회전한다. 30~70% 구간에 개별 조각이 서로 다른 방향으로 벌어지고 회전한다. 마지막 30%에 카메라는 앞으로 약 z 4.9까지 이동하며 가벼운 측면 이동을 더한다.
- 마우스는 회전에 부드럽게 작은 시선 변화를 더한다. 스크롤/포인터 목표에 보간하며, 목표에 도달하면 상시 렌더하지 않는다.
- Typography로 퇴장할 때 흩어진 큐브가 멈추지 않고 더 벌어지면서 fadeout한다. 중간에 2D 사각형이나 알파벳으로 바뀌지 않는다.
- 약 600px 근접 시 지연 초기화하고 화면 밖/숨김 탭에서 RAF를 정지한다. PC DPR 최대 1.5, 터치 DPR 최대 1, 터치 antialias는 끈다. 같은 크기라면 renderer 크기를 다시 설정하지 않는다.
- destroy에서 geometry·material·환경 텍스처·renderer를 dispose한다. Three/WebGL 실패 또는 reduced-motion에서는 assets/images/torus.jpg를 포스터 대안으로 보여준다.
```

## 4. Typography

```text
Typography를 구현해줘. 배경 #f2f0ea, Pretendard Variable의 어두운 굵은 글자가 중심이다. PC와 모바일에서 같은 장면 단계를 제공한다.

- 공통 intro: 03 / Typography, Words become form.
- 제목은 WORDS / TAKE / SHAPE 세 줄. PC clamp(3.75rem, 10vw, 10rem), 모바일 clamp(3.75rem, 17vw, 7rem), 행간 .87, 자간 -.045em. PC 제목 폭 약 65%, 모바일 100%.
- section 높이는 885svh이며 stage는 표시 중 화면에 고정한다.
- 단어 단위가 아니라 letter마다 화면의 위·아래·좌·우 바깥에서 출발해 자기 자리로 모인다. 흩어진 위치에 멈춘 글자를 먼저 fadein하지 않는다. 방향과 약한 각도를 다양하게 하고 resize 후에도 화면 밖 출발을 다시 계산한다.
- 스크롤 진행 기준 대략 0~33%는 모임, 33~52%는 정렬 상태 홀드, 52~77%는 letter별 순차 굵기 100→900, 마지막 구간은 확대 연출이다. 커서가 굵기에 영향을 주지 않는다.
- 마지막 제목은 화면 중앙을 향해 scale 10까지 커지며 동시에 fadeout한다. 먼저 확대를 멈춘 다음 사라지게 하지 않는다.
- 제목이 충분히 확대된 다음에만 Matter의 실제 배경이 서서히 드러난다. Matter의 현재 선택 이미지를 직접 공유하고 별도 중간 이미지나 T자 마스크를 만들지 않는다.
- Typography 하단 이미지·캡션·설명·사각형 장식은 만들지 않는다. 접근성을 위한 원문과 aria-hidden 시각 letter 레이어를 분리한다.
```

## 5. Matter

```text
Matter를 구현해줘. 화면에 고정된 금속/유리 이미지가 마우스에 반응해 넓고 부드럽게 굴절되는 장면이다.

- 공통 intro: 04 / Matter, Beyond the surface.
- 배경은 stage 전체 object-fit: cover, 중앙 정렬이다. 처음 보이는 순간부터 균일한 검정 40% 오버레이를 올린다. 그라데이션은 쓰지 않는다.
- 이미지 순환 순서: assets/images/chrome.jpg → metal.jpg → blue-chrome.jpg → shards.jpg → ribbon.jpg → swirl.jpg → chrome.jpg. 스크롤로 이미지를 교체하지 않는다.
- 중앙 제목은 Source Serif 4의 Beyond / the / surface. 세 줄이다. 확대·모바일에서도 각 줄을 유지한다. PC 기본 크기는 clamp(6rem, 12vw, 10rem), 모바일 약 20vw.
- 진입 시 단어가 .12초 간격으로 아래에서 올라오며 순차 등장한다. 설명은 “단단한 경계 너머, 새로운 질감을 상상합니다.”
- 스크롤 길이는 viewport + 3400px. 처음 약 500px은 제목 크기를 유지하고, 이후 제목은 PC 1→4배, 모바일 1→3배로 끝까지 확대한다. 동시에 자간은 0→-.2em, 굵기는 600→200으로 바뀐다. 글자를 회전시키지 않는다.
- 제목만 별도로 fadeout하지 않는다. 퇴장 마지막 20%에서는 배경·오버레이·제목·설명을 포함한 stage 전체가 함께 fadeout한다. 이 동안에도 제목 확대는 계속된다.
- PC에서는 내용 없는 밝은 원(지름 약 5.5rem)이 커서를 따라다닌다. 원 이동은 transform으로 프레임당 한 번 갱신한다. 클릭 지점에서 다음 이미지 자체가 원형 clip-path로 자라 약 1초 동안 화면을 채운다. 흰 파동을 덮는 방식은 쓰지 않는다.
- 전환 중 중복 클릭은 무시한다. 원의 중심은 이미지 확대율을 반영해 클릭 위치에 정확히 맞추고 반경은 화면 네 모서리를 모두 덮을 만큼 계산한다.
- 모바일에서는 커서 원과 왜곡 필터를 숨긴다. 배경 탭으로 같은 이미지 전환을 약 .75초 동안 제공하되 세로 스와이프는 이미지 탭으로 처리하지 않는다.

[현재 형태의 가벼운 왜곡]
- WebGL 유체 대신 SVG feTurbulence + feGaussianBlur + feDisplacementMap으로 원본 배경 전체를 굴절한다. 커서 주변만 잘라 붙인 복제 이미지나 원형 왜곡 패치는 만들지 않는다.
- turbulence는 고정 baseFrequency .0025 .0035, numOctaves 1, seed 8, blur stdDeviation 2. filter 여유 영역은 -8%/116%다.
- PC 이미지는 1.07배 overscan한다. displacement 최대 강도는 min(72, stageWidth*.065, stageHeight*.065)로 제한해 가장자리가 깨지지 않게 한다.
- 커서 이동 시 강도가 올라오고 멈추면 부드럽게 0으로 감쇠한다. 약 42ms 간격으로만 갱신하고, 감쇠 완료 시 filter·timer·RAF를 끈다. 정지 중 영구 애니메이션을 유지하지 않는다.
- Typography로 역스크롤해도 현재 선택한 실제 배경을 그대로 보여준다. 왜곡 없는 별도 중간 이미지를 끼우지 않는다.
```

## 6. Journey

```text
Journey를 구현해줘. 건축 이미지 일곱 장을 느리게 감상하는 갤러리다.

- 공통 intro: 05 / Journey, A change of scenery.
- 첫 제목은 A story. Many perspectives., 설명은 “빛을 따라, 새로운 시선으로.”
- PC 첫 화면은 제목을 중앙 43% 높이, 설명을 58% 높이에 크게 둔다. 각 문구의 단어가 순차 등장하고, 그 중간부터 첫 이미지가 opacity 0→.9로 서서히 나타난다.
- 이후 제목은 좌상단으로 이동하며 약 1.125~1.5rem로 작아지고 설명은 우상단 .75rem로 이동한다. 그 다음부터 갤러리 이동이 시작된다.
- 이미지 순서와 제목은 arches, cube, curves, hall, oculus, portal, stairs. assets/images의 같은 이름 JPG를 사용한다.
- 각 설명은 순서대로 “반복 속에서 발견한 리듬.” / “형태 사이로 깊어지는 공간.” / “곡선을 따라 달라지는 시선.” / “고요한 공간에 머무는 빛.” / “빛이 만드는 시작.” / “다음 가능성을 향한 문.” / “한 걸음 너머로 이어지는 여정.”
- PC에서는 stage를 고정하고 각 이미지가 viewport 폭 전체를 차지하는 가로 트랙을 만든다. 스크롤을 내려도 이미지가 자동 롤링되지 않고 각 패널에서 머문 뒤 확대, 다음 패널로 이동하는 리듬이다.
- 패널마다 hold .72, 수평 이동 .84 비율을 기준으로 삼고, 머무는 동안 이미지 scale 1.12→1.3과 약한 parallax를 준다. 패널은 왼쪽으로 이동하고 다음 이미지는 오른쪽에서 들어온다. scrub은 약 .6초다.
- 두 번째 이후 이미지는 화면에 절반쯤 들어왔을 때부터 opacity 0→.9로 나타난다. 최대 opacity는 1이 아니라 .9다.
- 이미지 제목은 하단에 clamp(3rem, 6vw, 6rem) 굵기 900으로 크게, 설명은 옆에 작게 배치한다. 첫 이미지 제목/설명이 배경보다 먼저 떠 있지 않게 한다.
- 측정은 이미지·폰트 로딩 뒤 한다. 스크롤 길이는 전체 가로 거리와 타임라인 hold/도입/종료 시간을 함께 반영해 산정한다.
- 모바일 768px 이하에서는 pin 없는 세로 갤러리로 바꾼다. 첫 문구부터 등장하고, 나머지 사진은 이미지 중앙이 화면 하단에 도착할 때부터 opacity 0→.9로 나타난다. 각 캡션도 함께 표시한다.
- Matter에서 진입할 때 축소됐다 재확대되는 장면 없이 자연스럽게 이어지고, Journey 끝에서는 Magnetic의 검정 장면으로 교차 전환한다.
```

## 7. Magnetic

```text
Magnetic을 구현해줘. 검정 배경에 밝고 가느다란 막대들이 엇갈려 있는 패턴이다.

- 공통 intro: 06 / Magnetic, An invisible force. 하단 설명 텍스트나 효과 선택 셀렉트는 만들지 않는다.
- 7행×10개, 총 70개 막대다. 행 높이는 20svh, 막대는 행 높이의 약 155%, 너비 clamp(4px, .5vw, 8px)다.
- 짝수 행은 가로 5% 어긋나고, 각 막대는 약 4~20도의 서로 다른 초기 각도를 가진다. 각도 부호가 이웃 막대/행과 교차하며 큰 흐름이 엇갈려 보이게 한다.
- pattern은 최소 너비 800px, 항상 화면 중앙 정렬이다. 모바일에서는 양옆이 잘리더라도 페이지 가로 스크롤이 생기지 않게 한다.
- 화면 전환이 완료된 뒤 막대가 무작위 순서로 전체 .5초 안에 fadein한다. fadein 중에도 포인터 반응은 활성화한다.
- pointer 가까이에서 막대가 멀어짐 + 서로 다른 방향으로 흩어짐 + 회전을 함께 수행한다. 끌어당기는 효과는 없다. 반응 지연 약 .12초, 보간 약 .9초로 급하게 튀지 않는다.
- 터치 중에도 반응하며 세로 스크롤은 허용한다. 이탈·해제 시 초기 위치와 초기 기울기로 돌아온다.
- section 높이는 viewport + 4000px. 패턴은 처음 화면 최하단에서 출발하고 스크롤하면서 전체가 천천히 위로 이동한다. 등장/포인터 transform과 전체 이동을 다른 레이어가 소유한다.
- 끝에서 막대를 fadeout하지 않는다. 패턴이 자연스럽게 문서 흐름으로 올라가고 마지막 viewport의 이동 속도가 일반 스크롤 속도로 이어지게 한다. 그 뒤 막대 3행 높이인 60svh 여백을 둔다.
- Weight로 넘어갈 때 막대나 Weight 본문 전체를 fade하지 말고 밝은 배경색만 fadein한다. Weight 본문은 문서 흐름을 따라 올라온다.
- Journey로 역스크롤하는 교차 구간에서도 막대 반응을 유지한다. 스크롤 방향을 바꿨다고 갑자기 정지하거나 초기 각도로 튀지 않게 한다.
- 크기·기본 좌표는 초기화/resize/refresh 때 캐싱한다. 스크롤 중 움직이는 행 좌표를 먼저 모두 읽고, 각 막대의 목표를 계산한 뒤 한꺼번에 쓴다. 읽기/쓰기를 막대마다 교차하지 않는다.
- 같은 목표나 .1px/.1도 이하 변화는 반복 갱신하지 않는다. 영향권 밖에는 복귀 목표를 한 번만 설정하되 0 복귀는 누락하지 않는다. reduced-motion은 정적 패턴으로 제공한다.
```

## 8. Weight와 아웃트로

```text
Weight와 아웃트로를 구현해줘. 밝은 배경을 꽉 채운 세리프 장문에서 포인터가 닿는 글자의 굵기가 바뀌는 마지막 장면이다.

- 공통 intro: 07 / Weight, The weight of attention. intro는 본문 위에 플로팅한다.
- 배경 #f2f0ea, 어두운 글자, Source Serif 4 variable 200~900. 본문 크기는 calc(max(12vw, 16svh) * 2 / 3), 행간 .95, 자간 -.055em이다.
- 문장은 반복하지 않고 아래 앨리스 원문을 lang=en인 단일 p로 묶는다. 단어 경계에 매이지 않고 break-all처럼 연속으로 줄바꿈한다. 글자 하나씩 효과용 span으로 감싸되 원문을 읽을 수 있게 한다.
- 본문 시작은 화면 높이 1/3 지점이다. 작은 화면에서는 공통 intro 하단 + 1.5rem보다 위로 올라오지 않게 한다. 진입 중에는 추가로 12svh 아래에서 계속 올라온다.
- 포인터/터치 가까이에서 200→900으로 굵어지고 멀어지면 가늘어진다. 범위는 실제 표시 글자 크기의 약 1.1em을 기준으로 하고 letter 중심점 대신 letter 영역과의 거리를 사용한다.
- 약 .08초 지연과 .24초 응답을 준다. 최대 굵기일 때의 글자 폭을 미리 확보해 굵어지는 동안 이웃 글자나 줄바꿈이 밀리지 않게 한다.
- 터치를 떼면 잠시 후 부드럽게 얇아진다. 세로 스와이프를 막지 않는다. 안정 상태/화면 밖/숨김 탭에서는 반복 계산을 멈춘다.
- section 높이는 viewport + 4000px. 앞 2600px은 본문을 위로 읽어 내려가며 마지막 문장 아래에 본문 크기 기준 1em 여백이 생길 때까지 이동한다.
- 이후 남은 스크롤과 아웃트로 진입 구간 동안 본문이 최대 2배까지 계속 확대된다. 확대 기준은 마지막 문장이 보이는 영역의 중앙이다. 문장 자체의 fadeout은 없다.
- 아웃트로는 header보다 위에서 검정 배경 전체가 fadein하며 확대 중인 본문을 덮는다. 검정 박스가 밑에서 올라오는 모습은 만들지 않는다. 덮이는 동안에도 본문 확대는 계속된다.
- 중앙에 “© 2026 BEYOND INTERACTION. All rights reserved.”와 테두리형 “처음으로 돌아가기 ↑” 링크를 둔다.
- 링크와 header 로고는 모두 index.html?intro=1을 새로 열고 scroll top + intro 재생으로 돌아간다. 아웃트로 전환 중에도 링크를 누를 수 있게 한다.

[본문]
The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs.
```

## 9. 전환 통합·소스 정리·완성

```text
지금까지 구현한 일곱 챕터를 연결하고 마무리해줘. 개별 효과를 새로 디자인하지 말고 다음 연결 계약을 우선해줘.

[장면 연결]
1. Intro → Awakening: intro 전체가 닫힌 뒤 Awakening 자동 letter 등장 시작.
2. Awakening → Dimension: 실제 검정 사각형이 원래 자리에서 확대되어 검정 화면을 채움 → 그 자리에 고정된 은빛 큐브 등장. 새 포인트 생성·입체 morph·새 장면의 상향 슬라이드는 없음.
3. Dimension → Typography: 큐브가 계속 더 흩어지며 fadeout → 밝은 Typography 등장. 2D 사각형 중간 연출 없음.
4. Typography → Matter: letter 모임·홀드·순차 bold·scale 10 확대/fade → 선택된 Matter 실제 배경 등장. 이미지 위치·크기·검정 오버레이는 처음부터 일관됨. 별도 중간 이미지 없음.
5. Matter → Journey: 확대 중인 타이틀을 포함한 Matter 전체 퇴장과 Journey 첫 장면 진입이 겹쳐 자연스럽게 연결. 이미지가 순간 축소/재확대되지 않음. 모바일은 세로 갤러리 흐름 유지.
6. Journey → Magnetic: Journey 끝의 이미지/문구가 fadeout하고 검정 Magnetic 장면으로 연결. 장면이 완전히 바뀌면 막대 전체 .5초 등장. 역스크롤 때도 양쪽 장면 상태를 같은 위치로 복원.
7. Magnetic → Weight: 막대는 fadeout 없이 자연스럽게 위로 스크롤. 60svh 여백 후 밝은 배경만 fadein, Weight 본문은 계속 올라옴.
8. Weight → Outro: 본문 opacity 유지·확대 지속, header 위에서 검정 outro 전체 fadein. 클릭 가능한 복귀 링크 유지.

[고정과 스크롤 계약]
- section 자체는 항상 스크롤 길이를 유지하는 spacer다. 장면이 화면을 덮고 있는 동안 stage의 위치·높이는 바뀌지 않는다.
- Awakening·Dimension·Typography·Matter·PC Journey·Weight·Outro는 필요한 표시 구간에서 stage를 fixed로 유지한다. 이전 장면은 다음 장면이 충분히 덮은 뒤 고정을 해제한다.
- Magnetic은 진입 교차 구간만 fixed, 본 구간은 sticky와 자연 종료 흐름을 사용한다. Weight는 자연 진입 후 상단 도달 시 고정한다. 모바일 Journey는 일반 세로 흐름이다.
- active true/false나 departing/arriving 상태가 바뀌는 순간 stage 배경을 transparent로 교체하지 않는다. 배경은 계속 유지하고 필요한 레이어의 opacity만 연속적으로 바꾼다. Weight의 배경만 별도 고정 레이어로 처리한다.
- 활성 상태·전환·header 색은 같은 업데이트에서 반영한다. 전환 진입/종료 시 DOM 재배치가 스크롤 위치나 문서 높이를 흔들지 않게 한다. 자동 scroll anchoring도 고려한다.
- 모든 scrub/전환은 현재 진행률로부터 계산해 순/역스크롤에 같은 결과를 낸다. 증분 transform 누적이나 이벤트 순서에만 의존하지 않는다.
- 직접 #awakening/#dimension/#typography/#matter/#journey/#magnetic/#weight 접근과 새로고침에서 그 장면을 독립적으로 복원한다. 초기 폰트/이미지 측정 후 잘못된 장면이 잠깐 나타나거나 다시 자동 정렬되지 않게 한다.
- 전체 DOM → CDN 의존성 → 폰트/이미지 치수 → 챕터 초기화 → 전환/탐색 연결 → 통합 refresh 순서를 관리한다. resize/폰트 로드 refresh는 모아서 호출하고 현재 진행률을 보존한다.

[최적화와 마무리]
- 반복 렌더는 필요할 때만 켠다. Matter 감쇠 완료, Magnetic 복귀 완료, Weight 굵기 안정화, 장면 이탈/숨김 탭에서는 관련 작업을 멈춘다.
- 비동기 초기화 중 destroy 또는 모드 변경이 일어나면 오래된 결과를 마운트하지 않는다. GPU·observer·이벤트·timer·RAF·ScrollTrigger는 소유한 코드에서 정리한다.
- reduced-motion과 CDN/Three.js 실패에서 문구·이미지·기본 탐색을 유지한다. letter 분리로 원문이 사라지거나 중복 낭독되지 않게 한다.
- SCSS mixin과 공통 클래스를 활용해 기능은 유지하면서 직관적이고 짧게 정리한다. 사용하지 않는 markup·스타일·script·패키지·실험 파일을 남기지 않는다.
- 기본 파싱·경로·컴파일 확인만 수행한다. 장시간 브라우저 QA나 성능 테스트, 추가 라이브러리 설치, 서버 실행, Git 저장은 별도 요청 없이 진행하지 않는다.
- 완성 시 각 챕터에서 무엇을 보면 되는지와 실행 방법, 재현하지 못한 항목만 간단히 알려줘.
```

## 완성본 비교 기준

점수는 재현 결과를 원본과 나란히 본 뒤 기록한다. 아래 비중은 이 실험을 위한 기준이며 측정된 유사도는 아니다.

| 비교 항목 | 비중 | 볼 부분 |
| --- | --- | --- |
| 디자인·레이아웃 | 20 | 두 배경색, 서체, 큰 제목 비율, 공통 intro와 header, 이미지 배치 |
| 챕터별 효과 | 30 | letter 단위 움직임, 은빛 조각, 원형 이미지 전환, 갤러리 리듬, 반발 막대, 근접 굵기 |
| 장면 연결 | 30 | 같은 포인트/배경의 연속성, 고정 위치 유지, 교차 타이밍, 순·역스크롤 |
| 모바일·실행 | 10 | 파일 직접 열기, 모바일 제목/메뉴/세로 갤러리/터치 대안 |
| 구조·쾌적성 | 10 | SCSS 분리, 불필요한 의존성 없음, 중복 초기화 방지, 정지·정리 |

PC 1440×900, 모바일 390×844를 기준으로 각 장면의 시작·중간·끝을 비교한다. 무작위 letter 순서와 막대 각도의 개별 값보다 전체 분포·움직임·연결의 유사성을 평가한다. 첫 완성본과 추가 피드백 후 완성본은 별도로 보관한다.
