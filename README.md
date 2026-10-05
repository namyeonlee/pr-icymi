# ICYMI — GitHub에 올리는 방법

이번 사이트는 뉴스를 자동으로 가져오므로 Jeopardy와 설정이 다릅니다.
Pages의 Source에서 **GitHub Actions**를 선택하세요.

## 1. 파일 업로드

1. ZIP을 풉니다.
2. 새 GitHub 저장소를 만들고 uploading an existing file을 클릭합니다.
3. 압축 푼 폴더 안의 파일과 하위 폴더를 모두 업로드하고 Commit changes를 누릅니다.
4. index.html이 저장소 첫 화면에 보여야 합니다.

## 2. 자동 업데이트 파일 확인

저장소 첫 화면에 .github 폴더가 보이면, 열어서 workflows → update-news.yml이 있는지 확인합니다. 있다면 3번으로 이동합니다.

.github 폴더가 안 보이면 다음처럼 만드세요. 이 단계는 한 번만 하면 됩니다.

1. GitHub 저장소에서 Add file → Create new file.
2. 파일 이름 칸에 아래 경로를 그대로 입력합니다.

.github/workflows/update-news.yml

3. ZIP 안의 WORKFLOW_SETUP.txt를 열고, 내용을 전부 복사해 GitHub의 큰 편집 칸에 붙여넣습니다.
4. Commit changes를 누릅니다.

Mac에서는 압축 푼 폴더 안에서 Command + Shift + . 을 누르면 숨겨진 .github 폴더를 볼 수 있습니다. 이미 이 폴더를 업로드했다면 위의 파일 만들기는 필요 없습니다.

## 3. 사이트 켜기

1. 저장소 Settings → Pages.
2. Build and deployment → Source → **GitHub Actions** 선택.
3. 위쪽 Actions 탭 → **Update news and publish** 선택.
4. Run workflow → 초록색 Run workflow 클릭.
5. 작업에 초록색 체크가 뜨면 Settings → Pages의 Visit site 클릭.

설정 전에 자동 작업이 실패해도 2번과 3번 설정을 완료한 뒤 Run workflow를 다시 누르면 됩니다.
기본 브랜치는 main을 기준으로 작성했습니다.

## 사용 방법

- 검색어, 주제, 기간(3·7·14·30일)으로 기사를 필터링합니다.
- 체크박스로 최대 5개 기사를 선택합니다.
- Present brief: 수업 발표 화면.
- Copy notes: 노트 복사.
- Download .md: 노트 파일 저장.
- 새로고침 버튼은 마지막으로 생성된 뉴스 목록을 다시 읽습니다.
- 즉시 새로운 기사를 가져오려면 Actions → Update news and publish → Run workflow.

## 자동 뉴스 갱신

6시간마다 뉴스 수집과 배포가 예약됩니다. GitHub 사정에 따라 실행이 지연될 수 있습니다.
공개 저장소의 예약 작업은 장기간 활동이 없으면 중지될 수 있습니다. 이 경우 Actions에서 다시 활성화합니다.
API 키나 유료 뉴스 서비스는 필요하지 않습니다.
일부 출판사 피드가 막히면 가능한 소스로 계속 진행합니다. 모든 피드가 실패하면 새 배포를 중단하여 기존 사이트를 유지합니다.
화면에는 데이터 갱신 시각이 표시되고, 48시간 이상 지났으면 안내 문구가 나옵니다.
기사 제목·링크·날짜만 저장합니다. 본문을 복제하지 않습니다.
수업 포인트와 토론 질문은 제목의 주제 분류에 따른 고정 프롬프트입니다. 기사 본문을 읽고 생성한 요약이 아닙니다.

## 파일 수정

GitHub에 올릴 웹사이트는 미리 빌드되어 있습니다. npm 설치나 코딩 없이 위 절차로 실행됩니다.
source/에는 편집 가능한 React 원본이 있습니다. 고급 수정 후 재빌드 방법은 source/BUILD.md를 참고하세요.
기존 ChatGPT 사이트는 변경하지 않았습니다. 이 ZIP은 독립적으로 동작하는 GitHub용 사본입니다.

공식 설정 안내:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
