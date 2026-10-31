# BEYOND INTERACTION — PROGRESS

## 요약

서버 없이 실행하는 인터랙션 프로젝트의 구조와 현재 구현된 챕터·공통 기능을 정리한다.

## 프로젝트 구조

- 실행: Chrome에서 `index.html` 직접 열기. 외부 라이브러리·폰트는 CDN으로 연결한다.
- 스타일: `scss/style.scss`와 챕터별 SCSS를 사용하고 `scss/style.css`로 출력한다.
- 스크립트: `js/core`는 초기화·탐색·전환, `js/chapters`는 장면 구성, `js/effects`는 재사용 효과를 담당한다.
- 서체: 기본 Pretendard, 세리프 Source Serif 4.

## 챕터 구현 상태

| 화면 | 현재 기능 |
| --- | --- |
| 인트로 | 글자 모임·무작위 볼드·홀딩·분산 퇴장, SKIP |
| Awakening | 자동 글자 등장·순차 볼드 반복·글자별 회전·분산·포인트 확대 |
| Dimension | 절차적 3D 조각의 회전·분해·카메라 이동. 3D 진입~퇴장 고정, 동일 크기 캔버스 재설정 생략 |
| Typography | PC·모바일 공통 글자 모임→홀드→순차 굵기→확대·fadeout. 별도 하단 이미지·설명 없이 Matter 배경으로 연결 |
| Matter | 전체 배경 물결·감쇠 후 필터/갱신 정지, transform 기반 커서 원, 클릭/터치 이미지 전환, 세 줄 타이틀 확대·자간 축소·굵기 감소, 초기 검정 오버레이·전체 fadeout |
| Journey | PC 가로 갤러리·사진 확대, 모바일 세로 갤러리 |
| Magnetic | 좌표 캐싱·측정/갱신 분리·동일 목표 생략으로 70개 막대의 반발·분산·회전 유지, 최소 800px 중앙 패턴, 자연 스크롤 종료 연결 |
| Weight | 앨리스 원문·커서/터치 굵기·본문 이동 후 확대 |
| 아웃트로 | copyright·처음으로 돌아가기 |

## 공통 동작

- 휠·터치는 기본 스크롤을 사용하고 상단 메뉴로 챕터를 탐색한다.
- 활성 상태와 전환 화면을 같은 호출에서 갱신하고, 챕터 영역의 브라우저 자동 스크롤 위치 보정은 끈다.
- Awakening·Dimension·Typography·Journey의 stage 배경은 전환 중에도 유지한다. Weight는 동일한 배경 레이어의 투명도만 바꾸며, 아웃트로는 stage 전체 fadein으로 연결한다.
- Awakening·Dimension 3D·Typography·Matter·PC Journey·Weight·아웃트로는 표시 중 stage 고정을 유지한다. Awakening·Dimension·Weight는 다음 화면이 덮은 뒤 고정을 해제하며, section은 스크롤 길이를 유지한다.
- 모바일 Journey는 세로 갤러리의 일반 흐름을 유지한다. Magnetic은 진입 중에만 고정하고 이후 sticky를 유지해 종료 시 고정 방식을 바꾸지 않는다. Magnetic→Weight는 기존 여백과 자연 스크롤·배경색 전환을 유지하며 Weight는 상단 도달 후 고정한다.
- 모바일은 헤더 로고·메뉴 스크롤바·Matter 원을 숨긴다. 메뉴 가로 스크롤과 배경 터치 전환은 유지한다.
- 로고·처음으로 돌아가기는 문서를 다시 열고 최상단에서 인트로를 시작한다.
- 모션 감소 대안과 화면 밖 반복 정지, init/destroy 정리를 제공한다.
